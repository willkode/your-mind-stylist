import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const INDY_MANAGER_ID = '693a98b3e154ab3b36c88ebc';
const ROBERTA_MANAGER_ID = '693b6b4124b276d4067b6d8e';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dry_run !== false; // default to dry run for safety

    // 1. Get Google Calendar event->calendar mapping for backfill
    let accessToken;
    try {
      const conn = await base44.asServiceRole.connectors.getConnection('googlecalendar');
      accessToken = conn.accessToken;
    } catch (err) {
      return Response.json({ error: 'Google Calendar not connected' }, { status: 500 });
    }

    const calListRes = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const calListData = await calListRes.json();
    const calendars = calListData.items || [];

    const eventToCalName = {};
    const now = new Date();
    const futureLimit = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

    for (const cal of calendars) {
      const calId = encodeURIComponent(cal.id);
      try {
        const evRes = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${calId}/events?` +
          `timeMin=${now.toISOString()}&timeMax=${futureLimit.toISOString()}&` +
          `singleEvents=true&maxResults=2500&orderBy=startTime`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (evRes.ok) {
          const evData = await evRes.json();
          for (const ev of (evData.items || [])) {
            if (ev.status !== 'cancelled') {
              eventToCalName[ev.id] = cal.summary || cal.id;
            }
          }
        }
      } catch (e) {
        console.warn(`Failed to fetch ${cal.summary}: ${e.message}`);
      }
    }

    // 2. Get all calendar_sync rules
    const allRules = await base44.asServiceRole.entities.AvailabilityRule.filter(
      { source: 'calendar_sync', active: true }
    );

    // Separate by manager
    const indyRules = allRules.filter(r => r.manager_id === INDY_MANAGER_ID);
    const robertaRules = allRules.filter(r => r.manager_id === ROBERTA_MANAGER_ID);

    // 3. BACKFILL: Find Roberta's unlabeled rules and resolve calendar_name
    const robertaUnlabeled = robertaRules.filter(r => !r.calendar_name || r.calendar_name.trim() === '');
    const backfillResults = { resolved: 0, unresolvable: 0, details: [] };

    if (!dryRun) {
      for (let i = 0; i < robertaUnlabeled.length; i++) {
        const rule = robertaUnlabeled[i];
        const resolved = rule.external_event_id ? eventToCalName[rule.external_event_id] : null;
        if (resolved) {
          await base44.asServiceRole.entities.AvailabilityRule.update(rule.id, {
            calendar_name: resolved,
          });
          backfillResults.resolved++;
        } else {
          backfillResults.unresolvable++;
          backfillResults.details.push({
            id: rule.id,
            reason: rule.reason,
            date: rule.specific_date,
            external_event_id: rule.external_event_id?.slice(0, 40),
          });
        }
        // Throttle: pause every 3 updates
        if ((i + 1) % 3 === 0) await sleep(1000);
      }
    } else {
      for (const rule of robertaUnlabeled) {
        const resolved = rule.external_event_id ? eventToCalName[rule.external_event_id] : null;
        if (resolved) {
          backfillResults.resolved++;
        } else {
          backfillResults.unresolvable++;
          backfillResults.details.push({
            id: rule.id,
            reason: rule.reason,
            date: rule.specific_date,
            external_event_id: rule.external_event_id?.slice(0, 40),
          });
        }
      }
    }

    // 4. DELETE: Remove Indy's calendar_sync rules
    let deletedCount = 0;
    if (!dryRun) {
      for (let i = 0; i < indyRules.length; i += 3) {
        const batch = indyRules.slice(i, i + 3);
        await Promise.all(batch.map(r =>
          base44.asServiceRole.entities.AvailabilityRule.delete(r.id)
        ));
        deletedCount += batch.length;
        await sleep(1000); // throttle to avoid rate limits
      }
    }

    // 5. Post-cleanup verification
    let postCleanupCount = null;
    let postCleanupByManager = null;
    if (!dryRun) {
      const postRules = await base44.asServiceRole.entities.AvailabilityRule.filter(
        { source: 'calendar_sync', active: true }
      );
      postCleanupCount = postRules.length;
      postCleanupByManager = {};
      for (const r of postRules) {
        postCleanupByManager[r.manager_id] = (postCleanupByManager[r.manager_id] || 0) + 1;
      }
    }

    return Response.json({
      dry_run: dryRun,
      before: {
        total_calendar_sync_rules: allRules.length,
        indy_rules: indyRules.length,
        roberta_rules: robertaRules.length,
        roberta_unlabeled: robertaUnlabeled.length,
      },
      actions: {
        indy_rules_deleted: dryRun ? `${indyRules.length} (would delete)` : deletedCount,
        roberta_backfill_resolved: backfillResults.resolved,
        roberta_backfill_unresolvable: backfillResults.unresolvable,
        unresolvable_details: backfillResults.details,
      },
      after: dryRun ? '(dry run — no changes made)' : {
        total_calendar_sync_rules: postCleanupCount,
        by_manager: postCleanupByManager,
      },
      google_events_indexed: Object.keys(eventToCalName).length,
    });
  } catch (error) {
    console.error('[cleanupIndyCalendarBlocks] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});