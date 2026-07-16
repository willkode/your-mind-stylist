import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_API_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's Stripe customer ID
    if (!user.stripe_customer_id) {
      return Response.json({ 
        error: 'No subscription found. You need to subscribe first.' 
      }, { status: 400 });
    }

    // Create customer portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${req.headers.get('origin')}/app/Dashboard`,
    });

    return Response.json({ 
      url: session.url 
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});