import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@17.6.0';

const stripe = new Stripe(Deno.env.get("STRIPE_API_KEY"));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify authentication
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { webinar_id } = await req.json();

    if (!webinar_id) {
      return Response.json({ error: 'webinar_id is required' }, { status: 400 });
    }

    // Fetch webinar
    const webinars = await base44.asServiceRole.entities.Webinar.filter({ id: webinar_id });
    if (webinars.length === 0) {
      return Response.json({ error: 'Webinar not found' }, { status: 404 });
    }

    const webinar = webinars[0];

    // Check if webinar is published
    if (webinar.status !== 'published') {
      return Response.json({ error: 'Webinar is not available for purchase' }, { status: 400 });
    }

    // Check if already purchased
    const existingAccess = await base44.asServiceRole.entities.UserWebinarAccess.filter({
      user_id: user.id,
      webinar_id: webinar_id
    });

    if (existingAccess.length > 0) {
      return Response.json({ error: 'You already have access to this webinar' }, { status: 400 });
    }

    // Check if webinar has Stripe price
    if (!webinar.stripe_price_id) {
      return Response.json({ error: 'Webinar is not configured for payment' }, { status: 400 });
    }

    // Get app host for URLs
    const url = new URL(req.url);
    const appHost = `${url.protocol}//${url.host}`;

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: webinar.stripe_price_id,
          quantity: 1,
        },
      ],
      customer_email: user.email,
      client_reference_id: user.id,
      metadata: {
        webinar_id: webinar.id,
        webinar_slug: webinar.slug,
        user_id: user.id,
        user_email: user.email,
        type: 'webinar_purchase'
      },
      success_url: `${appHost}/WebinarPage?slug=${webinar.slug}&payment=success`,
      cancel_url: `${appHost}/WebinarPage?slug=${webinar.slug}&payment=cancelled`,
    });

    return Response.json({
      checkout_url: session.url,
      session_id: session.id
    });

  } catch (error) {
    console.error('Checkout creation error:', error);
    return Response.json({ 
      error: error.message,
      details: error.toString()
    }, { status: 500 });
  }
});