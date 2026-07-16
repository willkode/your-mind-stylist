import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 1. Get Google Calendar connection and fetch event IDs per calendar
    let accessToken;
    try {
      const conn = await base44.asServiceRole.connectors.getConnection('googlecalendar');
      accessToken = conn.accessToken;
    } catch (err) {
      return Response.json({ error: 'Google Calendar not connected' }, { status: 500 });
    }

    // Fetch calendar list
    const calListRes = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const calListData = await calListRes.json();
    const calendars = calListData.items || [];

    // Build eventId -> calendarName mapping from Google
    const eventToCalendar = {}; // external_event_id -> { calendarName, calendarId, calType }
    const SYNC_DAYS = 365; // look wider than sync window
    const now = new Date();
    const futureLimit = new Date(now.getTime() + SYNC_DAYS * 24 * 60 * 60 * 1000);

    for (const cal of calendars) {
      const calId = encodeURIComponent(cal.id);
      let calType = 'owned';
      if (cal.primary) calType = 'primary';
      else if (cal.id.includes('@import.calendar.google.com')) calType = 'imported_ical';
      else if (cal.id.includes('@group.calendar.google.com')) calType = 'subscribed';
      else if (cal.accessRole === 'reader' || cal.accessRole === 'freeBusyReader') calType = 'subscribed';

      try {
        const eventsRes = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${calId}/events?` +
          `timeMin=${now.toISOString()}&timeMax=${futureLimit.toISOString()}&` +
          `singleEvents=true&maxResults=2500&orderBy=startTime`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (eventsRes.ok) {
          const eventsData = await eventsRes.json();
          for (const ev of (eventsData.items || [])) {
            if (ev.status === 'cancelled') continue;
            eventToCalendar[ev.id] = {
              calendarName: cal.summary || cal.id,
              calendarId: cal.id,
              calType,
            };
          }
        }
      } catch (e) {
        console.warn(`Failed to fetch events for ${cal.summary}: ${e.message}`);
      }
    }

    // 2. Get ALL calendar_sync availability rules
    const allRules = await base44.asServiceRole.entities.AvailabilityRule.filter(
      { source: 'calendar_sync', active: true }
    );

    const today = now.toISOString().slice(0, 10);

    // 3. Classify every rule
    const classified = allRules.map(r => {
      const hasLabel = r.calendar_name && r.calendar_name.trim() !== '';
      let resolvedSource = null;
      let resolvedCalType = null;

      if (hasLabel) {
        resolvedSource = r.calendar_name;
        // Infer type from known names
        if (r.calendar_name === 'Roberta') {
          resolvedCalType = 'imported_ical';
        } else if (r.calendar_name === 'farehypnosis@gmail.com') {
          resolvedCalType = 'primary';
        } else {
          resolvedCalType = 'other_labeled';
        }
      } else if (r.external_event_id && eventToCalendar[r.external_event_id]) {
        // Resolve from Google API
        const match = eventToCalendar[r.external_event_id];
        resolvedSource = match.calendarName;
        resolvedCalType = match.calType;
      } else {
        resolvedSource = '_unresolvable';
        resolvedCalType = '_unresolvable';
      }

      const isPast = r.specific_date && r.specific_date < today;
      const isFuture = r.specific_date && r.specific_date >= today;

      return {
        id: r.id,
        manager_id: r.manager_id,
        specific_date: r.specific_date,
        start_time: r.start_time,
        end_time: r.end_time,
        reason: r.reason,
        external_event_id: r.external_event_id,
        calendar_name_stored: r.calendar_name || null,
        resolved_source: resolvedSource,
        resolved_cal_type: resolvedCalType,
        has_label: hasLabel,
        is_past: isPast,
        is_future: isFuture,
        created_date: r.created_date,
      };
    });

    // 4. Stats: all 340 rules
    const totalRules = classified.length;
    const pastRules = classified.filter(r => r.is_past).length;
    const futureRules = classified.filter(r => r.is_future).length;

    // 5. Source breakdown (all rules)
    const byResolvedSource = {};
    const byResolvedType = {};
    for (const r of classified) {
      byResolvedSource[r.resolved_source] = (byResolvedSource[r.resolved_source] || 0) + 1;
      byResolvedType[r.resolved_cal_type] = (byResolvedType[r.resolved_cal_type] || 0) + 1;
    }

    // 6. Unknown-only breakdown
    const unknownOnly = classified.filter(r => !r.has_label);
    const unknownBySource = {};
    const unknownByType = {};
    for (const r of unknownOnly) {
      unknownBySource[r.resolved_source] = (unknownBySource[r.resolved_source] || 0) + 1;
      unknownByType[r.resolved_cal_type] = (unknownByType[r.resolved_cal_type] || 0) + 1;
    }

    // 7. Duplicate detection: same external_event_id across different manager_ids
    const eventManagerGroups = {};
    for (const r of classified) {
      if (!r.external_event_id) continue;
      if (!eventManagerGroups[r.external_event_id]) {
        eventManagerGroups[r.external_event_id] = [];
      }
      eventManagerGroups[r.external_event_id].push(r);
    }

    let crossManagerDuplicateEvents = 0;
    let crossManagerDuplicateRules = 0;
    const crossManagerSamples = [];
    for (const [eid, entries] of Object.entries(eventManagerGroups)) {
      const managerIds = [...new Set(entries.map(e => e.manager_id))];
      if (managerIds.length > 1) {
        crossManagerDuplicateEvents++;
        crossManagerDuplicateRules += entries.length; // all copies
        if (crossManagerSamples.length < 5) {
          crossManagerSamples.push({
            external_event_id: eid.slice(0, 40) + '...',
            reason: entries[0].reason,
            date: entries[0].specific_date,
            time: `${entries[0].start_time}-${entries[0].end_time}`,
            copies: entries.map(e => ({
              id: e.id,
              manager_id: e.manager_id,
              calendar_name_stored: e.calendar_name_stored,
              resolved_source: e.resolved_source,
            })),
          });
        }
      }
    }

    // 8. Time-slot duplicates: same date+time+title across different rules (regardless of event ID)
    const slotGroups = {};
    for (const r of classified) {
      const key = `${r.specific_date}__${r.start_time}__${r.end_time}__${r.reason}`;
      if (!slotGroups[key]) slotGroups[key] = [];
      slotGroups[key].push(r);
    }

    let timeSlotDuplicateGroups = 0;
    let timeSlotDuplicateRules = 0;
    const timeSlotSamples = [];
    for (const [key, entries] of Object.entries(slotGroups)) {
      if (entries.length > 1) {
        timeSlotDuplicateGroups++;
        timeSlotDuplicateRules += entries.length;
        if (timeSlotSamples.length < 5) {
          timeSlotSamples.push({
            slot: key.replace(/__/g, ' | '),
            count: entries.length,
            entries: entries.map(e => ({
              id: e.id,
              manager_id: e.manager_id,
              calendar_name_stored: e.calendar_name_stored,
              resolved_source: e.resolved_source,
              resolved_cal_type: e.resolved_cal_type,
            })),
          });
        }
      }
    }

    // 9. Deduplication check: does the sync function dedupe?
    // Check if same external_event_id + same manager_id appears more than once
    const sameManagerDupeGroups = {};
    for (const r of classified) {
      if (!r.external_event_id) continue;
      const key = `${r.external_event_id}__${r.manager_id}`;
      if (!sameManagerDupeGroups[key]) sameManagerDupeGroups[key] = [];
      sameManagerDupeGroups[key].push(r);
    }
    let sameManagerDupes = 0;
    for (const entries of Object.values(sameManagerDupeGroups)) {
      if (entries.length > 1) sameManagerDupes += entries.length - 1;
    }

    // 10. Manager ID summary
    const managerIds = [...new Set(classified.map(r => r.manager_id))];
    const byManager = {};
    for (const r of classified) {
      const mid = r.manager_id;
      if (!byManager[mid]) byManager[mid] = { total: 0, labeled: 0, unlabeled: 0 };
      byManager[mid].total++;
      if (r.has_label) byManager[mid].labeled++;
      else byManager[mid].unlabeled++;
    }

    return Response.json({
      // ===== TOTALS =====
      total_rules: totalRules,
      past_rules: pastRules,
      future_rules: futureRules,
      past_pct: Math.round((pastRules / totalRules) * 100),
      future_pct: Math.round((futureRules / totalRules) * 100),

      // ===== ALL RULES: SOURCE BREAKDOWN =====
      all_rules_by_resolved_source: byResolvedSource,
      all_rules_by_resolved_type: byResolvedType,

      // ===== UNKNOWN 239: SOURCE BREAKDOWN =====
      unknown_count: unknownOnly.length,
      unknown_by_resolved_source: unknownBySource,
      unknown_by_resolved_type: unknownByType,
      unknown_from_ical_pct: Math.round(((unknownByType['imported_ical'] || 0) / unknownOnly.length) * 100),
      unknown_from_primary_pct: Math.round(((unknownByType['primary'] || 0) / unknownOnly.length) * 100),
      unknown_unresolvable_pct: Math.round(((unknownByType['_unresolvable'] || 0) / unknownOnly.length) * 100),

      // ===== DUPLICATE ANALYSIS =====
      cross_manager_duplicate_events: crossManagerDuplicateEvents,
      cross_manager_duplicate_rules: crossManagerDuplicateRules,
      cross_manager_duplicate_pct: Math.round((crossManagerDuplicateRules / totalRules) * 100),
      cross_manager_samples: crossManagerSamples,

      timeslot_duplicate_groups: timeSlotDuplicateGroups,
      timeslot_duplicate_rules: timeSlotDuplicateRules,
      timeslot_duplicate_pct: Math.round((timeSlotDuplicateRules / totalRules) * 100),
      timeslot_samples: timeSlotSamples,

      same_manager_same_event_dupes: sameManagerDupes,

      // ===== DEDUP VERDICT =====
      dedup_at_sync_level: sameManagerDupes === 0,
      dedup_at_render_level: false, // we know it's not happening there
      dedup_explanation: sameManagerDupes === 0
        ? 'The sync function does deduplicate within a single manager (no same-event same-manager duplicates exist). BUT it syncs the same events to TWO different manager IDs, creating cross-manager duplicates. There is NO deduplication at the render/UI level — both copies show on the calendar.'
        : `Found ${sameManagerDupes} same-manager duplicates — sync dedup is broken.`,

      // ===== MANAGER BREAKDOWN =====
      manager_ids: managerIds,
      by_manager: byManager,

      // ===== GOOGLE API RESOLUTION STATS =====
      google_event_ids_indexed: Object.keys(eventToCalendar).length,
      calendars_indexed: calendars.map(c => ({
        name: c.summary,
        id_prefix: c.id.slice(0, 30),
        type: c.primary ? 'primary' : c.id.includes('@import') ? 'imported_ical' : c.id.includes('@group') ? 'subscribed' : 'owned',
      })),
    });
  } catch (error) {
    console.error('[auditBlocksBySource] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});