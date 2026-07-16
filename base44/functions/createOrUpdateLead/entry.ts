import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const data = await req.json();

        const {
            email, full_name, phone, source,
            interested_products, utm_source, utm_medium, utm_campaign,
            first_page_visited,
            skip_sequence_enrollment,
            email_consent, consent_given_at
        } = data;

        if (!email) {
            return Response.json({ error: 'Email required' }, { status: 400 });
        }

        // Check if lead exists
        const existingLeads = await base44.asServiceRole.entities.Lead.filter({ email });
        
        if (existingLeads.length > 0) {
            // Update existing lead
            const lead = existingLeads[0];
            const updates = {};
            
            if (full_name && !lead.full_name) updates.full_name = full_name;
            if (phone && !lead.phone) updates.phone = phone;
            if (interested_products) {
                const currentInterests = lead.interested_products || [];
                updates.interested_products = [...new Set([...currentInterests, ...interested_products])];
            }

            // Append source to sources array (no duplicates)
            if (source) {
                const currentSources = lead.sources || (lead.source ? [lead.source] : []);
                if (!currentSources.includes(source)) {
                    updates.sources = [...currentSources, source];
                }
                if (!lead.source) {
                    updates.source = source;
                }
            }
            
            // Update UTM data only if not already set
            if (utm_source && !lead.utm_source) updates.utm_source = utm_source;
            if (utm_medium && !lead.utm_medium) updates.utm_medium = utm_medium;
            if (utm_campaign && !lead.utm_campaign) updates.utm_campaign = utm_campaign;
            if (first_page_visited && !lead.first_page_visited) updates.first_page_visited = first_page_visited;

            // Consent: only upgrade, never downgrade
            if (email_consent && !lead.email_consent) {
                updates.email_consent = true;
                updates.consent_given_at = consent_given_at || new Date().toISOString();
            }

            // Recalculate lead score
            const newScore = calculateLeadScore({ ...lead, ...updates });
            updates.lead_score = newScore;

            // GUARD: Do NOT reset archived status or clear opted_out_at
            // Source/activity is recorded, but lifecycle state is preserved

            await base44.asServiceRole.entities.Lead.update(lead.id, updates);

            // Log activity
            await base44.asServiceRole.entities.LeadActivity.create({
                lead_id: lead.id,
                activity_type: 'form_submitted',
                description: `Lead information updated (source: ${source || 'unknown'})`
            });

            return Response.json({ 
                success: true, 
                lead_id: lead.id,
                is_new: false 
            });
        } else {
            // Create new lead
            const leadScore = calculateLeadScore(data);
            
            const effectiveSource = source || 'website';
            const createData = {
                email,
                full_name,
                phone,
                source: effectiveSource,
                sources: [effectiveSource],
                interested_products: interested_products || [],
                stage: 'new',
                lead_score: leadScore,
                interest_level: 'warm',
                utm_source,
                utm_medium,
                utm_campaign,
                first_page_visited,
                tags: []
            };

            // Consent tracking
            if (email_consent) {
                createData.email_consent = true;
                createData.consent_given_at = consent_given_at || new Date().toISOString();
            }

            const newLead = await base44.asServiceRole.entities.Lead.create(createData);

            // Log activity
            await base44.asServiceRole.entities.LeadActivity.create({
                lead_id: newLead.id,
                activity_type: 'form_submitted',
                description: `New lead created (source: ${effectiveSource})`
            });

            // Enroll in welcome sequence ONLY if:
            // 1. skip_sequence_enrollment is not set
            // 2. Lead is not opted out (new leads won't be, but guard anyway)
            if (!skip_sequence_enrollment) {
                try {
                    const sequences = await base44.asServiceRole.entities.EmailSequence.filter({
                        trigger_type: 'signup',
                        active: true
                    });
                    
                    if (sequences.length > 0) {
                        await base44.asServiceRole.functions.invoke('enrollUserInSequence', {
                            user_email: email,
                            sequence_id: sequences[0].id,
                            metadata: { lead_id: newLead.id, source: effectiveSource }
                        });
                    }
                } catch (err) {
                    console.error('Failed to enroll in sequence:', err);
                }
            }

            return Response.json({ 
                success: true, 
                lead_id: newLead.id,
                is_new: true 
            });
        }

    } catch (error) {
        console.error('Create/update lead error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

// Lead scoring algorithm
function calculateLeadScore(lead) {
    let score = 50;

    const sourceScores = {
        referral: 15,
        masterclass: 10,
        lead_magnet: 8,
        paid_ad: 5,
        organic_search: 8,
        social_media: 5,
        website: 5,
        contact_form: 7,
        email_campaign: 7
    };
    score += sourceScores[lead.source] || 0;

    if (lead.interested_products && lead.interested_products.length > 0) {
        score += Math.min(lead.interested_products.length * 5, 15);
    }

    if (lead.phone) score += 10;
    if (lead.budget_range) score += 10;

    const timelineScores = {
        immediate: 20,
        '1-3_months': 15,
        '3-6_months': 10,
        '6+_months': 5,
        'not_sure': 0
    };
    score += timelineScores[lead.timeline] || 0;

    return Math.min(Math.max(score, 0), 100);
}