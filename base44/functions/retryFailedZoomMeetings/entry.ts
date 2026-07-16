import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user || !['admin', 'manager'].includes(user.role)) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Find all bookings with failed or pending Zoom status that have scheduled dates
        const bookings = await base44.asServiceRole.entities.Booking.filter({
            zoom_status: 'failed',
            booking_status: 'confirmed'
        });

        const results = {
            total: bookings.length,
            success: 0,
            failed: 0,
            details: []
        };

        for (const booking of bookings) {
            if (!booking.scheduled_date) {
                results.details.push({
                    booking_id: booking.id,
                    status: 'skipped',
                    reason: 'No scheduled date'
                });
                continue;
            }

            try {
                // Get appointment type
                const appointmentTypes = await base44.asServiceRole.entities.AppointmentType.filter({
                    service_type: booking.service_type
                });

                if (appointmentTypes.length === 0 || !appointmentTypes[0].zoom_enabled) {
                    results.details.push({
                        booking_id: booking.id,
                        status: 'skipped',
                        reason: 'Zoom not enabled for this type'
                    });
                    continue;
                }

                const appointmentType = appointmentTypes[0];

                // Retry Zoom creation
                const zoomResult = await base44.asServiceRole.functions.invoke('createZoomMeeting', {
                    booking_id: booking.id,
                    scheduled_date: booking.scheduled_date,
                    duration: appointmentType.duration || 60,
                    topic: `${booking.service_type?.replace(/_/g, ' ')} - ${booking.user_name}`,
                    settings: appointmentType.zoom_settings || {}
                });

                if (zoomResult.data.success) {
                    results.success++;
                    results.details.push({
                        booking_id: booking.id,
                        status: 'success',
                        meeting_id: zoomResult.data.meeting_id
                    });
                } else {
                    results.failed++;
                    results.details.push({
                        booking_id: booking.id,
                        status: 'failed',
                        error: zoomResult.data.error
                    });
                }
            } catch (error) {
                results.failed++;
                results.details.push({
                    booking_id: booking.id,
                    status: 'failed',
                    error: error.message
                });
            }
        }

        return Response.json({
            success: true,
            message: `Processed ${results.total} bookings: ${results.success} succeeded, ${results.failed} failed`,
            results: results
        });

    } catch (error) {
        console.error('Bulk retry error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});