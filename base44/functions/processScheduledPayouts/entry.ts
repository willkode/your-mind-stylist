import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // This function can be called by a cron job or manually by admin
    // For manual trigger, verify auth
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const user = await base44.auth.me();
      if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
        return Response.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    const { minimum_threshold = 5000 } = await req.json(); // Default $50 minimum

    // Get all active affiliates with pending commission above threshold
    const affiliates = await base44.asServiceRole.entities.Affiliate.filter({
      status: 'active'
    });

    const eligibleAffiliates = affiliates.filter(
      aff => aff.commission_pending >= minimum_threshold && 
             (aff.payment_method === 'stripe' || aff.payment_method === 'paypal' || aff.payment_method === 'bank_transfer')
    );

    const results = {
      total_checked: affiliates.length,
      eligible: eligibleAffiliates.length,
      processed: 0,
      failed: 0,
      skipped: 0,
      details: []
    };

    // Process each eligible affiliate
    for (const affiliate of eligibleAffiliates) {
      try {
        // Only auto-process Stripe Connect payouts
        if (affiliate.payment_method === 'stripe' && affiliate.stripe_account_id) {
          const payoutResult = await base44.asServiceRole.functions.invoke('processAffiliatePayout', {
            affiliate_id: affiliate.id,
            payout_method: 'stripe'
          });

          if (payoutResult.data.success) {
            results.processed++;
            results.details.push({
              affiliate_id: affiliate.id,
              affiliate_code: affiliate.affiliate_code,
              amount: payoutResult.data.amount_paid,
              status: 'success'
            });
          } else {
            results.failed++;
            results.details.push({
              affiliate_id: affiliate.id,
              affiliate_code: affiliate.affiliate_code,
              status: 'failed',
              error: payoutResult.data.error
            });
          }
        } else {
          // Skip non-Stripe or manual payment methods
          results.skipped++;
          results.details.push({
            affiliate_id: affiliate.id,
            affiliate_code: affiliate.affiliate_code,
            status: 'skipped',
            reason: 'Manual payment method - requires manager approval'
          });
        }
      } catch (error) {
        results.failed++;
        results.details.push({
          affiliate_id: affiliate.id,
          affiliate_code: affiliate.affiliate_code,
          status: 'failed',
          error: error.message
        });
      }
    }

    // Send summary email to admin
    const adminUsers = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
    if (adminUsers.length > 0) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: adminUsers[0].email,
        subject: `Affiliate Payout Batch Processed - ${results.processed} Completed`,
        body: `
          <h2>Scheduled Affiliate Payout Summary</h2>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          
          <h3>Results:</h3>
          <ul>
            <li>Total Affiliates Checked: ${results.total_checked}</li>
            <li>Eligible for Payout: ${results.eligible}</li>
            <li>Successfully Processed: ${results.processed}</li>
            <li>Skipped (Manual): ${results.skipped}</li>
            <li>Failed: ${results.failed}</li>
          </ul>
          
          ${results.skipped > 0 ? `
            <p><em>Note: ${results.skipped} affiliates require manual payout processing (PayPal/Bank Transfer)</em></p>
          ` : ''}
          
          <p>View full details in the <a href="https://yourmindstylist.com/ManagerAffiliates">Affiliate Management Dashboard</a></p>
        `
      });
    }

    return Response.json({
      success: true,
      summary: results
    });

  } catch (error) {
    console.error('Scheduled payout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});