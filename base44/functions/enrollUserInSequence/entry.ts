import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { user_email, user_id, sequence_id, metadata } = await req.json();

        if (!user_email || !sequence_id) {
            return Response.json({ error: 'user_email and sequence_id required' }, { status: 400 });
        }

        // Get sequence details
        const sequences = await base44.asServiceRole.entities.EmailSequence.filter({ id: sequence_id });
        if (sequences.length === 0) {
            return Response.json({ error: 'Sequence not found' }, { status: 404 });
        }

        const sequence = sequences[0];
        if (!sequence.active) {
            return Response.json({ error: 'Sequence is not active' }, { status: 400 });
        }

        // Check if user already enrolled
        const existing = await base44.asServiceRole.entities.UserEmailSequence.filter({
            user_email,
            sequence_id,
            status: 'active'
        });

        if (existing.length > 0) {
            return Response.json({ 
                message: 'User already enrolled',
                enrollment: existing[0]
            });
        }

        // Get first step to calculate next send date
        const steps = await base44.asServiceRole.entities.EmailSequenceStep.filter({ 
            sequence_id 
        });
        const sortedSteps = steps.sort((a, b) => a.step_number - b.step_number);
        
        let nextSendDate = new Date();
        if (sortedSteps.length > 0) {
            const firstStep = sortedSteps[0];
            nextSendDate.setDate(nextSendDate.getDate() + firstStep.delay_days);
            nextSendDate.setHours(nextSendDate.getHours() + (firstStep.delay_hours || 0));
        }

        // Create enrollment
        const enrollment = await base44.asServiceRole.entities.UserEmailSequence.create({
            user_id,
            user_email,
            sequence_id,
            status: 'active',
            current_step: 0,
            next_send_date: nextSendDate.toISOString(),
            started_date: new Date().toISOString(),
            metadata: metadata || {},
            emails_sent: 0
        });

        // Update sequence subscriber count
        await base44.asServiceRole.entities.EmailSequence.update(sequence_id, {
            total_subscribers: (sequence.total_subscribers || 0) + 1
        });

        // Add to MailerLite group if configured
        if (sequence.mailerlite_group_id) {
            try {
                await base44.asServiceRole.functions.invoke('mailerLiteAddToGroup', {
                    email: user_email,
                    group_id: sequence.mailerlite_group_id
                });
            } catch (err) {
                console.error('MailerLite sync failed:', err);
            }
        }

        return Response.json({ 
            success: true,
            enrollment,
            next_send_date: nextSendDate.toISOString()
        });

    } catch (error) {
        console.error('Enroll in sequence error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});