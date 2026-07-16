import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { to, subject, message } = await req.json();

    await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: 'Your Mind Stylist',
      to,
      subject,
      body: message
    });

    return Response.json({ success: true });

  } catch (error) {
    console.error('Send waitlist email error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});