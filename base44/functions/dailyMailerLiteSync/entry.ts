import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const MAILERLITE_API_KEY = Deno.env.get('MAILERLITE_API_KEY');
    if (!MAILERLITE_API_KEY) {
      return Response.json({ error: 'MailerLite API key not configured' }, { status: 500 });
    }

    const headers = {
      'Authorization': `Bearer ${MAILERLITE_API_KEY}`,
      'Content-Type': 'application/json',
    };

    // Fetch all leads and users
    const leads = await base44.asServiceRole.entities.Lead.list('', 1000);
    const users = await base44.asServiceRole.entities.User.list('', 1000);

    let syncedCount = 0;
    let errors = [];

    // Deduplicate by email — combine leads + users
    const emailMap = new Map();

    for (const lead of leads) {
      if (!lead.email) continue;
      emailMap.set(lead.email.toLowerCase(), {
        email: lead.email,
        first_name: lead.first_name || '',
        last_name: lead.last_name || '',
        phone: lead.phone || '',
        source: 'lead',
        tags: lead.tags || [],
      });
    }

    for (const u of users) {
      if (!u.email) continue;
      const key = u.email.toLowerCase();
      if (emailMap.has(key)) {
        // Merge — user data takes priority for name
        const existing = emailMap.get(key);
        if (u.full_name) {
          const parts = u.full_name.split(' ');
          existing.first_name = parts[0] || existing.first_name;
          existing.last_name = parts.slice(1).join(' ') || existing.last_name;
        }
        existing.source = 'lead+user';
      } else {
        const parts = (u.full_name || '').split(' ');
        emailMap.set(key, {
          email: u.email,
          first_name: parts[0] || '',
          last_name: parts.slice(1).join(' ') || '',
          phone: '',
          source: 'user',
          tags: [],
        });
      }
    }

    // Sync each subscriber to MailerLite
    for (const [, contact] of emailMap) {
      try {
        const res = await fetch('https://connect.mailerlite.com/api/subscribers', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            email: contact.email,
            fields: {
              first_name: contact.first_name,
              last_name: contact.last_name,
              phone: contact.phone,
            },
            tags: contact.tags,
          }),
        });

        if (res.ok) {
          syncedCount++;
        } else {
          const errData = await res.json().catch(() => ({}));
          errors.push({ email: contact.email, error: errData.message || res.statusText });
        }
      } catch (e) {
        errors.push({ email: contact.email, error: e.message });
      }
    }

    console.log(`Daily MailerLite sync complete: ${syncedCount} synced, ${errors.length} errors`);

    return Response.json({
      success: true,
      total_contacts: emailMap.size,
      synced: syncedCount,
      errors: errors.length,
      error_details: errors.slice(0, 10),
      message: `Synced ${syncedCount} of ${emailMap.size} contacts to MailerLite`,
    });
  } catch (error) {
    console.error('Daily MailerLite sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});