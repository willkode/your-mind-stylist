import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { sequence_id } = await req.json();
    if (!sequence_id) {
      return Response.json({ error: 'sequence_id required' }, { status: 400 });
    }

    const MAILERLITE_API_KEY = Deno.env.get("MAILERLITE_API_KEY");
    if (!MAILERLITE_API_KEY) {
      return Response.json({ error: 'MailerLite API key not configured' }, { status: 500 });
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MAILERLITE_API_KEY}`,
    };

    // Get sequence
    const sequences = await base44.asServiceRole.entities.EmailSequence.filter({ id: sequence_id });
    if (sequences.length === 0) {
      return Response.json({ error: 'Sequence not found' }, { status: 404 });
    }
    const sequence = sequences[0];

    // Get steps
    const steps = await base44.asServiceRole.entities.EmailSequenceStep.filter({ sequence_id });
    const sortedSteps = steps.sort((a, b) => a.step_number - b.step_number);

    // Step 1: Create or get a MailerLite group for this sequence
    let groupId = sequence.mailerlite_group_id;
    if (!groupId) {
      const groupName = `Sequence: ${sequence.name}`;
      const groupRes = await fetch('https://connect.mailerlite.com/api/groups', {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: groupName }),
      });
      
      if (groupRes.ok) {
        const groupData = await groupRes.json();
        groupId = groupData.data.id;
      } else {
        // Group might already exist, try to find it
        const listRes = await fetch('https://connect.mailerlite.com/api/groups?limit=100', { headers });
        const listData = await listRes.json();
        const existing = listData.data?.find(g => g.name === groupName);
        if (existing) {
          groupId = existing.id;
        } else {
          const errText = await groupRes.text();
          return Response.json({ error: 'Failed to create MailerLite group', details: errText }, { status: 500 });
        }
      }
    }

    // Step 2: Sync currently enrolled active users to the group
    const enrollments = await base44.asServiceRole.entities.UserEmailSequence.filter({
      sequence_id,
      status: 'active',
    });

    let syncedCount = 0;
    for (const enrollment of enrollments) {
      const subRes = await fetch('https://connect.mailerlite.com/api/subscribers', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: enrollment.user_email,
          groups: [groupId],
        }),
      });
      if (subRes.ok) syncedCount++;
    }

    // Step 3: Update sequence with group ID
    await base44.asServiceRole.entities.EmailSequence.update(sequence_id, {
      mailerlite_group_id: groupId,
      total_emails: sortedSteps.length,
    });

    return Response.json({
      success: true,
      group_id: groupId,
      synced_subscribers: syncedCount,
      total_enrollments: enrollments.length,
      steps_count: sortedSteps.length,
      message: `Synced ${syncedCount} subscribers to MailerLite group. ${sortedSteps.length} email steps configured.`,
    });

  } catch (error) {
    console.error('Sync sequence to MailerLite error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});