import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user || (user.role !== 'admin' && user.custom_role !== 'manager')) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { booking_id } = await req.json();

        if (!booking_id) {
            return Response.json({ error: 'Booking ID is required' }, { status: 400 });
        }

        // Fetch the booking
        const bookings = await base44.asServiceRole.entities.Booking.filter({ id: booking_id });
        if (bookings.length === 0) {
            return Response.json({ error: 'Booking not found' }, { status: 404 });
        }

        const booking = bookings[0];

        // Check if booking needs Zoom meeting
        if (!booking.scheduled_date) {
            return Response.json({ error: 'Booking must have a scheduled date first' }, { status: 400 });
        }

        // Get appointment type to check if Zoom is enabled
        if (!booking.appointment_type_id) {
            return Response.json({ error: 'Booking has no appointment type assigned' }, { status: 400 });
        }

        const appointmentTypes = await base44.asServiceRole.entities.AppointmentType.filter({
            id: booking.appointment_type_id
        });

        if (appointmentTypes.length === 0) {
            return Response.json({ error: 'Appointment type not found' }, { status: 404 });
        }

        const appointmentType = appointmentTypes[0];

        if (!appointmentType.zoom_enabled) {
            return Response.json({ error: 'Zoom is not enabled for this appointment type' }, { status: 400 });
        }

        // Create Zoom meeting
        try {
            const zoomResult = await base44.asServiceRole.functions.invoke('createZoomMeeting', {
                booking_id: booking.id,
                scheduled_date: booking.scheduled_date,
                duration: appointmentType.duration || 60,
                topic: `${booking.service_type?.replace(/_/g, ' ')} - ${booking.user_name}`,
                settings: appointmentType.zoom_settings || {}
            });

            if (zoomResult.data.success) {
                return Response.json({
                    success: true,
                    message: 'Zoom meeting created successfully',
                    zoom_data: {
                        meeting_id: zoomResult.data.meeting_id,
                        join_url: zoomResult.data.join_url
                    }
                });
            } else {
                return Response.json({
                    success: false,
                    error: zoomResult.data.error || 'Failed to create Zoom meeting'
                }, { status: 500 });
            }
        } catch (error) {
            console.error('Zoom creation error:', error);
            
            // Mark as failed
            await base44.asServiceRole.entities.Booking.update(booking.id, {
                zoom_status: 'failed'
            });

            return Response.json({
                success: false,
                error: error.message || 'Failed to create Zoom meeting'
            }, { status: 500 });
        }

    } catch (error) {
        console.error('Retry Zoom creation error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});