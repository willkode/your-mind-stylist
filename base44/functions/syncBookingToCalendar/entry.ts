import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json();

    // Support both entity automation payload and direct call
    let booking_id, old_data;
    if (body.event && body.event.entity_id) {
      booking_id = body.event.entity_id;
      old_data = body.old_data;
    } else {
      booking_id = body.booking_id;
    }

    if (!booking_id) {
      return Response.json({ error: 'booking_id is required' }, { status: 400 });
    }

    // Get booking
    const bookings = await base44.asServiceRole.entities.Booking.filter({ id: booking_id });
    if (!bookings || bookings.length === 0) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    const booking = bookings[0];

    // Only sync confirmed or scheduled bookings with a scheduled date
    if (!['confirmed', 'scheduled'].includes(booking.booking_status) || !booking.scheduled_date) {
      return Response.json({ success: true, message: 'Booking not in a syncable status or missing date, skipping.' });
    }

    // Skip if nothing meaningful changed (avoid quota exhaustion on minor updates)
    if (old_data) {
      const relevantChanged = 
        old_data.scheduled_date !== booking.scheduled_date ||
        old_data.booking_status !== booking.booking_status ||
        old_data.zoom_join_url !== booking.zoom_join_url ||
        old_data.appointment_type_id !== booking.appointment_type_id ||
        old_data.google_event_id !== booking.google_event_id;
      
      if (!relevantChanged) {
        return Response.json({ success: true, message: 'No relevant changes, skipping calendar sync.' });
      }
    }

    // Get access token
    const conn = await base44.asServiceRole.connectors.getConnection('googlecalendar');
    const accessToken = conn.accessToken;
    
    if (!accessToken) {
      return Response.json({ error: 'Google Calendar not connected' }, { status: 400 });
    }

    // Get appointment type for duration
    let durationMinutes = 60;
    if (booking.appointment_type_id) {
      const apptTypes = await base44.asServiceRole.entities.AppointmentType.filter({ id: booking.appointment_type_id });
      if (apptTypes && apptTypes.length > 0) {
        durationMinutes = apptTypes[0].duration || 60;
      }
    }

    const startTime = new Date(booking.scheduled_date);
    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

    const eventData = {
      summary: `${booking.user_name} - Session`,
      description: `Booking ID: ${booking.id}\nClient: ${booking.user_name}\nEmail: ${booking.user_email}\nPhone: ${booking.client_phone || 'N/A'}\n\n${booking.zoom_join_url ? `Join Zoom Meeting: ${booking.zoom_join_url}\nPassword: ${booking.zoom_password || 'N/A'}` : 'No Zoom link'}`,
      location: booking.zoom_join_url || '',
      start: {
        dateTime: startTime.toISOString(),
        timeZone: 'America/Los_Angeles',
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'America/Los_Angeles',
      },
      attendees: [
        { email: booking.user_email },
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 60 },
        ],
      },
    };

    let response, event;
    const existingEventId = booking.google_event_id;

    if (existingEventId) {
      // Update existing event
      response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${existingEventId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });
    } else {
      // Create new event
      response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });
    }

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google Calendar API error: ${error}`);
    }

    event = await response.json();

    // Save google_event_id on first creation (matches Booking entity schema field name)
    if (!existingEventId && !old_data) {
      await base44.asServiceRole.entities.Booking.update(booking_id, {
        google_event_id: event.id,
      });
    } else if (!existingEventId && old_data) {
      // Called from entity automation - save event ID only if it wasn't set before
      if (!old_data.google_event_id) {
        await base44.asServiceRole.entities.Booking.update(booking_id, {
          google_event_id: event.id,
        });
      }
    }

    return Response.json({
      success: true,
      event_id: event.id,
      event_link: event.htmlLink,
      action: existingEventId ? 'updated' : 'created',
    });
  } catch (error) {
    console.error('Calendar sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});