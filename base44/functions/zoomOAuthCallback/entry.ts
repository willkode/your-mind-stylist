import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Verify manager access
        const user = await base44.auth.me();
        if (!user || (user.role !== 'admin' && user.custom_role !== 'manager')) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { code } = await req.json();
        
        if (!code) {
            return Response.json({ error: 'No authorization code provided' }, { status: 400 });
        }

        const ZOOM_CLIENT_ID = Deno.env.get('ZOOM_CLIENT_ID');
        const ZOOM_CLIENT_SECRET = Deno.env.get('ZOOM_CLIENT_SECRET');
        const redirectUri = 'https://yourmindstylist.com/ZoomCallback';

        // Exchange code for tokens
        const tokenResponse = await fetch('https://zoom.us/oauth/token', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${btoa(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`)}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: redirectUri
            })
        });

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error('Zoom token exchange failed:', errorText);
            return Response.json({ error: 'Failed to exchange code for tokens' }, { status: 500 });
        }

        const tokens = await tokenResponse.json();
        
        // Calculate expiration time
        const expiresAt = new Date(Date.now() + (tokens.expires_in * 1000)).toISOString();

        // Store tokens in user record
        await base44.auth.updateMe({
            zoom_access_token: tokens.access_token,
            zoom_refresh_token: tokens.refresh_token,
            zoom_token_expires_at: expiresAt,
            zoom_connected: true,
            hasZoom: true
        });

        return Response.json({
            success: true,
            message: 'Zoom account connected successfully'
        });

    } catch (error) {
        console.error('zoomOAuthCallback error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});