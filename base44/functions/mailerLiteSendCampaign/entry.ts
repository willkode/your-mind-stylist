import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      return Response.json({ error: 'Unauthorized - Admin/Manager only' }, { status: 401 });
    }

    const { subject, content, groups, emails } = await req.json();
    
    if (!subject || !content) {
      return Response.json({ error: 'Subject and content are required' }, { status: 400 });
    }

    const apiKey = Deno.env.get('MAILERLITE_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'MailerLite API key not configured' }, { status: 500 });
    }

    // Create campaign
    const campaignData = {
      name: subject,
      type: 'regular',
      emails: [{
        subject,
        from_name: 'Your Mind Stylist',
        from: 'roberta@yourmindstylist.com',
        content
      }]
    };

    if (groups && groups.length > 0) {
      campaignData.groups = groups;
    }

    if (emails && emails.length > 0) {
      campaignData.emails[0].to = emails;
    }

    const response = await fetch('https://connect.mailerlite.com/api/campaigns', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(campaignData)
    });

    const data = await response.json();

    if (!response.ok) {
      return Response.json({ 
        error: 'Failed to create campaign', 
        details: data 
      }, { status: response.status });
    }

    return Response.json({ 
      success: true, 
      campaign: data.data 
    });

  } catch (error) {
    console.error('MailerLite error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});