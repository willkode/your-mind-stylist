import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins/managers can reset availability
    if (user.role !== 'admin' && user.custom_role !== 'manager') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { manager_id } = await req.json();

    if (!manager_id) {
      return Response.json({ error: 'manager_id is required' }, { status: 400 });
    }

    // Get all availability rules for this manager
    const rules = await base44.asServiceRole.entities.AvailabilityRule.filter({
      manager_id: manager_id
    });

    // Deactivate all existing rules
    let deactivatedCount = 0;
    for (const rule of rules) {
      await base44.asServiceRole.entities.AvailabilityRule.update(rule.id, {
        active: false
      });
      deactivatedCount++;
    }

    return Response.json({
      success: true,
      message: `Deactivated ${deactivatedCount} availability rules for this manager`,
      deactivated_count: deactivatedCount,
      next_step: 'Re-sync with Google Calendar or manually re-enter availability'
    });

  } catch (error) {
    console.error('Error resetting availability rules:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});