import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
    try {
        // MailerLite sends a secret in the header for verification
        const secret = Deno.env.get('MAILERLITE_WEBHOOK_SECRET');
        if (secret) {
            const signature = req.headers.get('X-MailerLite-Signature') || req.headers.get('X-Signature');
            if (signature !== secret) {
                return Response.json({ error: 'Invalid signature' }, { status: 401 });
            }
        }

        const body = await req.json();
        const { events } = body;

        if (!events || !Array.isArray(events)) {
            return Response.json({ error: 'Invalid payload' }, { status: 400 });
        }

        const base44 = createClientFromRequest(req);

        const results = { processed: 0, skipped: 0 };

        for (const event of events) {
            const eventType = event.type; // e.g. 'subscriber.unsubscribed', 'subscriber.bounced', 'subscriber.spam_complained'
            const email = event.data?.subscriber?.email;

            if (!email) {
                results.skipped++;
                continue;
            }

            const shouldUnsubscribe = [
                'subscriber.unsubscribed',
                'subscriber.bounced',
                'subscriber.spam_complained'
            ].includes(eventType);

            if (!shouldUnsubscribe) {
                results.skipped++;
                continue;
            }

            // Mark user as unsubscribed if they exist
            const users = await base44.asServiceRole.entities.User.filter({ email });
            for (const user of users) {
                await base44.asServiceRole.entities.User.update(user.id, {
                    email_unsubscribed: true
                });
            }

            // Also mark leads as unsubscribed
            const leads = await base44.asServiceRole.entities.Lead.filter({ email });
            for (const lead of leads) {
                await base44.asServiceRole.entities.Lead.update(lead.id, {
                    email_unsubscribed: true
                });
            }

            // Also mark masterclass signups
            const signups = await base44.asServiceRole.entities.MasterclassSignup.filter({ email });
            for (const signup of signups) {
                await base44.asServiceRole.entities.MasterclassSignup.update(signup.id, {
                    email_unsubscribed: true
                });
            }

            // Mark active email sequences as paused
            const sequences = await base44.asServiceRole.entities.UserEmailSequence.filter({
                user_email: email,
                status: 'active'
            });
            for (const seq of sequences) {
                await base44.asServiceRole.entities.UserEmailSequence.update(seq.id, {
                    status: 'unsubscribed'
                });
            }

            console.log(`Unsubscribed ${email} due to event: ${eventType}`);
            results.processed++;
        }

        return Response.json({ success: true, ...results });

    } catch (error) {
        console.error('MailerLite webhook error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});