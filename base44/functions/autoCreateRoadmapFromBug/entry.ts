import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    if (body.event.type !== 'create' || body.event.entity_name !== 'BugReport') {
      return Response.json({ success: true });
    }

    const bugData = body.data;

    // Create a corresponding RoadmapItem
    await base44.asServiceRole.entities.RoadmapItem.create({
      title: bugData.title,
      description: bugData.description,
      category: 'Bug Fix',
      priority: bugData.priority || 'Medium',
      status: 'Planned',
      source: 'BugTracker',
      notes: `Page: ${bugData.page_url}\nReporter: ${bugData.reporter_name}\n\n${bugData.notes || ''}`
    });

    return Response.json({ success: true, message: 'RoadmapItem created from bug report' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});