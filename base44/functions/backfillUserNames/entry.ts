import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch all users and leads
    const allUsers = await base44.asServiceRole.entities.User.list('-created_date', 500);
    const allLeads = await base44.asServiceRole.entities.Lead.list('-created_date', 2000);

    // Build email→lead lookup
    const leadByEmail = {};
    allLeads.forEach(lead => {
      if (lead.email) {
        leadByEmail[lead.email.toLowerCase()] = lead;
      }
    });

    let updated = 0;
    let skipped = 0;
    const details = [];

    for (const u of allUsers) {
      // Skip if user already has first_name AND last_name set
      if (u.first_name && u.last_name) {
        skipped++;
        continue;
      }

      const lead = u.email ? leadByEmail[u.email.toLowerCase()] : null;
      const updates = {};

      // Try to derive first_name / last_name from various sources
      let firstName = u.first_name || null;
      let lastName = u.last_name || null;

      // Source 1: Lead record
      if (lead) {
        if (!firstName && lead.first_name) firstName = lead.first_name;
        if (!lastName && lead.last_name) lastName = lead.last_name;

        // If lead has full_name but no split name
        if ((!firstName || !lastName) && lead.full_name) {
          const parts = lead.full_name.trim().split(/\s+/);
          if (!firstName) firstName = parts[0];
          if (!lastName && parts.length > 1) lastName = parts.slice(1).join(' ');
        }
      }

      // Source 2: User's own full_name (built-in field)
      // Only use full_name if it looks like a real name (has a space, not just an email prefix)
      if ((!firstName || !lastName) && u.full_name && u.full_name.includes(' ')) {
        const parts = u.full_name.trim().split(/\s+/);
        if (!firstName) firstName = parts[0];
        if (!lastName && parts.length > 1) lastName = parts.slice(1).join(' ');
      }

      // Generate username from email if not set
      let username = u.username;
      if (!username && u.email) {
        username = u.email.split('@')[0].replace(/[._+]/g, '').toLowerCase();
      }

      // Build update payload
      if (firstName && firstName !== u.first_name) updates.first_name = firstName;
      if (lastName && lastName !== u.last_name) updates.last_name = lastName;
      if (username && username !== u.username) updates.username = username;

      // Mark profile_complete if we now have both names
      if ((firstName || u.first_name) && (lastName || u.last_name)) {
        updates.profile_complete = true;
      }

      if (Object.keys(updates).length > 0) {
        await base44.asServiceRole.entities.User.update(u.id, updates);
        updated++;
        details.push({
          email: u.email,
          updates,
          source: lead ? 'lead' : 'full_name',
        });
      } else {
        skipped++;
      }
    }

    return Response.json({
      success: true,
      total_users: allUsers.length,
      updated,
      skipped,
      details,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});