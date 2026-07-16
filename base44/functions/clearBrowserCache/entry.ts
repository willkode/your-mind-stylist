import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return cache-busting headers
    return Response.json(
      { success: true, message: 'Cache cleared' },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store',
          'Clear-Site-Data': '"cache", "cookies", "storage"',
        },
      }
    );
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});