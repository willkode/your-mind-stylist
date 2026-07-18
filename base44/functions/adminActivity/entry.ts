import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const RANKS = { owner: 4, admin: 3, manager: 2, support_staff: 1, user: 0 };

function effectiveRole(user) {
  const cr = user?.custom_role;
  if (['owner', 'admin', 'manager', 'support_staff'].includes(cr)) return cr;
  return user?.role === 'admin' ? 'admin' : 'user';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const role = effectiveRole(user);
    if (RANKS[role] < RANKS.support_staff) {
      return Response.json({ error: 'Forbidden — staff access required' }, { status: 403 });
    }

    const body = await req.json();
    const svc = base44.asServiceRole;

    // Any staff member may record an activity
    if (body.action === 'log') {
      const { action_type, target, entity_type, record_id, details, metadata } = body;
      if (!action_type) {
        return Response.json({ error: 'action_type is required' }, { status: 400 });
      }
      const entry = await svc.entities.ActivityLog.create({
        action: action_type,
        action_type,
        actor: user.email,
        actor_role: role,
        target: target || '',
        entity_type: entity_type || '',
        record_id: record_id || '',
        details: details || '',
        metadata: metadata || {},
      });
      return Response.json({ entry });
    }

    // Only owner/admin may read the log
    if (body.action === 'list') {
      if (RANKS[role] < RANKS.admin) {
        return Response.json({ error: 'Forbidden — admin access required' }, { status: 403 });
      }
      const { actor, action_type, entity_type, from, to } = body;
      let logs = await svc.entities.ActivityLog.list('-created_date', 500);
      if (actor) logs = logs.filter((l) => l.actor?.toLowerCase().includes(actor.toLowerCase()));
      if (action_type) logs = logs.filter((l) => (l.action_type || l.action) === action_type);
      if (entity_type) logs = logs.filter((l) => l.entity_type === entity_type);
      if (from) logs = logs.filter((l) => new Date(l.created_date) >= new Date(from));
      if (to) logs = logs.filter((l) => new Date(l.created_date) <= new Date(to + 'T23:59:59'));
      return Response.json({ logs: logs.slice(0, 200), total: logs.length });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});