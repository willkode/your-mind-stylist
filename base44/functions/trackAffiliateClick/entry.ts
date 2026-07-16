import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { affiliate_code, landing_page, referral_source } = await req.json();

    if (!affiliate_code) {
      return Response.json({ error: 'affiliate_code is required' }, { status: 400 });
    }

    // Find affiliate
    const affiliates = await base44.asServiceRole.entities.Affiliate.filter({ 
      affiliate_code,
      status: 'active'
    });

    if (affiliates.length === 0) {
      return Response.json({ error: 'Invalid or inactive affiliate code' }, { status: 404 });
    }

    const affiliate = affiliates[0];

    // Create a pending referral (no conversion yet, just tracking the click)
    await base44.asServiceRole.entities.AffiliateReferral.create({
      affiliate_id: affiliate.id,
      affiliate_code,
      referral_source: referral_source || 'direct',
      landing_page: landing_page || null,
      status: 'pending'
    });

    return Response.json({
      success: true,
      affiliate_code,
      commission_rate: affiliate.commission_rate
    });

  } catch (error) {
    console.error('Track click error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});