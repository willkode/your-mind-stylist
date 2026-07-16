import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const { email, name, automationType, customFields } = await req.json();
    
    if (!email || !automationType) {
      return Response.json({ error: 'Email and automation type are required' }, { status: 400 });
    }

    const apiKey = Deno.env.get('MAILERLITE_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'MailerLite API key not configured' }, { status: 500 });
    }

    // Map automation types to MailerLite group IDs
    // These should be created in MailerLite first
    const automationGroups = {
      'booking_confirmation': 'booking-confirmations',
      'masterclass_signup': 'masterclass-signups',
      'newsletter': 'newsletter-subscribers',
      'new_signup': 'new-signups',
      'post_session': 'post-session-followup',
    };

    const groupName = automationGroups[automationType];
    if (!groupName) {
      return Response.json({ error: 'Invalid automation type' }, { status: 400 });
    }

    // First, add/update subscriber
    const subscriberResponse = await fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        email,
        fields: {
          name: name || '',
          ...customFields
        }
      })
    });

    const subscriberData = await subscriberResponse.json();

    // Get group ID by name
    const groupsResponse = await fetch('https://connect.mailerlite.com/api/groups', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      }
    });

    const groupsData = await groupsResponse.json();
    const group = groupsData.data?.find(g => g.name === groupName);

    if (group) {
      // Add subscriber to group (triggers automation)
      await fetch(`https://connect.mailerlite.com/api/subscribers/${email}/groups/${group.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        }
      });
    }

    return Response.json({ 
      success: true,
      message: `Subscriber added to ${automationType} automation`,
      subscriber: subscriberData.data
    });

  } catch (error) {
    console.error('MailerLite automation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});