import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * PATCH-INVITES-DELIVERY-001: Invite Email Delivery Failure
 * 
 * Sends a branded invite email via Resend (works for external addresses)
 * then triggers the Base44 system invite for account setup.
 * Only updates Lead state if at least one mechanism succeeds.
 */

const RESEND_FROM = 'Roberta Fernandez <roberta@yourmindstylist.com>';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins/managers can invite users
    if (user.role !== 'admin' && user.custom_role !== 'manager') {
      return Response.json({ error: 'Forbidden: Only admins and managers can invite users' }, { status: 403 });
    }

    const { email, role = 'user', checkOnly = false, resend = false, brandedSubject, brandedBody } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUsers = await base44.asServiceRole.entities.User.filter({ email: normalizedEmail });
    const userExists = existingUsers.length > 0;

    // If just checking, return early
    if (checkOnly) {
      return Response.json({ userExists });
    }

    if (userExists && !resend) {
      return Response.json({ error: 'User already exists', userExists: true }, { status: 400 });
    }

    const nowISO = new Date().toISOString();
    const emailType = resend ? 'resend_invite' : 'invite';
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    // ── STEP 1: Send branded email via Resend ──
    let brandedEmailSent = false;
    let brandedEmailError = null;

    if (!RESEND_API_KEY) {
      brandedEmailError = 'RESEND_API_KEY not configured';
      console.error(brandedEmailError);
    } else {
      try {
        const finalSubject = brandedSubject || 'Your Mind Stylist — Your access is ready';
        const innerContent = brandedBody || getDefaultInnerBody(normalizedEmail);
        const finalBody = wrapInBrandShell(innerContent);

        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: RESEND_FROM,
            to: [normalizedEmail],
            subject: finalSubject,
            html: finalBody,
          }),
        });

        const resendData = await resendRes.json();

        if (!resendRes.ok) {
          brandedEmailError = resendData.message || JSON.stringify(resendData);
          console.error('Resend API error:', brandedEmailError);
        } else {
          brandedEmailSent = true;
          console.log('Branded invite email sent via Resend to', normalizedEmail, 'id:', resendData.id);
        }

        // Log result
        await base44.asServiceRole.entities.EmailSendLog.create({
          recipient_email: normalizedEmail,
          subject: finalSubject,
          email_type: emailType,
          send_type: 'individual',
          provider: 'resend',
          status: brandedEmailSent ? 'sent' : 'failed',
          error_message: brandedEmailError || undefined,
          sent_by: user.email,
        });
      } catch (emailError) {
        brandedEmailError = emailError.message;
        console.error('Error sending branded invite email via Resend:', emailError);
        try {
          await base44.asServiceRole.entities.EmailSendLog.create({
            recipient_email: normalizedEmail,
            subject: brandedSubject || 'Your Mind Stylist — Your access is ready',
            email_type: emailType,
            send_type: 'individual',
            provider: 'resend',
            status: 'failed',
            error_message: brandedEmailError,
            sent_by: user.email,
          });
        } catch (logErr) {
          console.error('Failed to log email error:', logErr.message);
        }
      }
    }

    // ── STEP 2: Send system invite (account setup email from Base44) ──
    let systemInviteSent = false;
    let systemInviteError = null;
    try {
      await base44.auth.inviteUser(normalizedEmail, role);
      systemInviteSent = true;
      console.log('System invite sent to', normalizedEmail);

      await base44.asServiceRole.entities.EmailSendLog.create({
        recipient_email: normalizedEmail,
        subject: 'Account setup invitation (system)',
        email_type: emailType,
        send_type: 'automated',
        provider: 'system',
        status: 'sent',
        sent_by: user.email,
      });
    } catch (inviteError) {
      systemInviteError = inviteError.message;
      console.error('System invite error for', normalizedEmail, ':', systemInviteError);

      // Don't log "already invited" as a failure
      if (!systemInviteError?.includes('already')) {
        try {
          await base44.asServiceRole.entities.EmailSendLog.create({
            recipient_email: normalizedEmail,
            subject: 'Account setup invitation (system)',
            email_type: emailType,
            send_type: 'automated',
            provider: 'system',
            status: 'failed',
            error_message: systemInviteError,
            sent_by: user.email,
          });
        } catch (logErr) {
          console.error('Failed to log system invite error:', logErr.message);
        }
      }
    }

    // ── STEP 3: Gate success — at least one mechanism must have worked ──
    const anySuccess = brandedEmailSent || systemInviteSent;

    if (!anySuccess) {
      return Response.json({
        success: false,
        error: 'Both invite methods failed',
        brandedEmailError,
        systemInviteError,
      }, { status: 502 });
    }

    // ── STEP 4: Update Lead record ONLY on success ──
    try {
      const existingLeads = await base44.asServiceRole.entities.Lead.filter({ email: normalizedEmail });

      if (existingLeads.length > 0) {
        const lead = existingLeads[0];
        const updates = {
          converted_to_client: true,
          last_contact_date: nowISO,
          invite_status: 'invited',
          invite_sent_at: nowISO,
        };
        // Append to notes
        if (resend) {
          updates.notes = `${lead.notes || ''}\n[${new Date().toLocaleDateString()}] Invite resent`.trim();
        } else {
          updates.notes = `${lead.notes || ''}\n[${new Date().toLocaleDateString()}] Invited to platform`.trim();
          updates.stage = lead.stage === 'new' || lead.stage === 'contacted' ? 'qualified' : lead.stage;
        }
        await base44.asServiceRole.entities.Lead.update(lead.id, updates);
        console.log('Lead updated with invite_status=invited for', normalizedEmail);
      } else {
        // No lead exists — create one so it shows in Pending Invites
        const nameParts = normalizedEmail.split('@')[0].replace(/[._-]/g, ' ').split(' ');
        await base44.asServiceRole.entities.Lead.create({
          email: normalizedEmail,
          first_name: nameParts[0] ? nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1) : '',
          last_name: nameParts.length > 1 ? nameParts.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ') : '',
          full_name: normalizedEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          stage: 'qualified',
          source: 'referral',
          sources: ['referral'],
          converted_to_client: true,
          invite_status: 'invited',
          invite_sent_at: nowISO,
          last_contact_date: nowISO,
          notes: `[${new Date().toLocaleDateString()}] Invited to platform`,
        });
        console.log('Lead created with invite_status=invited for', normalizedEmail);
      }
    } catch (leadError) {
      console.error('Failed to update Lead record (non-critical):', leadError.message);
    }

    return Response.json({
      success: true,
      message: `Invitation sent to ${normalizedEmail}`,
      brandedEmailSent,
      systemInviteSent,
      brandedEmailError,
      systemInviteError,
      resend,
    });
  } catch (error) {
    console.error('Error inviting user:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

/**
 * Wraps any inner HTML content in the branded Your Mind Stylist email shell.
 * This ensures consistent branding regardless of which template body is used.
 * Roberta can edit the inner content via her Email Templates dashboard —
 * the wrapper is always applied automatically at send time.
 */
function wrapInBrandShell(innerHtml) {
  return `<div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #F9F5EF; padding: 0;">
  <div style="text-align: center; padding: 32px 24px 16px;">
    <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693a98b3e154ab3b36c88ebb/fad26f1a8_mind-stylist-whie-gold-logo2x.png" alt="Your Mind Stylist" style="height: 60px; width: auto;" />
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

function getDefaultInnerBody(email) {
  const name = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return `<p style="font-family: Georgia, serif; color: #1E3A32; font-size: 18px; margin: 0 0 16px;">Hi ${name},</p>
    <p style="color: #2B2725; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">Roberta here. I've created access for you inside Your Mind Stylist so you can access your programs, courses, and resources.</p>
    <p style="color: #2B2725; font-size: 15px; line-height: 1.7; margin: 0 0 8px;">Click below, then choose <strong>Sign up</strong> on the login screen using this same email address.</p>
    <p style="color: #2B2725; font-size: 13px; line-height: 1.6; margin: 0 0 24px; opacity: 0.7;">(Use <strong>${email}</strong> — the email this message was sent to.)</p>
    <div style="text-align: center; margin: 0 0 24px;">
      <a href="https://yourmindstylist.com/login" style="display: inline-block; background: #1E3A32; color: #F9F5EF; padding: 14px 36px; text-decoration: none; font-size: 14px; letter-spacing: 0.1em; border-radius: 4px;">SET UP YOUR ACCOUNT</a>
    </div>
    <p style="color: #2B2725; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">Once inside, you'll be able to find your materials, appointments, and resources in your client area.</p>
    <p style="color: #1E3A32; font-size: 15px; font-weight: 500; margin: 0;">Warmly,</p>
    <p style="color: #1E3A32; font-size: 15px; margin: 4px 0 0;">Roberta Fernandez<br/><span style="color: #6E4F7D; font-size: 13px;">Your Mind Stylist</span></p>`;
}