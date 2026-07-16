import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const conn = await base44.asServiceRole.connectors.getConnection('googlecalendar');
    const accessToken = conn.accessToken;

    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Get all calendars
    const calListRes = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList',
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );
    const calListData = await calListRes.json();
    const allCalendars = calListData.items || [];

    const results = [];

    for (const cal of allCalendars) {
      const calId = encodeURIComponent(cal.id);
      const eventsRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calId}/events?` +
        `timeMin=${now.toISOString()}&timeMax=${in30Days.toISOString()}&` +
        `singleEvents=true&maxResults=250&orderBy=startTime`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );

      if (!eventsRes.ok) continue;
      const eventsData = await eventsRes.json();
      const events = (eventsData.items || []).filter(e => e.status !== 'cancelled');

      for (const e of events) {
        const isAllDay = !e.start?.dateTime && !!e.start?.date;
        results.push({
          cal: cal.summary || cal.id,
          cal_type: cal.id.includes('@import.calendar') ? 'SUBSCRIBED_ICAL' : (cal.primary ? 'PRIMARY' : 'OWNED'),
          title: e.summary || '(no title)',
          all_day: isAllDay,
          start: isAllDay ? e.start.date : e.start.dateTime,
          end: isAllDay ? e.end.date : e.end.dateTime,
          transparency: e.transparency || 'opaque',
          visibility: e.visibility || 'default',
          creator: e.creator?.email || 'unknown',
        });
      }
      await sleep(50);
    }

    // Sort by start
    results.sort((a, b) => (a.start || '').localeCompare(b.start || ''));

    // Count all-day events
    const allDayEvents = results.filter(r => r.all_day);
    const timedEvents = results.filter(r => !r.all_day);

    return Response.json({
      total_calendars: allCalendars.length,
      calendar_types: allCalendars.map(c => ({
        name: c.summary || c.id,
        type: c.id.includes('@import.calendar') ? 'SUBSCRIBED_ICAL' : (c.primary ? 'PRIMARY' : 'OWNED'),
        events: results.filter(r => r.cal === (c.summary || c.id)).length,
      })),
      total_events: results.length,
      all_day_count: allDayEvents.length,
      timed_count: timedEvents.length,
      all_day_events: allDayEvents,
      events: results,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});