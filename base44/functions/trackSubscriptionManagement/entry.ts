import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, subscription_id, metadata } = await req.json();

    // Valid actions: 'view_subscriptions', 'cancel', 'reactivate', 'update_payment'
    const validActions = ['view_subscriptions', 'cancel', 'reactivate', 'update_payment'];

    if (!validActions.includes(action)) {
      return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Log subscription management event
    await base44.asServiceRole.entities.ActivityLog.create({
      user_id: user.id,
      user_email: user.email,
      event_type: `subscription.${action}`,
      event_category: 'subscription_management',
      event_data: {
        subscription_id,
        ...metadata
      },
      timestamp: new Date().toISOString()
    });

    return Response.json({ success: true });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});