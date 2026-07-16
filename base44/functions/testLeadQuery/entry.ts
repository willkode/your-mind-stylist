import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Test 1: Simple list
    const leads = await base44.entities.Lead.list('-created_date', 500);
    
    // Test 2: Filter all
    const allLeads = await base44.asServiceRole.entities.Lead.filter({}, '-created_date', 500);
    
    return Response.json({
      user_scoped_count: leads.length,
      service_role_count: allLeads.length,
      sample_user_scoped: leads.slice(0, 2),
      sample_service_role: allLeads.slice(0, 2),
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});