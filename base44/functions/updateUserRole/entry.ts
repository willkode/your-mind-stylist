import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const RANKS = { owner: 4, admin: 3, manager: 2, support_staff: 1, user: 0 };
const VALID_ROLES = ['owner', 'admin', 'manager', 'support_staff', 'user'];

function effectiveRole(user) {
  const cr = user?.custom_role;
  if (['owner', 'admin', 'manager', 'support_staff'].includes(cr)) return cr;
  return user?.role === 'admin' ? 'admin' : 'user';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const currentUser = await base44.auth.me();
    if (!currentUser) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const callerRole = effectiveRole(currentUser);
    if (RANKS[callerRole] < RANKS.admin) {
      return Response.json({ error: 'Forbidden — admin access required' }, { status: 403 });
    }

    const { userId, role } = await req.json();
    if (!userId || !role) {
      return Response.json({ error: 'Missing userId or role' }, { status: 400 });
    }
    if (!VALID_ROLES.includes(role)) {
      return Response.json({ error: 'Invalid role. Valid roles: ' + VALID_ROLES.join(', ') }, { status: 400 });
    }

    const svc = base44.asServiceRole;
    const target = await svc.entities.User.get(userId);
    if (!target) return Response.json({ error: 'User not found' }, { status: 404 });

    if (target.id === currentUser.id) {
      return Response.json({ error: 'You cannot change your own role' }, { status: 400 });
    }

    const targetRole = effectiveRole(target);
    const owners = await svc.entities.User.filter({ custom_role: 'owner' });
    const ownerExists = owners.length > 0;

    // Owner-only controls (with one-time bootstrap: an admin may assign
    // the first owner if none exists yet)
    if (callerRole !== 'owner') {
      if (targetRole === 'owner') {
        return Response.json({ error: 'Only the owner can change an owner account' }, { status: 403 });
      }
      if (role === 'owner' && ownerExists) {
        return Response.json({ error: 'Only the current owner can assign the owner role' }, { status: 403 });
      }
    }

    const builtInRole = role === 'owner' || role === 'admin' ? 'admin' : 'user';
    const customRole = role === 'user' ? null : role;

    const updatedUser = await svc.entities.User.update(userId, {
      custom_role: customRole,
      role: builtInRole,
    });

    // Audit log
    try {
      await svc.entities.ActivityLog.create({
        action: 'role_changed',
        action_type: 'role_changed',
        actor: currentUser.email,
        actor_role: callerRole,
        target: target.email,
        entity_type: 'User',
        record_id: target.id,
        details: `Role changed from ${targetRole} to ${role} by ${currentUser.email}`,
        metadata: { before: targetRole, after: role },
      });
    } catch (e) {
      console.error('Activity log failed:', e.message);
    }

    return Response.json({ success: true, user: updatedUser });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});