import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const now = new Date();
    
    // Get all confirmed bookings that haven't been completed
    const bookings = await base44.asServiceRole.entities.Booking.filter({
      booking_status: 'confirmed'
    });

    const remindersToSend = [];

    for (const booking of bookings) {
      if (!booking.scheduled_date) continue;

      const scheduledDate = new Date(booking.scheduled_date);
      const hoursUntil = (scheduledDate - now) / (1000 * 60 * 60);

      // Send 24h reminder — window: 24h to 20h before (covers 4-hour window for scheduler reliability)
      if (hoursUntil <= 24 && hoursUntil > 20 && !booking.reminder_24h_sent) {
        remindersToSend.push({
          booking_id: booking.id,
          notification_type: 'reminder_24h'
        });
      }

      // Send 1h reminder — window: 1.5h to 0.25h before
      if (hoursUntil <= 1.5 && hoursUntil > 0.25 && !booking.reminder_1h_sent) {
        remindersToSend.push({
          booking_id: booking.id,
          notification_type: 'reminder_1h'
        });
      }
    }

    // Send all reminders and log each
    // CRITICAL: Always mark the reminder as sent even on failure to prevent infinite retry loops.
    // A failed email is logged once with error detail but does NOT block future reminders.
    const results = [];
    for (const reminder of remindersToSend) {
      const booking = bookings.find(b => b.id === reminder.booking_id);
      try {
        await base44.asServiceRole.functions.invoke('sendBookingNotifications', reminder);
        results.push({
          booking_id: reminder.booking_id,
          type: reminder.notification_type,
          success: true
        });
      } catch (error) {
        console.error(`Reminder failed for booking ${reminder.booking_id}:`, error.message);
        results.push({
          booking_id: reminder.booking_id,
          type: reminder.notification_type,
          success: false,
          error: error.message
        });
        // Log the failure once
        try {
          await base44.asServiceRole.entities.EmailSendLog.create({
            recipient_email: booking?.user_email || 'unknown',
            subject: `Booking reminder FAILED (${reminder.notification_type})`,
            email_type: 'booking_reminder',
            send_type: 'automated',
            provider: 'base44',
            status: 'failed',
            error_message: `[${new Date().toISOString()}] ${error.message}`,
            sent_by: 'system',
          });
        } catch (logErr) {
          console.error('Failed to log reminder error:', logErr.message);
        }
      }

      // ALWAYS mark reminder as sent to prevent infinite retry loop — even on failure.
      // This ensures a failed email is attempted once, logged, and never retried endlessly.
      try {
        if (reminder.notification_type === 'reminder_24h' && !booking?.reminder_24h_sent) {
          await base44.asServiceRole.entities.Booking.update(reminder.booking_id, { reminder_24h_sent: true });
        } else if (reminder.notification_type === 'reminder_1h' && !booking?.reminder_1h_sent) {
          await base44.asServiceRole.entities.Booking.update(reminder.booking_id, { reminder_1h_sent: true });
        }
      } catch (flagErr) {
        console.error(`Failed to set reminder flag for booking ${reminder.booking_id}:`, flagErr.message);
      }
    }

    return Response.json({
      success: true,
      checked: bookings.length,
      reminders_sent: results.filter(r => r.success).length,
      reminders_failed: results.filter(r => !r.success).length,
      results
    });

  } catch (error) {
    console.error('Check reminders error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});