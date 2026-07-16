import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch all confirmed/scheduled bookings
        const allBookings = await base44.asServiceRole.entities.Booking.list('-scheduled_date');
        const bookings = allBookings.filter(b => 
            b.scheduled_date && 
            (b.booking_status === 'confirmed' || b.booking_status === 'scheduled')
        );

        // Generate iCal format
        let icalContent = 'BEGIN:VCALENDAR\r\n';
        icalContent += 'VERSION:2.0\r\n';
        icalContent += 'PRODID:-//Your Mind Stylist//Booking Calendar//EN\r\n';
        icalContent += 'CALSCALE:GREGORIAN\r\n';
        icalContent += 'METHOD:PUBLISH\r\n';
        icalContent += 'X-WR-CALNAME:Mind Stylist Bookings\r\n';
        icalContent += 'X-WR-TIMEZONE:America/Los_Angeles\r\n';
        icalContent += 'X-WR-CALDESC:Client booking sessions\r\n';

        bookings.forEach(booking => {
            const startDate = new Date(booking.scheduled_date);
            
            // Determine duration based on appointment type (default 60 minutes)
            const durationMinutes = booking.duration || 60;
            const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

            // Format dates for iCal (YYYYMMDDTHHMMSS)
            const formatICalDate = (date) => {
                return date.toISOString()
                    .replace(/[-:]/g, '')
                    .replace(/\.\d{3}/, '')
                    .replace(/Z$/, 'Z');
            };

            const uid = `booking-${booking.id}@yourmindstylist.com`;
            const dtstart = formatICalDate(startDate);
            const dtend = formatICalDate(endDate);
            const dtstamp = formatICalDate(new Date());

            // Build description with booking details
            let description = `Client: ${booking.user_name}\\n`;
            description += `Email: ${booking.user_email}\\n`;
            if (booking.client_phone) {
                description += `Phone: ${booking.client_phone}\\n`;
            }
            if (booking.zoom_join_url) {
                description += `\\nZoom: ${booking.zoom_join_url}\\n`;
            }
            if (booking.client_goals) {
                description += `\\nGoals: ${booking.client_goals}\\n`;
            }

            // Add event
            icalContent += 'BEGIN:VEVENT\r\n';
            icalContent += `UID:${uid}\r\n`;
            icalContent += `DTSTAMP:${dtstamp}\r\n`;
            icalContent += `DTSTART:${dtstart}\r\n`;
            icalContent += `DTEND:${dtend}\r\n`;
            icalContent += `SUMMARY:${booking.user_name}\r\n`;
            icalContent += `DESCRIPTION:${description}\r\n`;
            if (booking.zoom_join_url) {
                icalContent += `LOCATION:${booking.zoom_join_url}\r\n`;
            }
            icalContent += `STATUS:CONFIRMED\r\n`;
            icalContent += 'END:VEVENT\r\n';
        });

        icalContent += 'END:VCALENDAR\r\n';

        // Return iCal file
        return new Response(icalContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/calendar; charset=utf-8',
                'Content-Disposition': 'attachment; filename="bookings.ics"',
            },
        });

    } catch (error) {
        console.error('iCal generation error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});