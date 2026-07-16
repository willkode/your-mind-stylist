import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user || (user.role !== 'admin' && user.role !== 'manager' && user.custom_role !== 'manager')) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { booking_id, action, data } = await req.json();

        if (!booking_id || !action) {
            return Response.json({ error: 'Booking ID and action are required' }, { status: 400 });
        }

        // Fetch the booking
        const bookings = await base44.asServiceRole.entities.Booking.filter({ id: booking_id });
        if (bookings.length === 0) {
            return Response.json({ error: 'Booking not found' }, { status: 404 });
        }

        const booking = bookings[0];

        switch (action) {
            case 'complete':
                return await completeSession(base44, booking, data);
            case 'add_notes':
                return await addManagerNotes(base44, booking, data);
            case 'reschedule':
                return await managerReschedule(base44, booking, data);
            case 'change_type':
                return await changeAppointmentType(base44, booking, data);
            case 'cancel':
                return await managerCancel(base44, booking, data);
            case 'delete':
                return await deleteBooking(base44, booking);
            default:
                return Response.json({ error: 'Invalid action' }, { status: 400 });
        }

    } catch (error) {
        console.error('Manager booking action error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

async function completeSession(base44, booking, data) {
    if (booking.booking_status === 'completed') {
        return Response.json({ error: 'Session already marked as completed' }, { status: 400 });
    }

    const updateData = {
        booking_status: 'completed',
        completed_at: new Date().toISOString(),
    };

    if (data.session_notes) {
        updateData.session_notes = data.session_notes;
    }

    await base44.asServiceRole.entities.Booking.update(booking.id, updateData);

    // Send completion email to client
    await base44.asServiceRole.integrations.Core.SendEmail({
        to: booking.user_email,
        subject: 'Session Completed - Thank You',
        body: generateCompletionEmail(booking, data.session_notes)
    });

    return Response.json({
        success: true,
        message: 'Session marked as completed'
    });
}

async function addManagerNotes(base44, booking, data) {
    if (!data.manager_notes) {
        return Response.json({ error: 'Manager notes are required' }, { status: 400 });
    }

    await base44.asServiceRole.entities.Booking.update(booking.id, {
        manager_notes: data.manager_notes
    });

    return Response.json({
        success: true,
        message: 'Manager notes added successfully'
    });
}

async function managerReschedule(base44, booking, data) {
    if (!data.new_date) {
        return Response.json({ error: 'New date is required' }, { status: 400 });
    }

    const newScheduledDate = new Date(data.new_date);
    if (isNaN(newScheduledDate.getTime())) {
        return Response.json({ error: 'Invalid date format' }, { status: 400 });
    }

    const oldDate = booking.scheduled_date;

    // Determine appointment type (may be changing)
    let appointmentType = null;
    const updatePayload = {
        scheduled_date: newScheduledDate.toISOString(),
        reminder_24h_sent: false,
        reminder_1h_sent: false,
        notes: booking.notes ? `${booking.notes}\n\nRescheduled by manager from ${oldDate ? new Date(oldDate).toLocaleString() : 'unscheduled'}. Reason: ${data.reason || 'Not provided'}` : `Rescheduled by manager. Reason: ${data.reason || 'Not provided'}`
    };

    if (data.new_appointment_type_id) {
        const types = await base44.asServiceRole.entities.AppointmentType.filter({ id: data.new_appointment_type_id });
        if (types.length > 0) {
            appointmentType = types[0];
            updatePayload.appointment_type_id = appointmentType.id;
            updatePayload.service_type = appointmentType.service_type;
            // Clear old zoom data if switching to in-person
            if (!appointmentType.zoom_enabled) {
                updatePayload.zoom_meeting_id = null;
                updatePayload.zoom_join_url = null;
                updatePayload.zoom_start_url = null;
                updatePayload.zoom_password = null;
                updatePayload.zoom_status = 'pending';
            }
        }
    } else if (booking.appointment_type_id) {
        const types = await base44.asServiceRole.entities.AppointmentType.filter({ id: booking.appointment_type_id });
        if (types.length > 0) appointmentType = types[0];
    }

    await base44.asServiceRole.entities.Booking.update(booking.id, updatePayload);

    // Create/update Zoom if the appointment type has zoom enabled
    if (appointmentType?.zoom_enabled) {
        try {
            await base44.asServiceRole.functions.invoke('createZoomMeeting', { booking_id: booking.id });
        } catch (error) {
            console.error('Error creating Zoom meeting:', error);
        }
    }

    // Sync to Google Calendar
    try {
        await base44.asServiceRole.functions.invoke('syncBookingToCalendar', { booking_id: booking.id });
    } catch (error) {
        console.error('Error syncing to Google Calendar after reschedule:', error);
    }

    // Notify client
    await base44.asServiceRole.integrations.Core.SendEmail({
        to: booking.user_email,
        subject: 'Your Session Has Been Rescheduled',
        body: generateRescheduleEmail(booking, newScheduledDate, oldDate, data.reason)
    });

    return Response.json({
        success: true,
        message: 'Booking rescheduled successfully'
    });
}

async function changeAppointmentType(base44, booking, data) {
    if (!data.new_appointment_type_id) {
        return Response.json({ error: 'New appointment type is required' }, { status: 400 });
    }

    const types = await base44.asServiceRole.entities.AppointmentType.filter({ id: data.new_appointment_type_id });
    if (types.length === 0) {
        return Response.json({ error: 'Appointment type not found' }, { status: 404 });
    }
    const newType = types[0];

    const updatePayload = {
        appointment_type_id: newType.id,
        service_type: newType.service_type,
    };

    // If switching to in-person, clear zoom data
    if (!newType.zoom_enabled) {
        updatePayload.zoom_meeting_id = null;
        updatePayload.zoom_join_url = null;
        updatePayload.zoom_start_url = null;
        updatePayload.zoom_password = null;
        updatePayload.zoom_status = 'pending';
    }

    await base44.asServiceRole.entities.Booking.update(booking.id, updatePayload);

    // If switching to Zoom-enabled type, create a Zoom meeting
    if (newType.zoom_enabled && booking.scheduled_date) {
        try {
            await base44.asServiceRole.functions.invoke('createZoomMeeting', { booking_id: booking.id });
        } catch (error) {
            console.error('Error creating Zoom meeting after type change:', error);
        }
    }

    // Sync to Google Calendar (update the existing event with new type info)
    try {
        await base44.asServiceRole.functions.invoke('syncBookingToCalendar', { booking_id: booking.id });
    } catch (error) {
        console.error('Error syncing to Google Calendar after type change:', error);
    }

    // Notify client of the change
    await base44.asServiceRole.integrations.Core.SendEmail({
        to: booking.user_email,
        subject: 'Your Session Type Has Been Updated',
        body: generateTypeChangeEmail(booking, newType, data.reason)
    });

    return Response.json({
        success: true,
        message: `Appointment type changed to "${newType.name}"${newType.zoom_enabled && booking.scheduled_date ? ' and Zoom link created' : ''}`
    });
}

async function managerCancel(base44, booking, data) {
    if (['cancelled', 'completed'].includes(booking.booking_status)) {
        return Response.json({ error: 'Cannot cancel this booking' }, { status: 400 });
    }

    // Get current user for cancelled_by
    const user = await base44.auth.me();

    await base44.asServiceRole.entities.Booking.update(booking.id, {
        booking_status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_by: user?.email || 'manager',
        cancellation_reason: data.reason || null,
        notes: booking.notes ? `${booking.notes}\n\nCancelled by manager. Reason: ${data.reason || 'Not provided'}` : `Cancelled by manager. Reason: ${data.reason || 'Not provided'}`
    });

    // Delete Google Calendar event if we have the ID
    if (booking.google_event_id) {
        try {
            const conn = await base44.asServiceRole.connectors.getConnection('googlecalendar');
            const delRes = await fetch(
                `https://www.googleapis.com/calendar/v3/calendars/primary/events/${booking.google_event_id}`,
                {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${conn.accessToken}` }
                }
            );
            if (delRes.ok || delRes.status === 204) {
                console.log('[managerCancel] Deleted Google Calendar event:', booking.google_event_id);
            } else {
                console.error('[managerCancel] Failed to delete Google Calendar event:', await delRes.text());
            }
        } catch (calErr) {
            console.error('[managerCancel] Google Calendar cleanup error:', calErr.message);
        }
    }

    // Notify client (try to send email, but don't fail if recipient is not a registered user)
    try {
        await base44.asServiceRole.integrations.Core.SendEmail({
            to: booking.user_email,
            subject: 'Session Cancelled',
            body: generateCancellationEmail(booking, data.reason)
        });
    } catch (emailError) {
        console.log('Could not send cancellation email:', emailError.message);
    }

    return Response.json({
        success: true,
        message: 'Booking cancelled successfully'
    });
}

function generateCompletionEmail(booking, sessionNotes) {
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #F9F5EF;">
            <div style="background-color: #1E3A32; padding: 40px 20px; text-align: center;">
                <h1 style="color: #F9F5EF; font-family: Georgia, serif; font-size: 28px; margin: 0;">
                    Thank You for Your Session
                </h1>
            </div>
            
            <div style="background-color: #FFFFFF; padding: 40px 30px;">
                <p style="color: #2B2725; font-size: 16px; line-height: 1.6; margin-top: 0;">
                    Hi ${booking.user_name},
                </p>
                
                <p style="color: #2B2725; font-size: 16px; line-height: 1.6;">
                    Thank you for completing your <strong>${booking.service_type?.replace(/_/g, ' ')}</strong> session. It was wonderful working with you.
                </p>
                
                ${sessionNotes ? `
                    <div style="background-color: #F9F5EF; border-left: 4px solid #D8B46B; padding: 20px; margin: 20px 0;">
                        <p style="font-weight: 600; color: #1E3A32; margin: 0 0 10px 0;">Session Notes:</p>
                        <p style="margin: 0; color: #2B2725;">${sessionNotes}</p>
                    </div>
                ` : ''}
                
                <p style="color: #2B2725; font-size: 16px; line-height: 1.6;">
                    I look forward to continuing this journey with you. If you'd like to schedule another session or have any questions, please reach out.
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

function generateRescheduleEmail(booking, newDate, oldDate, reason) {
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
                    Session Rescheduled
                </h1>
            </div>
            
            <div style="background-color: #FFFFFF; padding: 40px 30px;">
                <p style="color: #2B2725; font-size: 16px; line-height: 1.6; margin-top: 0;">
                    Hi ${booking.user_name},
                </p>
                
                <p style="color: #2B2725; font-size: 16px; line-height: 1.6;">
                    Your session has been rescheduled${reason ? ` due to: ${reason}` : ''}.
                </p>
                
                <div style="background-color: #E8F4FD; border: 2px solid #2D8CFF; padding: 20px; margin: 20px 0; text-align: center;">
                    <p style="color: #1E3A32; font-weight: 600; margin: 0 0 10px 0;">New Session Time</p>
                    <p style="font-size: 18px; color: #1E3A32; font-weight: 600; margin: 0;">
                        ${formatDate(newDate)}
                    </p>
                </div>
                
                <p style="color: #2B2725; font-size: 16px; line-height: 1.6;">
                    I apologize for any inconvenience. Looking forward to our session at the new time.
                </p>
                
                <p style="color: #2B2725; font-size: 16px; line-height: 1.6; margin-bottom: 0;">
                    Roberta Fernandez<br />
                    <span style="color: #D8B46B; font-size: 14px;">Your Mind Stylist</span>
                </p>
            </div>
        </div>
    `;
}

function generateCancellationEmail(booking, reason) {
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #F9F5EF;">
            <div style="background-color: #1E3A32; padding: 40px 20px; text-align: center;">
                <h1 style="color: #F9F5EF; font-family: Georgia, serif; font-size: 28px; margin: 0;">
                    Session Cancelled
                </h1>
            </div>
            
            <div style="background-color: #FFFFFF; padding: 40px 30px;">
                <p style="color: #2B2725; font-size: 16px; line-height: 1.6; margin-top: 0;">
                    Hi ${booking.user_name},
                </p>
                
                <p style="color: #2B2725; font-size: 16px; line-height: 1.6;">
                    I needed to cancel your upcoming session${reason ? ` due to: ${reason}` : ''}.
                </p>
                
                <p style="color: #2B2725; font-size: 16px; line-height: 1.6;">
                    Please reach out to reschedule at your convenience. I apologize for any inconvenience this may cause.
                </p>
                
                <p style="color: #2B2725; font-size: 16px; line-height: 1.6; margin-bottom: 0;">
                    Roberta Fernandez<br />
                    <span style="color: #D8B46B; font-size: 14px;">Your Mind Stylist</span>
                </p>
            </div>
        </div>
    `;
}

function generateTypeChangeEmail(booking, newType, reason) {
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #F9F5EF;">
            <div style="background-color: #1E3A32; padding: 40px 20px; text-align: center;">
                <h1 style="color: #F9F5EF; font-family: Georgia, serif; font-size: 28px; margin: 0;">
                    Session Updated
                </h1>
            </div>
            <div style="background-color: #FFFFFF; padding: 40px 30px;">
                <p style="color: #2B2725; font-size: 16px; line-height: 1.6; margin-top: 0;">
                    Hi ${booking.user_name},
                </p>
                <p style="color: #2B2725; font-size: 16px; line-height: 1.6;">
                    Your upcoming session type has been updated to <strong>${newType.name}</strong>${reason ? ` — ${reason}` : ''}.
                </p>
                ${newType.zoom_enabled ? `
                <div style="background-color: #E8F4FD; border: 2px solid #2D8CFF; padding: 20px; margin: 20px 0;">
                    <p style="color: #1E3A32; font-weight: 600; margin: 0 0 8px 0;">Virtual Session — Zoom link</p>
                    <p style="color: #2B2725; margin: 0; font-size: 14px;">A Zoom meeting has been created for your session. You will receive the link shortly or can find it in your booking confirmation.</p>
                </div>` : `
                <div style="background-color: #FFF8E8; border: 2px solid #D8B46B; padding: 20px; margin: 20px 0;">
                    <p style="color: #1E3A32; font-weight: 600; margin: 0 0 8px 0;">In-Person Session</p>
                    <p style="color: #2B2725; margin: 0; font-size: 14px;">This session will take place in person. Please reach out if you have any questions about the location.</p>
                </div>`}
                <p style="color: #2B2725; font-size: 16px; line-height: 1.6; margin-bottom: 0;">
                    Roberta Fernandez<br />
                    <span style="color: #D8B46B; font-size: 14px;">Your Mind Stylist</span>
                </p>
            </div>
        </div>
    `;
}

async function deleteBooking(base44, booking) {
    // Delete from Google Calendar if we have the event ID
    if (booking.google_event_id) {
        try {
            const conn = await base44.asServiceRole.connectors.getConnection('googlecalendar');
            const delRes = await fetch(
                `https://www.googleapis.com/calendar/v3/calendars/primary/events/${booking.google_event_id}`,
                {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${conn.accessToken}` }
                }
            );
            if (delRes.ok || delRes.status === 204) {
                console.log('[deleteBooking] Deleted Google Calendar event:', booking.google_event_id);
            } else {
                console.error('[deleteBooking] Failed to delete Google Calendar event:', await delRes.text());
            }
        } catch (error) {
            console.error('[deleteBooking] Google Calendar cleanup error:', error.message);
        }
    }

    // Permanently delete the booking
    await base44.asServiceRole.entities.Booking.delete(booking.id);

    return Response.json({
        success: true,
        message: 'Booking permanently deleted'
    });
}