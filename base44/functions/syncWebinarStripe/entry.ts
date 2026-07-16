import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@17.6.0';

const stripe = new Stripe(Deno.env.get("STRIPE_API_KEY"));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify authentication
    const user = await base44.auth.me();
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { webinar_id } = await req.json();

    if (!webinar_id) {
      return Response.json({ error: 'webinar_id is required' }, { status: 400 });
    }

    // Fetch webinar using service role
    const webinars = await base44.asServiceRole.entities.Webinar.filter({ id: webinar_id });
    if (webinars.length === 0) {
      return Response.json({ error: 'Webinar not found' }, { status: 404 });
    }

    const webinar = webinars[0];

    // Only sync if it's a paid webinar
    if (!webinar.price || webinar.price === 0) {
      return Response.json({ 
        message: 'Webinar is free, no Stripe sync needed',
        webinar_id 
      });
    }

    let productId = webinar.stripe_product_id;
    let priceId = webinar.stripe_price_id;

    // Create or update Stripe product
    if (productId) {
      // Update existing product
      await stripe.products.update(productId, {
        name: webinar.title,
        description: webinar.short_description || webinar.title,
        images: webinar.thumbnail ? [webinar.thumbnail] : [],
        metadata: {
          webinar_id: webinar.id,
          type: 'webinar'
        }
      });
    } else {
      // Create new product
      const product = await stripe.products.create({
        name: webinar.title,
        description: webinar.short_description || webinar.title,
        images: webinar.thumbnail ? [webinar.thumbnail] : [],
        metadata: {
          webinar_id: webinar.id,
          type: 'webinar'
        }
      });
      productId = product.id;
    }

    // Check if price needs to be created/updated
    if (priceId) {
      // Fetch existing price to check if amount changed
      const existingPrice = await stripe.prices.retrieve(priceId);
      
      if (existingPrice.unit_amount !== webinar.price) {
        // Price changed - archive old price and create new one
        await stripe.prices.update(priceId, { active: false });
        
        const newPrice = await stripe.prices.create({
          product: productId,
          unit_amount: webinar.price,
          currency: 'usd',
          metadata: {
            webinar_id: webinar.id
          }
        });
        priceId = newPrice.id;
      }
    } else {
      // Create new price
      const price = await stripe.prices.create({
        product: productId,
        unit_amount: webinar.price,
        currency: 'usd',
        metadata: {
          webinar_id: webinar.id
        }
      });
      priceId = price.id;
    }

    // Update webinar with Stripe IDs
    await base44.asServiceRole.entities.Webinar.update(webinar.id, {
      stripe_product_id: productId,
      stripe_price_id: priceId
    });

    return Response.json({
      success: true,
      webinar_id: webinar.id,
      stripe_product_id: productId,
      stripe_price_id: priceId,
      message: 'Webinar synced with Stripe successfully'
    });

  } catch (error) {
    console.error('Stripe sync error:', error);
    return Response.json({ 
      error: error.message,
      details: error.toString()
    }, { status: 500 });
  }
});