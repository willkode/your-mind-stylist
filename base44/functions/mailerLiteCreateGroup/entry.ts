import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      return Response.json({ error: 'Unauthorized - Admin/Manager only' }, { status: 401 });
    }

    const { name } = await req.json();
    
    if (!name) {
      return Response.json({ error: 'Group name is required' }, { status: 400 });
    }

    const apiKey = Deno.env.get('MAILERLITE_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'MailerLite API key not configured' }, { status: 500 });
    }

    const response = await fetch('https://connect.mailerlite.com/api/groups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ name })
    });

    const data = await response.json();

    if (!response.ok) {
      return Response.json({ 
        error: 'Failed to create group', 
        details: data 
      }, { status: response.status });
    }

    return Response.json({ 
      success: true, 
      group: data.data 
    });

  } catch (error) {
    console.error('MailerLite error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});