import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Timezone helpers
const getDateInTimezone = (isoStr, tz) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' })
    .format(new Date(isoStr));

const getTimeInTimezone = (isoStr, tz) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false
  }).formatToParts(new Date(isoStr));
  let h = parts.find(p => p.type === 'hour')?.value || '00';
  const m = parts.find(p => p.type === 'minute')?.value || '00';
  if (h === '24') h = '00';
  return `${h}:${m}`;
};

Deno.serve(async (req) => {
  const _syncStartTime = Date.now();
  try {
    const base44 = createClientFromRequest(req);

    // Get access token via service role connector
    let accessToken;
    try {
      const conn = await base44.asServiceRole.connectors.getConnection('googlecalendar');
      accessToken = conn.accessToken;
    } catch (err) {
      throw new Error(`Google Calendar not connected: ${err.message}`);
    }

    // Get availability settings
    const allSettings = await base44.asServiceRole.entities.AvailabilitySettings.list();
    if (!allSettings || allSettings.length === 0) {
      throw new Error('No availability settings found — cannot determine timezone or manager.');
    }

    const settings = allSettings[0];
    // CANONICAL MANAGER: Always sync to Roberta's profile, regardless of settings order
    const CANONICAL_MANAGER_ID = '693b6b4124b276d4067b6d8e';
    const managerId = CANONICAL_MANAGER_ID;
    const userTimezone = settings.timezone || 'America/Los_Angeles';
    console.log(`Syncing for canonical manager ${managerId} timezone=${userTimezone}`);

    // Fetch all calendars the user has access to
    const calListRes = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=reader',
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );
    if (!calListRes.ok) {
      const errText = await calListRes.text();
      console.error('CalendarList error:', errText);
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

    // Time window: now → 180 days out (6 months for full visibility)
    const SYNC_DAYS = 180;
    const now = new Date();
    const futureLimit = new Date(now.getTime() + SYNC_DAYS * 24 * 60 * 60 * 1000);
    const todayStr = getDateInTimezone(now.toISOString(), userTimezone);
    const futureLimitStr = getDateInTimezone(futureLimit.toISOString(), userTimezone);

    // Fetch events from ALL calendars
    const allEvents = [];
    for (const cal of calendars) {
      const calId = encodeURIComponent(cal.id);
      const eventsRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calId}/events?` +
        `timeMin=${now.toISOString()}&timeMax=${futureLimit.toISOString()}&` +
        `singleEvents=true&maxResults=500&orderBy=startTime`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );
      if (!eventsRes.ok) {
        console.warn(`Skipping calendar ${cal.summary}: ${eventsRes.status}`);
        continue;
      }
      const eventsData = await eventsRes.json();
      const events = (eventsData.items || []).filter(e => e.status !== 'cancelled');
      console.log(`  Calendar "${cal.summary}": ${events.length} events`);
      // Tag each event with its source calendar name
      const calName = cal.summary || cal.id;
      events.forEach(e => { e._calendarName = calName; });
      allEvents.push(...events);
      await sleep(100); // small pause between calendar requests
    }

    console.log(`Total events across all calendars: ${allEvents.length}`);

    // De-duplicate by event id (same event can appear in multiple calendars if shared)
    const seenIds = new Set();
    const uniqueEvents = allEvents.filter(e => {
      if (seenIds.has(e.id)) return false;
      seenIds.add(e.id);
      return true;
    });
    console.log(`Unique events after de-dup: ${uniqueEvents.length}`);

    // Build new blocked rules from events
    const newRules = [];
    for (const event of uniqueEvents) {
      // Skip events created by our own booking system (they have 'Booking ID:' in description)
      if (event.description && event.description.includes('Booking ID:')) {
        console.log(`Skipping own booking event: ${event.summary}`);
        continue;
      }
      // Skip if summary ends with ' - Session' (our booking event pattern)
      if (event.summary && event.summary.match(/ - Session$/)) {
        console.log(`Skipping own session event: ${event.summary}`);
        continue;
      }
      // Skip events the user declined
      if (event.attendees) {
        const self = event.attendees.find(a => a.self);
        if (self && self.responseStatus === 'declined') continue;
      }

      if (event.start?.dateTime) {
        newRules.push({
          manager_id: managerId,
          rule_type: 'blocked',
          specific_date: getDateInTimezone(event.start.dateTime, userTimezone),
          start_time: getTimeInTimezone(event.start.dateTime, userTimezone),
          end_time: getTimeInTimezone(event.end.dateTime, userTimezone),
          is_available: false,
          reason: `Calendar: ${event.summary || 'Busy'}`,
          source: 'calendar_sync',
          calendar_name: event._calendarName || null,
          external_event_id: event.id,
          active: true
        });
      } else if (event.start?.date) {
        // All-day event
        let d = new Date(event.start.date + 'T12:00:00Z');
        const endD = new Date((event.end?.date || event.start.date) + 'T12:00:00Z');
        while (d < endD) {
          newRules.push({
            manager_id: managerId,
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

    // Delta sync: compare with existing rules in the window
    const newRuleKeys = new Set(newRules.map(r => `${r.external_event_id}::${r.specific_date}::${r.start_time}`));

    const existingRules = await base44.asServiceRole.entities.AvailabilityRule.filter({
      manager_id: managerId,
      source: 'calendar_sync'
    });

    const toDelete = existingRules.filter(r =>
      r.specific_date &&
      r.specific_date >= todayStr &&
      r.specific_date <= futureLimitStr &&
      r.external_event_id &&
      !newRuleKeys.has(`${r.external_event_id}::${r.specific_date}::${r.start_time}`)
    );

    const existingKeys = new Set(
      existingRules
        .filter(r => r.specific_date >= todayStr && r.specific_date <= futureLimitStr)
        .map(r => `${r.external_event_id}::${r.specific_date}::${r.start_time}`)
    );
    const toCreate = newRules.filter(r => !existingKeys.has(`${r.external_event_id}::${r.specific_date}::${r.start_time}`));

    console.log(`Delta: ${toDelete.length} to delete, ${toCreate.length} to create`);

    // Delete stale rules (small batches to avoid rate limits, ignore already-deleted)
    let deleted = 0;
    for (let i = 0; i < toDelete.length; i += 3) {
      const batch = toDelete.slice(i, i + 3);
      await Promise.all(batch.map(r =>
        base44.asServiceRole.entities.AvailabilityRule.delete(r.id).catch(() => {})
      ));
      deleted += batch.length;
      await sleep(1000);
    }

    // Create new rules
    let created = 0;
    for (let i = 0; i < toCreate.length; i += 10) {
      const batch = toCreate.slice(i, i + 10);
      await base44.asServiceRole.entities.AvailabilityRule.bulkCreate(batch);
      created += batch.length;
      if (i + 10 < toCreate.length) await sleep(500);
    }

    console.log(`Sync complete: ${deleted} deleted, ${created} created`);

    // Log successful sync
    try {
      // Count consecutive failures before this success (to reset counter)
      await base44.asServiceRole.entities.CalendarSyncLog.create({
        sync_type: 'scheduled_sync',
        status: 'success',
        calendars_synced: calendars.map(c => c.summary || c.id),
        events_found: uniqueEvents.length,
        rules_created: created,
        rules_deleted: deleted,
        consecutive_failures: 0,
        duration_ms: Date.now() - _syncStartTime
      });
    } catch (logErr) {
      console.warn('Failed to log sync success:', logErr.message);
    }

    return Response.json({
      success: true,
      calendars_synced: calendars.map(c => c.summary || c.id),
      unique_events: uniqueEvents.length,
      rules_deleted: deleted,
      rules_created: created,
      timezone: userTimezone,
      sync_days: SYNC_DAYS,
      window: `${todayStr} to ${futureLimitStr}`,
      message: `Synced ${created} new / removed ${deleted} stale blocked slots from ${calendars.length} Google Calendars (${SYNC_DAYS}-day window)`
    });
  } catch (error) {
    console.error('Calendar sync error:', error.message);

    // Log the failure and count consecutive failures
    try {
      const base44ForLog = createClientFromRequest(req);
      const recentLogs = await base44ForLog.asServiceRole.entities.CalendarSyncLog.list('-created_date', 10);
      let consecutiveFailures = 0;
      for (const log of recentLogs) {
        if (log.status === 'failure') consecutiveFailures++;
        else break;
      }
      consecutiveFailures++; // Include this failure

      const errorType = error.message?.includes('401') || error.message?.includes('403') || error.message?.includes('not connected')
        ? 'auth_expired'
        : error.message?.includes('Rate limit') ? 'rate_limit'
        : error.message?.includes('fetch') ? 'network'
        : 'unknown';

      // Send alert if threshold exceeded
      let alertSent = false;
      if (consecutiveFailures >= 2) {
        try {
          await base44ForLog.asServiceRole.integrations.Core.SendEmail({
            to: 'roberta@robertafernandez.com',
            from_name: 'Your Mind Stylist — System Alert',
            subject: '⚠️ Google Calendar Sync Failed — Action Needed',
            body: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
                <div style="background: #FEF3CD; border-left: 4px solid #D8B46B; padding: 16px; margin-bottom: 24px;">
                  <h2 style="color: #1E3A32; margin: 0 0 8px 0;">Calendar Sync Alert</h2>
                  <p style="color: #2B2725; margin: 0; font-size: 14px;">
                    Google Calendar sync has failed <strong>${consecutiveFailures} times in a row</strong>.
                  </p>
                </div>
                <p style="color: #2B2725; font-size: 14px;">
                  <strong>Error:</strong> ${error.message}
                </p>
                <p style="color: #2B2725; font-size: 14px;">
                  Your booking availability may be out of date. Please contact Indy to reconnect your Google Calendar.
                </p>
              </div>
            `
          });
          alertSent = true;
          console.log(`Alert email sent — ${consecutiveFailures} consecutive failures`);
        } catch (emailErr) {
          console.error('Failed to send alert email:', emailErr.message);
        }
      }

      await base44ForLog.asServiceRole.entities.CalendarSyncLog.create({
        sync_type: 'scheduled_sync',
        status: 'failure',
        error_message: error.message,
        error_type: errorType,
        consecutive_failures: consecutiveFailures,
        alert_sent: alertSent,
        duration_ms: Date.now() - _syncStartTime
      });
    } catch (logErr) {
      console.error('Failed to log sync failure:', logErr.message);
    }

    return Response.json({ error: error.message }, { status: 500 });
  }
});