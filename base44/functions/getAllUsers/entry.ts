import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = user.role === 'admin';
    const isManager = user.role === 'manager' || user.custom_role === 'manager';

    if (!isAdmin && !isManager) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const users = await base44.asServiceRole.entities.User.list('-created_date', 500);

    return Response.json({ users });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});