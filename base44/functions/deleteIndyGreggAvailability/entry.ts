import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only allow admin/managers to run this
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get all calendar-synced blocked times
    const allRules = await base44.asServiceRole.entities.AvailabilityRule.filter({
      source: 'calendar_sync'
    });
    
    // Filter for rules with "Indy Gregg" in the reason field
    const indyRules = allRules.filter(rule => 
      rule.reason && rule.reason.includes('Indy Gregg')
    );

    console.log(`Found ${indyRules.length} calendar-synced blocked times from Indy Gregg`);

    // Delete each rule in batches
    let deletedCount = 0;
    for (const rule of indyRules) {
      try {
        await base44.asServiceRole.entities.AvailabilityRule.delete(rule.id);
        deletedCount++;
      } catch (err) {
        console.error(`Failed to delete rule ${rule.id}:`, err.message);
      }
    }

    return Response.json({ 
      success: true,
      message: `Deleted ${deletedCount} calendar-synced blocked times from Indy Gregg`,
      total_found: indyRules.length
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});