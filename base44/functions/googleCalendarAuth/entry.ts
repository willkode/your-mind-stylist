import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || (user.role !== 'admin' && user.custom_role !== 'manager')) {
            return Response.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const clientId = Deno.env.get('GOOGLE_CALENDAR_CLIENT_ID');
        const redirectUri = 'https://yourmindstylist.com/api/functions/googleCalendarCallback';

        const scopes = [
            'https://www.googleapis.com/auth/calendar.events',
            'https://www.googleapis.com/auth/calendar.readonly'
        ].join(' ');

        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${clientId}&` +
            `redirect_uri=${encodeURIComponent(redirectUri)}&` +
            `response_type=code&` +
            `scope=${encodeURIComponent(scopes)}&` +
            `access_type=offline&` +
            `prompt=consent&` +
            `state=${user.id}`;

        return Response.json({ authUrl });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});