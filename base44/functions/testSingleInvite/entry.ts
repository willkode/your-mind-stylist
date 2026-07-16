import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * SINGLE-USER INVITE TEST
 * Tests the complete invite + pending-access flow for one email.
 * NOT for production use. Does not count toward migration batch.
 */

const RESEND_FROM = 'Roberta Fernandez <roberta@yourmindstylist.com>';
const TEST_BATCH_ID = 'invite-test-single-user';

const BRANDED_SUBJECT = 'Your Mind Stylist / Pocket Mindset access from Roberta Fernandez';

function buildBrandedBody(email, firstName) {
  const displayName = firstName || email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const innerHtml = `
    <p style="font-family: Georgia, serif; color: #1E3A32; font-size: 18px; margin: 0 0 20px;">Hi ${displayName},</p>

    <p style="color: #2B2725; font-size: 15px; line-height: 1.8; margin: 0 0 16px;">I promise that you know me!</p>

    <p style="color: #2B2725; font-size: 15px; line-height: 1.8; margin: 0 0 16px;">You've either been a client of FARE Hypnosis, used Conscious Napping&reg;, been a student, or have some other connection to me.</p>

    <p style="color: #2B2725; font-size: 15px; line-height: 1.8; margin: 0 0 16px;">I am rebranding to better reflect the evolution of FARE Hypnosis and Conscious Napping&reg;.</p>

    <p style="color: #2B2725; font-size: 15px; line-height: 1.8; margin: 0 0 16px;">The new name is <strong>Your Mind Stylist</strong> and the app is now <strong>Pocket Mindset</strong>.</p>

    <p style="color: #2B2725; font-size: 15px; line-height: 1.8; margin: 0 0 16px;">Over the past 15 years, you may have received only one or two emails from me. This will not change, as I now have a non-intrusive way for you to continue our work or to reengage with me:</p>

    <p style="color: #1E3A32; font-size: 16px; line-height: 1.8; margin: 0 0 16px; font-weight: 600;">Your new personalized dashboard has been set up and is waiting for you!</p>

    <p style="color: #2B2725; font-size: 15px; line-height: 1.8; margin: 0 0 16px;">It is fun, has freebies to be added regularly, and offers other ways to engage with my services and content.</p>

    <p style="color: #2B2725; font-size: 15px; line-height: 1.8; margin: 0 0 24px;">All you have to do is click the link in this email and set up a password. Then have fun continuing to restyle your life.</p>

    <div style="text-align: center; margin: 0 0 24px;">
      <a href="https://yourmindstylist.com/login" style="display: inline-block; background: #1E3A32; color: #F9F5EF; padding: 14px 36px; text-decoration: none; font-size: 14px; letter-spacing: 0.1em; border-radius: 4px; font-weight: 600;">SET UP YOUR ACCOUNT</a>
    </div>

    <p style="color: #2B2725; font-size: 13px; line-height: 1.6; margin: 0 0 8px; opacity: 0.7;">(Use <strong>${email}</strong> — the email this message was sent to.)</p>

    <p style="color: #2B2725; font-size: 13px; line-height: 1.6; margin: 0 0 24px; opacity: 0.7;">You may also receive a separate account setup email from Your Mind Stylist — that's from us too. Please use that link if prompted to create your login.</p>

    <p style="color: #2B2725; font-size: 15px; line-height: 1.8; margin: 0 0 8px;">As always, feel free to reach out any time,</p>

    <p style="color: #1E3A32; font-size: 15px; font-weight: 500; margin: 0;">Roberta Fernandez</p>
    <p style="color: #6E4F7D; font-size: 13px; margin: 4px 0 0;">Your Mind Stylist</p>`;

  // Wrap in brand shell
  return `<div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #F9F5EF; padding: 0;">
  <div style="text-align: center; padding: 32px 24px 16px;">
    <img src="https://media.base44.com/images/public/693a98b3e154ab3b36c88ebb/a5bb69af7_your-mind-stylist-horizontal-fin.png" alt="Your Mind Stylist" style="height: 60px; width: auto;" />
  </div>
  <div style="background: white; border-radius: 12px; margin: 0 24px; padding: 32px 28px; border: 1px solid #E4D9C4;">
    ${innerHtml}
  </div>
  <div style="text-align: center; padding: 24px; color: #2B2725; opacity: 0.5; font-size: 12px;">
    <p style="margin: 0;">&copy; ${new Date().getFullYear()} Your Mind Stylist &middot; Las Vegas, NV</p>
    <p style="margin: 4px 0 0;"><a href="https://yourmindstylist.com" style="color: #6E4F7D;">yourmindstylist.com</a></p>
  </div>
</div>`;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') {
    return Response.json({ error: 'Admin only' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const testEmail = (body.email || '').toLowerCase().trim();
  
  if (!testEmail) {
    return Response.json({ error: 'email is required' }, { status: 400 });
  }

  const nowISO = new Date().toISOString();
  const results = {
    test_email: testEmail,
    steps: {},
    email_logs: [],
  };

  // ── STEP 1: Create or update test Lead record ───────────────────────
  console.log(`[testSingleInvite] Step 1: Create/update Lead for ${testEmail}`);
  
  const existingLeads = await base44.asServiceRole.entities.Lead.filter({ email: testEmail });
  let lead;
  
  const pendingGrants = [
    {
      action_type: 'grant_product',
      platform_item_name: 'Cleaning Out Your Closet™',
      product_id: null, // Will be resolved below
      csv_purchase_text: 'Cleaning Out Your Closet™',
      confidence: 'exact',
      protected: false,
      status: 'pending',
      migration_batch_id: TEST_BATCH_ID,
    }
  ];

  // Resolve product ID for Cleaning Out Your Closet
  const allProducts = await base44.asServiceRole.entities.Product.list('-created_date', 100);
  const cotcProduct = allProducts.find(p => 
    p.name?.includes('Cleaning Out Your Closet') && !p.name?.includes('Bundle')
  );
  if (cotcProduct) {
    pendingGrants[0].product_id = cotcProduct.id;
    console.log(`[testSingleInvite] Resolved COTC product: ${cotcProduct.name} (${cotcProduct.id})`);
  }

  if (existingLeads.length > 0) {
    lead = existingLeads[0];
    // Update with test metadata
    await base44.asServiceRole.entities.Lead.update(lead.id, {
      what_they_bought: 'Cleaning Out Your Closet™',
      source: 'other',
      sources: [...(lead.sources || []), 'Migration Test'],
      tags: [...(lead.tags || []).filter(t => t !== 'invite-test'), 'invite-test'],
      pending_access_grants: pendingGrants,
      notes: `${lead.notes || ''}\n[${new Date().toLocaleDateString()}] Single invite test — migration flow validation`.trim(),
    });
    lead = { ...lead, pending_access_grants: pendingGrants };
    results.steps.lead = { action: 'updated_existing', lead_id: lead.id, email: testEmail };
  } else {
    lead = await base44.asServiceRole.entities.Lead.create({
      email: testEmail,
      first_name: 'Indy',
      last_name: 'Test',
      full_name: 'Indy Test',
      source: 'other',
      sources: ['Migration Test'],
      stage: 'qualified',
      lead_status: 'active',
      invite_status: 'not_invited',
      what_they_bought: 'Cleaning Out Your Closet™',
      tags: ['invite-test'],
      pending_access_grants: pendingGrants,
      notes: `[${new Date().toLocaleDateString()}] Single invite test — migration flow validation`,
      migration_batch_id: TEST_BATCH_ID,
    });
    results.steps.lead = { action: 'created_new', lead_id: lead.id, email: testEmail };
  }
  console.log(`[testSingleInvite] Lead ready: ${lead.id}`);

  // ── STEP 2: Check if User already exists ────────────────────────────
  const existingUsers = await base44.asServiceRole.entities.User.filter({ email: testEmail });
  const userExists = existingUsers.length > 0;
  results.steps.user_check = { user_exists: userExists, user_id: userExists ? existingUsers[0].id : null };
  console.log(`[testSingleInvite] User exists: ${userExists}`);

  // ── STEP 3: Send branded pre-invite email via Resend ────────────────
  console.log(`[testSingleInvite] Step 3: Sending branded email...`);
  
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  let brandedEmailSent = false;
  let brandedEmailError = null;
  let brandedEmailLogId = null;

  const brandedBody = buildBrandedBody(testEmail, lead.first_name || 'Indy');

  if (!RESEND_API_KEY) {
    brandedEmailError = 'RESEND_API_KEY not configured';
  } else {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [testEmail],
        subject: BRANDED_SUBJECT,
        html: brandedBody,
      }),
    });

    const resendData = await resendRes.json();
    if (!resendRes.ok) {
      brandedEmailError = resendData.message || JSON.stringify(resendData);
      console.error('[testSingleInvite] Resend error:', brandedEmailError);
    } else {
      brandedEmailSent = true;
      console.log('[testSingleInvite] Branded email sent, Resend ID:', resendData.id);
    }
  }

  // Log branded email
  const brandedLog = await base44.asServiceRole.entities.EmailSendLog.create({
    recipient_email: testEmail,
    recipient_name: lead.full_name || 'Indy Test',
    subject: BRANDED_SUBJECT,
    email_type: 'invite',
    send_type: 'individual',
    provider: 'resend',
    status: brandedEmailSent ? 'sent' : 'failed',
    error_message: brandedEmailError || undefined,
    sent_by: user.email,
    campaign_subject: 'Migration invite test — single user',
  });
  brandedEmailLogId = brandedLog.id;
  results.steps.branded_email = { sent: brandedEmailSent, error: brandedEmailError, log_id: brandedEmailLogId };

  // ── STEP 4: Trigger Base44 system invite ────────────────────────────
  console.log(`[testSingleInvite] Step 4: Triggering Base44 inviteUser...`);
  
  let systemInviteSent = false;
  let systemInviteError = null;
  let systemInviteLogId = null;

  if (userExists) {
    systemInviteError = 'User already exists — skipping system invite';
    console.log('[testSingleInvite]', systemInviteError);
  } else {
    try {
      const inviteResult = await base44.users.inviteUser(testEmail, 'user');
      systemInviteSent = true;
      console.log('[testSingleInvite] System invite sent. Return type:', typeof inviteResult);
    } catch (e) {
      systemInviteError = e.message;
      console.error('[testSingleInvite] System invite error:', systemInviteError);
      // If "already invited" that's actually fine
      if (systemInviteError?.toLowerCase().includes('already')) {
        systemInviteSent = true; // treat as success
        systemInviteError = `Already invited (non-fatal): ${systemInviteError}`;
      }
    }
  }

  // Log system invite
  const systemLog = await base44.asServiceRole.entities.EmailSendLog.create({
    recipient_email: testEmail,
    recipient_name: lead.full_name || 'Indy Test',
    subject: 'Account setup invitation (Base44 system)',
    email_type: 'invite',
    send_type: 'automated',
    provider: 'system',
    status: systemInviteSent ? 'sent' : 'failed',
    error_message: systemInviteError || undefined,
    sent_by: user.email,
    campaign_subject: 'Migration invite test — single user',
  });
  systemInviteLogId = systemLog.id;
  results.steps.system_invite = { sent: systemInviteSent, error: systemInviteError, log_id: systemInviteLogId };

  // ── STEP 5: Update Lead with invite status ──────────────────────────
  const anySuccess = brandedEmailSent || systemInviteSent;
  if (anySuccess) {
    await base44.asServiceRole.entities.Lead.update(lead.id, {
      invite_status: 'invited',
      invite_sent_at: nowISO,
      last_contact_date: nowISO,
      stage: 'qualified',
    });
    results.steps.lead_update = { invite_status: 'invited', invite_sent_at: nowISO };
  } else {
    results.steps.lead_update = { invite_status: 'not_invited', reason: 'Both email methods failed' };
  }

  // ── SUMMARY ─────────────────────────────────────────────────────────
  results.summary = {
    lead_id: lead.id,
    branded_email_log_id: brandedEmailLogId,
    system_invite_log_id: systemInviteLogId,
    branded_email_sent: brandedEmailSent,
    system_invite_sent: systemInviteSent,
    user_already_existed: userExists,
    pending_access_grants: pendingGrants.length,
    pending_access_items: pendingGrants.map(g => g.platform_item_name),
    email_subject_used: BRANDED_SUBJECT,
    test_batch_id: TEST_BATCH_ID,
    note: 'This is a single-user test. NOT counted in production migration batch.',
  };

  // Include the actual HTML for review
  results.email_body_html = brandedBody;

  console.log('[testSingleInvite] Complete:', JSON.stringify(results.summary));
  return Response.json(results);
});