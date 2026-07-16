import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, name, fields, groups } = await req.json();
    
    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    const apiKey = Deno.env.get('MAILERLITE_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'MailerLite API key not configured' }, { status: 500 });
    }

    // Add subscriber to MailerLite
    const response = await fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        email,
        fields: {
          name: name || '',
          ...fields
        },
        groups: groups || []
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return Response.json({ 
        error: 'Failed to add subscriber', 
        details: data 
      }, { status: response.status });
    }

    return Response.json({ 
      success: true, 
      subscriber: data.data 
    });

  } catch (error) {
    console.error('MailerLite error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});