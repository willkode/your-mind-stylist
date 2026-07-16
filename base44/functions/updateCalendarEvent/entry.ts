import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role === 'user') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { booking_id } = await req.json();

    // Get booking
    const bookings = await base44.asServiceRole.entities.Booking.filter({ id: booking_id });
    if (!bookings || bookings.length === 0) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    const booking = bookings[0];

    if (!booking.google_event_id) {
      return Response.json({ error: 'No calendar event linked' }, { status: 400 });
    }

    // Get access token
    const conn = await base44.asServiceRole.connectors.getConnection('googlecalendar');
    const accessToken = conn.accessToken;
    
    if (!accessToken) {
      return Response.json({ error: 'Google Calendar not connected' }, { status: 400 });
    }

    // Update calendar event
    const eventData = {
      summary: `${booking.service_type} Session with ${booking.user_name}`,
      description: `Booking ID: ${booking.id}\nClient: ${booking.user_name}\nEmail: ${booking.user_email}\nPhone: ${booking.client_phone || 'N/A'}\n\nZoom: ${booking.zoom_join_url || 'Not created yet'}`,
      start: {
        dateTime: new Date(booking.scheduled_date).toISOString(),
        timeZone: 'America/Los_Angeles',
      },
      end: {
        dateTime: new Date(new Date(booking.scheduled_date).getTime() + 60 * 60 * 1000).toISOString(),
        timeZone: 'America/Los_Angeles',
      },
      attendees: [
        { email: booking.user_email },
      ],
      conferenceData: booking.zoom_join_url ? {
        entryPoints: [{
          entryPointType: 'video',
          uri: booking.zoom_join_url,
        }],
      } : undefined,
    };

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${booking.google_event_id}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google Calendar API error: ${error}`);
    }

    const event = await response.json();

    return Response.json({
      success: true,
      event_id: event.id,
      event_link: event.htmlLink,
    });
  } catch (error) {
    console.error('Calendar update error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});