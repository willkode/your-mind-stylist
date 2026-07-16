import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, groupId } = await req.json();
    
    if (!email || !groupId) {
      return Response.json({ error: 'Email and group ID are required' }, { status: 400 });
    }

    const apiKey = Deno.env.get('MAILERLITE_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'MailerLite API key not configured' }, { status: 500 });
    }

    // Assign subscriber to group
    const response = await fetch(`https://connect.mailerlite.com/api/subscribers/${email}/groups/${groupId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      }
    });

    if (!response.ok) {
      const data = await response.json();
      return Response.json({ 
        error: 'Failed to add subscriber to group', 
        details: data 
      }, { status: response.status });
    }

    return Response.json({ success: true });

  } catch (error) {
    console.error('MailerLite error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});