import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { 
      affiliate_code,
      referred_user_email,
      referred_user_id,
      referral_source,
      landing_page,
      conversion_type,
      product_id,
      product_name,
      purchase_amount,
      stripe_payment_intent_id
    } = await req.json();

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

    // Determine if this is a conversion or just a referral
    const isConversion = !!purchase_amount;
    const status = isConversion ? 'converted' : 'pending';

    // Calculate commission
    let commissionAmount = 0;
    if (isConversion) {
      commissionAmount = Math.round((purchase_amount * affiliate.commission_rate) / 100);
    }

    // Create referral record
    const referral = await base44.asServiceRole.entities.AffiliateReferral.create({
      affiliate_id: affiliate.id,
      affiliate_code,
      referred_user_email: referred_user_email || null,
      referred_user_id: referred_user_id || null,
      referral_source: referral_source || 'direct',
      landing_page: landing_page || null,
      status,
      conversion_type: conversion_type || null,
      product_id: product_id || null,
      product_name: product_name || null,
      purchase_amount: purchase_amount || 0,
      commission_rate: affiliate.commission_rate,
      commission_amount: commissionAmount,
      commission_status: isConversion ? 'pending' : null,
      stripe_payment_intent_id: stripe_payment_intent_id || null,
      converted_date: isConversion ? new Date().toISOString() : null
    });

    // Update affiliate stats
    const updates = {
      total_referrals: affiliate.total_referrals + 1
    };

    if (isConversion) {
      updates.successful_conversions = affiliate.successful_conversions + 1;
      updates.total_revenue_generated = affiliate.total_revenue_generated + purchase_amount;
      updates.total_commission_earned = affiliate.total_commission_earned + commissionAmount;
      updates.commission_pending = affiliate.commission_pending + commissionAmount;
    }

    await base44.asServiceRole.entities.Affiliate.update(affiliate.id, updates);

    return Response.json({
      success: true,
      referral,
      commission_amount: commissionAmount
    });

  } catch (error) {
    console.error('Track referral error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});