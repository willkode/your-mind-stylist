import { base44 } from "@/api/base44Client";
import { CREDIT_WEIGHTS } from "./creditConfig";

/**
 * Check if the current user has enough credits for a feature.
 * Returns { allowed, remaining, tier, cost, monthly_limit, credits_used, requires_subscription }
 *
 * Model:
 *   - Admin users bypass all checks
 *   - No CreditAllowance → auto-provision as "starter" (0 credits, requires subscription)
 *   - Has allowance but no stripe_subscription_id → requires subscription
 *   - Has subscription + credits → allowed
 *   - Has subscription + 0 credits → blocked (can buy top-up)
 */
export async function checkCredits(feature) {
  try {
    const user = await base44.auth.me();
    if (!user?.email) return { allowed: true, remaining: 999, tier: "unknown" };

    // Admin users bypass credit checks
    if (user.role === "admin") return { allowed: true, remaining: 999, tier: "admin" };

    const cost = CREDIT_WEIGHTS[feature] || 1;
    const allowances = await base44.entities.CreditAllowance.filter({ user_email: user.email });

    if (allowances.length === 0) {
      // Auto-provision as unpaid starter — no credits until they subscribe
      const now = new Date();
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      await base44.entities.CreditAllowance.create({
        user_email: user.email,
        user_name: user.full_name || "",
        tier: "starter",
        monthly_limit: 0,
        credits_used: 0,
        credits_remaining: 0,
        period_start: now.toISOString(),
        period_end: periodEnd.toISOString(),
        last_reset_date: now.toISOString(),
      });
      return { allowed: false, remaining: 0, tier: "starter", cost, requires_subscription: true };
    }

    const allowance = allowances[0];

    // Block unpaid users — must have an active subscription
    if (!allowance.stripe_subscription_id || allowance.tier === "starter") {
      return {
        allowed: false,
        remaining: 0,
        tier: allowance.tier || "unpaid",
        cost,
        monthly_limit: allowance.monthly_limit || 0,
        credits_used: allowance.credits_used || 0,
        requires_subscription: true,
      };
    }

    // Check if period needs reset (new month)
    const periodEnd = new Date(allowance.period_end);
    if (new Date() >= periodEnd) {
      const now = new Date();
      const newPeriodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      await base44.entities.CreditAllowance.update(allowance.id, {
        credits_used: 0,
        credits_remaining: allowance.monthly_limit,
        period_start: now.toISOString(),
        period_end: newPeriodEnd.toISOString(),
        last_reset_date: now.toISOString(),
      });
      return { allowed: true, remaining: allowance.monthly_limit, tier: allowance.tier, cost, monthly_limit: allowance.monthly_limit };
    }

    return {
      allowed: allowance.credits_remaining >= cost,
      remaining: allowance.credits_remaining,
      tier: allowance.tier,
      cost,
      monthly_limit: allowance.monthly_limit,
      credits_used: allowance.credits_used,
    };
  } catch (e) {
    console.error("[checkCredits] FAILED — feature:", feature, "error:", e?.message || e, e);
    return { allowed: true, remaining: 999, tier: "unknown" };
  }
}

/**
 * MANAGER_EMAIL — canonical Roberta account.
 * Used by trackUsageForManager to charge client AI usage to the business owner.
 */
const MANAGER_EMAIL = "roberta@robertafernandez.com";

/**
 * Track usage and deduct credits from Roberta's (manager) allowance,
 * regardless of which user triggered the call.
 * Use this for client-facing AI features whose cost is borne by the business.
 */
export async function trackUsageForManager({ feature, integration_type, estimated_credits, details = "" }) {
  try {
    const user = await base44.auth.me();
    const cost = estimated_credits || CREDIT_WEIGHTS[feature] || 1;

    // Log the usage event — attribute to the actual user who triggered it
    await base44.entities.IntegrationUsageLog.create({
      user_email: user?.email || "unknown",
      user_name: user?.full_name || "Unknown",
      feature,
      integration_type,
      estimated_credits: cost,
      details: details.substring(0, 200),
    });

    // Deduct from MANAGER's allowance (not the client's)
    const allowances = await base44.entities.CreditAllowance.filter({ user_email: MANAGER_EMAIL });
    if (allowances.length > 0) {
      const a = allowances[0];
      await base44.entities.CreditAllowance.update(a.id, {
        credits_used: (a.credits_used || 0) + cost,
        credits_remaining: Math.max(0, (a.credits_remaining || 0) - cost),
      });
    }
  } catch (e) {
    console.error("[trackUsageForManager] FAILED — feature:", feature, "integration:", integration_type, "error:", e?.message || e, e);
    try {
      await base44.entities.BugReport.create({
        title: `[Auto] Manager usage tracking failed: ${feature}`,
        description: `trackUsageForManager() failed for feature="${feature}", integration="${integration_type}", details="${details}".\n\nError: ${e?.message || JSON.stringify(e)}`,
        status: "New",
        priority: "High",
        reporter_email: "system@yourmindstylist.com",
        reporter_name: "System — Usage Tracker",
        page_url: "/tracking-diagnostic",
        browser_info: "Backend tracking system",
      });
    } catch (bugErr) {
      console.error("[trackUsageForManager] Also failed to create BugReport:", bugErr?.message);
    }
  }
}

/**
 * Logs an integration credit usage event AND deducts from allowance.
 * Call this AFTER a successful integration call.
 */
export async function trackUsage({ feature, integration_type, estimated_credits, details = "" }) {
  try {
    const user = await base44.auth.me();
    const cost = estimated_credits || CREDIT_WEIGHTS[feature] || 1;

    // Log the usage event
    await base44.entities.IntegrationUsageLog.create({
      user_email: user?.email || "unknown",
      user_name: user?.full_name || "Unknown",
      feature,
      integration_type,
      estimated_credits: cost,
      details: details.substring(0, 200),
    });

    // Deduct from allowance (admin bypass)
    if (user?.role === "admin") return;

    const allowances = await base44.entities.CreditAllowance.filter({ user_email: user?.email });
    if (allowances.length > 0) {
      const a = allowances[0];
      await base44.entities.CreditAllowance.update(a.id, {
        credits_used: (a.credits_used || 0) + cost,
        credits_remaining: Math.max(0, (a.credits_remaining || 0) - cost),
      });
    }
  } catch (e) {
    // DIAGNOSTIC: Log full error for admin visibility — do NOT swallow silently
    console.error("[trackUsage] FAILED — feature:", feature, "integration:", integration_type, "error:", e?.message || e, e);
    // File a silent bug report so it surfaces in admin dashboard
    try {
      await base44.entities.BugReport.create({
        title: `[Auto] Usage tracking failed: ${feature}`,
        description: `trackUsage() failed for feature="${feature}", integration="${integration_type}", details="${details}".\n\nError: ${e?.message || JSON.stringify(e)}`,
        status: "New",
        priority: "High",
        reporter_email: "system@yourmindstylist.com",
        reporter_name: "System — Usage Tracker",
        page_url: "/tracking-diagnostic",
        browser_info: "Backend tracking system",
      });
    } catch (bugErr) {
      console.error("[trackUsage] Also failed to create BugReport:", bugErr?.message);
    }
  }
}