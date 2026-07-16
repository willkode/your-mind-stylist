import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const isAdmin = user.role === 'admin';
    const isManager = user.role === 'manager' || user.custom_role === 'manager';
    if (!isAdmin && !isManager) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { users, brandedSubject, brandedBody } = await req.json();
    if (!users || !Array.isArray(users)) return Response.json({ error: 'No users provided' }, { status: 400 });

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const results = { invited: 0, enrolled: 0, skipped: 0, errors: [] };

    for (const u of users) {
      const email = (u.email || '').trim().toLowerCase();
      if (!email) { results.skipped++; continue; }

      let brandedSent = false;
      let systemSent = false;

      // 1a. Send branded email from Roberta via Resend
      try {
        const recipientName = u.full_name || u.first_name || email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        const innerContent = (brandedBody || getDefaultInnerBody(recipientName))
          .replace(/\{\{name\}\}/g, recipientName)
          .replace(/\{\{user_name\}\}/g, recipientName);
        const personalizedBody = wrapInBrandShell(innerContent);
        const personalizedSubject = (brandedSubject || "Your Mind Stylist — Your access is ready")
          .replace(/\{\{name\}\}/g, recipientName)
          .replace(/\{\{user_name\}\}/g, recipientName);

        if (RESEND_API_KEY) {
          const resendRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: 'Roberta Fernandez <roberta@yourmindstylist.com>',
              to: [email],
              subject: personalizedSubject,
              html: personalizedBody,
            }),
          });
          if (resendRes.ok) {
            brandedSent = true;
            console.log(`Branded invite sent via Resend to ${email}`);
          } else {
            const errData = await resendRes.json();
            console.error(`Resend error for ${email}:`, errData.message || JSON.stringify(errData));
          }
        } else {
          console.error('RESEND_API_KEY not configured — skipping branded email');
        }
      } catch (emailErr) {
        console.error(`Branded email failed for ${email}:`, emailErr.message);
      }

      // 1b. Invite the user to the platform (system email with account setup link)
      try {
        await base44.auth.inviteUser(email, 'user');
        systemSent = true;
        results.invited++;
      } catch (err) {
        // User may already exist - that's fine, continue to enrollment
        const msg = err?.message || '';
        if (!msg.toLowerCase().includes('already')) {
          results.errors.push(`Invite failed for ${email}: ${msg}`);
        }
        // Count as invited if branded email at least went out
        if (brandedSent && !systemSent) results.invited++;
      }

      // 2. Find user in the system (they may be newly invited or already exist)
      // Wait a moment to let invite settle, then try to find them
      let targetUser = null;
      try {
        const foundUsers = await base44.asServiceRole.entities.User.filter({ email });
        targetUser = foundUsers[0];
      } catch (_) {}

      // 3. Enroll in each mapped course
      if (u.appCourseIds && u.appCourseIds.length > 0 && targetUser) {
        for (const courseId of u.appCourseIds) {
          try {
            // Check if already enrolled
            const existing = await base44.asServiceRole.entities.UserCourseProgress.filter({
              user_id: targetUser.id,
              course_id: courseId,
            });

            if (existing.length === 0) {
              await base44.asServiceRole.entities.UserCourseProgress.create({
                user_id: targetUser.id,
                course_id: courseId,
                status: 'not_started',
                completion_percentage: 0,
              });
              results.enrolled++;

              // Send enrollment notification email
              try {
                const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
                if (RESEND_API_KEY) {
                  const courses = await base44.asServiceRole.entities.Course.filter({ id: courseId });
                  const courseName = courses[0]?.title || 'your course';
                  const firstName = u.firstName || email.split('@')[0];

                  await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${RESEND_API_KEY}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      from: 'Roberta Fernandez <roberta@yourmindstylist.com>',
                      to: email,
                      subject: `You're enrolled in ${courseName}`,
                      html: `
                        <div style="font-family: Georgia, serif; max-width: 580px; margin: 0 auto; color: #2B2725;">
                          <div style="background: #1E3A32; padding: 32px; text-align: center;">
                            <h1 style="color: #D8B46B; font-size: 24px; margin: 0;">Your Mind Stylist</h1>
                          </div>
                          <div style="padding: 40px 32px;">
                            <p style="font-size: 18px; color: #1E3A32; margin-bottom: 8px;">Hi ${firstName},</p>
                            <p style="line-height: 1.7;">You've been enrolled in <strong>${courseName}</strong> on the Your Mind Stylist platform.</p>
                            <p style="line-height: 1.7;">If you don't have an account yet, check your inbox for a separate invitation email to set up your login.</p>
                            <div style="text-align: center; margin: 32px 0;">
                              <a href="https://yourmindstylist.com/login" style="background: #1E3A32; color: #F9F5EF; padding: 14px 32px; text-decoration: none; font-size: 14px; letter-spacing: 0.1em;">ACCESS YOUR COURSE</a>
                            </div>
                            <p style="color: #2B2725; line-height: 1.7; font-size: 14px;">Warmly,<br><strong>Roberta Fernandez</strong><br>Your Mind Stylist</p>
                          </div>
                        </div>
                      `,
                    }),
                  });
                }
              } catch (emailErr) {
                results.errors.push(`Enrollment email failed for ${email}: ${emailErr.message}`);
              }
            }
          } catch (enrollErr) {
            results.errors.push(`Enrollment failed for ${email} in course ${courseId}: ${enrollErr.message}`);
          }
        }
      } else if (u.appCourseIds && u.appCourseIds.length > 0 && !targetUser) {
        // User was just invited, won't have an ID yet — log it
        results.errors.push(`${email}: invited but couldn't enroll yet (account not active). Please manually enroll after they accept the invitation.`);
        results.skipped++;
      }
    }

    return Response.json(results);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

/**
 * Wraps any inner HTML content in the branded Your Mind Stylist email shell.
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

function getDefaultInnerBody(name) {
  return `<p style="font-family: Georgia, serif; color: #1E3A32; font-size: 18px; margin: 0 0 16px;">Hi ${name},</p>
    <p style="color: #2B2725; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">Roberta here. I've created access for you inside Your Mind Stylist so you can access your programs, courses, and resources.</p>
    <p style="color: #2B2725; font-size: 15px; line-height: 1.7; margin: 0 0 8px;">Click below, then choose <strong>Sign up</strong> on the login screen using the email address this message was sent to.</p>
    <p style="color: #2B2725; font-size: 13px; line-height: 1.6; margin: 0 0 24px; opacity: 0.7;">(No need for "Forgot password" — just choose <strong>Sign up</strong> to create your new account.)</p>
    <div style="text-align: center; margin: 0 0 24px;">
      <a href="https://yourmindstylist.com/login" style="display: inline-block; background: #1E3A32; color: #F9F5EF; padding: 14px 36px; text-decoration: none; font-size: 14px; letter-spacing: 0.1em; border-radius: 4px;">SET UP YOUR ACCOUNT</a>
    </div>
    <p style="color: #2B2725; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">Once inside, you'll be able to find your materials, appointments, and resources in your client area.</p>
    <p style="color: #1E3A32; font-size: 15px; font-weight: 500; margin: 0;">Warmly,</p>
    <p style="color: #1E3A32; font-size: 15px; margin: 4px 0 0;">Roberta Fernandez<br/><span style="color: #6E4F7D; font-size: 13px;">Your Mind Stylist</span></p>`;
}