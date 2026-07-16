import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

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
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const searchTitle = body.search_title || null; // optional: filter events by title substring

    let accessToken;
    try {
      const conn = await base44.asServiceRole.connectors.getConnection('googlecalendar');
      accessToken = conn.accessToken;
    } catch (err) {
      return Response.json({ error: 'Google Calendar not connected: ' + err.message }, { status: 400 });
    }

    const allSettings = await base44.asServiceRole.entities.AvailabilitySettings.list();
    const settings = allSettings[0] || {};
    const managerId = settings.manager_id;
    const userTimezone = settings.timezone || 'America/Los_Angeles';

    // Fetch ALL calendars (not just selected)
    const calListRes = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList',
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );
    if (!calListRes.ok) {
      const errText = await calListRes.text();
      return Response.json({ error: `CalendarList API error: ${calListRes.status}`, details: errText }, { status: 500 });
    }
    const calListData = await calListRes.json();
    const allCalendars = calListData.items || [];

    console.log(`Total Google calendars visible: ${allCalendars.length}`);

    const calendarDiag = [];
    const allEventsDiag = [];

    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const todayStr = getDateInTimezone(now.toISOString(), userTimezone);

    for (const cal of allCalendars) {
      const calInfo = {
        id: cal.id,
        summary: cal.summary || cal.id,
        accessRole: cal.accessRole,
        selected: cal.selected,
        deleted: cal.deleted,
        primary: cal.primary || false,
        backgroundColor: cal.backgroundColor,
        hidden: cal.hidden || false,
      };
      calendarDiag.push(calInfo);

      // Production sync skips deleted/unselected — we fetch ALL for diagnosis
      const calId = encodeURIComponent(cal.id);
      const eventsRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calId}/events?` +
        `timeMin=${now.toISOString()}&timeMax=${in30Days.toISOString()}&` +
        `singleEvents=true&maxResults=250&orderBy=startTime`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );

      if (!eventsRes.ok) {
        calInfo.eventsFetchError = `HTTP ${eventsRes.status}`;
        calInfo.eventsCount = 0;
        continue;
      }

      const eventsData = await eventsRes.json();
      const events = (eventsData.items || []).filter(e => e.status !== 'cancelled');
      calInfo.eventsCount = events.length;

      for (const event of events) {
        // Apply optional title filter
        if (searchTitle && !(event.summary || '').toLowerCase().includes(searchTitle.toLowerCase())) {
          continue;
        }

        const isAllDay = !event.start?.dateTime && !!event.start?.date;
        const isOwnBooking = (event.description && event.description.includes('Booking ID:')) ||
                              (event.summary && event.summary.match(/ - Session$/));

        let parsedDate, parsedStart, parsedEnd;
        let wouldCreateRule = false;
        let skipReason = null;

        if (isOwnBooking) {
          skipReason = 'OWN_BOOKING_EVENT';
        }

        // Check declined
        if (!skipReason && event.attendees) {
          const self = event.attendees.find(a => a.self);
          if (self && self.responseStatus === 'declined') {
            skipReason = 'DECLINED_BY_USER';
          }
        }

        // Check if production sync would include this calendar
        const productionIncluded = !cal.deleted && cal.selected !== false;
        if (!skipReason && !productionIncluded) {
          skipReason = `CALENDAR_EXCLUDED (deleted=${cal.deleted}, selected=${cal.selected})`;
        }

        if (!skipReason) {
          if (event.start?.dateTime) {
            parsedDate = getDateInTimezone(event.start.dateTime, userTimezone);
            parsedStart = getTimeInTimezone(event.start.dateTime, userTimezone);
            parsedEnd = getTimeInTimezone(event.end.dateTime, userTimezone);
            wouldCreateRule = true;
          } else if (event.start?.date) {
            parsedDate = event.start.date;
            parsedStart = '00:00';
            parsedEnd = '23:59';
            wouldCreateRule = true;
          } else {
            skipReason = 'NO_START_TIME';
          }
        }

        // Check if rule already exists
        let ruleExists = false;
        if (wouldCreateRule) {
          const existingRules = await base44.asServiceRole.entities.AvailabilityRule.filter({
            manager_id: managerId,
            external_event_id: event.id,
            source: 'calendar_sync'
          });
          ruleExists = existingRules.length > 0;
        }

        allEventsDiag.push({
          calendar_id: cal.id,
          calendar_name: cal.summary || cal.id,
          calendar_included_in_production_sync: productionIncluded,
          event_id: event.id,
          summary: event.summary || '(no title)',
          description_preview: (event.description || '').substring(0, 100),
          start_raw: event.start,
          end_raw: event.end,
          is_all_day: isAllDay,
          transparency: event.transparency || 'opaque',   // 'opaque' = busy (default), 'transparent' = free
          visibility: event.visibility || 'default',
          status: event.status,
          creator: event.creator?.email,
          organizer: event.organizer?.email,
          self_response: event.attendees?.find(a => a.self)?.responseStatus || 'N/A',
          // Parsed output
          parsed_date: parsedDate || null,
          parsed_start_time: parsedStart || null,
          parsed_end_time: parsedEnd || null,
          would_create_blocked_rule: wouldCreateRule,
          skip_reason: skipReason,
          rule_already_exists: ruleExists,
        });
      }

      await sleep(100);
    }

    // Sort events by date
    allEventsDiag.sort((a, b) => {
      const da = a.parsed_date || a.start_raw?.date || a.start_raw?.dateTime || '';
      const db = b.parsed_date || b.start_raw?.date || b.start_raw?.dateTime || '';
      return da.localeCompare(db);
    });

    // Summary
    const transparentEvents = allEventsDiag.filter(e => e.transparency === 'transparent');
    const excludedCalendarEvents = allEventsDiag.filter(e => e.skip_reason?.startsWith('CALENDAR_EXCLUDED'));
    const ownBookingEvents = allEventsDiag.filter(e => e.skip_reason === 'OWN_BOOKING_EVENT');
    const wouldBlock = allEventsDiag.filter(e => e.would_create_blocked_rule);
    const alreadySynced = allEventsDiag.filter(e => e.rule_already_exists);
    const needsSync = allEventsDiag.filter(e => e.would_create_blocked_rule && !e.rule_already_exists);

    return Response.json({
      diagnosis: {
        total_google_calendars: allCalendars.length,
        calendars_included_in_production_sync: allCalendars.filter(c => !c.deleted && c.selected !== false).length,
        total_events_found: allEventsDiag.length,
        events_marked_transparent_FREE: transparentEvents.length,
        events_on_excluded_calendars: excludedCalendarEvents.length,
        events_skipped_own_booking: ownBookingEvents.length,
        events_would_create_block: wouldBlock.length,
        events_already_synced: alreadySynced.length,
        events_needing_new_sync: needsSync.length,
        timezone: userTimezone,
        sync_window: `${todayStr} to ${getDateInTimezone(in30Days.toISOString(), userTimezone)}`,
        NOTE_ON_TRANSPARENCY: 'Google Calendar marks events as "opaque" (busy) by default. Apple iCal events synced to Google are typically opaque. Events marked "transparent" are treated as free time and currently ARE still synced as blocked by our system - but this flag is worth noting.',
      },
      calendars: calendarDiag,
      transparent_free_events: transparentEvents,
      excluded_calendar_events: excludedCalendarEvents.slice(0, 20),
      events_needing_sync: needsSync,
      all_events: allEventsDiag,
    });
  } catch (error) {
    console.error('Diagnostic error:', error);
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});