import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.role !== 'manager' && user.custom_role !== 'manager')) {
      return Response.json({ error: 'Forbidden: Manager access required' }, { status: 403 });
    }

    const { to_email, subject, body_html, cta_text, cta_url, preview_text } = await req.json();

    if (!to_email || !subject || !body_html) {
      return Response.json({ error: 'Missing required fields: to_email, subject, body_html' }, { status: 400 });
    }

    // Replace variables with test data
    const testVars = {
      '{{name}}': 'Test User',
      '{{email}}': to_email,
      '{{first_name}}': 'Test',
      '{{product_name}}': 'Sample Product',
    };

    let finalSubject = subject;
    let finalBody = body_html;
    for (const [key, value] of Object.entries(testVars)) {
      finalSubject = finalSubject.replaceAll(key, value);
      finalBody = finalBody.replaceAll(key, value);
    }

    // Add CTA button if provided
    if (cta_text && cta_url) {
      finalBody += `
        <div style="text-align: center; margin: 24px 0;">
          <a href="${cta_url}" style="display: inline-block; padding: 12px 24px; background-color: #1E3A32; color: #F9F5EF; text-decoration: none; border-radius: 4px; font-family: sans-serif; font-weight: 600;">${cta_text}</a>
        </div>`;
    }

    // Wrap in a simple styled container
    const wrappedBody = `
      <div style="max-width: 600px; margin: 0 auto; font-family: 'Inter', Arial, sans-serif; color: #2B2725;">
        <div style="background: #D8B46B; padding: 8px 16px; text-align: center; font-size: 11px; color: #1E3A32; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">
          ⚡ TEST EMAIL — This is a preview, not sent to any subscribers
        </div>
        <div style="padding: 24px; background: #ffffff; border: 1px solid #E4D9C4;">
          ${finalBody}
        </div>
        <div style="padding: 12px; text-align: center; font-size: 10px; color: #2B2725; opacity: 0.5;">
          Sent as test from Your Mind Stylist Email Sequences
        </div>
      </div>`;

    // Send the email using Core.SendEmail
    await base44.integrations.Core.SendEmail({
      to: to_email,
      subject: `[TEST] ${finalSubject}`,
      body: wrappedBody,
      from_name: 'Your Mind Stylist (Test)',
    });

    return Response.json({ success: true, message: `Test email sent to ${to_email}` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});