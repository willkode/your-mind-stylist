import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const stripe = await import('npm:stripe@16.12.0');
const stripeClient = new stripe.default(Deno.env.get('STRIPE_API_KEY'));

// Stripe tax codes for different product types
const TAX_CODES = {
  // Physical goods (books, physical products)
  physical: 'txcd_100000000', // General - Physical Goods
  // Digital services (webinars, courses, digital services)
  digital: 'txcd_110000000', // General - Digitally Supplied Services
};

// Nevada tax rate (7.375% default)
const NEVADA_TAX_RATE = 7.375;

async function ensureNevadaTaxRates() {
  try {
    // Check existing tax rates
    const taxRates = await stripeClient.taxRates.list();
    const nevadaRates = taxRates.data.filter(rate => 
      rate.jurisdiction === 'US-NV' && rate.percentage === NEVADA_TAX_RATE
    );
    
    if (nevadaRates.length >= 2) {
      // Already have rates for both types
      return {
        physical: nevadaRates.find(r => r.description?.includes('Physical')),
        digital: nevadaRates.find(r => r.description?.includes('Digital'))
      };
    }

    // Create Nevada tax rates if needed
    const [physicalRate, digitalRate] = await Promise.all([
      stripeClient.taxRates.create({
        percentage: NEVADA_TAX_RATE,
        display_name: 'Nevada Sales Tax - Physical Goods',
        jurisdiction: 'US-NV',
        description: 'Physical goods (7.375%)',
        inclusive: false,
      }),
      stripeClient.taxRates.create({
        percentage: NEVADA_TAX_RATE,
        display_name: 'Nevada Sales Tax - Digital Services',
        jurisdiction: 'US-NV',
        description: 'Digital services (7.375%)',
        inclusive: false,
      })
    ]);

    return {
      physical: physicalRate,
      digital: digitalRate
    };
  } catch (error) {
    console.error('Error ensuring Nevada tax rates:', error);
    throw error;
  }
}

function getTaxCodeForSubtype(subtype) {
  // Books and physical products → physical goods tax code
  if (subtype === 'book' || subtype === 'physical_product') {
    return TAX_CODES.physical;
  }
  // Digital products → digital services tax code
  if (subtype === 'webinar' || subtype === 'course' || subtype === 'digital_service') {
    return TAX_CODES.digital;
  }
  // Default to digital for other types
  return TAX_CODES.digital;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { product_id } = await req.json();

    if (!product_id) {
      return Response.json({ error: 'product_id is required' }, { status: 400 });
    }

    // Get product from database
    const product = await base44.entities.Product.get(product_id);
    if (!product) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    // Ensure Nevada tax rates exist in Stripe
    const nevadaTaxRates = await ensureNevadaTaxRates();

    // Determine tax code based on product_subtype
    const taxCode = getTaxCodeForSubtype(product.product_subtype);

    // If product has Stripe ID, update it with tax code
    if (product.stripe_product_id) {
      await stripeClient.products.update(product.stripe_product_id, {
        tax_code: taxCode,
      });
    }

    // Update product in database with tax_code
    await base44.entities.Product.update(product_id, {
      tax_code: taxCode,
    });

    return Response.json({
      success: true,
      product_id,
      tax_code: taxCode,
      subtype: product.product_subtype,
      message: `Tax code synced successfully. Nevada tax rates are configured in Stripe.`,
      nevada_tax_rates: {
        physical_rate_id: nevadaTaxRates.physical?.id,
        digital_rate_id: nevadaTaxRates.digital?.id,
        percentage: NEVADA_TAX_RATE,
      }
    });
  } catch (error) {
    console.error('Error syncing tax code:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});