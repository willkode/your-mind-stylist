import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Get request data
        const { booking_id, topic, start_time, duration, timezone } = await req.json();

        if (!booking_id) {
            return Response.json({ error: 'booking_id required' }, { status: 400 });
        }

        // Get booking to find assigned manager
        const bookings = await base44.asServiceRole.entities.Booking.filter({ id: booking_id });
        if (!bookings || bookings.length === 0) {
            return Response.json({ error: 'Booking not found' }, { status: 404 });
        }
        const booking = bookings[0];

        // Get Zoom access token directly
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
            const tokenError = await tokenResponse.text();
            console.error('Zoom token error:', tokenError);
            return Response.json({ 
                error: 'Failed to get Zoom access token',
                details: tokenError
            }, { status: tokenResponse.status });
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;



        // Configure meeting details based on service type
        const serviceType = booking.service_type || 'private_sessions';
        const meetingConfigs = {
            'private_sessions': {
                duration: 60,
                host_video: true,
                participant_video: true,
                waiting_room: true,
                mute_upon_entry: false,
            },
            'consultation': {
                duration: 30,
                host_video: true,
                participant_video: true,
                waiting_room: true,
                mute_upon_entry: false,
            },
            'certification': {
                duration: 90,
                host_video: true,
                participant_video: true,
                waiting_room: false,
                mute_upon_entry: false,
            },
            'other': {
                duration: 60,
                host_video: true,
                participant_video: true,
                waiting_room: true,
                mute_upon_entry: false,
            }
        };

        const config = meetingConfigs[serviceType] || meetingConfigs['other'];

        const meetingData = {
            topic: topic || `${serviceType.replace('_', ' ').toUpperCase()} - ${booking.user_name}`,
            type: 2, // Scheduled meeting
            start_time: start_time || new Date().toISOString(),
            duration: duration || config.duration,
            timezone: timezone || 'America/Los_Angeles',
            settings: {
                host_video: config.host_video,
                participant_video: config.participant_video,
                join_before_host: false,
                mute_upon_entry: config.mute_upon_entry,
                waiting_room: config.waiting_room,
                audio: 'both',
                auto_recording: 'none',
                approval_type: 2 // No registration required
            }
        };

        // For Server-to-Server OAuth, use "me" as the user identifier
        console.log('Creating Zoom meeting...');
        console.log('Access token received:', accessToken ? 'Yes' : 'No');

        // Create Zoom meeting via API - use "me" for Server-to-Server OAuth
        const zoomResponse = await fetch(`https://api.zoom.us/v2/users/me/meetings`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(meetingData)
        });

        if (!zoomResponse.ok) {
            const errorText = await zoomResponse.text();
            console.error('Zoom API error status:', zoomResponse.status);
            console.error('Zoom API error response (full):', errorText);
            console.error('Request URL:', `https://api.zoom.us/v2/users/me/meetings`);
            console.error('Access token (first 20 chars):', accessToken.substring(0, 20));

            // Update booking with failed status
            await base44.asServiceRole.entities.Booking.update(booking_id, {
                zoom_status: 'failed'
            });

            return Response.json({ 
                error: 'Failed to create Zoom meeting',
                details: errorText,
                status: zoomResponse.status
            }, { status: zoomResponse.status });
        }

        const meeting = await zoomResponse.json();

        // Update booking with Zoom meeting details
        await base44.asServiceRole.entities.Booking.update(booking_id, {
            zoom_meeting_id: meeting.id.toString(),
            zoom_join_url: meeting.join_url,
            zoom_start_url: meeting.start_url,
            zoom_password: meeting.password,
            zoom_status: 'created'
        });

        return Response.json({
            success: true,
            meeting_id: meeting.id,
            join_url: meeting.join_url,
            start_url: meeting.start_url,
            password: meeting.password
        });

    } catch (error) {
        console.error('createZoomMeeting error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});