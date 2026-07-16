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

        const { appointment_type_id, name, description, price, currency } = await req.json();

        if (!name || !price) {
            return Response.json({ error: 'name and price are required' }, { status: 400 });
        }

        let product;
        let priceObj;

        // If updating existing appointment type, get existing product
        if (appointment_type_id) {
            const appointmentTypes = await base44.asServiceRole.entities.AppointmentType.filter({ 
                id: appointment_type_id 
            });
            const existingType = appointmentTypes[0];

            if (existingType?.stripe_product_id) {
                // Update existing product
                product = await stripe.products.update(existingType.stripe_product_id, {
                    name,
                    description: description || '',
                    active: true,
                });

                // Check if price changed
                if (existingType.stripe_price_id) {
                    const existingPrice = await stripe.prices.retrieve(existingType.stripe_price_id);
                    
                    if (existingPrice.unit_amount !== price) {
                        // Price changed, create new price (can't update prices in Stripe)
                        priceObj = await stripe.prices.create({
                            product: product.id,
                            unit_amount: price,
                            currency: currency || 'usd',
                        });
                    } else {
                        // Price unchanged, use existing
                        priceObj = existingPrice;
                    }
                }
            } else {
                // No existing product, create new
                product = await stripe.products.create({
                    name,
                    description: description || '',
                    active: true,
                });

                priceObj = await stripe.prices.create({
                    product: product.id,
                    unit_amount: price,
                    currency: currency || 'usd',
                });
            }
        } else {
            // Creating new appointment type
            product = await stripe.products.create({
                name,
                description: description || '',
                active: true,
            });

            priceObj = await stripe.prices.create({
                product: product.id,
                unit_amount: price,
                currency: currency || 'usd',
            });
        }

        return Response.json({
            success: true,
            product_id: product.id,
            price_id: priceObj.id,
        });

    } catch (error) {
        console.error('syncAppointmentTypeStripe error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});