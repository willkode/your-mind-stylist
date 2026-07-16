import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get("STRIPE_API_KEY"));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Try to get user — but allow guest checkout
    let user = null;
    try {
      user = await base44.auth.me();
    } catch (e) {
      // Not logged in — guest checkout via Stripe
    }

    const { product_id, product_ids, selected_price_id, affiliate_code, gift_code } = await req.json();

    // Support both single and multiple products
    const ids = product_ids || (product_id ? [product_id] : []);

    if (ids.length === 0) {
      return Response.json({ error: 'product_id or product_ids is required' }, { status: 400 });
    }

    // Ensure affiliate_code is either a non-empty string or null
    const affiliateCodeValue = affiliate_code && affiliate_code.trim() ? affiliate_code.trim() : null;

    // Get product details for only the requested IDs
    const productPromises = ids.map(id => base44.asServiceRole.entities.Product.get(id));
    const products = await Promise.all(productPromises);

    if (products.length === 0) {
      return Response.json({ error: 'No products found' }, { status: 404 });
    }

    // Validate all products have stripe prices
    for (const product of products) {
      if (!product.stripe_price_id) {
        return Response.json({
          error: `No Stripe price configured for product: ${product.name}`
        }, { status: 400 });
      }
    }

    // Get or create Stripe customer (if user is logged in)
    let customerConfig = {};
    if (user) {
      let customer;
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      });

      if (customers.data.length > 0) {
        customer = customers.data[0];
      } else {
        customer = await stripe.customers.create({
          email: user.email,
          name: user.full_name,
          metadata: {
            user_id: user.id,
            product_key: products[0].key,
          },
        });
      }
      customerConfig = { customer: customer.id };
    }

    // Check if any product is recurring/subscription
    let mode = 'payment';
    const hasRecurring = products.some(p => p.type === 'subscription');
    if (hasRecurring) {
      mode = 'subscription';
    }

    // Build line items for all products
    const line_items = products.map(product => ({
      price: product.stripe_price_id,
      quantity: 1,
    }));

    // Handle gift code discount
    let giftCodeRecord = null;
    let discountConfig = {};
    if (gift_code) {
      const giftCodes = await base44.asServiceRole.entities.GiftCode.filter({ code: gift_code.toUpperCase() });
      const gc = giftCodes[0];
      if (gc && gc.is_active) {
        giftCodeRecord = gc;

        // Gift codes grant 100% off — they represent pre-paid access
        const discountPct = gc.discount_percentage || 100;
        const coupon = await stripe.coupons.create({
          percent_off: discountPct,
          duration: 'once',
          name: `Gift Code: ${gift_code}`,
        });
        discountConfig = { discounts: [{ coupon: coupon.id }] };

        await base44.asServiceRole.entities.GiftCode.update(gc.id, {
          times_used: (gc.times_used || 0) + 1,
          is_active: gc.is_single_use ? false : gc.is_active,
        });
      } else if (gift_code) {
        return Response.json({ error: 'Invalid or expired gift code' }, { status: 400 });
      }
    }

    const origin = req.headers.get('origin') || 'https://yourmindstylist.com';

    // Detect if any product requires physical shipping
    // Uses the explicit requires_shipping toggle on the Product entity.
    // Only products with requires_shipping === true trigger shipping collection.
    const hasPhysicalProduct = products.some(p => p.requires_shipping === true);

    // Build shipping config for physical products
    let shippingConfig = {};
    if (hasPhysicalProduct) {
      // Calculate cart subtotal in cents
      const subtotalCents = products.reduce((sum, p) => sum + (p.price || 0), 0);
      const FREE_SHIPPING_THRESHOLD_CENTS = 5000; // $50 free shipping threshold
      const FLAT_RATE_CENTS = 599; // $5.99 flat rate shipping

      const shippingOptions = [];

      // If over threshold, offer free shipping as first option
      if (subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS) {
        shippingOptions.push({
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: 0, currency: 'usd' },
            display_name: 'Free Shipping',
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 5 },
              maximum: { unit: 'business_day', value: 10 },
            },
          },
        });
      } else {
        // Standard shipping
        shippingOptions.push({
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: FLAT_RATE_CENTS, currency: 'usd' },
            display_name: 'Standard Shipping',
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 5 },
              maximum: { unit: 'business_day', value: 10 },
            },
          },
        });
      }

      shippingConfig = {
        shipping_address_collection: {
          allowed_countries: [
            'US', 'CA', 'GB', 'AU', 'DE', 'FR', 'ES', 'IT', 'MX',
            'NL', 'BE', 'AT', 'CH', 'IE', 'NZ', 'SE', 'NO', 'DK',
            'FI', 'PT', 'PL', 'CZ', 'IL', 'JP', 'KR', 'SG', 'BR',
          ],
        },
        shipping_options: shippingOptions,
        phone_number_collection: { enabled: true },
      };
    }

    // Create checkout session — always collect phone + billing address for CRM
    const sessionConfig = {
      ...customerConfig,
      mode: mode,
      line_items: line_items,
      success_url: `${origin}/PurchaseSuccess?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/Cart`,
      billing_address_collection: 'required',
      phone_number_collection: { enabled: true },
      ...shippingConfig,
      metadata: {
        ...(user?.id ? { user_id: user.id } : {}),
        product_ids: products.map(p => p.id).join(','),
        product_keys: products.map(p => p.key).join(','),
        product_names: products.map(p => p.name).join('; '),
        affiliate_code: affiliateCodeValue || '',
        gift_code: gift_code || '',
        has_physical: hasPhysicalProduct ? 'true' : 'false',
      },
      ...discountConfig,
    };

    // Only set client_reference_id if affiliate_code is provided and non-empty
    if (affiliateCodeValue) {
      sessionConfig.client_reference_id = affiliateCodeValue;
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return Response.json({
      url: session.url,
      session_id: session.id,
    });

  } catch (error) {
    console.error('createProductCheckout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});