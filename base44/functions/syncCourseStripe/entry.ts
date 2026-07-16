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

        const { course_id, title, description, price, currency } = await req.json();

        if (!title) {
            return Response.json({ error: 'title is required' }, { status: 400 });
        }

        let product;

        // If updating existing course, get existing product
        if (course_id) {
            const courses = await base44.asServiceRole.entities.Course.filter({ 
                id: course_id 
            });
            const existingCourse = courses[0];

            if (existingCourse?.product_linkage && existingCourse.product_linkage.length > 0) {
                // Update existing product
                const existingProductId = existingCourse.product_linkage[0];
                product = await stripe.products.update(existingProductId, {
                    name: title,
                    description: description || '',
                    active: true,
                });
            } else {
                // No existing product, create new
                product = await stripe.products.create({
                    name: title,
                    description: description || '',
                    active: true,
                    metadata: {
                        course_id: course_id,
                        type: 'course'
                    }
                });
            }
        } else {
            // Creating new course
            product = await stripe.products.create({
                name: title,
                description: description || '',
                active: true,
                metadata: {
                    type: 'course'
                }
            });
        }

        // Create price if provided
        let priceObj = null;
        if (price && price > 0) {
            priceObj = await stripe.prices.create({
                product: product.id,
                unit_amount: price,
                currency: currency || 'usd',
            });
        }

        return Response.json({
            success: true,
            product_id: product.id,
            price_id: priceObj?.id || null,
        });

    } catch (error) {
        console.error('syncCourseStripe error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});