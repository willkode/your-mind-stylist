import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get("STRIPE_API_KEY"));

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Verify user is authenticated
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { 
            product_id, 
            key,
            name, 
            description, 
            price, 
            currency,
            billing_interval,
            payment_plan_options,
            type
        } = await req.json();

        if (!name) {
            return Response.json({ error: 'name is required' }, { status: 400 });
        }

        let stripeProduct;
        let existingProduct = null;

        // If updating existing product, get existing Stripe product
        if (product_id) {
            const products = await base44.asServiceRole.entities.Product.filter({ 
                id: product_id 
            });
            existingProduct = products[0];

            if (existingProduct?.stripe_product_id) {
                // Try to update existing Stripe product, fall back to create if not found (e.g. switching test→live)
                try {
                    stripeProduct = await stripe.products.update(existingProduct.stripe_product_id, {
                        name: name,
                        description: description || '',
                        active: true,
                    });
                } catch (err) {
                    // Product doesn't exist in this Stripe mode (e.g. test ID in live mode) — create fresh
                    stripeProduct = await stripe.products.create({
                        name: name,
                        description: description || '',
                        active: true,
                        metadata: {
                            product_id: product_id,
                            product_key: key
                        }
                    });
                }
            } else {
                // No existing product, create new
                stripeProduct = await stripe.products.create({
                    name: name,
                    description: description || '',
                    active: true,
                    metadata: {
                        product_id: product_id,
                        product_key: key
                    }
                });
            }
        } else {
            // Creating new product
            stripeProduct = await stripe.products.create({
                name: name,
                description: description || '',
                active: true,
                metadata: {
                    product_key: key
                }
            });
        }

        // Create or update prices
        const priceIds = [];
        
        // Handle main price
        if (price && price > 0) {
            const priceData = {
                product: stripeProduct.id,
                unit_amount: price,
                currency: currency || 'usd',
            };

            // Add recurring interval for subscriptions
            if (type === 'subscription' && billing_interval && billing_interval !== 'one_time') {
                priceData.recurring = {
                    interval: billing_interval === 'yearly' ? 'year' : 'month'
                };
            }

            const stripePrice = await stripe.prices.create(priceData);
            priceIds.push(stripePrice.id);
        }

        // Handle payment plan options
        if (payment_plan_options && Array.isArray(payment_plan_options)) {
            for (const plan of payment_plan_options) {
                if (plan.monthly_price && plan.months) {
                    const planPrice = await stripe.prices.create({
                        product: stripeProduct.id,
                        unit_amount: plan.monthly_price,
                        currency: currency || 'usd',
                        recurring: {
                            interval: 'month',
                            interval_count: 1,
                        },
                        metadata: {
                            plan_name: plan.name,
                            total_months: plan.months
                        }
                    });
                    priceIds.push(planPrice.id);
                }
            }
        }

        return Response.json({
            success: true,
            stripe_product_id: stripeProduct.id,
            stripe_price_id: priceIds[0] || null,
            stripe_price_ids: priceIds,
        });

    } catch (error) {
        console.error('syncProductStripe error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});