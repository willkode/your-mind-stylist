import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const allRules = await base44.asServiceRole.entities.AvailabilityRule.filter(
      { source: 'calendar_sync', active: true }
    );

    const withName = allRules.filter(r => r.calendar_name && r.calendar_name.trim() !== '');
    const withoutName = allRules.filter(r => !r.calendar_name || r.calendar_name.trim() === '');

    // Build lookup: external_event_id -> known calendar_name entries
    const knownByEventId = {};
    for (const r of withName) {
      if (!r.external_event_id) continue;
      if (!knownByEventId[r.external_event_id]) {
        knownByEventId[r.external_event_id] = [];
      }
      knownByEventId[r.external_event_id].push({
        id: r.id,
        calendar_name: r.calendar_name,
        manager_id: r.manager_id,
        specific_date: r.specific_date,
      });
    }

    // Analyze overlapping unknown blocks
    const overlappingUnknown = withoutName.filter(
      r => r.external_event_id && knownByEventId[r.external_event_id]
    );

    // For overlapping: check if same manager or different manager
    let sameManagerOverlap = 0;
    let differentManagerOverlap = 0;
    const overlapDetails = [];

    for (const r of overlappingUnknown) {
      const knownEntries = knownByEventId[r.external_event_id];
      const hasSameManager = knownEntries.some(k => k.manager_id === r.manager_id);
      const hasDiffManager = knownEntries.some(k => k.manager_id !== r.manager_id);

      if (hasSameManager) sameManagerOverlap++;
      if (hasDiffManager) differentManagerOverlap++;

      if (overlapDetails.length < 8) {
        overlapDetails.push({
          unknown_id: r.id,
          unknown_manager: r.manager_id,
          unknown_date: r.specific_date,
          unknown_time: `${r.start_time}-${r.end_time}`,
          unknown_reason: r.reason,
          known_matches: knownEntries.map(k => ({
            id: k.id,
            calendar_name: k.calendar_name,
            manager_id: k.manager_id,
          })),
        });
      }
    }

    // Non-overlapping unknown blocks (no matching event ID in known set)
    const nonOverlappingUnknown = withoutName.filter(
      r => !r.external_event_id || !knownByEventId[r.external_event_id]
    );

    // Manager distribution of non-overlapping
    const nonOverlapByManager = {};
    for (const r of nonOverlappingUnknown) {
      const mid = r.manager_id || '_none';
      nonOverlapByManager[mid] = (nonOverlapByManager[mid] || 0) + 1;
    }

    // Created date of non-overlapping
    const nonOverlapByCreated = {};
    for (const r of nonOverlappingUnknown) {
      const cd = r.created_date ? new Date(r.created_date).toISOString().slice(0, 10) : '_unknown';
      nonOverlapByCreated[cd] = (nonOverlapByCreated[cd] || 0) + 1;
    }

    // Sample of non-overlapping
    const nonOverlapSample = nonOverlappingUnknown.slice(0, 10).map(r => ({
      id: r.id,
      specific_date: r.specific_date,
      start_time: r.start_time,
      end_time: r.end_time,
      reason: r.reason,
      manager_id: r.manager_id,
      created_date: r.created_date ? new Date(r.created_date).toISOString().slice(0, 10) : null,
    }));

    // Two manager IDs — get user info
    const managerIds = [...new Set(allRules.map(r => r.manager_id).filter(Boolean))];

    return Response.json({
      summary: {
        total_unknown: withoutName.length,
        overlapping_with_known_event_id: overlappingUnknown.length,
        non_overlapping: nonOverlappingUnknown.length,
      },

      overlap_analysis: {
        same_manager_overlap: sameManagerOverlap,
        different_manager_overlap: differentManagerOverlap,
        sample_overlaps: overlapDetails,
      },

      non_overlapping_analysis: {
        count: nonOverlappingUnknown.length,
        by_manager_id: nonOverlapByManager,
        by_creation_date: nonOverlapByCreated,
        sample: nonOverlapSample,
      },

      manager_ids_in_use: managerIds,
    });
  } catch (error) {
    console.error('[auditUnknownBlocksDeep] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});