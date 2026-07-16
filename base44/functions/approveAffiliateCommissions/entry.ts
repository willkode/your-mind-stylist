import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { referral_ids } = await req.json();

    if (!referral_ids || !Array.isArray(referral_ids) || referral_ids.length === 0) {
      return Response.json({ error: 'referral_ids array is required' }, { status: 400 });
    }

    const approvedCount = referral_ids.length;

    // Update all referrals to approved status
    for (const referralId of referral_ids) {
      await base44.asServiceRole.entities.AffiliateReferral.update(referralId, {
        commission_status: 'approved',
        commission_approved_date: new Date().toISOString()
      });
    }

    return Response.json({
      success: true,
      approved_count: approvedCount,
      message: `${approvedCount} commissions approved and ready for payout`
    });

  } catch (error) {
    console.error('Approve commissions error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});