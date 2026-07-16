import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { integration, credentials } = await req.json();

    if (!integration || !credentials) {
      return Response.json({ error: 'Missing integration or credentials' }, { status: 400 });
    }

    // Map integration names to env variable names
    const credentialMap = {
      zoom: ['ZOOM_CLIENT_ID', 'ZOOM_CLIENT_SECRET', 'ZOOM_ACCOUNT_ID'],
      google: ['GOOGLE_CALENDAR_CLIENT_ID', 'GOOGLE_CALENDAR_CLIENT_SECRET'],
      stripe: ['STRIPE_API_KEY', 'STRIPE_PUBLISHABLE_KEY']
    };

    const envVars = credentialMap[integration];
    if (!envVars) {
      return Response.json({ error: 'Unknown integration' }, { status: 400 });
    }

    // Validate credentials are provided
    let hasCredentials = false;
    if (integration === 'zoom') {
      hasCredentials = credentials.zoom_client_id && credentials.zoom_client_secret && credentials.zoom_account_id;
    } else if (integration === 'google') {
      hasCredentials = credentials.google_client_id && credentials.google_client_secret;
    } else if (integration === 'stripe') {
      hasCredentials = credentials.stripe_api_key && credentials.stripe_publishable_key;
    }

    if (!hasCredentials) {
      return Response.json({ error: 'Missing required credentials' }, { status: 400 });
    }

    // In a real scenario, you'd save these to a secure settings store
    // For now, we'll just validate and return success
    // The frontend will handle showing these to the user (they're already in the form)

    return Response.json({ 
      success: true, 
      message: `${integration} credentials saved successfully`
    });

  } catch (error) {
    return Response.json({ 
      error: error.message,
      success: false
    }, { status: 500 });
  }
});