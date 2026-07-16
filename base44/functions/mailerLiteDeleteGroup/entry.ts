import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { groupId } = await req.json();

    if (!groupId) {
      return Response.json({ error: 'groupId is required' }, { status: 400 });
    }

    const MAILERLITE_API_KEY = Deno.env.get('MAILERLITE_API_KEY');
    if (!MAILERLITE_API_KEY) {
      return Response.json({ error: 'MailerLite API key not configured' }, { status: 500 });
    }

    const response = await fetch(`https://connect.mailerlite.com/api/groups/${groupId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${MAILERLITE_API_KEY}`,
      }
    });

    if (!response.ok && response.status !== 204) {
      const data = await response.json().catch(() => ({}));
      return Response.json({ error: 'Failed to delete group', details: data }, { status: response.status });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('mailerLiteDeleteGroup error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});