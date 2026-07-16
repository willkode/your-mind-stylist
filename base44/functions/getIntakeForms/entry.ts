import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const intakes = await base44.asServiceRole.entities.ConsultationIntake.list('-submitted_date', 200);
    return Response.json({ intakes });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});