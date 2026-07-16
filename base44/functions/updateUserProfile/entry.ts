import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth.me();
    
    if (!caller || (caller.role !== 'admin' && caller.role !== 'manager')) {
      return Response.json({ error: 'Forbidden: Manager access required' }, { status: 403 });
    }

    const body = await req.json();
    const userId = body.userId;
    const updates = body.updates || body.data;
    
    if (!userId) {
      return Response.json({ error: 'userId is required' }, { status: 400 });
    }

    if (!updates) {
      return Response.json({ error: 'updates or data is required' }, { status: 400 });
    }

    // Only allow safe fields to be updated by manager
    const allowedFields = [
      'first_name', 'last_name', 'phone',
      'address_line1', 'address_line2', 'city', 'state', 'zip', 'country',
      'manager_notes', 'account_status'
    ];

    const safeUpdates = {};
    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        safeUpdates[key] = updates[key];
      }
    }

    // Auto-compute profile_complete
    if (safeUpdates.first_name !== undefined || safeUpdates.last_name !== undefined) {
      // Need current data to merge
      const users = await base44.asServiceRole.entities.User.filter({ id: userId });
      const currentUser = users[0];
      if (currentUser) {
        const firstName = safeUpdates.first_name !== undefined ? safeUpdates.first_name : (currentUser.first_name || '');
        const lastName = safeUpdates.last_name !== undefined ? safeUpdates.last_name : (currentUser.last_name || '');
        safeUpdates.profile_complete = !!(firstName && lastName);
      }
    }

    if (Object.keys(safeUpdates).length === 0) {
      return Response.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    await base44.asServiceRole.entities.User.update(userId, safeUpdates);

    return Response.json({ success: true, updated: Object.keys(safeUpdates) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});