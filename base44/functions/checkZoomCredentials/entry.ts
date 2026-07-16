import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Verify manager access
        const user = await base44.auth.me();
        if (!user || (user.role !== 'admin' && user.custom_role !== 'manager')) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if all required Zoom credentials are set
        const accountId = Deno.env.get('ZOOM_ACCOUNT_ID');
        const clientId = Deno.env.get('ZOOM_CLIENT_ID');
        const clientSecret = Deno.env.get('ZOOM_CLIENT_SECRET');

        const isConfigured = !!(accountId && clientId && clientSecret);

        return Response.json({
            isConfigured,
            message: isConfigured 
                ? 'Zoom Server-to-Server OAuth is configured' 
                : 'Zoom credentials not configured'
        });

    } catch (error) {
        console.error('checkZoomCredentials error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});