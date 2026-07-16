import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get ALL calendar_sync rules
    const allRules = await base44.asServiceRole.entities.AvailabilityRule.filter(
      { source: 'calendar_sync', active: true }
    );

    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // Separate known vs unknown
    const withCalendarName = allRules.filter(r => r.calendar_name && r.calendar_name.trim() !== '');
    const withoutCalendarName = allRules.filter(r => !r.calendar_name || r.calendar_name.trim() === '');

    // Unknown blocks analysis
    const unknownPast = withoutCalendarName.filter(r => r.specific_date && r.specific_date < today);
    const unknownFuture = withoutCalendarName.filter(r => r.specific_date && r.specific_date >= today);
    const unknownNoDates = withoutCalendarName.filter(r => !r.specific_date);

    // Date range of unknown blocks
    const unknownDates = withoutCalendarName
      .filter(r => r.specific_date)
      .map(r => r.specific_date)
      .sort();
    const earliestUnknown = unknownDates[0] || null;
    const latestUnknown = unknownDates[unknownDates.length - 1] || null;

    // Manager ID distribution
    const managerCounts = {};
    for (const r of withoutCalendarName) {
      const mid = r.manager_id || '_no_manager';
      managerCounts[mid] = (managerCounts[mid] || 0) + 1;
    }

    // Created date distribution (to find when these were synced)
    const createdDateCounts = {};
    for (const r of withoutCalendarName) {
      // Extract just the date from created_date
      const cd = r.created_date ? new Date(r.created_date).toISOString().slice(0, 10) : '_unknown';
      createdDateCounts[cd] = (createdDateCounts[cd] || 0) + 1;
    }

    // Check for duplicates: same external_event_id + same manager_id
    const eventManagerMap = {};
    const duplicates = [];
    for (const r of allRules) {
      const key = `${r.external_event_id}__${r.manager_id}`;
      if (!eventManagerMap[key]) {
        eventManagerMap[key] = [];
      }
      eventManagerMap[key].push({
        id: r.id,
        calendar_name: r.calendar_name || '_unknown',
        specific_date: r.specific_date,
        start_time: r.start_time,
        end_time: r.end_time,
        reason: r.reason,
        manager_id: r.manager_id,
      });
    }

    let duplicateCount = 0;
    const duplicateDetails = [];
    for (const [key, entries] of Object.entries(eventManagerMap)) {
      if (entries.length > 1) {
        duplicateCount += entries.length - 1; // extra copies
        duplicateDetails.push({
          external_event_id: key.split('__')[0],
          manager_id: key.split('__')[1],
          count: entries.length,
          entries: entries.map(e => ({
            id: e.id,
            calendar_name: e.calendar_name,
            date: e.specific_date,
            time: `${e.start_time}-${e.end_time}`,
          })),
        });
      }
    }

    // Cross-check: unknown blocks that share external_event_id with known blocks
    const knownEventIds = new Set(withCalendarName.map(r => r.external_event_id).filter(Boolean));
    const unknownOverlappingWithKnown = withoutCalendarName.filter(
      r => r.external_event_id && knownEventIds.has(r.external_event_id)
    );

    // Cross-check: unknown blocks with same date+time+manager as known blocks (different event IDs)
    const knownSlotKeys = new Set(
      withCalendarName.map(r => `${r.specific_date}__${r.start_time}__${r.end_time}__${r.manager_id}`)
    );
    const unknownTimeOverlaps = withoutCalendarName.filter(r => {
      const key = `${r.specific_date}__${r.start_time}__${r.end_time}__${r.manager_id}`;
      return knownSlotKeys.has(key);
    });

    // Sample unknown blocks (first 10 for inspection)
    const sampleUnknown = withoutCalendarName.slice(0, 15).map(r => ({
      id: r.id,
      specific_date: r.specific_date,
      start_time: r.start_time,
      end_time: r.end_time,
      reason: r.reason,
      manager_id: r.manager_id,
      external_event_id: r.external_event_id ? r.external_event_id.slice(0, 30) + '...' : null,
      created_date: r.created_date,
      calendar_name: r.calendar_name || null,
    }));

    return Response.json({
      total_calendar_sync_rules: allRules.length,
      with_calendar_name: withCalendarName.length,
      without_calendar_name: withoutCalendarName.length,

      unknown_blocks_analysis: {
        date_range: { earliest: earliestUnknown, latest: latestUnknown },
        past_blocks: unknownPast.length,
        future_blocks: unknownFuture.length,
        no_date_blocks: unknownNoDates.length,
        by_manager_id: managerCounts,
        by_creation_date: createdDateCounts,
      },

      duplication_analysis: {
        total_duplicate_extra_copies: duplicateCount,
        duplicate_groups: duplicateDetails.length,
        sample_duplicates: duplicateDetails.slice(0, 10),
      },

      overlap_with_known: {
        same_event_id_overlap: unknownOverlappingWithKnown.length,
        same_timeslot_overlap: unknownTimeOverlaps.length,
      },

      sample_unknown_blocks: sampleUnknown,
    });
  } catch (error) {
    console.error('[auditUnknownBlocks] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});