import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const MAILERLITE_API_KEY = Deno.env.get('MAILERLITE_API_KEY');
    if (!MAILERLITE_API_KEY) {
      return Response.json({ error: 'MailerLite API key not configured' }, { status: 500 });
    }

    const { status = 'sent', limit = 25 } = await req.json().catch(() => ({}));

    // Fetch campaigns from MailerLite
    const params = new URLSearchParams({
      'filter[status]': status,
      limit: String(limit),
      sort: '-finished_at',
    });

    const response = await fetch(`https://connect.mailerlite.com/api/campaigns?${params}`, {
      headers: {
        'Authorization': `Bearer ${MAILERLITE_API_KEY}`,
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return Response.json({ error: 'Failed to fetch campaigns', details: data }, { status: response.status });
    }

    // Map to a clean format
    const campaigns = (data.data || []).map(c => ({
      id: c.id,
      name: c.name,
      subject: c.emails?.[0]?.subject || c.name,
      status: c.status,
      type: c.type,
      sent_at: c.finished_at || c.scheduled_for || c.created_at,
      stats: {
        sent: c.stats?.sent || 0,
        opens_count: c.stats?.opens_count || 0,
        unique_opens_count: c.stats?.unique_opens_count || 0,
        clicks_count: c.stats?.clicks_count || 0,
        unique_clicks_count: c.stats?.unique_clicks_count || 0,
        unsubscribes_count: c.stats?.unsubscribes_count || 0,
        bounces_count: c.stats?.hard_bounces_count || 0,
        open_rate: c.stats?.open_rate || 0,
        click_rate: c.stats?.click_rate || 0,
      }
    }));

    return Response.json({ success: true, campaigns });
  } catch (error) {
    console.error('getMailerLiteCampaigns error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});