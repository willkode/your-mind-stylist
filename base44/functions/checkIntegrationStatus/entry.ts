import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check which credentials are configured
    const zoom = {
      configured: !!Deno.env.get('ZOOM_CLIENT_ID') && !!Deno.env.get('ZOOM_CLIENT_SECRET'),
      valid: null
    };

    const google = {
      configured: !!Deno.env.get('GOOGLE_CALENDAR_CLIENT_ID') && !!Deno.env.get('GOOGLE_CALENDAR_CLIENT_SECRET'),
      valid: null
    };

    const stripe = {
      configured: !!Deno.env.get('STRIPE_API_KEY') && !!Deno.env.get('STRIPE_PUBLISHABLE_KEY'),
      valid: null
    };

    return Response.json({ 
      zoom,
      google,
      stripe
    });

  } catch (error) {
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});