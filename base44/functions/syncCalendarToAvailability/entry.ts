import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get Google Calendar access token
        const conn = await base44.asServiceRole.connectors.getConnection("googlecalendar");
        const accessToken = conn.accessToken;

        // Fetch events from primary calendar for the next 90 days
        const now = new Date();
        const futureDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

        const calendarResponse = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
            `timeMin=${now.toISOString()}&` +
            `timeMax=${futureDate.toISOString()}&` +
            `singleEvents=true&` +
            `orderBy=startTime`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            }
        );

        if (!calendarResponse.ok) {
            const error = await calendarResponse.text();
            console.error('Google Calendar API error:', error);
            return Response.json({ error: 'Failed to fetch calendar events' }, { status: 500 });
        }

        const calendarData = await calendarResponse.json();
        const events = calendarData.items || [];

        // Get existing availability rules created by sync
        const existingRules = await base44.asServiceRole.entities.AvailabilityRule.filter({
            source: 'calendar_sync'
        });

        // Delete old sync rules (we'll recreate them)
        for (const rule of existingRules) {
            await base44.asServiceRole.entities.AvailabilityRule.delete(rule.id);
        }

        // Create blocked time slots for each calendar event
        let blockedCount = 0;
        for (const event of events) {
            // Skip events without start/end times or all-day events
            if (!event.start?.dateTime || !event.end?.dateTime) continue;
            
            // Skip declined events
            if (event.status === 'cancelled') continue;

            const startDate = new Date(event.start.dateTime);
            const endDate = new Date(event.end.dateTime);

            // Create a blocked availability rule for this time slot
            await base44.asServiceRole.entities.AvailabilityRule.create({
                rule_type: 'blocked',
                day_of_week: null, // Specific date override
                specific_date: startDate.toISOString().split('T')[0],
                start_time: startDate.toTimeString().slice(0, 5), // HH:MM format
                end_time: endDate.toTimeString().slice(0, 5),
                is_available: false,
                reason: `Blocked: ${event.summary || 'Busy'}`,
                source: 'calendar_sync',
                external_event_id: event.id
            });

            blockedCount++;
        }

        return Response.json({
            success: true,
            events_synced: events.length,
            blocked_slots_created: blockedCount,
            message: `Synced ${blockedCount} blocked time slots from your calendar`
        });

    } catch (error) {
        console.error('Calendar sync error:', error);
        return Response.json({ 
            error: error.message,
            details: 'Failed to sync calendar. Make sure Google Calendar is connected.'
        }, { status: 500 });
    }
});