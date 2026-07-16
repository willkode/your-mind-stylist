import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin user
    const currentUser = await base44.auth.me();
    if (!currentUser || currentUser.role !== "admin") {
      return Response.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    const { userId, role } = await req.json();

    if (!userId || !role) {
      return Response.json({ error: 'Missing userId or role' }, { status: 400 });
    }

    if (!['admin', 'manager', 'user'].includes(role)) {
      return Response.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Update custom_role field since built-in role only supports 'admin' and 'user'
    const updatedUser = await base44.asServiceRole.entities.User.update(userId, { 
      custom_role: role,
      role: role === 'manager' ? 'user' : role // Set built-in role to 'user' for managers
    });

    return Response.json({ 
      success: true, 
      user: updatedUser 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});