import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get authenticated user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins/managers can sync
    const isManager = user.role === 'admin' || user.role === 'manager' || user.custom_role === 'manager';
    if (!isManager) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // CANONICAL MANAGER: Always sync to Roberta's manager profile, regardless of who triggers
    const CANONICAL_MANAGER_ID = '693b6b4124b276d4067b6d8e';

    // Get access token using app connector (already authorized)
    let accessToken;
    try {
      const conn = await base44.asServiceRole.connectors.getConnection('googlecalendar');
      accessToken = conn.accessToken;
    } catch (err) {
      return Response.json({ 
        error: 'Google Calendar not connected. Please authorize in Manager Settings first.' 
      }, { status: 400 });
    }
    
    // Fetch events from Google Calendar (next 180 days - full visibility)
    const SYNC_DAYS = 180;
    const now = new Date();
    const futureLimit = new Date(now.getTime() + SYNC_DAYS * 24 * 60 * 60 * 1000);

    // Fetch all calendars the user has access to
    const calListRes = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=reader',
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );
    if (!calListRes.ok) {
      throw new Error(`CalendarList API error: ${calListRes.status}`);
    }
    const calListData = await calListRes.json();
    // Calendars explicitly disabled by admin (inactive, 0 events, safe to skip)
    const DISABLED_CALENDARS = new Set([
      'yourmindstylist@gmail.com',
    ]);

    const calendars = (calListData.items || []).filter(c =>
      !c.deleted && c.selected !== false && !DISABLED_CALENDARS.has(c.id)
    );
    console.log(`Found ${calendars.length} calendars (${DISABLED_CALENDARS.size} disabled): ${calendars.map(c => c.summary || c.id).join(', ')}`);

    // Fetch events from ALL calendars
    const allEvents = [];
    for (const cal of calendars) {
      const calId = encodeURIComponent(cal.id);
      const calendarRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calId}/events?` +
        `timeMin=${now.toISOString()}&` +
        `timeMax=${futureLimit.toISOString()}&` +
        `singleEvents=true&` +
        `maxResults=500&` +
        `orderBy=startTime`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      if (!calendarRes.ok) {
        console.warn(`Skipping calendar ${cal.summary}: ${calendarRes.status}`);
        continue;
      }
      const calendarData = await calendarRes.json();
      const calEvents = (calendarData.items || []).filter(e => e.status !== 'cancelled');
      console.log(`  Calendar "${cal.summary}": ${calEvents.length} events`);
      // Tag each event with its source calendar name
      const calName = cal.summary || cal.id;
      calEvents.forEach(e => { e._calendarName = calName; });
      allEvents.push(...calEvents);
    }

    // De-duplicate by event id
    const seenIds = new Set();
    const events = allEvents.filter(e => {
      if (seenIds.has(e.id)) return false;
      seenIds.add(e.id);
      return true;
    });
    console.log(`Total unique events: ${events.length}`);

    // Get timezone from canonical manager's availability settings
    const settingsRes = await base44.asServiceRole.entities.AvailabilitySettings.filter(
      { manager_id: CANONICAL_MANAGER_ID },
      '-created_date',
      1
    );
    const userTimezone = settingsRes.length > 0 ? settingsRes[0].timezone : 'America/Los_Angeles';

    // Helper to convert UTC time to user's timezone
    const formatTimeInTimezone = (date, timezone) => {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      return formatter.format(new Date(date));
    };

    // Helper to convert UTC date to user's timezone date
    const getDateInTimezone = (date, timezone) => {
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      return formatter.format(new Date(date));
    };

    // Build the fresh set of rules from calendar events
    const rulesToCreate = [];
    for (const event of events) {
      // Skip events created by our own booking system
      if (event.description && event.description.includes('Booking ID:')) continue;
      if (event.summary && event.summary.match(/ - Session$/)) continue;
      // Skip events the user declined
      if (event.attendees) {
        const self = event.attendees.find(a => a.self);
        if (self && self.responseStatus === 'declined') continue;
      }

      if (event.start?.dateTime) {
        rulesToCreate.push({
          manager_id: CANONICAL_MANAGER_ID,
          rule_type: 'blocked',
          specific_date: getDateInTimezone(event.start.dateTime, userTimezone),
          start_time: formatTimeInTimezone(event.start.dateTime, userTimezone),
          end_time: formatTimeInTimezone(event.end.dateTime, userTimezone),
          is_available: false,
          reason: `Calendar: ${event.summary || 'Busy'}`,
          source: 'calendar_sync',
          calendar_name: event._calendarName || null,
          external_event_id: event.id,
          active: true
        });
      } else if (event.start?.date) {
        // All-day event — create block for each day
        let d = new Date(event.start.date + 'T12:00:00Z');
        const endD = new Date((event.end?.date || event.start.date) + 'T12:00:00Z');
        while (d < endD) {
          rulesToCreate.push({
            manager_id: CANONICAL_MANAGER_ID,
            rule_type: 'blocked',
            specific_date: getDateInTimezone(d.toISOString(), userTimezone),
            start_time: '00:00',
            end_time: '23:59',
            is_available: false,
            reason: `All-day: ${event.summary || 'Busy'}`,
            source: 'calendar_sync',
            calendar_name: event._calendarName || null,
            external_event_id: event.id,
            active: true
          });
          d.setUTCDate(d.getUTCDate() + 1);
        }
      }
    }

    // Delta sync: compare new rules with existing ones, only create/delete what changed
    const todayStr = getDateInTimezone(now, userTimezone);
    const futureLimitStr = getDateInTimezone(futureLimit, userTimezone);

    const existingRules = await base44.asServiceRole.entities.AvailabilityRule.filter({
      manager_id: CANONICAL_MANAGER_ID,
      source: 'calendar_sync',
    });

    // Build key sets for comparison
    const newRuleKeys = new Set(rulesToCreate.map(r => `${r.external_event_id}::${r.specific_date}::${r.start_time}`));
    const existingFutureRules = existingRules.filter(r => r.specific_date && r.specific_date >= todayStr && r.specific_date <= futureLimitStr);
    const existingKeys = new Set(existingFutureRules.map(r => `${r.external_event_id}::${r.specific_date}::${r.start_time}`));

    // Rules to delete: exist in DB but not in fresh calendar data
    const toDelete = existingFutureRules.filter(r =>
      r.external_event_id && !newRuleKeys.has(`${r.external_event_id}::${r.specific_date}::${r.start_time}`)
    );
    // Rules to create: exist in calendar but not in DB
    const toCreate = rulesToCreate.filter(r => !existingKeys.has(`${r.external_event_id}::${r.specific_date}::${r.start_time}`));

    console.log(`Delta: ${toDelete.length} to delete, ${toCreate.length} to create (of ${rulesToCreate.length} total)`);

    // Delete stale rules in batches with pauses
    let deletedCount = 0;
    for (let i = 0; i < toDelete.length; i += 5) {
      const batch = toDelete.slice(i, i + 5);
      await Promise.all(batch.map(r => base44.asServiceRole.entities.AvailabilityRule.delete(r.id)));
      deletedCount += batch.length;
      if (i + 5 < toDelete.length) await new Promise(r => setTimeout(r, 600));
    }

    // Create new rules in batches with pauses
    let createdCount = 0;
    for (let i = 0; i < toCreate.length; i += 10) {
      const batch = toCreate.slice(i, i + 10);
      await base44.asServiceRole.entities.AvailabilityRule.bulkCreate(batch);
      createdCount += batch.length;
      if (i + 10 < toCreate.length) await new Promise(r => setTimeout(r, 600));
    }

    return Response.json({
      success: true,
      calendars_synced: calendars.map(c => c.summary || c.id),
      deleted_stale: deletedCount,
      synced_events: createdCount,
      total_calendar_events: rulesToCreate.length,
      existing_rules: existingFutureRules.length,
      sync_days: SYNC_DAYS,
      window: `${todayStr} to ${futureLimitStr}`,
      message: `Delta sync: created ${createdCount} new, removed ${deletedCount} stale from ${calendars.length} calendars (${SYNC_DAYS}-day window)`
    });
  } catch (error) {
    console.error('Calendar sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});