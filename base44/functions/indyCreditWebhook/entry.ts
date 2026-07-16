import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@17.5.0';

/**
 * Webhook handler for Indy's Stripe account — handles credit system events.
 * Completely separate from Roberta's stripeWebhook which handles product sales.
 *
 * Events handled:
 *   checkout.session.completed (type: credit_subscription) → activate sub, set 250 credits
 *   checkout.session.completed (type: credit_topup)        → add 50 credits to balance
 *   customer.subscription.deleted                          → revoke credits
 *   customer.subscription.updated                          → freeze if payment issue
 *   invoice.payment_succeeded (subscription renewal)       → reset monthly credits
 */

const STANDARD_MONTHLY_LIMIT = 250;
const TOPUP_CREDITS = 50;

Deno.serve(async (req) => {
  try {
    const stripe = new Stripe(Deno.env.get("INDY_STRIPE_SECRET_KEY"));
    const body = await req.text();

    // Verify webhook signature
    const webhookSecret = Deno.env.get("INDY_STRIPE_WEBHOOK_SECRET");
    let event;
    if (webhookSecret) {
      const signature = req.headers.get("stripe-signature");
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } else {
      event = JSON.parse(body);
    }

    // Create base44 client (body already consumed, use fake request)
    const fakeReq = new Request(req.url, { method: req.method, headers: req.headers });
    const base44 = createClientFromRequest(fakeReq);

    console.log(`[indyCreditWebhook] Event: ${event.type}`);

    // ── Checkout completed ──────────────────────────────────────────
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const metadata = session.metadata || {};

      if (metadata.type === "credit_subscription") {
        const userEmail = metadata.user_email;
        const subscriptionId = session.subscription;
        const customerId = session.customer;

        console.log(`[indyCreditWebhook] Activating standard for ${userEmail}, sub=${subscriptionId}`);

        const allowances = await base44.asServiceRole.entities.CreditAllowance.filter({ user_email: userEmail });
        const now = new Date();
        const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        const updateData = {
          tier: "standard",
          monthly_limit: STANDARD_MONTHLY_LIMIT,
          credits_used: 0,
          credits_remaining: STANDARD_MONTHLY_LIMIT,
          stripe_subscription_id: subscriptionId,
          stripe_customer_id: customerId,
          auto_renew: true,
          period_start: now.toISOString(),
          period_end: periodEnd.toISOString(),
          last_reset_date: now.toISOString(),
        };

        if (allowances.length > 0) {
          await base44.asServiceRole.entities.CreditAllowance.update(allowances[0].id, updateData);
        } else {
          await base44.asServiceRole.entities.CreditAllowance.create({
            user_email: userEmail,
            user_name: metadata.user_name || "",
            ...updateData,
          });
        }
        console.log(`[indyCreditWebhook] ✅ ${userEmail} subscribed — ${STANDARD_MONTHLY_LIMIT} credits`);
      }

      if (metadata.type === "credit_topup") {
        const userEmail = metadata.user_email;
        const credits = parseInt(metadata.topup_credits, 10) || TOPUP_CREDITS;

        console.log(`[indyCreditWebhook] Top-up ${credits} credits for ${userEmail}`);

        const allowances = await base44.asServiceRole.entities.CreditAllowance.filter({ user_email: userEmail });
        if (allowances.length > 0) {
          const a = allowances[0];
          await base44.asServiceRole.entities.CreditAllowance.update(a.id, {
            credits_remaining: (a.credits_remaining || 0) + credits,
            // Don't change monthly_limit — top-ups are bonus credits
          });
          console.log(`[indyCreditWebhook] ✅ ${userEmail} topped up +${credits}, now ${(a.credits_remaining || 0) + credits}`);
        } else {
          console.warn(`[indyCreditWebhook] ⚠️ No allowance found for ${userEmail} — ignoring top-up`);
        }
      }

      // Ignore other checkout types
      if (!metadata.type || !["credit_subscription", "credit_topup"].includes(metadata.type)) {
        console.log("[indyCreditWebhook] Ignoring unrelated checkout");
      }
    }

    // ── Subscription deleted ────────────────────────────────────────
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;
      const allAllowances = await base44.asServiceRole.entities.CreditAllowance.list();
      const match = allAllowances.find(a => a.stripe_subscription_id === subscription.id);

      if (match) {
        await base44.asServiceRole.entities.CreditAllowance.update(match.id, {
          tier: "starter",
          monthly_limit: 0,
          credits_remaining: 0,
          stripe_subscription_id: "",
          auto_renew: false,
        });
        console.log(`[indyCreditWebhook] ❌ Sub cancelled for ${match.user_email}`);
      }
    }

    // ── Subscription updated (payment issues) ───────────────────────
    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object;
      if (subscription.status === "past_due" || subscription.status === "unpaid") {
        const allAllowances = await base44.asServiceRole.entities.CreditAllowance.list();
        const match = allAllowances.find(a => a.stripe_subscription_id === subscription.id);
        if (match) {
          await base44.asServiceRole.entities.CreditAllowance.update(match.id, {
            credits_remaining: 0,
          });
          console.log(`[indyCreditWebhook] ⚠️ Payment issue for ${match.user_email}, credits frozen`);
        }
      }
    }

    // ── Invoice paid (monthly renewal) ──────────────────────────────
    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object;
      // Only handle subscription renewal invoices (not the first one)
      if (invoice.billing_reason === "subscription_cycle") {
        const subscriptionId = invoice.subscription;
        const allAllowances = await base44.asServiceRole.entities.CreditAllowance.list();
        const match = allAllowances.find(a => a.stripe_subscription_id === subscriptionId);
        if (match) {
          const now = new Date();
          const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          await base44.asServiceRole.entities.CreditAllowance.update(match.id, {
            credits_used: 0,
            credits_remaining: STANDARD_MONTHLY_LIMIT,
            period_start: now.toISOString(),
            period_end: periodEnd.toISOString(),
            last_reset_date: now.toISOString(),
          });
          console.log(`[indyCreditWebhook] 🔄 Monthly reset for ${match.user_email} — ${STANDARD_MONTHLY_LIMIT} credits`);
        }
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error("[indyCreditWebhook] Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});