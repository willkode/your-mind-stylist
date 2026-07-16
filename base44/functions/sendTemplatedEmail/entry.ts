import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { template_key, recipient, variables } = await req.json();

    if (!template_key || !recipient) {
      return Response.json({ error: 'template_key and recipient are required' }, { status: 400 });
    }

    // Fetch email template
    const templates = await base44.asServiceRole.entities.EmailTemplate.filter({ key: template_key, active: true });
    
    if (!templates || templates.length === 0) {
      return Response.json({ error: 'Email template not found or inactive' }, { status: 404 });
    }

    const template = templates[0];

    // Replace variables in subject and body
    let subject = template.subject;
    let body = template.body;

    if (variables) {
      Object.keys(variables).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        subject = subject.replace(regex, variables[key] || '');
        body = body.replace(regex, variables[key] || '');
      });
    }

    // Send email using Core integration
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: recipient,
      subject: subject,
      body: body.replace(/\n/g, '<br>')
    });

    return Response.json({
      success: true,
      template_key,
      recipient
    });

  } catch (error) {
    console.error('Send templated email error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});