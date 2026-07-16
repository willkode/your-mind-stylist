import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        // Get all active enrollments where next_send_date is in the past
        const now = new Date().toISOString();
        const enrollments = await base44.asServiceRole.entities.UserEmailSequence.filter({
            status: 'active'
        });

        const dueEnrollments = enrollments.filter(e => 
            e.next_send_date && new Date(e.next_send_date) <= new Date()
        );

        const results = {
            processed: 0,
            failed: 0,
            completed: 0,
            errors: []
        };

        for (const enrollment of dueEnrollments) {
            try {
                // Check if user has unsubscribed
                const users = await base44.asServiceRole.entities.User.filter({ email: enrollment.user_email });
                const isUnsubscribed = users.some(u => u.email_unsubscribed);
                if (isUnsubscribed) {
                    await base44.asServiceRole.entities.UserEmailSequence.update(enrollment.id, { status: 'unsubscribed' });
                    results.completed++;
                    continue;
                }

                // Get sequence steps
                const steps = await base44.asServiceRole.entities.EmailSequenceStep.filter({
                    sequence_id: enrollment.sequence_id,
                    active: true
                });

                const sortedSteps = steps.sort((a, b) => a.step_number - b.step_number);
                const nextStepIndex = enrollment.current_step;

                if (nextStepIndex >= sortedSteps.length) {
                    // Sequence completed
                    await base44.asServiceRole.entities.UserEmailSequence.update(enrollment.id, {
                        status: 'completed',
                        completed_date: new Date().toISOString()
                    });
                    results.completed++;
                    continue;
                }

                const currentStep = sortedSteps[nextStepIndex];

                // Replace variables in email
                const replacements = {
                    '{{name}}': enrollment.user_email.split('@')[0],
                    '{{email}}': enrollment.user_email,
                    ...enrollment.metadata
                };

                let subject = currentStep.subject;
                let body = currentStep.body_html;

                Object.keys(replacements).forEach(key => {
                    subject = subject.replace(new RegExp(key, 'g'), replacements[key] || '');
                    body = body.replace(new RegExp(key, 'g'), replacements[key] || '');
                });

                // Send email
                await base44.asServiceRole.integrations.Core.SendEmail({
                    to: enrollment.user_email,
                    subject,
                    body
                });

                // Calculate next send date
                const nextStepNum = enrollment.current_step + 1;
                let nextSendDate = null;

                if (nextStepNum < sortedSteps.length) {
                    const nextStep = sortedSteps[nextStepNum];
                    const sendDate = new Date();
                    sendDate.setDate(sendDate.getDate() + nextStep.delay_days);
                    sendDate.setHours(sendDate.getHours() + (nextStep.delay_hours || 0));
                    nextSendDate = sendDate.toISOString();
                }

                // Update enrollment
                await base44.asServiceRole.entities.UserEmailSequence.update(enrollment.id, {
                    current_step: nextStepNum,
                    next_send_date: nextSendDate,
                    emails_sent: (enrollment.emails_sent || 0) + 1,
                    status: nextSendDate ? 'active' : 'completed',
                    completed_date: nextSendDate ? null : new Date().toISOString()
                });

                // Update step stats
                await base44.asServiceRole.entities.EmailSequenceStep.update(currentStep.id, {
                    sent_count: (currentStep.sent_count || 0) + 1
                });

                results.processed++;

            } catch (error) {
                console.error(`Failed to process enrollment ${enrollment.id}:`, error);
                results.failed++;
                results.errors.push({
                    enrollment_id: enrollment.id,
                    error: error.message
                });
            }
        }

        return Response.json({
            success: true,
            summary: results,
            total_checked: enrollments.length,
            due_for_sending: dueEnrollments.length
        });

    } catch (error) {
        console.error('Process sequences error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});