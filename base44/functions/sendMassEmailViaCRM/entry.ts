import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { subject, body, attachments = [], filters, useMailerLite = true, groupId } = await req.json();

    if (!subject || !body) {
      return Response.json({ error: 'Subject and body are required' }, { status: 400 });
    }

    const MAILERLITE_API_KEY = Deno.env.get('MAILERLITE_API_KEY');

    // Fetch leads with applied filters
    let leads = await base44.asServiceRole.entities.Lead.list('', 500);

    if (filters?.tags && filters.tags.length > 0) {
      leads = leads.filter(lead =>
        filters.tags.some(tag => lead.tags?.includes(tag))
      );
    }
    if (filters?.stages && filters.stages.length > 0) {
      leads = leads.filter(lead => filters.stages.includes(lead.stage));
    }
    if (filters?.sources && filters.sources.length > 0) {
      leads = leads.filter(lead => filters.sources.includes(lead.source));
    }

    const validLeads = leads.filter(l => l.email);

    if (validLeads.length === 0) {
      return Response.json({ error: 'No leads match the selected filters' }, { status: 400 });
    }

    // ── MailerLite path: sync recipients → create campaign → send ──
    if (useMailerLite && MAILERLITE_API_KEY) {
      console.log(`[MailerLite] Syncing ${validLeads.length} recipients...`);

      // Step 1: Determine or create a temporary send group
      let targetGroupId = groupId;

      if (!targetGroupId) {
        const groupName = `Campaign: ${subject.substring(0, 40)} (${new Date().toISOString().split('T')[0]})`;
        const createGroupRes = await fetch('https://connect.mailerlite.com/api/groups', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${MAILERLITE_API_KEY}`,
          },
          body: JSON.stringify({ name: groupName })
        });
        const groupData = await createGroupRes.json();
        if (!createGroupRes.ok) {
          console.error('Group creation failed:', groupData);
          return Response.json({ error: 'Failed to create MailerLite group', details: groupData }, { status: 500 });
        }
        targetGroupId = groupData.data.id;
        console.log(`[MailerLite] Created temp group: ${targetGroupId}`);
      }

      // Step 2: Sync all filtered leads as subscribers and add to group
      let syncedCount = 0;
      const batchSize = 10;
      for (let i = 0; i < validLeads.length; i += batchSize) {
        const batch = validLeads.slice(i, i + batchSize);
        const results = await Promise.allSettled(
          batch.map(async (lead) => {
            const subRes = await fetch('https://connect.mailerlite.com/api/subscribers', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MAILERLITE_API_KEY}`,
              },
              body: JSON.stringify({
                email: lead.email,
                fields: {
                  name: lead.full_name || lead.first_name || '',
                  last_name: lead.last_name || '',
                  phone: lead.phone || '',
                },
                groups: [targetGroupId],
              })
            });
            if (subRes.ok) syncedCount++;
            return subRes;
          })
        );
        if (i + batchSize < validLeads.length) {
          await new Promise(r => setTimeout(r, 300));
        }
      }

      console.log(`[MailerLite] Synced ${syncedCount}/${validLeads.length} subscribers`);

      // Step 3: Build the branded HTML for MailerLite campaign
      const year = new Date().getFullYear();
      const attachHtml = attachments.length > 0
        ? '<div style="padding:16px 28px;border-top:1px solid #E4D9C4;"><p style="font-size:14px;color:#2B2725;margin:0 0 8px;"><strong>Attachments:</strong></p>' +
          attachments.map(att => '<p style="margin:4px 0;"><a href="' + att.url + '" style="color:#1E3A32;text-decoration:underline;">' + att.name + '</a></p>').join('') +
          '</div>'
        : '';

      const brandedHtml = '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>' +
        '<body style="margin:0;padding:0;font-family:Georgia,serif;background-color:#F9F5EF;">' +
        '<div style="max-width:600px;margin:0 auto;background:#ffffff;">' +
        '<div style="background:#1E3A32;padding:28px 24px;text-align:center;">' +
        '<h2 style="color:#D8B46B;margin:0;font-size:18px;letter-spacing:2px;font-family:Georgia,serif;">YOUR MIND STYLIST</h2>' +
        '<p style="color:#F9F5EF;margin:4px 0 0;font-size:12px;font-family:Arial,sans-serif;">Roberta Fernandez</p></div>' +
        '<div style="padding:36px 28px;color:#2B2725;font-size:16px;line-height:1.7;">' + body + '</div>' +
        attachHtml +
        '<div style="background:#1E3A32;padding:20px 24px;text-align:center;">' +
        '<p style="color:#F9F5EF;font-size:11px;margin:0;">\u00A9 ' + year + ' Your Mind Stylist. All rights reserved.</p>' +
        '<p style="color:#F9F5EF;font-size:11px;margin:4px 0 0;">8724 Spanish Ridge Ave #B, Las Vegas, NV 89148</p>' +
        '<p style="margin:8px 0 0;"><a href="{$unsubscribe}" style="color:#D8B46B;font-size:11px;">Unsubscribe</a></p>' +
        '</div></div></body></html>';

      // Step 4: Create the campaign
      const campaignRes = await fetch('https://connect.mailerlite.com/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MAILERLITE_API_KEY}`,
        },
        body: JSON.stringify({
          name: subject + ' \u2014 ' + new Date().toLocaleDateString(),
          type: 'regular',
          emails: [{
            subject,
            from_name: 'Roberta Fernandez',
            from: 'roberta@yourmindstylist.com',
            content: brandedHtml,
          }],
          groups: [targetGroupId],
        })
      });

      const campaignData = await campaignRes.json();
      if (!campaignRes.ok) {
        console.error('Campaign creation failed:', campaignData);
        return Response.json({ error: 'Failed to create MailerLite campaign', details: campaignData }, { status: 500 });
      }

      const campaignId = campaignData.data.id;
      console.log(`[MailerLite] Campaign created: ${campaignId}`);

      // Step 5: Schedule or send the campaign immediately
      const scheduleRes = await fetch('https://connect.mailerlite.com/api/campaigns/' + campaignId + '/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MAILERLITE_API_KEY}`,
        },
        body: JSON.stringify({
          delivery: 'instant',
        })
      });

      const scheduleData = await scheduleRes.json();
      if (!scheduleRes.ok) {
        console.error('Campaign scheduling failed:', scheduleData);
        return Response.json({
          success: true,
          partial: true,
          message: 'Campaign created but failed to send. Check MailerLite dashboard.',
          campaignId,
          recipientCount: syncedCount,
        });
      }

      console.log(`[MailerLite] Campaign sent to ${syncedCount} recipients`);

      // Log to EmailSendLog for analytics
      try {
        await base44.asServiceRole.entities.EmailSendLog.create({
          recipient_email: validLeads[0]?.email || 'bulk',
          recipient_name: syncedCount + ' recipients',
          subject,
          send_type: 'mass_campaign',
          method: 'mailerlite',
          campaign_subject: subject,
          recipient_count: syncedCount,
          sent_by: user.email,
        });
      } catch (_) { /* don't fail for logging */ }

      // Log activity
      for (const lead of validLeads.slice(0, 50)) {
        try {
          await base44.asServiceRole.entities.LeadActivity.create({
            lead_id: lead.id,
            activity_type: 'mass_email_sent',
            description: 'MailerLite campaign: "' + subject + '"',
          });
        } catch (e) {
          // Don't fail for logging
        }
      }

      return Response.json({
        success: true,
        method: 'mailerlite',
        recipientCount: syncedCount,
        campaignId,
        message: 'Campaign sent to ' + syncedCount + ' recipients via MailerLite',
      });
    }

    // ── Fallback: Resend path (one-by-one) ──
    console.log(`[Resend] Sending to ${validLeads.length} recipients...`);

    const fallbackAttachHtml = attachments.length > 0
      ? '<div style="padding: 16px 24px; background: #F9F5EF; border-top: 1px solid #E4D9C4;">' +
        '<p style="font-size: 14px; color: #2B2725; margin: 0 0 8px;"><strong>Attachments:</strong></p>' +
        attachments.map(att => '<p style="margin: 4px 0;"><a href="' + att.url + '" style="color: #1E3A32;">' + att.name + '</a></p>').join('') +
        '</div>'
      : '';

    const fullHtml = '<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #2B2725;">' +
      '<div style="background: #1E3A32; padding: 24px; text-align: center;">' +
      '<h2 style="color: #D8B46B; margin: 0; font-size: 18px; letter-spacing: 2px;">YOUR MIND STYLIST</h2>' +
      '<p style="color: #F9F5EF; margin: 4px 0 0; font-size: 12px;">Roberta Fernandez</p></div>' +
      '<div style="padding: 32px 24px; background: #F9F5EF;">' + body + '</div>' +
      fallbackAttachHtml +
      '<div style="background: #1E3A32; padding: 16px 24px; text-align: center;">' +
      '<p style="color: #F9F5EF; font-size: 11px; margin: 0;">\u00A9 ' + new Date().getFullYear() + ' Your Mind Stylist. All rights reserved.</p>' +
      '</div></div>';

    let successCount = 0;
    let failCount = 0;
    const batchSize2 = 5;
    for (let i = 0; i < validLeads.length; i += batchSize2) {
      const batch = validLeads.slice(i, i + batchSize2);
      const results = await Promise.allSettled(
        batch.map(lead =>
          base44.asServiceRole.integrations.Core.SendEmail({
            to: lead.email,
            subject,
            body: fullHtml,
            from_name: 'Roberta Fernandez',
          })
        )
      );
      results.forEach(r => r.status === 'fulfilled' ? successCount++ : failCount++);
      if (i + batchSize2 < validLeads.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Log mass CRM send for analytics
    try {
      await base44.asServiceRole.entities.EmailSendLog.create({
        recipient_email: validLeads[0]?.email || 'bulk',
        recipient_name: successCount + ' recipients',
        subject,
        send_type: 'mass_campaign',
        method: 'resend',
        campaign_subject: subject,
        recipient_count: successCount,
        sent_by: user.email,
      });
    } catch (_) { /* don't fail for logging */ }

    return Response.json({
      success: true,
      method: 'resend',
      recipientCount: successCount,
      failedCount: failCount,
      message: 'Email sent to ' + successCount + ' lead(s) via Resend' + (failCount > 0 ? ', ' + failCount + ' failed' : ''),
    });
  } catch (error) {
    console.error('sendMassEmailViaCRM error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});