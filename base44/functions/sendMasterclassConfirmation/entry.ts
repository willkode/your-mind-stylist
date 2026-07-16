import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // This is a public endpoint — no auth required

    let body;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const { email, full_name } = body;

    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    // Create or update MasterclassSignup record
    try {
      const existing = await base44.asServiceRole.entities.MasterclassSignup.filter({ email });
      if (existing.length === 0) {
        await base44.asServiceRole.entities.MasterclassSignup.create({
          email,
          full_name: full_name || '',
          confirmation_sent: false,
          source: 'free_masterclass_page'
        });
      }
    } catch (e) {
      console.log('MasterclassSignup upsert failed (non-critical):', e.message);
    }

    const masterclassUrl = 'https://yourmindstylist.com/masterclass';

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const htmlBody = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; font-family: Georgia, serif;">
  <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background-color: #F9F5EF;">
    <div style="background-color: #1E3A32; padding: 40px 30px; text-align: center;">
      <h1 style="color: #F9F5EF; font-size: 24px; margin: 0 0 10px 0; font-weight: normal;">Roberta Fernandez</h1>
      <p style="color: #D8B46B; font-size: 14px; letter-spacing: 2px; margin: 0; text-transform: uppercase;">The Mind Stylist</p>
    </div>
    <div style="padding: 50px 30px; background-color: #FFFFFF;">
      <h2 style="font-size: 28px; color: #1E3A32; margin-bottom: 20px; font-family: Georgia, serif;">Your Free Masterclass is Ready</h2>
      <p style="font-size: 16px; color: #2B2725; line-height: 1.6; margin-bottom: 20px;">Hi ${full_name || 'there'},</p>
      <p style="font-size: 16px; color: #2B2725; line-height: 1.6; margin-bottom: 20px;">Thank you for signing up. Your masterclass on imposter syndrome is ready to watch.</p>
      <p style="font-size: 16px; color: #2B2725; line-height: 1.6; margin-bottom: 30px;">In this session, we'll explore what's really happening beneath those feelings of "I'm not enough" — and how to start shifting the patterns that keep you stuck.</p>
      <div style="text-align: center; margin: 40px 0;">
        <a href="${masterclassUrl}" style="display: inline-block; padding: 16px 40px; background-color: #1E3A32; color: #F9F5EF; text-decoration: none; font-size: 14px; letter-spacing: 1px; text-transform: uppercase;">Watch the Masterclass</a>
      </div>
      <div style="border-left: 3px solid #D8B46B; padding-left: 20px; margin-top: 40px;">
        <p style="font-size: 16px; color: #2B2725; line-height: 1.6; font-style: italic; margin: 0;">"Awareness is always the first step. Simply noticing these patterns — without judgment — is the beginning of transformation."</p>
      </div>
    </div>
    <div style="padding: 30px; background-color: #F9F5EF; text-align: center; border-top: 1px solid #E4D9C4;">
      <p style="font-size: 14px; color: #2B2725; opacity: 0.7; margin: 0 0 10px 0;">Questions? Reply to this email or contact us at roberta@yourmindstylist.com</p>
      <p style="font-size: 12px; color: #2B2725; opacity: 0.5; margin: 0;">© 2025 The Mind Stylist. Las Vegas, NV</p>
    </div>
  </div>
</body>
</html>`;

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: 'Roberta Fernandez <roberta@yourmindstylist.com>',
        to: [email],
        subject: 'Your Free Masterclass is Ready to Watch',
        html: htmlBody
      })
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      console.error('Resend error:', errText);
      throw new Error(`Failed to send email: ${errText}`);
    }

    // Update signup record
    const signups = await base44.asServiceRole.entities.MasterclassSignup.filter({ email });
    if (signups.length > 0) {
      await base44.asServiceRole.entities.MasterclassSignup.update(signups[0].id, {
        confirmation_sent: true
      });
    }

    // Add to MailerLite masterclass automation
    try {
      const apiKey = Deno.env.get('MAILERLITE_API_KEY');
      if (apiKey) {
        await fetch('https://connect.mailerlite.com/api/subscribers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            email,
            fields: {
              name: full_name || '',
              masterclass_signup_date: new Date().toISOString()
            }
          })
        });
      }
    } catch (mlError) {
      console.log('MailerLite sync failed (non-critical):', mlError.message);
    }

    // Add to CRM as lead via centralized pipeline pattern (Phase 5A)
    // Inline implementation matching createOrUpdateLead logic since
    // function-to-function invoke is unreliable from public endpoints.
    try {
      const leadSource = 'free_masterclass';
      const existingLeads = await base44.asServiceRole.entities.Lead.filter({ email });

      if (existingLeads.length > 0) {
        const lead = existingLeads[0];
        const updates = {};

        // Only fill in name if not already set
        if ((full_name) && !lead.full_name) updates.full_name = full_name;

        // Append source to sources array (no duplicates)
        const currentSources = lead.sources || (lead.source ? [lead.source] : []);
        if (!currentSources.includes(leadSource)) {
          updates.sources = [...currentSources, leadSource];
        }
        if (!lead.source) updates.source = leadSource;

        // Consent: only upgrade, never downgrade
        if (!lead.email_consent) {
          updates.email_consent = true;
          updates.consent_given_at = new Date().toISOString();
        }

        // GUARD: Do NOT reset archived status or clear opted_out_at
        if (Object.keys(updates).length > 0) {
          await base44.asServiceRole.entities.Lead.update(lead.id, updates);
        }

        await base44.asServiceRole.entities.LeadActivity.create({
          lead_id: lead.id,
          activity_type: 'form_submitted',
          description: `Lead information updated (source: ${leadSource})`
        });
      } else {
        const newLead = await base44.asServiceRole.entities.Lead.create({
          email,
          full_name: full_name || '',
          source: leadSource,
          sources: [leadSource],
          stage: 'new',
          email_consent: true,
          consent_given_at: new Date().toISOString(),
          tags: []
        });

        await base44.asServiceRole.entities.LeadActivity.create({
          lead_id: newLead.id,
          activity_type: 'form_submitted',
          description: `New lead created (source: ${leadSource})`
        });
      }
    } catch (crmError) {
      console.error('Failed to add to CRM (non-critical):', crmError.message);
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});