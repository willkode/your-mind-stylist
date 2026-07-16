import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const url = new URL(req.url);
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state'); // user ID
        const error = url.searchParams.get('error');

        console.log('Callback received:', { code: !!code, state, error });

        if (error) {
            console.error('OAuth error from Google:', error);
            return Response.redirect(`https://yourmindstylist.com/CalendarSettings?error=${error}`);
        }

        if (!code || !state) {
            console.error('Missing params:', { code: !!code, state });
            return Response.redirect(`https://yourmindstylist.com/CalendarSettings?error=missing_params`);
        }

        const clientId = Deno.env.get('GOOGLE_CALENDAR_CLIENT_ID');
        const clientSecret = Deno.env.get('GOOGLE_CALENDAR_CLIENT_SECRET');
        const redirectUri = 'https://yourmindstylist.com/api/functions/googleCalendarCallback';

        // Exchange code for tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code'
            })
        });

        const tokens = await tokenResponse.json();
        console.log('Token exchange response:', { success: !!tokens.access_token, error: tokens.error });

        if (!tokens.access_token) {
            console.error('Token exchange failed:', tokens);
            return Response.redirect(`https://yourmindstylist.com/CalendarSettings?error=token_exchange_failed&details=${tokens.error || 'unknown'}`);
        }

        // Store tokens in user record
        const base44 = createClientFromRequest(req);
        console.log('Updating user:', state);
        try {
            const updateResult = await base44.auth.updateMe({
                google_calendar_access_token: tokens.access_token,
                google_calendar_refresh_token: tokens.refresh_token,
                google_calendar_token_expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
                hasGoogleCalendar: true
            });
            console.log('User update successful:', !!updateResult);
        } catch (updateError) {
            console.error('User update failed:', updateError.message);
            throw new Error(`Failed to save tokens: ${updateError.message}`);
        }

        console.log('Redirecting to success page');
        const redirectUrl = 'https://yourmindstylist.com/ManagerDashboard?calendar_connected=true';
        return new Response(
            `<html><head><meta http-equiv="refresh" content="0;url=${redirectUrl}"></head><body>Connecting... redirecting to dashboard.</body></html>`,
            { 
                status: 200,
                headers: { 
                    'Content-Type': 'text/html',
                    'Location': redirectUrl 
                } 
            }
        );
    } catch (error) {
        console.error('Google Calendar OAuth error:', error);
        console.error('Error stack:', error.stack);
        const errorUrl = `https://yourmindstylist.com/ManagerDashboard?error=${encodeURIComponent(error.message)}`;
        return new Response(
            `<html><head><meta http-equiv="refresh" content="0;url=${errorUrl}"></head><body>Error occurred. Redirecting...</body></html>`,
            { 
                status: 200,
                headers: { 
                    'Content-Type': 'text/html',
                    'Location': errorUrl 
                } 
            }
        );
    }
});