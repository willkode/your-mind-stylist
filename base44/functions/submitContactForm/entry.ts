import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { name, email, phone, message } = await req.json();

    if (!name || !email || !message) {
      return Response.json({ error: 'Name, email, and message are required.' }, { status: 400 });
    }

    // Send notification email to Roberta (service role — form is public)
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: 'roberta@yourmindstylist.com',
      subject: `New Contact Form Submission from ${name}`,
      body: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    });

    // Create or update lead for follow-up (non-blocking)
    try {
      const existing = await base44.asServiceRole.entities.Lead.filter({ email });
      if (existing.length > 0) {
        await base44.asServiceRole.entities.Lead.update(existing[0].id, {
          full_name: name,
          phone: phone || existing[0].phone,
          notes: message,
        });
      } else {
        await base44.asServiceRole.entities.Lead.create({
          email,
          full_name: name,
          phone,
          source: 'contact_form',
          notes: message,
          email_consent: true,
          consent_given_at: new Date().toISOString(),
        });
      }
    } catch (leadErr) {
      console.error('Lead creation failed (non-blocking):', leadErr.message);
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});