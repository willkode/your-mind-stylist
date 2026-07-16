import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_API_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { product_id, payment_plan_options } = await req.json();

    // Get product
    const product = await base44.asServiceRole.entities.Product.filter({ id: product_id });
    if (!product || product.length === 0) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    const productData = product[0];

    // Get or create Stripe product
    let stripeProduct;
    if (productData.stripe_product_id) {
      stripeProduct = await stripe.products.retrieve(productData.stripe_product_id);
    } else {
      return Response.json({ error: 'Product not synced to Stripe yet' }, { status: 400 });
    }

    // Create payment plan prices in Stripe
    const priceIds = [productData.stripe_price_id]; // Start with main price

    for (const plan of payment_plan_options) {
      const monthlyAmount = Math.round(plan.monthly_price);
      
      // Create recurring price for this payment plan
      const price = await stripe.prices.create({
        product: stripeProduct.id,
        unit_amount: monthlyAmount,
        currency: productData.currency || 'usd',
        recurring: {
          interval: 'month',
          interval_count: 1,
        },
        metadata: {
          payment_plan: 'true',
          plan_name: plan.name,
          total_months: plan.months.toString(),
          total_amount: (monthlyAmount * plan.months).toString(),
          product_id: product_id,
        },
      });

      priceIds.push(price.id);
    }

    // Update product with payment plan info
    await base44.asServiceRole.entities.Product.update(product_id, {
      payment_plan_options,
      stripe_price_ids: priceIds,
      type: 'payment_plan',
    });

    return Response.json({
      success: true,
      stripe_product_id: stripeProduct.id,
      price_ids: priceIds,
      payment_plans: payment_plan_options,
    });
  } catch (error) {
    console.error('Payment plan sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});