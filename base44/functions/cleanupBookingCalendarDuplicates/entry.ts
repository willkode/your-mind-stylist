import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get calendar-synced rules that match our session event pattern directly
    // "Calendar: <Name> - Session" is the pattern created by syncBookingToCalendar
    const sessionRules = await base44.asServiceRole.entities.AvailabilityRule.list('-created_date', 500);
    const toDelete = sessionRules.filter(rule =>
      rule.source === 'calendar_sync' &&
      rule.reason && rule.reason.match(/- Session$/)
    );

    console.log(`Rules from own session events (to delete): ${toDelete.length}`);

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    let deleted = 0;
    for (let i = 0; i < toDelete.length; i += 3) {
      const batch = toDelete.slice(i, i + 3);
      await Promise.all(batch.map(r => base44.asServiceRole.entities.AvailabilityRule.delete(r.id)));
      deleted += batch.length;
      await sleep(300);
    }

    return Response.json({
      success: true,
      total_rules: sessionRules.length,
      session_rules_found: toDelete.length,
      deleted,
      message: `Cleaned up ${deleted} duplicate blocked slots that were created from session booking events.`
    });
  } catch (error) {
    console.error('Cleanup error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});