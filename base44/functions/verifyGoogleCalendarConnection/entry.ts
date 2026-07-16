import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Allow both admin and manager
    if (user.role !== 'admin' && user.role !== 'manager' && user.custom_role !== 'manager') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get access token using app connector
    let accessToken;
    try {
      const conn = await base44.asServiceRole.connectors.getConnection('googlecalendar');
      accessToken = conn.accessToken;
    } catch (err) {
      return Response.json({ 
        connected: false, 
        message: 'No Google Calendar connector authorized' 
      });
    }

    // Test with a lightweight calendar list call
    const calendarRes = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=5',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (calendarRes.status === 401 || calendarRes.status === 403) {
      return Response.json({ 
        connected: false, 
        message: 'Token is invalid or expired — Google Calendar needs to be reconnected'
      });
    }

    if (!calendarRes.ok) {
      return Response.json({ 
        connected: false, 
        message: `Calendar API returned ${calendarRes.status}: ${calendarRes.statusText}`
      });
    }

    const calData = await calendarRes.json();
    const calendars = (calData.items || []).map(c => c.summary || c.id);

    return Response.json({ 
      connected: true, 
      calendars: calendars,
      message: `Connected — ${calendars.length} calendars accessible`
    });
  } catch (error) {
    console.error('Verification error:', error);
    return Response.json({ 
      connected: false, 
      error: error.message 
    }, { status: 500 });
  }
});