import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const products = await base44.asServiceRole.entities.Product.filter(
      { status: "published", active: true },
      "display_order",
      200
    );
    return Response.json({ products });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});