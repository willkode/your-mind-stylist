import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { event_type, product_id, product_key, metadata } = await req.json();

    // Validate event type
    const validEvents = [
      'purchase_center.viewed',
      'product.card_clicked',
      'product.detail_viewed',
      'product.checkout_started',
      'purchase.completed',
      'upsell.shown',
      'upsell.accepted',
      'upsell.dismissed'
    ];

    if (!validEvents.includes(event_type)) {
      return Response.json({ error: 'Invalid event type' }, { status: 400 });
    }

    // Log event to ActivityLog entity
    await base44.asServiceRole.entities.ActivityLog.create({
      user_id: user.id,
      user_email: user.email,
      event_type,
      event_category: 'purchase_funnel',
      event_data: {
        product_id,
        product_key,
        ...metadata
      },
      timestamp: new Date().toISOString()
    });

    return Response.json({ success: true });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});