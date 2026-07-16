import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get("STRIPE_API_KEY"));

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { session_id } = await req.json();
        if (!session_id) {
            return Response.json({ valid: false, error: 'No session_id provided' });
        }

        const session = await stripe.checkout.sessions.retrieve(session_id);

        const valid = session.payment_status === 'paid' || session.status === 'complete';

        return Response.json({
            valid,
            customer_email: session.customer_details?.email,
            amount_total: session.amount_total,
            product_ids: session.metadata?.product_ids || session.metadata?.product_id || null,
            type: session.metadata?.type || null,
        });
    } catch (error) {
        return Response.json({ valid: false, error: error.message });
    }
});