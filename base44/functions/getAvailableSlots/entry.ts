import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const { appointment_type_id, start_date, end_date, debug } = await req.json();

    if (!appointment_type_id || !start_date || !end_date) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Get appointment type details
    const appointmentTypes = await base44.asServiceRole.entities.AppointmentType.filter({ id: appointment_type_id });
    const appointmentType = appointmentTypes[0];

    if (!appointmentType) {
      return Response.json({ error: 'Appointment type not found' }, { status: 404 });
    }

    const managerId = appointmentType.manager_id;
    if (!managerId) {
      return Response.json({ error: 'No manager assigned to this appointment type' }, { status: 400 });
    }

    // --- Load availability rules ---
    // 1. Appointment-specific available rules
    let availabilityRules = await base44.asServiceRole.entities.AvailabilityRule.filter({
      manager_id: managerId,
      appointment_type_id: appointment_type_id,
      active: true
    });

    // 2. If no appointment-specific rules, use general available rules
    if (availabilityRules.length === 0) {
      availabilityRules = await base44.asServiceRole.entities.AvailabilityRule.filter({
        manager_id: managerId,
        appointment_type_id: null,
        active: true
      });
    }

    // 3. ALWAYS load ALL general blocked rules (calendar_sync + manual blocks)
    // These apply to ALL appointment types regardless
    const generalBlockedRules = await base44.asServiceRole.entities.AvailabilityRule.filter({
      manager_id: managerId,
      appointment_type_id: null,
      rule_type: 'blocked',
      active: true
    });

    // 4. Also load appointment-specific blocked rules
    const specificBlockedRules = await base44.asServiceRole.entities.AvailabilityRule.filter({
      manager_id: managerId,
      appointment_type_id: appointment_type_id,
      rule_type: 'blocked',
      active: true
    });

    // Merge all blocked rules in (dedup by id)
    const ruleIds = new Set(availabilityRules.map(r => r.id));
    for (const r of [...generalBlockedRules, ...specificBlockedRules]) {
      if (!ruleIds.has(r.id)) {
        availabilityRules.push(r);
        ruleIds.add(r.id);
      }
    }

    // --- Load settings ---
    let availabilitySettings = await base44.asServiceRole.entities.AvailabilitySettings.filter({
      manager_id: managerId,
      appointment_type_id: appointment_type_id
    });
    if (availabilitySettings.length === 0) {
      availabilitySettings = await base44.asServiceRole.entities.AvailabilitySettings.filter({
        manager_id: managerId,
        appointment_type_id: null
      });
    }
    const settings = availabilitySettings[0] || {
      buffer_minutes: 15,
      min_notice_hours: 24,
      max_advance_days: 90,
      timezone: 'America/Los_Angeles'
    };
    const tz = settings.timezone || 'America/Los_Angeles';

    // --- Load existing bookings ---
    const existingBookings = await base44.asServiceRole.entities.Booking.filter({
      staff_id: managerId,
      booking_status: { $in: ['confirmed', 'scheduled', 'pending_payment'] }
    });

    // --- Also load ALL appointment types for this manager to get their durations ---
    const allAppointmentTypes = await base44.asServiceRole.entities.AppointmentType.filter({
      manager_id: managerId,
      active: true
    });
    const appointmentTypeDurations = {};
    for (const at of allAppointmentTypes) {
      appointmentTypeDurations[at.service_type] = at.duration || 60;
      appointmentTypeDurations[at.id] = at.duration || 60;
    }

    // --- Timezone-correct helper functions ---
    // Convert a local time string "YYYY-MM-DDThh:mm:00" in the manager's timezone to a UTC Date
    const localToUTC = (dateStr, timeStr) => {
      // Build an ISO-like string and use Intl to figure out the UTC offset
      const fakeDate = new Date(`${dateStr}T${timeStr}:00`);
      // Get what the same instant looks like in UTC vs the target timezone
      const utcStr = fakeDate.toLocaleString('en-US', { timeZone: 'UTC' });
      const tzStr = fakeDate.toLocaleString('en-US', { timeZone: tz });
      const utcParsed = new Date(utcStr);
      const tzParsed = new Date(tzStr);
      const offsetMs = utcParsed.getTime() - tzParsed.getTime();
      // The actual UTC time = local time + offset
      return new Date(fakeDate.getTime() + offsetMs);
    };

    // Get the YYYY-MM-DD in the manager's timezone for a given Date
    const getLocalDate = (d) => {
      return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
    };

    // Get the day-of-week (0=Sun) in the manager's timezone for a given Date
    const getLocalDayOfWeek = (d) => {
      const dayStr = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short' }).format(d);
      const map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      return map[dayStr] ?? 0;
    };

    // --- Generate slots ---
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const now = new Date();
    const minBookingTime = new Date(now.getTime() + settings.min_notice_hours * 60 * 60 * 1000);
    const maxBookingTime = new Date(now.getTime() + settings.max_advance_days * 24 * 60 * 60 * 1000);

    const availableSlots = [];
    const debugLog = [];

    // Iterate by LOCAL date strings (YYYY-MM-DD) to avoid timezone confusion
    // The caller sends dates like "2026-05-06" meaning May 6 in the manager's timezone
    const startDateStr = start_date.split('T')[0]; // "2026-05-06"
    const endDateStr = end_date.split('T')[0];     // "2026-05-15"

    // Build list of date strings to iterate
    const datesToCheck = [];
    {
      const d = new Date(startDateStr + 'T12:00:00Z'); // noon UTC to avoid DST edge
      const e = new Date(endDateStr + 'T12:00:00Z');
      while (d <= e) {
        datesToCheck.push(d.toISOString().split('T')[0]); // YYYY-MM-DD
        d.setUTCDate(d.getUTCDate() + 1);
      }
    }

    for (const dateStr of datesToCheck) {
      // Compute day of week for this local date
      const dayOfWeek = localToUTC(dateStr, '12:00').getUTCDay();
      // Adjust for timezone: the day of week should be for the LOCAL date, not UTC
      // Since we're using the date string directly, compute from Date constructor
      const [y, m, dd] = dateStr.split('-').map(Number);
      const localDow = new Date(y, m - 1, dd).getDay();

      // Find AVAILABLE rules for this day
      const dayRules = availabilityRules.filter(rule =>
        rule.is_available && (
          (rule.day_of_week === localDow && !rule.specific_date) ||
          (rule.specific_date === dateStr)
        )
      );

      // Find ALL BLOCKED rules for this day (both specific_date and recurring day_of_week)
      const blockedRules = availabilityRules.filter(rule =>
        !rule.is_available && (
          (rule.specific_date === dateStr) ||
          (rule.day_of_week === localDow && !rule.specific_date)
        )
      );

      if (debug && blockedRules.length > 0) {
        debugLog.push({
          date: dateStr,
          blocked_rules_count: blockedRules.length,
          blocked_rules: blockedRules.map(r => ({
            id: r.id,
            start: r.start_time,
            end: r.end_time,
            reason: r.reason,
            source: r.source,
            specific_date: r.specific_date
          }))
        });
      }

      if (dayRules.length > 0) {
        for (const rule of dayRules) {
          // Convert available window to UTC
          const windowStartUTC = localToUTC(dateStr, rule.start_time);
          const windowEndUTC = localToUTC(dateStr, rule.end_time);

          // Pre-convert all blocked rules to UTC for this date
          const blockedRangesUTC = blockedRules.map(br => ({
            start: localToUTC(dateStr, br.start_time),
            end: localToUTC(dateStr, br.end_time),
            reason: br.reason
          }));

          // Generate time slots within the available window
          let slotStart = new Date(windowStartUTC);
          const duration = appointmentType.duration || 60;
          const buffer = settings.buffer_minutes || 0;
          const slotStep = (duration + buffer) * 60 * 1000;

          while (slotStart < windowEndUTC) {
            const slotEnd = new Date(slotStart.getTime() + duration * 60 * 1000);

            // Slot must fit within the available window
            if (slotEnd > windowEndUTC) break;

            // Slot must be within booking bounds
            if (slotStart >= minBookingTime && slotStart <= maxBookingTime) {

              // Check overlap with BLOCKED calendar rules
              // Correct overlap: slot_start < block_end AND slot_end > block_start
              const hasBlockedConflict = blockedRangesUTC.some(block =>
                slotStart < block.end && slotEnd > block.start
              );

              // Check overlap with existing BOOKINGS (across ALL appointment types)
              const hasBookingConflict = existingBookings.some(booking => {
                if (!booking.scheduled_date) return false;
                const bookingStart = new Date(booking.scheduled_date);
                // Use actual duration from the booking's appointment type, not a hardcoded 1h
                const bookingDurationMin = appointmentTypeDurations[booking.appointment_type_id]
                  || appointmentTypeDurations[booking.service_type]
                  || 60;
                const bookingEnd = new Date(bookingStart.getTime() + bookingDurationMin * 60 * 1000);

                // Add buffer time around bookings
                const bufferStart = new Date(bookingStart.getTime() - buffer * 60 * 1000);
                const bufferEnd = new Date(bookingEnd.getTime() + buffer * 60 * 1000);

                return (slotStart < bufferEnd && slotEnd > bufferStart);
              });

              if (!hasBlockedConflict && !hasBookingConflict) {
                availableSlots.push({
                  start: slotStart.toISOString(),
                  end: slotEnd.toISOString(),
                  date: dateStr // Always the manager's local date
                });
              } else if (debug) {
                debugLog.push({
                  date: dateStr,
                  rejected_slot: slotStart.toISOString(),
                  blocked: hasBlockedConflict,
                  booking_conflict: hasBookingConflict
                });
              }
            }

            // Advance by duration + buffer
            slotStart = new Date(slotStart.getTime() + slotStep);
          }
        }
      }

    } // end for datesToCheck

    const response = {
      slots: availableSlots,
      settings: {
        buffer_minutes: settings.buffer_minutes,
        min_notice_hours: settings.min_notice_hours,
        max_advance_days: settings.max_advance_days,
        timezone: tz
      }
    };

    if (debug) {
      response.debug = {
        appointment_type: {
          id: appointmentType.id,
          name: appointmentType.name,
          duration: appointmentType.duration,
          service_type: appointmentType.service_type
        },
        total_availability_rules: availabilityRules.length,
        total_blocked_rules: availabilityRules.filter(r => !r.is_available).length,
        total_bookings_checked: existingBookings.length,
        all_appointment_durations: appointmentTypeDurations,
        log: debugLog
      };
    }

    return Response.json(response);

  } catch (error) {
    console.error('Error getting available slots:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});