import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Verify manager/admin access
        const user = await base44.auth.me();
        if (!user || (user.role !== 'admin' && user.custom_role !== 'manager')) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const ZOOM_CLIENT_ID = Deno.env.get('ZOOM_CLIENT_ID');

        return Response.json({
            client_id: ZOOM_CLIENT_ID
        });

    } catch (error) {
        console.error('getZoomClientId error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});