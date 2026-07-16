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
      return Response.json({ success: true, message: 'No calendar event to delete' });
    }

    // Get access token
    const conn = await base44.asServiceRole.connectors.getConnection('googlecalendar');
    const accessToken = conn.accessToken;
    
    if (!accessToken) {
      return Response.json({ error: 'Google Calendar not connected' }, { status: 400 });
    }

    // Delete calendar event
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${booking.google_event_id}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok && response.status !== 404) {
      const error = await response.text();
      throw new Error(`Google Calendar API error: ${error}`);
    }

    // Clear calendar event ID from booking
    await base44.asServiceRole.entities.Booking.update(booking_id, {
      google_event_id: null,
    });

    return Response.json({
      success: true,
      message: 'Calendar event deleted',
    });
  } catch (error) {
    console.error('Calendar delete error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});