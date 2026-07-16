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

    // Get customer's subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripe_customer_id,
      status: 'all',
      limit: 10
    });

    // Format subscription data
    const formattedSubs = await Promise.all(subscriptions.data.map(async (sub) => {
      const product = await stripe.products.retrieve(sub.items.data[0].price.product);
      
      return {
        id: sub.id,
        product_name: product.name,
        status: sub.status,
        price: sub.items.data[0].price.unit_amount,
        currency: sub.items.data[0].price.currency,
        interval: sub.items.data[0].price.recurring.interval,
        current_period_start: sub.current_period_start,
        current_period_end: sub.current_period_end,
        cancel_at_period_end: sub.cancel_at_period_end,
        created: sub.created
      };
    }));

    return Response.json({ subscriptions: formattedSubs });

  } catch (error) {
    console.error('Get subscriptions error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});