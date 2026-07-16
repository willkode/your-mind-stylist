import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    const userRole = user?.role?.toLowerCase() || '';
    const isAuthorized = userRole === 'admin' || userRole === 'manager' || user?.custom_role === 'manager';
    if (!isAuthorized) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { email } = await req.json();
    if (!email) return Response.json({ error: 'email required' }, { status: 400 });

    const allUsers = await base44.asServiceRole.entities.User.list();
    const targetUser = allUsers.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (!targetUser) return Response.json({ enrollments: [] });

    const enrollments = await base44.asServiceRole.entities.UserCourseProgress.filter({ user_id: targetUser.id });

    return Response.json({ enrollments });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});