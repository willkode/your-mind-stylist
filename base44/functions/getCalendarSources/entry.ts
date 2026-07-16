import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get Google Calendar connection
    let accessToken;
    try {
      const conn = await base44.asServiceRole.connectors.getConnection('googlecalendar');
      accessToken = conn.accessToken;
    } catch (err) {
      return Response.json({
        connected: false,
        error: 'Google Calendar not connected',
        calendars: [],
      });
    }

    // Fetch calendar list from Google
    const calListRes = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList',
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );
    if (!calListRes.ok) {
      return Response.json({ error: `Google API error: ${calListRes.status}` }, { status: 500 });
    }
    const calListData = await calListRes.json();
    const allCalendars = calListData.items || [];

    // Fetch events for next 180 days per calendar
    const SYNC_DAYS = 180;
    const now = new Date();
    const futureLimit = new Date(now.getTime() + SYNC_DAYS * 24 * 60 * 60 * 1000);

    // Calendars explicitly disabled by admin
    const DISABLED_CALENDARS = new Set([
      'yourmindstylist@gmail.com',
    ]);

    const calendarSources = [];

    for (const cal of allCalendars) {
      const calId = encodeURIComponent(cal.id);
      let eventCount = 0;

      try {
        const eventsRes = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${calId}/events?` +
          `timeMin=${now.toISOString()}&timeMax=${futureLimit.toISOString()}&` +
          `singleEvents=true&maxResults=500&orderBy=startTime`,
          { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );
        if (eventsRes.ok) {
          const eventsData = await eventsRes.json();
          eventCount = (eventsData.items || []).filter(e => e.status !== 'cancelled').length;
        }
      } catch (e) {
        console.warn(`Failed to fetch events for ${cal.summary}: ${e.message}`);
      }

      // Determine calendar type
      let calType = 'owned';
      if (cal.primary) {
        calType = 'primary';
      } else if (cal.id.includes('@import.calendar.google.com')) {
        calType = 'imported';
      } else if (cal.id.includes('@group.calendar.google.com')) {
        calType = 'subscribed';
      } else if (cal.accessRole === 'reader' || cal.accessRole === 'freeBusyReader') {
        calType = 'subscribed';
      }

      // Determine recommendation
      let recommendation = 'keep';
      if (eventCount === 0) {
        recommendation = 'review';
      }
      if (calType === 'imported' && eventCount > 0) {
        recommendation = 'review'; // imported calendars should be reviewed regardless
      }

      // Determine if currently included in sync
      const isDisabled = DISABLED_CALENDARS.has(cal.id);
      const isSelected = cal.selected !== false && !cal.deleted && !isDisabled;

      calendarSources.push({
        id: cal.id,
        display_name: cal.summary || cal.id,
        description: cal.description || null,
        account_email: cal.id.includes('@') ? cal.id.split('@')[0].length > 30 ? null : cal.id : null,
        calendar_id: cal.id,
        type: calType,
        access_role: cal.accessRole || 'unknown',
        primary: !!cal.primary,
        selected: isSelected,
        included_in_sync: isSelected,
        disabled: isDisabled,
        event_count_180d: eventCount,
        foreground_color: cal.foregroundColor || null,
        background_color: cal.backgroundColor || null,
        recommendation: isDisabled ? 'disabled' : recommendation,
      });
    }

    // Sort: primary first, then by event count descending
    calendarSources.sort((a, b) => {
      if (a.primary && !b.primary) return -1;
      if (!a.primary && b.primary) return 1;
      return b.event_count_180d - a.event_count_180d;
    });

    // Get last sync time from availability rules
    const syncRules = await base44.asServiceRole.entities.AvailabilityRule.filter(
      { source: 'calendar_sync', active: true },
      '-updated_date',
      1
    );
    const lastSyncTime = syncRules.length > 0 ? syncRules[0].updated_date : null;

    // Get total synced event count (blocked rules from calendar)
    const allSyncRules = await base44.asServiceRole.entities.AvailabilityRule.filter(
      { source: 'calendar_sync', active: true }
    );
    const totalSyncedBlocks = allSyncRules.length;

    // Per-calendar synced block counts
    const syncedBlocksByCalendar = {};
    for (const rule of allSyncRules) {
      const name = rule.calendar_name || '_unknown';
      syncedBlocksByCalendar[name] = (syncedBlocksByCalendar[name] || 0) + 1;
    }

    return Response.json({
      connected: true,
      calendars: calendarSources,
      total_google_calendars: calendarSources.length,
      total_synced_blocks: totalSyncedBlocks,
      synced_blocks_by_calendar: syncedBlocksByCalendar,
      last_sync_time: lastSyncTime,
      sync_window_days: SYNC_DAYS,
    });
  } catch (error) {
    console.error('[getCalendarSources] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});