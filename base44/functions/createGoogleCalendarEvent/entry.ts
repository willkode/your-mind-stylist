import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isManager = user.role === 'admin' || user.role === 'manager' || user.custom_role === 'manager';
    if (!isManager) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { booking_id, booking_data } = await req.json();
    
    if (!booking_id || !booking_data) {
      return Response.json({ error: 'booking_id and booking_data are required' }, { status: 400 });
    }

    // Get Google Calendar access token
    let accessToken;
    try {
      const conn = await base44.asServiceRole.connectors.getConnection('googlecalendar');
      accessToken = conn.accessToken;
    } catch (err) {
      // Google Calendar not connected - silently return (not required)
      return Response.json({
        success: true,
        message: 'Google Calendar not connected - skipping sync'
      });
    }

    // Extract event details from booking
    const eventTitle = booking_data.user_name;
    const eventDescription = `
Client: ${booking_data.user_name}
Email: ${booking_data.user_email}
Phone: ${booking_data.client_phone || 'N/A'}
Notes: ${booking_data.notes || 'None'}
Booking ID: ${booking_id}
    `.trim();

    // Create Google Calendar event
    const calendarEvent = {
      summary: eventTitle,
      description: eventDescription,
      start: {
        dateTime: booking_data.scheduled_date,
        timeZone: 'America/Los_Angeles'
      },
      end: {
        dateTime: new Date(new Date(booking_data.scheduled_date).getTime() + 60 * 60 * 1000).toISOString(), // 1 hour default
        timeZone: 'America/Los_Angeles'
      },
      attendees: [
        {
          email: booking_data.user_email,
          displayName: booking_data.user_name
        }
      ]
    };

    const calendarRes = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(calendarEvent)
      }
    );

    if (!calendarRes.ok) {
      throw new Error(`Google Calendar API error: ${calendarRes.statusText}`);
    }

    const createdEvent = await calendarRes.json();

    return Response.json({
      success: true,
      calendar_event_id: createdEvent.id,
      message: 'Booking synced to Google Calendar'
    });
  } catch (error) {
    console.error('Google Calendar sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});