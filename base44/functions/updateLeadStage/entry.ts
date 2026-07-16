import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
            return Response.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { lead_id, stage, notes } = await req.json();

        if (!lead_id || !stage) {
            return Response.json({ error: 'lead_id and stage required' }, { status: 400 });
        }

        // Get current lead
        const leads = await base44.asServiceRole.entities.Lead.filter({ id: lead_id });
        if (leads.length === 0) {
            return Response.json({ error: 'Lead not found' }, { status: 404 });
        }

        const lead = leads[0];
        const previousStage = lead.stage;

        // Update lead
        const updates = {
            stage,
            last_contact_date: new Date().toISOString()
        };

        if (notes) {
            updates.notes = (lead.notes || '') + '\n\n' + `[${new Date().toLocaleString()}] ${notes}`;
        }

        // If won, mark as converted
        if (stage === 'won') {
            updates.converted_to_client = true;
            updates.converted_date = new Date().toISOString();
        }

        // Set follow-up date based on stage
        const followUpDays = {
            new: 1,
            contacted: 3,
            qualified: 5,
            proposal: 7,
            negotiation: 2,
            won: null,
            lost: null
        };

        if (followUpDays[stage] !== null) {
            const followUpDate = new Date();
            followUpDate.setDate(followUpDate.getDate() + followUpDays[stage]);
            updates.next_follow_up_date = followUpDate.toISOString();
        } else {
            updates.next_follow_up_date = null;
        }

        await base44.asServiceRole.entities.Lead.update(lead_id, updates);

        // Log activity
        await base44.asServiceRole.entities.LeadActivity.create({
            lead_id,
            activity_type: 'stage_changed',
            description: `Stage changed from ${previousStage} to ${stage}`,
            created_by: user.email,
            metadata: { previous_stage: previousStage, new_stage: stage, notes }
        });

        // Trigger appropriate email sequence based on stage
        if (stage === 'qualified') {
            try {
                const sequences = await base44.asServiceRole.entities.EmailSequence.filter({
                    trigger_type: 'qualified_lead',
                    active: true
                });
                
                if (sequences.length > 0) {
                    await base44.asServiceRole.functions.invoke('enrollUserInSequence', {
                        user_email: lead.email,
                        sequence_id: sequences[0].id,
                        metadata: { lead_id }
                    });
                }
            } catch (err) {
                console.error('Failed to enroll in sequence:', err);
            }
        }

        return Response.json({ success: true, lead_id, stage });

    } catch (error) {
        console.error('Update lead stage error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});