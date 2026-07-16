import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get("STRIPE_API_KEY"));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { affiliate_id, payout_method } = await req.json();

    if (!affiliate_id) {
      return Response.json({ error: 'affiliate_id is required' }, { status: 400 });
    }

    // Get affiliate details
    const affiliates = await base44.asServiceRole.entities.Affiliate.filter({ id: affiliate_id });
    if (affiliates.length === 0) {
      return Response.json({ error: 'Affiliate not found' }, { status: 404 });
    }
    const affiliate = affiliates[0];

    // Check if affiliate has pending commission
    if (affiliate.commission_pending <= 0) {
      return Response.json({ error: 'No pending commission to pay out' }, { status: 400 });
    }

    // Get user info
    const users = await base44.asServiceRole.entities.User.filter({ id: affiliate.user_id });
    const affiliateUser = users[0];

    // Get approved referrals that haven't been paid
    const unpaidReferrals = await base44.asServiceRole.entities.AffiliateReferral.filter({
      affiliate_id: affiliate.id,
      commission_status: 'approved'
    });

    if (unpaidReferrals.length === 0) {
      return Response.json({ error: 'No approved referrals to pay out' }, { status: 400 });
    }

    const referralIds = unpaidReferrals.map(r => r.id);
    const totalAmount = affiliate.commission_pending;

    let payoutResult;
    const method = payout_method || affiliate.payment_method || 'stripe';

    // Process payout based on method
    if (method === 'stripe' && affiliate.stripe_account_id) {
      try {
        // Stripe Connect Transfer
        const transfer = await stripe.transfers.create({
          amount: Math.round(totalAmount), // Already in cents
          currency: 'usd',
          destination: affiliate.stripe_account_id,
          description: `Affiliate commission payout for ${affiliateUser.full_name}`,
          metadata: {
            affiliate_id: affiliate.id,
            user_id: affiliate.user_id,
            referral_count: unpaidReferrals.length
          }
        });

        payoutResult = {
          stripe_transfer_id: transfer.id,
          payment_reference: transfer.id,
          status: 'completed'
        };
      } catch (stripeError) {
        return Response.json({ 
          error: 'Stripe transfer failed', 
          details: stripeError.message 
        }, { status: 500 });
      }
    } else if (method === 'paypal' && affiliate.payment_email) {
      // PayPal payout would go here
      // For now, mark as processing and manager handles manually
      payoutResult = {
        payment_reference: `PAYPAL-${Date.now()}`,
        status: 'processing',
        notes: `PayPal payout to ${affiliate.payment_email} - Process manually`
      };
    } else if (method === 'bank_transfer' && affiliate.bank_details) {
      // Bank transfer - manual process
      payoutResult = {
        payment_reference: `BANK-${Date.now()}`,
        status: 'processing',
        notes: `Bank transfer to account ending ${affiliate.bank_details.account_number?.slice(-4)} - Process manually`
      };
    } else {
      return Response.json({ 
        error: 'Invalid payment method or missing payment details' 
      }, { status: 400 });
    }

    // Create payout record
    const payout = await base44.asServiceRole.entities.AffiliatePayout.create({
      affiliate_id: affiliate.id,
      payout_amount: totalAmount,
      currency: 'usd',
      payout_method: method,
      referral_ids: referralIds,
      status: payoutResult.status,
      payment_reference: payoutResult.payment_reference,
      stripe_transfer_id: payoutResult.stripe_transfer_id || null,
      processed_date: new Date().toISOString(),
      completed_date: payoutResult.status === 'completed' ? new Date().toISOString() : null,
      notes: payoutResult.notes || null
    });

    // Update referrals to paid status
    for (const referralId of referralIds) {
      await base44.asServiceRole.entities.AffiliateReferral.update(referralId, {
        commission_status: 'paid',
        commission_paid_date: new Date().toISOString(),
        payout_id: payout.id
      });
    }

    // Update affiliate stats
    await base44.asServiceRole.entities.Affiliate.update(affiliate.id, {
      commission_pending: 0,
      commission_paid: (affiliate.commission_paid || 0) + totalAmount,
      last_payout_date: new Date().toISOString()
    });

    // Send notification email to affiliate
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: affiliateUser.email,
      subject: 'Affiliate Commission Payout Processed',
      body: `
        <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="font-family: 'Playfair Display', serif; color: #1E3A32;">Commission Payout Processed</h1>
          
          <p style="color: #2B2725; font-size: 16px; line-height: 1.6;">
            Great news! Your affiliate commission has been processed.
          </p>
          
          <div style="background: #F9F5EF; padding: 24px; margin: 24px 0; border-left: 4px solid #D8B46B;">
            <p style="color: #1E3A32; font-size: 18px; margin: 0;">
              <strong>Amount:</strong> $${(totalAmount / 100).toFixed(2)}
            </p>
            <p style="color: #2B2725; margin-top: 8px;">
              <strong>Method:</strong> ${method === 'stripe' ? 'Stripe Connect' : method === 'paypal' ? 'PayPal' : 'Bank Transfer'}
            </p>
            <p style="color: #2B2725; margin-top: 8px;">
              <strong>Referrals:</strong> ${unpaidReferrals.length}
            </p>
            <p style="color: #2B2725; margin-top: 8px;">
              <strong>Status:</strong> ${payoutResult.status === 'completed' ? 'Completed' : 'Processing'}
            </p>
          </div>
          
          <p style="color: #2B2725; font-size: 14px;">
            ${payoutResult.status === 'completed' 
              ? 'The funds should appear in your account within 1-2 business days.' 
              : 'Your payout is being processed and will be completed shortly.'}
          </p>
          
          <p style="color: #2B2725; font-size: 16px; margin-top: 20px;">
            Thank you for being an affiliate partner!<br>
            <strong>Roberta Fernandez</strong><br>
            <span style="color: #D8B46B;">Your Mind Stylist</span>
          </p>
        </div>
      `
    });

    return Response.json({
      success: true,
      payout_id: payout.id,
      amount_paid: totalAmount,
      referrals_paid: unpaidReferrals.length,
      status: payoutResult.status,
      payment_reference: payoutResult.payment_reference
    });

  } catch (error) {
    console.error('Payout processing error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});