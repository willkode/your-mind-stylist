import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        // Use Server-to-Server OAuth with account-level credentials
        const ZOOM_ACCOUNT_ID = Deno.env.get('ZOOM_ACCOUNT_ID');
        const ZOOM_CLIENT_ID = Deno.env.get('ZOOM_CLIENT_ID');
        const ZOOM_CLIENT_SECRET = Deno.env.get('ZOOM_CLIENT_SECRET');

        if (!ZOOM_ACCOUNT_ID || !ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET) {
            return Response.json({ 
                error: 'Zoom credentials not configured',
                message: 'Please set ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, and ZOOM_CLIENT_SECRET'
            }, { status: 500 });
        }

        // Get access token using Server-to-Server OAuth
        const tokenUrl = 'https://zoom.us/oauth/token';
        const credentials = btoa(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`);
        
        const body = new URLSearchParams();
        body.append('grant_type', 'account_credentials');
        body.append('account_id', ZOOM_ACCOUNT_ID);

        const tokenResponse = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: body.toString()
        });

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error('Zoom token error:', errorText);
            return Response.json({ 
                error: 'Failed to get Zoom access token',
                details: errorText
            }, { status: tokenResponse.status });
        }

        const tokenData = await tokenResponse.json();

        return Response.json({
            access_token: tokenData.access_token
        });

    } catch (error) {
        console.error('getZoomToken error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});