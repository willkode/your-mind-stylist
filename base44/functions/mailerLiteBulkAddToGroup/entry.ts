import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { leadIds, groupId } = await req.json();

    if (!leadIds?.length || !groupId) {
      return Response.json({ error: 'leadIds and groupId are required' }, { status: 400 });
    }

    const MAILERLITE_API_KEY = Deno.env.get('MAILERLITE_API_KEY');
    if (!MAILERLITE_API_KEY) {
      return Response.json({ error: 'MailerLite API key not configured' }, { status: 500 });
    }

    // Fetch leads by IDs
    const allLeads = await base44.asServiceRole.entities.Lead.list('', 500);
    const targetLeads = allLeads.filter(l => leadIds.includes(l.id) && l.email);

    if (targetLeads.length === 0) {
      return Response.json({ error: 'No valid leads found' }, { status: 400 });
    }

    let addedCount = 0;
    let errors = [];

    // Add each lead as subscriber and assign to group
    const batchSize = 10;
    for (let i = 0; i < targetLeads.length; i += batchSize) {
      const batch = targetLeads.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map(async (lead) => {
          // Upsert subscriber and add to group in one call
          const res = await fetch('https://connect.mailerlite.com/api/subscribers', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${MAILERLITE_API_KEY}`,
            },
            body: JSON.stringify({
              email: lead.email,
              fields: {
                name: lead.full_name || lead.first_name || '',
                last_name: lead.last_name || '',
                phone: lead.phone || '',
              },
              groups: [groupId],
            })
          });
          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.message || 'Failed');
          }
          return res;
        })
      );

      for (let j = 0; j < results.length; j++) {
        if (results[j].status === 'fulfilled') {
          addedCount++;
        } else {
          errors.push({ email: batch[j].email, error: results[j].reason?.message });
        }
      }

      if (i + batchSize < targetLeads.length) {
        await new Promise(r => setTimeout(r, 300));
      }
    }

    return Response.json({
      success: true,
      addedCount,
      totalRequested: targetLeads.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Added ${addedCount} leads to group`,
    });
  } catch (error) {
    console.error('mailerLiteBulkAddToGroup error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});