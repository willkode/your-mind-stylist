import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const MAILERLITE_API_KEY = Deno.env.get('MAILERLITE_API_KEY');
    if (!MAILERLITE_API_KEY) {
      return Response.json({ error: 'MailerLite API key not configured' }, { status: 500 });
    }

    // Fetch all leads from Base44
    const leads = await base44.asServiceRole.entities.Lead.list('', 500);

    let syncedCount = 0;
    let errors = [];

    // Sync leads to MailerLite
    for (const lead of leads) {
      if (!lead.email) continue;

      try {
        // Add/update subscriber in MailerLite
        const subscriberResponse = await fetch('https://connect.mailerlite.com/api/subscribers', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${MAILERLITE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: lead.email,
            fields: {
              first_name: lead.first_name || '',
              last_name: lead.last_name || '',
              phone: lead.phone || '',
              company: lead.source || '',
            },
            tags: lead.tags || [],
          }),
        });

        if (subscriberResponse.ok) {
          syncedCount++;
        } else {
          errors.push({ lead_id: lead.id, error: 'Failed to sync to MailerLite' });
        }
      } catch (e) {
        errors.push({ lead_id: lead.id, error: e.message });
      }
    }

    // Fetch MailerLite subscribers to sync back to Base44
    const subscribersResponse = await fetch('https://connect.mailerlite.com/api/subscribers', {
      headers: {
        'Authorization': `Bearer ${MAILERLITE_API_KEY}`,
      },
    });

    if (subscribersResponse.ok) {
      const { data: subscribers } = await subscribersResponse.json();
      
      // Update lead mailerlite_subscriber_id if matched
      for (const subscriber of subscribers || []) {
        const lead = leads.find(l => l.email === subscriber.email);
        if (lead && !lead.mailerlite_subscriber_id) {
          await base44.asServiceRole.entities.Lead.update(lead.id, {
            mailerlite_subscriber_id: subscriber.id,
          });
        }
      }
    }

    return Response.json({
      success: true,
      syncedCount,
      errors,
      message: `Synced ${syncedCount} leads to MailerLite`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});