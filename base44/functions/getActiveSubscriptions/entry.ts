import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_API_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.stripe_customer_id) {
      return Response.json({ subscriptions: [] });
    }

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripe_customer_id,
      status: 'all',
      expand: ['data.items.data.price.product']
    });

    const formattedSubs = subscriptions.data.map(sub => {
      const item = sub.items.data[0];
      const price = item.price;
      const product = price.product;

      return {
        id: sub.id,
        status: sub.status,
        product_name: typeof product === 'object' ? product.name : 'Subscription',
        amount: price.unit_amount,
        currency: price.currency,
        interval: price.recurring?.interval || 'month',
        current_period_start: sub.current_period_start,
        current_period_end: sub.current_period_end,
        cancel_at_period_end: sub.cancel_at_period_end
      };
    });

    return Response.json({ 
      subscriptions: formattedSubs.filter(s => 
        ['active', 'trialing', 'past_due'].includes(s.status)
      )
    });

  } catch (error) {
    console.error('Get subscriptions error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});