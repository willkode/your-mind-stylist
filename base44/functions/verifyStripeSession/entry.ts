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

        // Only the purchaser (or an admin/manager) may verify a session
        const isPrivileged = user.role === 'admin' || user.role === 'manager' || user.custom_role === 'manager';
        const isOwner =
            (session.customer_details?.email && session.customer_details.email.toLowerCase() === (user.email || '').toLowerCase()) ||
            (session.metadata?.user_id && session.metadata.user_id === user.id);
        if (!isPrivileged && !isOwner) {
            return Response.json({ valid: false, error: 'Not authorized for this session' }, { status: 403 });
        }

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