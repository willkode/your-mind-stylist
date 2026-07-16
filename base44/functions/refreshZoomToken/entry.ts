import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const { user_id } = await req.json();
        
        if (!user_id) {
            return Response.json({ error: 'user_id required' }, { status: 400 });
        }

        // Get user with refresh token
        const users = await base44.asServiceRole.entities.User.filter({ id: user_id });
        if (!users || users.length === 0 || !users[0].zoom_refresh_token) {
            return Response.json({ error: 'User not found or Zoom not connected' }, { status: 404 });
        }

        const user = users[0];
        const ZOOM_CLIENT_ID = Deno.env.get('ZOOM_CLIENT_ID');
        const ZOOM_CLIENT_SECRET = Deno.env.get('ZOOM_CLIENT_SECRET');

        // Refresh the access token
        const tokenResponse = await fetch('https://zoom.us/oauth/token', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${btoa(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`)}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: user.zoom_refresh_token
            })
        });

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error('Token refresh failed:', errorText);
            
            // Mark Zoom as disconnected
            await base44.asServiceRole.entities.User.update(user_id, {
                zoom_connected: false
            });
            
            return Response.json({ error: 'Failed to refresh token' }, { status: 500 });
        }

        const tokens = await tokenResponse.json();
        const expiresAt = new Date(Date.now() + (tokens.expires_in * 1000)).toISOString();

        // Update user with new tokens
        await base44.asServiceRole.entities.User.update(user_id, {
            zoom_access_token: tokens.access_token,
            zoom_refresh_token: tokens.refresh_token,
            zoom_token_expires_at: expiresAt,
            zoom_connected: true
        });

        return Response.json({
            access_token: tokens.access_token,
            expires_at: expiresAt
        });

    } catch (error) {
        console.error('refreshZoomToken error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});