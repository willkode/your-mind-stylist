import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { name, first_name, last_name, email, phone, inquiry, message } = await req.json();

    if (!name || !email || !message) {
      return Response.json({ error: 'Name, email, and message are required.' }, { status: 400 });
    }
    if (!last_name) {
      return Response.json({ error: 'Last name is required.' }, { status: 400 });
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
        <p><strong>Inquiring about:</strong> ${inquiry || 'Not specified'}</p>
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
          first_name: first_name || existing[0].first_name,
          last_name: last_name || existing[0].last_name,
          phone: phone || existing[0].phone,
          what_inquired_about: inquiry || existing[0].what_inquired_about,
          notes: message,
        });
      } else {
        await base44.asServiceRole.entities.Lead.create({
          email,
          full_name: name,
          first_name,
          last_name,
          phone,
          source: 'contact_form',
          what_inquired_about: inquiry,
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