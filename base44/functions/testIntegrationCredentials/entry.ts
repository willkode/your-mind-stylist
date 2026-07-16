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

    // Test Zoom credentials
    if (integration === 'zoom') {
      const { zoom_client_id, zoom_client_secret, zoom_account_id } = credentials;
      
      if (!zoom_client_id || !zoom_client_secret || !zoom_account_id) {
        return Response.json({ 
          success: false, 
          error: 'Missing Client ID, Client Secret, or Account ID' 
        });
      }

      // Test OAuth token request
      try {
        const tokenResponse = await fetch('https://zoom.us/oauth/token', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`${zoom_client_id}:${zoom_client_secret}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: 'grant_type=account_credentials&account_id=' + zoom_account_id
        });

        if (!tokenResponse.ok) {
          const error = await tokenResponse.json();
          return Response.json({ 
            success: false, 
            error: error.reason || 'Invalid Zoom credentials' 
          });
        }

        return Response.json({ success: true });
      } catch (error) {
        return Response.json({ 
          success: false, 
          error: 'Could not connect to Zoom: ' + error.message 
        });
      }
    }

    // Test Stripe credentials
    if (integration === 'stripe') {
      const { stripe_api_key } = credentials;

      if (!stripe_api_key) {
        return Response.json({ 
          success: false, 
          error: 'Missing API Key' 
        });
      }

      try {
        const response = await fetch('https://api.stripe.com/v1/account', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${stripe_api_key}`
          }
        });

        if (!response.ok) {
          return Response.json({ 
            success: false, 
            error: 'Invalid Stripe API key' 
          });
        }

        return Response.json({ success: true });
      } catch (error) {
        return Response.json({ 
          success: false, 
          error: 'Could not connect to Stripe: ' + error.message 
        });
      }
    }

    // Test Google credentials
    if (integration === 'google') {
      const { google_client_id, google_client_secret } = credentials;

      if (!google_client_id || !google_client_secret) {
        return Response.json({ 
          success: false, 
          error: 'Missing Client ID or Client Secret' 
        });
      }

      // Google credentials validation happens during OAuth flow
      // Here we just check that they're not empty
      return Response.json({ 
        success: true,
        message: 'Configuration saved. Full validation happens during OAuth flow.'
      });
    }

    return Response.json({ 
      success: false, 
      error: 'Unknown integration' 
    });

  } catch (error) {
    return Response.json({ 
      error: error.message,
      success: false
    }, { status: 500 });
  }
});