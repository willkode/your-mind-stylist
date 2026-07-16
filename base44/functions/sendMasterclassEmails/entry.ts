import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // This is a scheduled function that should be called by a cron job
    // For now, it can be triggered manually from the admin dashboard
    
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const signups = await base44.asServiceRole.entities.MasterclassSignup.list();
    const results = {
      reminders_sent: 0,
      post_email_1_sent: 0,
      post_email_2_sent: 0,
      post_email_3_sent: 0
    };

    const masterclassUrl = `${Deno.env.get('BASE_URL') || 'https://app.base44.com'}/app/masterclass`;
    const dashboardUrl = `${Deno.env.get('BASE_URL') || 'https://app.base44.com'}/app/dashboard`;

    for (const signup of signups) {
      const signupDate = new Date(signup.signup_date);
      const watchDate = signup.watch_date ? new Date(signup.watch_date) : null;

      // Send reminder email (3 days after signup, if not watched)
      if (!signup.watched && !signup.reminder_sent && signupDate < threeDaysAgo) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: signup.email,
          from_name: 'Roberta Fernandez - The Mind Stylist',
          subject: 'Ready to Finish Your Masterclass?',
          body: getReminderEmailHTML(signup.full_name, masterclassUrl)
        });

        await base44.asServiceRole.entities.MasterclassSignup.update(signup.id, {
          reminder_sent: true
        });
        results.reminders_sent++;
      }

      // Post-masterclass emails (only if watched)
      if (signup.watched && watchDate) {
        // Email 1: 2 days after watching
        if (!signup.post_email_1_sent && watchDate < new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: signup.email,
            from_name: 'Roberta Fernandez - The Mind Stylist',
            subject: 'A Question for Reflection',
            body: getPostEmail1HTML(signup.full_name, dashboardUrl)
          });

          await base44.asServiceRole.entities.MasterclassSignup.update(signup.id, {
            post_email_1_sent: true
          });
          results.post_email_1_sent++;
        }

        // Email 2: 7 days after watching
        if (!signup.post_email_2_sent && watchDate < sevenDaysAgo) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: signup.email,
            from_name: 'Roberta Fernandez - The Mind Stylist',
            subject: 'The Work Beneath the Surface',
            body: getPostEmail2HTML(signup.full_name, dashboardUrl)
          });

          await base44.asServiceRole.entities.MasterclassSignup.update(signup.id, {
            post_email_2_sent: true
          });
          results.post_email_2_sent++;
        }

        // Email 3: 14 days after watching
        if (!signup.post_email_3_sent && watchDate < fourteenDaysAgo) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: signup.email,
            from_name: 'Roberta Fernandez - The Mind Stylist',
            subject: 'Ready for the Next Step?',
            body: getPostEmail3HTML(signup.full_name, dashboardUrl)
          });

          await base44.asServiceRole.entities.MasterclassSignup.update(signup.id, {
            post_email_3_sent: true
          });
          results.post_email_3_sent++;
        }
      }
    }

    return Response.json({ success: true, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function getReminderEmailHTML(userName, masterclassUrl) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; font-family: Georgia, serif;">
  <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background-color: #F9F5EF;">
    <div style="background-color: #1E3A32; padding: 40px 30px; text-align: center;">
      <h1 style="color: #F9F5EF; font-size: 24px; margin: 0 0 10px 0; font-weight: normal;">Roberta Fernandez</h1>
      <p style="color: #D8B46B; font-size: 14px; letter-spacing: 2px; margin: 0; text-transform: uppercase;">The Mind Stylist</p>
    </div>
    <div style="padding: 50px 30px; background-color: #FFFFFF;">
      <h2 style="font-size: 28px; color: #1E3A32; margin-bottom: 20px;">Ready to Finish Your Masterclass?</h2>
      <p style="font-size: 16px; color: #2B2725; line-height: 1.6; margin-bottom: 20px;">Hi ${userName},</p>
      <p style="font-size: 16px; color: #2B2725; line-height: 1.6; margin-bottom: 20px;">I noticed you started your free masterclass on imposter syndrome, but haven't finished it yet.</p>
      <p style="font-size: 16px; color: #2B2725; line-height: 1.6; margin-bottom: 30px;">No pressure — life gets busy. But if you're curious about what's beneath those "I'm not enough" feelings, the full session is waiting for you.</p>
      <div style="text-align: center; margin: 40px 0;">
        <a href="${masterclassUrl}" style="display: inline-block; padding: 16px 40px; background-color: #1E3A32; color: #F9F5EF; text-decoration: none; font-size: 14px; letter-spacing: 1px; text-transform: uppercase;">Continue Watching</a>
      </div>
    </div>
    <div style="padding: 30px; background-color: #F9F5EF; text-align: center; border-top: 1px solid #E4D9C4;">
      <p style="font-size: 14px; color: #2B2725; opacity: 0.7; margin: 0 0 10px 0;">Questions? Reply to this email.</p>
      <p style="font-size: 12px; color: #2B2725; opacity: 0.5; margin: 0;">© 2025 The Mind Stylist</p>
    </div>
  </div>
</body></html>`;
}

function getPostEmail1HTML(userName, dashboardUrl) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; font-family: Georgia, serif;">
  <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background-color: #F9F5EF;">
    <div style="background-color: #1E3A32; padding: 40px 30px; text-align: center;">
      <h1 style="color: #F9F5EF; font-size: 24px; margin: 0 0 10px 0; font-weight: normal;">Roberta Fernandez</h1>
      <p style="color: #D8B46B; font-size: 14px; letter-spacing: 2px; margin: 0; text-transform: uppercase;">The Mind Stylist</p>
    </div>
    <div style="padding: 50px 30px; background-color: #FFFFFF;">
      <h2 style="font-size: 28px; color: #1E3A32; margin-bottom: 20px;">A Question for Reflection</h2>
      <p style="font-size: 16px; color: #2B2725; line-height: 1.6; margin-bottom: 20px;">Hi ${userName},</p>
      <p style="font-size: 16px; color: #2B2725; line-height: 1.6; margin-bottom: 30px;">Thank you for watching the masterclass. Here's a question to sit with this week:</p>
      <div style="background-color: #F9F5EF; padding: 30px; margin-bottom: 30px;">
        <p style="font-size: 18px; color: #1E3A32; line-height: 1.6; font-style: italic; margin: 0;">"What would change if you stopped questioning whether you belong, and simply trusted that you do?"</p>
      </div>
      <div style="border-top: 2px solid #D8B46B; padding-top: 30px; margin-top: 40px;">
        <h3 style="font-size: 20px; color: #1E3A32; margin-bottom: 15px;">Want to Go Deeper?</h3>
        <p style="font-size: 16px; color: #2B2725; line-height: 1.6; margin-bottom: 20px;">If what you learned resonated, you might be interested in <strong>The Mind Styling Certification™</strong>.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${dashboardUrl}" style="display: inline-block; padding: 14px 35px; background-color: #1E3A32; color: #F9F5EF; text-decoration: none; font-size: 14px; letter-spacing: 1px; text-transform: uppercase;">Explore Programs</a>
        </div>
      </div>
    </div>
    <div style="padding: 30px; background-color: #F9F5EF; text-align: center; border-top: 1px solid #E4D9C4;">
      <p style="font-size: 12px; color: #2B2725; opacity: 0.5; margin: 0;">© 2025 The Mind Stylist</p>
    </div>
  </div>
</body></html>`;
}

function getPostEmail2HTML(userName, dashboardUrl) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; font-family: Georgia, serif;">
  <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background-color: #F9F5EF;">
    <div style="background-color: #1E3A32; padding: 40px 30px; text-align: center;">
      <h1 style="color: #F9F5EF; font-size: 24px; margin: 0 0 10px 0; font-weight: normal;">Roberta Fernandez</h1>
      <p style="color: #D8B46B; font-size: 14px; letter-spacing: 2px; margin: 0; text-transform: uppercase;">The Mind Stylist</p>
    </div>
    <div style="padding: 50px 30px; background-color: #FFFFFF;">
      <h2 style="font-size: 28px; color: #1E3A32; margin-bottom: 20px;">The Work Beneath the Surface</h2>
      <p style="font-size: 16px; color: #2B2725; line-height: 1.6; margin-bottom: 20px;">Hi ${userName},</p>
      <p style="font-size: 16px; color: #2B2725; line-height: 1.6; margin-bottom: 20px;">A week ago, you watched the masterclass on imposter syndrome. I'm curious: has anything shifted since then?</p>
      <p style="font-size: 16px; color: #2B2725; line-height: 1.6; margin-bottom: 30px;">Sometimes the most profound changes happen quietly. A small internal recalibration. A moment of noticing without judging. These are the seeds of transformation.</p>
      <div style="background-color: #6E4F7D; padding: 30px; margin: 30px 0;">
        <p style="font-size: 16px; color: #F9F5EF; line-height: 1.6; margin: 0;">If you're ready to go deeper—beyond awareness into lasting pattern shifts—The Mind Styling Certification™ is designed for exactly that.</p>
      </div>
      <div style="text-align: center;">
        <a href="${dashboardUrl}" style="display: inline-block; padding: 14px 35px; background-color: #1E3A32; color: #F9F5EF; text-decoration: none; font-size: 14px; letter-spacing: 1px; text-transform: uppercase;">Learn More</a>
      </div>
    </div>
    <div style="padding: 30px; background-color: #F9F5EF; text-align: center; border-top: 1px solid #E4D9C4;">
      <p style="font-size: 12px; color: #2B2725; opacity: 0.5; margin: 0;">© 2025 The Mind Stylist</p>
    </div>
  </div>
</body></html>`;
}

function getPostEmail3HTML(userName, dashboardUrl) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; font-family: Georgia, serif;">
  <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background-color: #F9F5EF;">
    <div style="background-color: #1E3A32; padding: 40px 30px; text-align: center;">
      <h1 style="color: #F9F5EF; font-size: 24px; margin: 0 0 10px 0; font-weight: normal;">Roberta Fernandez</h1>
      <p style="color: #D8B46B; font-size: 14px; letter-spacing: 2px; margin: 0; text-transform: uppercase;">The Mind Stylist</p>
    </div>
    <div style="padding: 50px 30px; background-color: #FFFFFF;">
      <h2 style="font-size: 28px; color: #1E3A32; margin-bottom: 20px;">Ready for the Next Step?</h2>
      <p style="font-size: 16px; color: #2B2725; line-height: 1.6; margin-bottom: 20px;">Hi ${userName},</p>
      <p style="font-size: 16px; color: #2B2725; line-height: 1.6; margin-bottom: 20px;">Two weeks ago, you watched the masterclass. By now, you've had time to reflect, notice patterns, and maybe even try some of the practices.</p>
      <p style="font-size: 16px; color: #2B2725; line-height: 1.6; margin-bottom: 30px;">If you're ready to make this work part of your identity—not just something you know, but something you embody—I'd love to support you.</p>
      <div style="background-color: #F9F5EF; padding: 30px; margin: 30px 0;">
        <h3 style="font-size: 20px; color: #1E3A32; margin-bottom: 15px;">Three ways to continue:</h3>
        <ul style="list-style: none; padding: 0; margin: 0;">
          <li style="padding: 10px 0; border-bottom: 1px solid #E4D9C4;">The Mind Styling Certification™</li>
          <li style="padding: 10px 0; border-bottom: 1px solid #E4D9C4;">Private 1:1 Mind Styling</li>
          <li style="padding: 10px 0;">The Inner Rehearsal Sessions™</li>
        </ul>
      </div>
      <div style="text-align: center;">
        <a href="${dashboardUrl}" style="display: inline-block; padding: 14px 35px; background-color: #1E3A32; color: #F9F5EF; text-decoration: none; font-size: 14px; letter-spacing: 1px; text-transform: uppercase;">Explore Your Options</a>
      </div>
    </div>
    <div style="padding: 30px; background-color: #F9F5EF; text-align: center; border-top: 1px solid #E4D9C4;">
      <p style="font-size: 12px; color: #2B2725; opacity: 0.5; margin: 0;">© 2025 The Mind Stylist</p>
    </div>
  </div>
</body></html>`;
}