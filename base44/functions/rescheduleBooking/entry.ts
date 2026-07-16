import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { booking_id, new_date, reason } = await req.json();

        if (!booking_id || !new_date) {
            return Response.json({ error: 'Booking ID and new date are required' }, { status: 400 });
        }

        // Validate date format
        const newScheduledDate = new Date(new_date);
        if (isNaN(newScheduledDate.getTime())) {
            return Response.json({ error: 'Invalid date format' }, { status: 400 });
        }

        // Check if date is in the future
        if (newScheduledDate <= new Date()) {
            return Response.json({ error: 'New date must be in the future' }, { status: 400 });
        }

        // Fetch the booking
        const bookings = await base44.entities.Booking.filter({ id: booking_id });
        if (bookings.length === 0) {
            return Response.json({ error: 'Booking not found' }, { status: 404 });
        }

        const booking = bookings[0];

        // Verify user owns this booking or is admin/manager
        if (booking.user_email !== user.email && !['admin', 'manager'].includes(user.role)) {
            return Response.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Check if booking can be rescheduled
        if (['cancelled', 'completed', 'expired'].includes(booking.booking_status)) {
            return Response.json({ error: 'This booking cannot be rescheduled' }, { status: 400 });
        }

        // Check slot availability
        const checkAvailability = await base44.functions.invoke('checkSlotAvailability', {
            scheduled_date: newScheduledDate.toISOString()
        });

        if (!checkAvailability.data.available) {
            return Response.json({ 
                error: 'This time slot is not available',
                details: checkAvailability.data
            }, { status: 409 });
        }

        const oldDate = booking.scheduled_date;

        // Update booking with new date and reset reminders
        await base44.entities.Booking.update(booking_id, {
            scheduled_date: newScheduledDate.toISOString(),
            reminder_24h_sent: false,
            reminder_1h_sent: false,
            notes: booking.notes ? `${booking.notes}\n\nRescheduled from ${oldDate ? new Date(oldDate).toLocaleString() : 'unscheduled'}. Reason: ${reason || 'Not provided'}` : `Rescheduled. Reason: ${reason || 'Not provided'}`
        });

        // Update Zoom meeting if exists
        let zoomUpdated = false;
        if (booking.zoom_meeting_id) {
            try {
                // Call update zoom meeting function if you have one
                // For now, we'll create a new meeting
                const appointmentTypes = await base44.entities.AppointmentType.filter({
                    service_type: booking.service_type
                });
                
                if (appointmentTypes.length > 0 && appointmentTypes[0].zoom_enabled) {
                    const zoomResult = await base44.asServiceRole.functions.invoke('createZoomMeeting', {
                        booking_id: booking_id,
                        scheduled_date: newScheduledDate.toISOString(),
                        duration: appointmentTypes[0].duration,
                        topic: `${booking.service_type?.replace(/_/g, ' ')} - ${booking.user_name}`
                    });
                    zoomUpdated = zoomResult?.data?.success;
                }
            } catch (error) {
                console.error('Error updating Zoom meeting:', error);
            }
        }

        // Send notification to client
        await base44.integrations.Core.SendEmail({
            to: booking.user_email,
            subject: 'Booking Rescheduled Successfully',
            body: generateRescheduleEmail(booking, newScheduledDate, oldDate)
        });

        // Send notification to manager
        await base44.integrations.Core.SendEmail({
            to: 'roberta@robertafernandez.com',
            subject: `Booking Rescheduled: ${booking.user_name}`,
            body: generateManagerRescheduleEmail(booking, newScheduledDate, oldDate, reason)
        });

        return Response.json({
            success: true,
            booking_id: booking_id,
            new_date: newScheduledDate.toISOString(),
            zoom_updated: zoomUpdated,
            message: 'Your booking has been rescheduled successfully.'
        });

    } catch (error) {
        console.error('Reschedule booking error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

function generateRescheduleEmail(booking, newDate, oldDate) {
    const formatDate = (date) => {
        return new Date(date).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit"
        });
    };

    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #F9F5EF;">
            <div style="background-color: #1E3A32; padding: 40px 20px; text-align: center;">
                <h1 style="color: #F9F5EF; font-family: Georgia, serif; font-size: 28px; margin: 0;">
                    Booking Rescheduled
                </h1>
            </div>
            
            <div style="background-color: #FFFFFF; padding: 40px 30px;">
                <p style="color: #2B2725; font-size: 16px; line-height: 1.6; margin-top: 0;">
                    Hi ${booking.user_name},
                </p>
                
                <p style="color: #2B2725; font-size: 16px; line-height: 1.6;">
                    Your <strong>${booking.service_type?.replace(/_/g, ' ')}</strong> session has been successfully rescheduled.
                </p>
                
                ${oldDate ? `
                    <div style="background-color: #F9F5EF; padding: 20px; margin: 20px 0;">
                        <p style="margin: 0;"><strong>Previous Date:</strong></p>
                        <p style="text-decoration: line-through; opacity: 0.6; margin: 5px 0;">${formatDate(oldDate)}</p>
                    </div>
                ` : ''}
                
                <div style="background-color: #E8F4FD; border: 2px solid #2D8CFF; padding: 20px; margin: 20px 0; text-align: center;">
                    <p style="color: #1E3A32; font-weight: 600; margin: 0 0 10px 0;">✓ New Session Date</p>
                    <p style="font-size: 18px; color: #1E3A32; font-weight: 600; margin: 0;">
                        ${formatDate(newDate)}
                    </p>
                </div>
                
                ${booking.zoom_join_url ? `
                    <div style="background-color: #F9F5EF; padding: 20px; margin: 20px 0;">
                        <p style="font-weight: 600; margin: 0 0 10px 0;">🎥 Zoom Meeting Link:</p>
                        <a href="${booking.zoom_join_url}" style="color: #2D8CFF; word-break: break-all;">${booking.zoom_join_url}</a>
                    </div>
                ` : ''}
                
                <p style="color: #2B2725; font-size: 16px; line-height: 1.6;">
                    Looking forward to seeing you at the new time!
                </p>
                
                <p style="color: #2B2725; font-size: 16px; line-height: 1.6; margin-bottom: 0;">
                    Roberta Fernandez<br />
                    <span style="color: #D8B46B; font-size: 14px;">Your Mind Stylist</span>
                </p>
            </div>
            
            <div style="background-color: #F9F5EF; padding: 30px 20px; text-align: center; border-top: 1px solid #E4D9C4;">
                <p style="color: #2B2725; font-size: 12px; opacity: 0.6; margin: 0;">
                    © ${new Date().getFullYear()} Your Mind Stylist. All rights reserved.
                </p>
            </div>
        </div>
    `;
}

function generateManagerRescheduleEmail(booking, newDate, oldDate, reason) {
    const formatDate = (date) => {
        return new Date(date).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit"
        });
    };

    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #1E3A32; padding: 40px 20px; text-align: center;">
                <h1 style="color: #F9F5EF; font-family: Georgia, serif; font-size: 28px; margin: 0;">
                    Booking Rescheduled
                </h1>
            </div>
            
            <div style="background-color: #FFFFFF; padding: 40px 30px;">
                <p style="color: #2B2725; font-size: 16px; line-height: 1.6;">
                    <strong>${booking.user_name}</strong> has rescheduled their booking.
                </p>
                
                <div style="background-color: #F9F5EF; padding: 20px; margin: 20px 0;">
                    <p><strong>Service:</strong> ${booking.service_type?.replace(/_/g, ' ')}</p>
                    <p><strong>Client:</strong> ${booking.user_name} (${booking.user_email})</p>
                    ${oldDate ? `<p><strong>Previous Date:</strong> ${formatDate(oldDate)}</p>` : ''}
                    <p><strong>New Date:</strong> ${formatDate(newDate)}</p>
                    ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
                </div>
            </div>
        </div>
    `;
}