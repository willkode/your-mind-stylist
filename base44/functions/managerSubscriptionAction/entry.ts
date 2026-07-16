import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_API_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { action, customer_email, subscription_id, payment_intent_id, charge_id, amount, reason } = body;

    // --- Look up customer by email ---
    let customerId = body.stripe_customer_id;
    if (!customerId && customer_email) {
      const customers = await stripe.customers.list({ email: customer_email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      }
    }

    if (action === 'list_subscriptions') {
      if (!customerId) {
        return Response.json({ subscriptions: [], charges: [] });
      }
      const [subs, charges] = await Promise.all([
        stripe.subscriptions.list({ customer: customerId, limit: 10 }),
        stripe.charges.list({ customer: customerId, limit: 10 }),
      ]);
      return Response.json({
        subscriptions: subs.data.map(s => ({
          id: s.id,
          status: s.status,
          current_period_end: s.current_period_end,
          cancel_at_period_end: s.cancel_at_period_end,
          product_name: s.items.data[0]?.price?.nickname || s.items.data[0]?.price?.product || 'Subscription',
          amount: s.items.data[0]?.price?.unit_amount,
          interval: s.items.data[0]?.price?.recurring?.interval,
        })),
        charges: charges.data.map(c => ({
          id: c.id,
          amount: c.amount,
          amount_refunded: c.amount_refunded,
          refunded: c.refunded,
          description: c.description,
          created: c.created,
          payment_intent: c.payment_intent,
          currency: c.currency,
        })),
      });
    }

    if (action === 'cancel_subscription') {
      if (!subscription_id) {
        return Response.json({ error: 'subscription_id is required' }, { status: 400 });
      }
      // Cancel at period end by default (graceful cancel)
      const cancelled = await stripe.subscriptions.update(subscription_id, {
        cancel_at_period_end: true,
        cancellation_details: { comment: reason || 'Cancelled by manager' },
      });
      return Response.json({ success: true, subscription: cancelled });
    }

    if (action === 'cancel_subscription_immediately') {
      if (!subscription_id) {
        return Response.json({ error: 'subscription_id is required' }, { status: 400 });
      }
      const cancelled = await stripe.subscriptions.cancel(subscription_id);
      return Response.json({ success: true, subscription: cancelled });
    }

    if (action === 'issue_refund') {
      if (!charge_id && !payment_intent_id) {
        return Response.json({ error: 'charge_id or payment_intent_id is required' }, { status: 400 });
      }
      const refundData = { reason: 'requested_by_customer' };
      if (charge_id) refundData.charge = charge_id;
      if (payment_intent_id) refundData.payment_intent = payment_intent_id;
      if (amount) refundData.amount = amount; // partial refund in cents
      const refund = await stripe.refunds.create(refundData);
      return Response.json({ success: true, refund });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });

  } catch (error) {
    console.error('Manager subscription action error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});