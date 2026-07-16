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
      return Response.json({ error: 'Forbidden: Manager access required' }, { status: 403 });
    }

    const {
      client_name,
      client_email,
      client_phone,
      appointment_type_id,
      scheduled_date,
      scheduled_timezone,
      duration_minutes,
      location_type,
      custom_location,
      notes,
      manager_notes,
      send_confirmation_email,
      sync_to_google_calendar,
    } = await req.json();

    // Validate required fields
    if (!client_name || !client_email || !scheduled_date) {
      return Response.json({ error: 'client_name, client_email, and scheduled_date are required' }, { status: 400 });
    }

    // --- Timezone-safe conversion ---
    // The frontend sends a bare local datetime like "2026-06-01T13:30:00"
    // along with scheduled_timezone = "America/Los_Angeles".
    // We need to convert that to a proper UTC ISO string for storage.
    const tz = scheduled_timezone || 'America/Los_Angeles';
    let scheduledUTC;

    if (scheduled_date.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(scheduled_date)) {
      // Already a full ISO/UTC string (legacy callers) — use as-is
      scheduledUTC = scheduled_date;
    } else {
      // Bare local datetime like "2026-06-01T13:30:00"
      // Convert from Pacific local → UTC using Intl offset detection
      const naiveDate = new Date(scheduled_date);
      // Get the UTC representation of the same wall-clock time in the target timezone
      const utcStr = naiveDate.toLocaleString('en-US', { timeZone: 'UTC' });
      const tzStr = naiveDate.toLocaleString('en-US', { timeZone: tz });
      const utcParsed = new Date(utcStr);
      const tzParsed = new Date(tzStr);
      const offsetMs = utcParsed.getTime() - tzParsed.getTime();
      const utcDate = new Date(naiveDate.getTime() + offsetMs);
      scheduledUTC = utcDate.toISOString();
    }

    console.log('[createManualBooking] Input scheduled_date:', scheduled_date);
    console.log('[createManualBooking] Resolved UTC:', scheduledUTC);

    // Fetch appointment type if provided
    let appointmentType = null;
    if (appointment_type_id) {
      const types = await base44.asServiceRole.entities.AppointmentType.filter({ id: appointment_type_id });
      appointmentType = types[0] || null;
    }

    const effectiveDuration = duration_minutes || appointmentType?.duration || 60;
    const serviceType = appointmentType?.service_type || 'private_sessions';

    // Build location string
    let locationStr = '';
    if (location_type === 'in_person') {
      locationStr = custom_location || '8724 Spanish Ridge Ave #B, Las Vegas, NV 89148';
    } else if (location_type === 'online') {
      locationStr = 'Online (Zoom)';
    } else if (location_type === 'phone') {
      locationStr = 'Phone call';
    } else if (location_type === 'custom' && custom_location) {
      locationStr = custom_location;
    }

    // Create Booking entity — always store UTC
    const bookingData = {
      user_email: client_email.toLowerCase().trim(),
      user_name: client_name.trim(),
      client_phone: client_phone || '',
      staff_id: user.id,
      appointment_type_id: appointment_type_id || null,
      service_type: serviceType,
      session_count: 1,
      amount: 0,
      currency: 'usd',
      payment_status: 'not_required',
      booking_status: 'confirmed',
      booking_source: 'manual_manager',
      location: locationStr || '',
      scheduled_date: scheduledUTC,
      notes: notes || '',
      manager_notes: manager_notes || '',
      can_reschedule: true,
      can_cancel: true,
    };

    console.log('[createManualBooking] Creating booking:', bookingData);
    const booking = await base44.asServiceRole.entities.Booking.create(bookingData);
    console.log('[createManualBooking] Booking created:', booking.id);

    // Create Zoom meeting if online appointment with Zoom enabled
    let zoomResult = null;
    if (location_type === 'online' && appointmentType?.zoom_enabled) {
      try {
        const zoomRes = await base44.asServiceRole.functions.invoke('createZoomMeeting', {
          booking_id: booking.id
        });
        zoomResult = zoomRes;
        console.log('[createManualBooking] Zoom meeting created');
      } catch (zoomErr) {
        console.error('[createManualBooking] Zoom creation failed (non-critical):', zoomErr.message);
      }
    }

    // Send confirmation emails
    let emailsSent = { client: false, manager: false };
    if (send_confirmation_email) {
      // Send client confirmation
      try {
        await base44.asServiceRole.functions.invoke('sendBookingEmail', {
          booking_id: booking.id,
          recipient_type: 'client'
        });
        emailsSent.client = true;
        console.log('[createManualBooking] Client confirmation email sent');
      } catch (emailErr) {
        console.error('[createManualBooking] Client email failed:', emailErr.message);
      }

      // Send manager notification
      try {
        await base44.asServiceRole.functions.invoke('sendBookingEmail', {
          booking_id: booking.id,
          recipient_type: 'manager'
        });
        emailsSent.manager = true;
        console.log('[createManualBooking] Manager notification email sent');
      } catch (emailErr) {
        console.error('[createManualBooking] Manager email failed:', emailErr.message);
      }
    }

    // Sync to Google Calendar
    let calendarSynced = false;
    if (sync_to_google_calendar) {
      try {
        const endDateUTC = new Date(new Date(scheduledUTC).getTime() + effectiveDuration * 60 * 1000).toISOString();
        
        const conn = await base44.asServiceRole.connectors.getConnection('googlecalendar');
        const accessToken = conn.accessToken;

        const calendarEvent = {
          summary: `${client_name} — ${appointmentType?.name || 'Manual Appointment'}`,
          description: [
            `Client: ${client_name}`,
            `Email: ${client_email}`,
            client_phone ? `Phone: ${client_phone}` : null,
            locationStr ? `Location: ${locationStr}` : null,
            notes ? `Notes: ${notes}` : null,
            `Booking ID: ${booking.id}`,
            `Created by: ${user.full_name || user.email} (manual booking)`,
          ].filter(Boolean).join('\n'),
          start: {
            dateTime: scheduledUTC,
            timeZone: tz
          },
          end: {
            dateTime: endDateUTC,
            timeZone: tz
          },
          location: locationStr || undefined,
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

        if (calendarRes.ok) {
          calendarSynced = true;
          const calData = await calendarRes.json();
          // Store Google Calendar event ID on the booking for future cleanup
          if (calData.id) {
            await base44.asServiceRole.entities.Booking.update(booking.id, {
              google_event_id: calData.id
            });
            console.log('[createManualBooking] Stored google_event_id:', calData.id);
          }
          console.log('[createManualBooking] Synced to Google Calendar');
        } else {
          const errText = await calendarRes.text();
          console.error('[createManualBooking] Google Calendar sync failed:', errText);
        }
      } catch (calErr) {
        console.error('[createManualBooking] Google Calendar sync error:', calErr.message);
      }
    }

    // Create/update Lead record if one doesn't exist
    try {
      const existingLeads = await base44.asServiceRole.entities.Lead.filter({ email: client_email.toLowerCase().trim() });
      if (existingLeads.length === 0) {
        await base44.asServiceRole.entities.Lead.create({
          email: client_email.toLowerCase().trim(),
          full_name: client_name.trim(),
          first_name: client_name.split(' ')[0] || '',
          last_name: client_name.split(' ').slice(1).join(' ') || '',
          phone: client_phone || '',
          source: 'booking_system',
          stage: 'booked',
        });
        console.log('[createManualBooking] Lead record created');
      } else {
        // Update stage if currently just "new"
        const lead = existingLeads[0];
        if (lead.stage === 'new' || lead.stage === 'contacted') {
          await base44.asServiceRole.entities.Lead.update(lead.id, { stage: 'booked' });
        }
      }
    } catch (leadErr) {
      console.error('[createManualBooking] Lead upsert failed (non-critical):', leadErr.message);
    }

    // Format display time in Pacific for the response message
    const displayOptions = { 
      weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit',
      timeZone: 'America/Los_Angeles'
    };

    return Response.json({
      success: true,
      booking_id: booking.id,
      booking: booking,
      emails_sent: emailsSent,
      calendar_synced: calendarSynced,
      zoom_created: !!zoomResult,
      message: `Appointment created for ${client_name} on ${new Date(scheduledUTC).toLocaleDateString('en-US', displayOptions)}`,
    });

  } catch (error) {
    console.error('[createManualBooking] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});