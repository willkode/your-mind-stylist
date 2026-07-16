import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const MAILERLITE_API_KEY = Deno.env.get("MAILERLITE_API_KEY");
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead_magnet_id, user_email, user_name, source } = await req.json();

    if (!lead_magnet_id || !user_email || !user_name) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get lead magnet
    const leadMagnets = await base44.asServiceRole.entities.LeadMagnet.filter({ id: lead_magnet_id });
    if (!leadMagnets.length) {
      return Response.json({ error: "Lead magnet not found" }, { status: 404 });
    }
    const leadMagnet = leadMagnets[0];

    if (!leadMagnet.active) {
      return Response.json({ error: "Lead magnet not available" }, { status: 404 });
    }

    // Record download
    const download = await base44.asServiceRole.entities.LeadMagnetDownload.create({
      lead_magnet_id,
      lead_magnet_title: leadMagnet.title,
      user_email,
      user_name,
      source: source || "landing_page",
      mailerlite_synced: false,
      email_sent: false,
    });

    // Update download count
    await base44.asServiceRole.entities.LeadMagnet.update(lead_magnet_id, {
      download_count: (leadMagnet.download_count || 0) + 1,
    });

    // --- Phase 5A: Create or update Lead record ---
    // Uses skip_sequence_enrollment to prevent lead magnet downloads
    // from triggering unrelated welcome email sequences.
    // The lead magnet's own confirmation email (below) is the approved email.
    try {
      await base44.asServiceRole.functions.invoke('createOrUpdateLead', {
        email: user_email,
        full_name: user_name,
        source: 'lead_magnet',
        skip_sequence_enrollment: true,
        email_consent: true,
        consent_given_at: new Date().toISOString(),
      });
    } catch (leadErr) {
      // Non-blocking: download still succeeds even if lead creation fails
      console.error('Lead creation/update failed (non-blocking):', leadErr.message);
    }

    // Sync to MailerLite
    let mailerliteSynced = false;
    if (MAILERLITE_API_KEY && leadMagnet.mailerlite_group_id) {
      try {
        const mlRes = await fetch("https://connect.mailerlite.com/api/subscribers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${MAILERLITE_API_KEY}`,
          },
          body: JSON.stringify({
            email: user_email,
            fields: { name: user_name },
            groups: [leadMagnet.mailerlite_group_id],
          }),
        });
        if (mlRes.ok) mailerliteSynced = true;
      } catch (e) {
        console.error("MailerLite sync error:", e.message);
      }
    }

    // Send confirmation email with download link
    let emailSent = false;
    if (RESEND_API_KEY) {
      try {
        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "Roberta Fernandez <roberta@yourmindstylist.com>",
            to: user_email,
            subject: `Your free download: ${leadMagnet.title}`,
            html: `
              <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #2B2725;">
                <div style="background: #1E3A32; padding: 32px; text-align: center;">
                  <p style="color: #D8B46B; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; margin: 0 0 8px;">Your Mind Stylist</p>
                  <h1 style="color: #F9F5EF; font-size: 24px; margin: 0;">Your Download is Ready</h1>
                </div>
                <div style="padding: 40px 32px;">
                  <p style="font-size: 16px; line-height: 1.7;">Hi ${user_name},</p>
                  <p style="font-size: 16px; line-height: 1.7;">Thank you for downloading <strong>${leadMagnet.title}</strong>. Your file is ready below.</p>
                  <div style="text-align: center; margin: 32px 0;">
                    <a href="${leadMagnet.file_url}" style="background: #1E3A32; color: #F9F5EF; padding: 16px 32px; text-decoration: none; font-size: 14px; letter-spacing: 1px; display: inline-block;">
                      Download Your File →
                    </a>
                  </div>
                  <p style="font-size: 14px; color: #2B2725; opacity: 0.7; line-height: 1.7;">If you have any questions, feel free to reply to this email. I'm here to help.</p>
                  <p style="font-size: 16px; line-height: 1.7;">With warmth,<br><strong>Roberta Fernandez</strong><br><em>Your Mind Stylist</em></p>
                </div>
                <div style="background: #F9F5EF; padding: 24px 32px; text-align: center; border-top: 1px solid #E4D9C4;">
                  <p style="font-size: 12px; color: #2B2725; opacity: 0.5; margin: 0;">© ${new Date().getFullYear()} Your Mind Stylist · Las Vegas, NV</p>
                </div>
              </div>
            `,
          }),
        });
        if (emailRes.ok) emailSent = true;
      } catch (e) {
        console.error("Email send error:", e.message);
      }
    }

    // Update download record
    await base44.asServiceRole.entities.LeadMagnetDownload.update(download.id, {
      mailerlite_synced: mailerliteSynced,
      email_sent: emailSent,
    });

    return Response.json({
      success: true,
      file_url: leadMagnet.file_url,
      title: leadMagnet.title,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});