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

    const { payment_type } = await req.json(); // 'full' or 'payment_plan_3' or 'payment_plan_6'

    // Define pricing
    const pricing = {
      full: {
        amount: 199500, // $1,995
        description: 'Mind Styling Certification - Full Payment'
      },
      payment_plan_3: {
        amount: 69900, // $699 x 3
        description: 'Mind Styling Certification - 3 Monthly Payments',
        installments: 3
      },
      payment_plan_6: {
        amount: 36500, // $365 x 6
        description: 'Mind Styling Certification - 6 Monthly Payments',
        installments: 6
      }
    };

    const selectedPricing = pricing[payment_type];
    if (!selectedPricing) {
      return Response.json({ error: 'Invalid payment type' }, { status: 400 });
    }

    const appHost = req.headers.get('origin') || 'https://yourmindstylist.com';
    const successUrl = `${appHost}/app/purchase/success?type=certification&payment_type=${payment_type}`;
    const cancelUrl = `${appHost}/app/purchase-center`;

    // Create or get Stripe customer
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: user.email,
      limit: 1
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: user.email,
        name: user.full_name,
        metadata: {
          user_id: user.id,
          app: 'mind_stylist'
        }
      });
    }

    // For payment plans, create subscription
    if (payment_type.includes('payment_plan')) {
      // Create price for subscription
      const price = await stripe.prices.create({
        unit_amount: selectedPricing.amount,
        currency: 'usd',
        recurring: { interval: 'month', interval_count: 1 },
        product_data: {
          name: selectedPricing.description,
          metadata: {
            certification: 'true',
            installments: selectedPricing.installments.toString()
          }
        }
      });

      const session = await stripe.checkout.sessions.create({
        customer: customer.id,
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [{
          price: price.id,
          quantity: 1
        }],
        subscription_data: {
          metadata: {
            user_id: user.id,
            certification: 'true',
            payment_type,
            total_installments: selectedPricing.installments.toString(),
            cancel_at: Math.floor(Date.now() / 1000) + (selectedPricing.installments * 31 * 24 * 60 * 60) // Cancel after X months
          }
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          user_id: user.id,
          user_email: user.email,
          certification: 'true',
          payment_type
        }
      });

      return Response.json({ url: session.url });
    } else {
      // Full payment - one-time
      const session = await stripe.checkout.sessions.create({
        customer: customer.id,
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: selectedPricing.description,
              metadata: {
                certification: 'true'
              }
            },
            unit_amount: selectedPricing.amount
          },
          quantity: 1
        }],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          user_id: user.id,
          user_email: user.email,
          certification: 'true',
          payment_type: 'full'
        }
      });

      return Response.json({ url: session.url });
    }
  } catch (error) {
    console.error('Certification checkout error:', error);
    return Response.json({ 
      error: error.message || 'Failed to create checkout session' 
    }, { status: 500 });
  }
});