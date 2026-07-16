import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Scheduled monthly: resets all credit allowances to their tier limits.
 * Should run on the 1st of every month.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const allAllowances = await base44.asServiceRole.entities.CreditAllowance.filter({});
    const now = new Date();
    const newPeriodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    let resetCount = 0;

    for (const a of allAllowances) {
      // Only reset if period has ended
      const periodEnd = new Date(a.period_end);
      if (now >= periodEnd) {
        await base44.asServiceRole.entities.CreditAllowance.update(a.id, {
          credits_used: 0,
          credits_remaining: a.monthly_limit,
          period_start: now.toISOString(),
          period_end: newPeriodEnd.toISOString(),
          last_reset_date: now.toISOString(),
        });
        resetCount++;
      }
    }

    return Response.json({
      success: true,
      message: `Reset ${resetCount} credit allowances`,
      reset_count: resetCount,
      total_checked: allAllowances.length,
    });
  } catch (error) {
    console.error("resetMonthlyCredits error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});