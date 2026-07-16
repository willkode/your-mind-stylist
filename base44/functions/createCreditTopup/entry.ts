import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@17.5.0';

/**
 * Creates a Stripe Checkout session for either:
 *   - action: "subscribe"  → $79/mo Standard subscription
 *   - action: "topup"      → $25 one-time 50-credit top-up
 *
 * Uses Indy's Stripe account (INDY_STRIPE_SECRET_KEY),
 * completely separate from Roberta's business Stripe.
 */

const STANDARD_PRICE_ID = "price_1TarvnGtV3XinJAoMmuobhQR";
const TOPUP_PRICE_ID = "price_1TarwOGtV3XinJAogCaEcm5V";
const TOPUP_CREDITS = 50;
const STANDARD_MONTHLY_LIMIT = 250;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action } = await req.json();
    if (!["subscribe", "topup"].includes(action)) {
      return Response.json({ error: "Invalid action. Use 'subscribe' or 'topup'." }, { status: 400 });
    }

    const stripe = new Stripe(Deno.env.get("INDY_STRIPE_SECRET_KEY"));

    // Find or create Stripe customer
    let customerId;
    const allowances = await base44.asServiceRole.entities.CreditAllowance.filter({ user_email: user.email });
    if (allowances.length > 0 && allowances[0].stripe_customer_id) {
      customerId = allowances[0].stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.full_name || undefined,
        metadata: { source: "credit_system" },
      });
      customerId = customer.id;
    }

    if (action === "subscribe") {
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        line_items: [{ price: STANDARD_PRICE_ID, quantity: 1 }],
        metadata: {
          type: "credit_subscription",
          user_email: user.email,
          user_id: user.id,
          user_name: user.full_name || "",
          monthly_limit: String(STANDARD_MONTHLY_LIMIT),
        },
        success_url: "https://yourmindstylist.com/ManagerCreditUpgrade?success=subscription",
        cancel_url: "https://yourmindstylist.com/ManagerCreditUpgrade?cancelled=true",
      });
      return Response.json({ url: session.url });
    }

    if (action === "topup") {
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer: customerId,
        line_items: [{ price: TOPUP_PRICE_ID, quantity: 1 }],
        metadata: {
          type: "credit_topup",
          user_email: user.email,
          user_id: user.id,
          topup_credits: String(TOPUP_CREDITS),
        },
        success_url: "https://yourmindstylist.com/ManagerCreditUpgrade?success=topup",
        cancel_url: "https://yourmindstylist.com/ManagerCreditUpgrade?cancelled=true",
      });
      return Response.json({ url: session.url });
    }
  } catch (error) {
    console.error("createCreditTopup error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});