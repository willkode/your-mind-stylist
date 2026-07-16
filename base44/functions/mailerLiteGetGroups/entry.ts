import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      return Response.json({ error: 'Unauthorized - Admin/Manager only' }, { status: 401 });
    }

    const apiKey = Deno.env.get('MAILERLITE_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'MailerLite API key not configured' }, { status: 500 });
    }

    const response = await fetch('https://connect.mailerlite.com/api/groups', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return Response.json({ 
        error: 'Failed to fetch groups', 
        details: data 
      }, { status: response.status });
    }

    return Response.json({ 
      success: true, 
      groups: data.data 
    });

  } catch (error) {
    console.error('MailerLite error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});