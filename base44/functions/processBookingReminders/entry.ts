import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        // Get all confirmed bookings
        const bookings = await base44.asServiceRole.entities.Booking.filter({
            booking_status: 'confirmed',
            payment_status: 'paid'
        });

        const now = new Date();
        const results = {
            sent_24h: 0,
            sent_1h: 0,
            skipped: 0,
            failed: 0,
            errors: []
        };

        for (const booking of bookings) {
            try {
                const appointmentDateTime = new Date(`${booking.appointment_date}T${booking.appointment_time}`);
                const hoursUntil = (appointmentDateTime - now) / (1000 * 60 * 60);

                // Skip if no phone number
                if (!booking.client_phone) {
                    results.skipped++;
                    continue;
                }

                // Skip if appointment already passed
                if (hoursUntil < 0) {
                    results.skipped++;
                    continue;
                }

                // 24-hour reminder
                if (hoursUntil <= 24 && hoursUntil > 23 && !booking.reminder_24h_sent) {
                    const message = `Hi ${booking.client_name}! This is a reminder about your appointment tomorrow at ${booking.appointment_time}. Looking forward to seeing you! - Your Mind Stylist`;
                    
                    const smsResult = await base44.asServiceRole.functions.invoke('sendSMS', {
                        to: booking.client_phone,
                        message,
                        booking_id: booking.id
                    });

                    await base44.asServiceRole.entities.Booking.update(booking.id, {
                        reminder_24h_sent: true,
                        last_reminder_sent: new Date().toISOString()
                    });

                    results.sent_24h++;
                }

                // 1-hour reminder
                else if (hoursUntil <= 1 && hoursUntil > 0.5 && !booking.reminder_1h_sent) {
                    const zoomLink = booking.zoom_join_url ? `\n\nZoom Link: ${booking.zoom_join_url}` : '';
                    const message = `Hi ${booking.client_name}! Your appointment is in 1 hour at ${booking.appointment_time}.${zoomLink} See you soon! - Your Mind Stylist`;
                    
                    const smsResult = await base44.asServiceRole.functions.invoke('sendSMS', {
                        to: booking.client_phone,
                        message,
                        booking_id: booking.id
                    });

                    await base44.asServiceRole.entities.Booking.update(booking.id, {
                        reminder_1h_sent: true,
                        last_reminder_sent: new Date().toISOString()
                    });

                    results.sent_1h++;
                }

            } catch (error) {
                console.error(`Failed to process booking ${booking.id}:`, error);
                results.failed++;
                results.errors.push({
                    booking_id: booking.id,
                    error: error.message
                });
            }
        }

        return Response.json({
            success: true,
            summary: results,
            total_bookings_checked: bookings.length
        });

    } catch (error) {
        console.error('Process booking reminders error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});