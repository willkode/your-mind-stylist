import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * correctedResendBatch1
 * 
 * Corrected resend campaign for the original prod-batch-1 recipients.
 * 
 * Modes:
 *   - dry_run: true  → preview eligible recipients, no sends
 *   - test_only: "email@example.com" → send single test email, no lead updates
 *   - (default)  → send corrected email to all eligible prod-batch-1 recipients
 * 
 * Eligibility for resend:
 *   - Must have tag: prod-batch-1
 *   - Must NOT have: lead_status=archived, tag=opted_out, opted_out_at set
 *   - Must NOT have: invite_status=accepted
 *   - Must NOT be a registered User already
 * 
 * On send:
 *   - Tags recipient with: corrected_resend_batch_1
 *   - Appends note with timestamp
 *   - Logs to EmailSendLog
 *   - Does NOT change invite_status (they were already invited)
 */

const RESEND_FROM = 'Roberta Fernandez <roberta@yourmindstylist.com>';

function buildCorrectedBody(lead) {
  const name = lead.first_name || lead.email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return `<p style="font-family: Georgia, serif; color: #1E3A32; font-size: 18px; margin: 0 0 16px;">Hi ${name},</p>
    <p style="color: #6E4F7D; font-size: 14px; line-height: 1.6; margin: 0 0 20px; font-style: italic;">You may have received an earlier message from us with a different introduction as we finalized the transition to Your Mind Stylist and Pocket Mindset. I wanted to personally resend the correct welcome message below.</p>
    <p style="color: #2B2725; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">I promise that you know me!</p>
    <p style="color: #2B2725; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">You've either been a client of FARE Hypnosis, used Conscious Napping&reg;, been a student, or have some other connection to me.</p>
    <p style="color: #2B2725; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">I am rebranding to better reflect the evolution of FARE Hypnosis and Conscious Napping&reg;.</p>
    <p style="color: #2B2725; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">The new name is <strong>Your Mind Stylist</strong>, and the app is now <strong>Pocket Mindset</strong>.</p>
    <p style="color: #2B2725; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">Over the past 15 years, you may have received only one or 2 emails from me. This will not change, as I now have a non-intrusive way for you to continue our work or to re-engage with me:</p>
    <p style="color: #1E3A32; font-size: 16px; line-height: 1.7; margin: 0 0 16px; font-weight: 600;">Your new personalized dashboard has been set up and is waiting for you!</p>
    <p style="color: #2B2725; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">It is fun, has freebies (to be added regularly!), and other ways to engage with my services and content.</p>
    <p style="color: #2B2725; font-size: 15px; line-height: 1.7; margin: 0 0 8px;">All you have to do is click the link in this email and set up a password. Then have fun continuing to restyle your life.</p>
    <p style="color: #2B2725; font-size: 13px; line-height: 1.6; margin: 0 0 24px; opacity: 0.7;">(Use <strong>${lead.email}</strong> — the email this message was sent to.)</p>
    <div style="text-align: center; margin: 0 0 12px;">
      <a href="https://yourmindstylist.com/register" style="display: inline-block; background: #1E3A32; color: #F9F5EF; padding: 14px 36px; text-decoration: none; font-size: 14px; letter-spacing: 0.1em; border-radius: 4px;">SET UP YOUR PASSWORD</a>
    </div>
    <p style="color: #2B2725; font-size: 13px; line-height: 1.5; margin: 0 0 24px; text-align: center; opacity: 0.6;">If you already created your password, you can simply <a href="https://yourmindstylist.com/login" style="color: #6E4F7D; text-decoration: underline;">log in</a>.</p>
    <p style="color: #2B2725; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">As always, feel free to reach out any time,</p>
    <p style="color: #1E3A32; font-size: 15px; font-weight: 500; margin: 0;">Roberta Fernandez</p>
    <p style="color: #6E4F7D; font-size: 14px; margin: 4px 0 0;">Your Mind Stylist</p>
    <p style="color: #2B2725; font-size: 13px; margin: 4px 0 0; opacity: 0.7;">Online Anywhere or Las Vegas, NV</p>`;
}

function wrapInBrandShell(innerHtml) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Mind Stylist</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F9F5EF; font-family: 'Inter', Arial, Helvetica, sans-serif; -webkit-font-smoothing: antialiased;">
<div style="max-width: 600px; margin: 0 auto; background: #F9F5EF; padding: 0;">
  <div style="text-align: center; padding: 32px 24px 16px;">
    <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693a98b3e154ab3b36c88ebb/7d5c32b99_Mind-stylist-dark-icon2x.png" alt="Your Mind Stylist" style="height: 60px; width: auto;" />
  </div>
  <div style="background: white; border-radius: 12px; margin: 0 24px; padding: 32px 28px; border: 1px solid #E4D9C4;">
    ${innerHtml}
  </div>
  <div style="text-align: center; padding: 24px; color: #2B2725; opacity: 0.5; font-size: 12px;">
    <p style="margin: 0;">&copy; ${new Date().getFullYear()} Your Mind Stylist &middot; Las Vegas, NV</p>
    <p style="margin: 4px 0 0;"><a href="https://yourmindstylist.com" style="color: #6E4F7D;">yourmindstylist.com</a></p>
  </div>
</div>
</body>
</html>`;
}

const SUBJECT = 'Your Mind Stylist — Your Personal Dashboard Is Ready';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const caller = await base44.auth.me();
  if (caller?.role !== 'admin') {
    return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const dryRun = body.dry_run === true;
  const testOnly = body.test_only || null; // email address for single test send

  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  if (!RESEND_API_KEY && !dryRun) {
    return Response.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // MODE: Test-only — send a single email to specified address
  // ═══════════════════════════════════════════════════════════════════════
  if (testOnly) {
    const testLead = {
      email: testOnly,
      first_name: 'Test',
    };
    const innerHtml = buildCorrectedBody(testLead);
    const fullHtml = wrapInBrandShell(innerHtml);

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [testOnly],
        subject: SUBJECT,
        html: fullHtml,
      }),
    });
    const resendData = await resendRes.json();

    // Log test send
    await base44.asServiceRole.entities.EmailSendLog.create({
      recipient_email: testOnly,
      recipient_name: 'Test Send',
      subject: SUBJECT,
      email_type: 'invite',
      send_type: 'individual',
      provider: 'resend',
      status: resendRes.ok ? 'sent' : 'failed',
      error_message: resendRes.ok ? undefined : (resendData.message || JSON.stringify(resendData)),
      sent_by: caller.email,
      campaign_subject: 'Corrected Resend Batch 1 — TEST',
    });

    return Response.json({
      status: 'test_sent',
      to: testOnly,
      subject: SUBJECT,
      cta_url: 'https://yourmindstylist.com/register',
      resend_success: resendRes.ok,
      resend_response: resendData,
      logo: 'dark logo (Mind-stylist-dark-icon2x.png)',
      includes_login_note: true,
      includes_correction_paragraph: true,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Fetch Users (to exclude already-registered)
  // ═══════════════════════════════════════════════════════════════════════
  const allUsers = await base44.asServiceRole.entities.User.list();
  const userEmailSet = new Set(allUsers.map(u => u.email?.toLowerCase()).filter(Boolean));

  // ═══════════════════════════════════════════════════════════════════════
  // Fetch all Leads and filter to prod-batch-1 eligible for resend
  // ═══════════════════════════════════════════════════════════════════════
  const allLeads = [];
  let page = await base44.asServiceRole.entities.Lead.list('-created_date', 50);
  while (page.length > 0) {
    allLeads.push(...page);
    if (page.length < 50) break;
    page = await base44.asServiceRole.entities.Lead.list('-created_date', 50, allLeads.length);
  }

  const eligible = [];
  const excluded = { reasons: {} };
  const excludedDetail = [];

  function excl(email, reason) {
    excluded.reasons[reason] = (excluded.reasons[reason] || 0) + 1;
    excludedDetail.push({ email, reason });
  }

  for (const lead of allLeads) {
    const email = (lead.email || '').toLowerCase().trim();
    const tags = lead.tags || [];

    // Must be in original batch
    if (!tags.includes('prod-batch-1')) continue;

    // Exclusions
    if (lead.lead_status === 'archived') { excl(email, 'archived'); continue; }
    if (tags.includes('opted_out')) { excl(email, 'opted_out'); continue; }
    if (lead.opted_out_at) { excl(email, 'opted_out_timestamp'); continue; }
    if (lead.invite_status === 'accepted') { excl(email, 'already_accepted'); continue; }
    if (userEmailSet.has(email)) { excl(email, 'already_registered'); continue; }
    if (tags.includes('corrected_resend_batch_1')) { excl(email, 'already_resent'); continue; }

    eligible.push(lead);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // DRY RUN
  // ═══════════════════════════════════════════════════════════════════════
  if (dryRun) {
    return Response.json({
      status: 'dry_run',
      subject: SUBJECT,
      cta_url: 'https://yourmindstylist.com/register',
      total_prod_batch_1_leads: allLeads.filter(l => (l.tags || []).includes('prod-batch-1')).length,
      eligible_for_resend: eligible.length,
      excluded_reasons: excluded.reasons,
      excluded_detail: excludedDetail,
      eligible_list: eligible.map(l => ({
        email: l.email,
        name: `${l.first_name || ''} ${l.last_name || ''}`.trim(),
      })),
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // LIVE SEND
  // ═══════════════════════════════════════════════════════════════════════
  if (eligible.length === 0) {
    return Response.json({
      status: 'no_eligible_recipients',
      excluded_reasons: excluded.reasons,
    });
  }

  const nowISO = new Date().toISOString();
  const results = [];

  for (const lead of eligible) {
    const email = lead.email.toLowerCase().trim();
    const result = { email, name: `${lead.first_name || ''} ${lead.last_name || ''}`.trim(), sent: false, error: null };

    const innerHtml = buildCorrectedBody(lead);
    const fullHtml = wrapInBrandShell(innerHtml);

    try {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: RESEND_FROM,
          to: [email],
          subject: SUBJECT,
          html: fullHtml,
        }),
      });
      const resendData = await resendRes.json();

      if (!resendRes.ok) {
        result.error = resendData.message || JSON.stringify(resendData);
      } else {
        result.sent = true;
      }

      await base44.asServiceRole.entities.EmailSendLog.create({
        recipient_email: email,
        recipient_name: result.name,
        subject: SUBJECT,
        email_type: 'resend_invite',
        send_type: 'mass_campaign',
        provider: 'resend',
        status: result.sent ? 'sent' : 'failed',
        error_message: result.error || undefined,
        sent_by: caller.email,
        campaign_subject: 'Corrected Resend Batch 1',
      });
    } catch (err) {
      result.error = err.message;
    }

    // Update lead: tag + note (only on success)
    if (result.sent) {
      const existingTags = lead.tags || [];
      const dateStr = new Date().toLocaleDateString();
      const existingNotes = lead.notes || '';
      await base44.asServiceRole.entities.Lead.update(lead.id, {
        tags: existingTags.includes('corrected_resend_batch_1') ? existingTags : [...existingTags, 'corrected_resend_batch_1'],
        last_contact_date: nowISO,
        notes: `${existingNotes}\n[${dateStr}] Corrected resend email sent (updated copy + login note)`.trim(),
      });
    }

    results.push(result);
    await new Promise(r => setTimeout(r, 300));
  }

  const sentCount = results.filter(r => r.sent).length;
  const failedCount = results.filter(r => !r.sent).length;

  return Response.json({
    status: 'corrected_resend_complete',
    subject: SUBJECT,
    cta_url: 'https://yourmindstylist.com/register',
    timestamp: nowISO,
    summary: {
      total_prod_batch_1: allLeads.filter(l => (l.tags || []).includes('prod-batch-1')).length,
      eligible_for_resend: eligible.length,
      emails_sent: sentCount,
      emails_failed: failedCount,
    },
    excluded_reasons: excluded.reasons,
    results: results,
  });
});