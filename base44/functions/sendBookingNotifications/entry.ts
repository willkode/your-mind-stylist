import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { booking_id, notification_type } = await req.json();

    // Fetch booking details
    const bookings = await base44.asServiceRole.entities.Booking.filter({ id: booking_id });
    const booking = bookings[0];

    if (!booking) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Fetch appointment type for service details
    let appointmentType = null;
    if (booking.service_type) {
      const types = await base44.asServiceRole.entities.AppointmentType.filter({
        service_type: booking.service_type
      });
      appointmentType = types[0];
    }

    const formatDate = (dateString, tz = 'America/Los_Angeles') => {
      if (!dateString) return 'TBD';
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZone: tz,
        timeZoneName: 'short'
      });
    };

    // --- Try to load editable template from EmailTemplate entity ---
    const templateKeyMap = {
      'booking_confirmation_client': 'booking_confirmation_client',
      'booking_confirmation_manager': 'booking_confirmation_manager',
      'reminder_24h': 'reminder_24h',
      'reminder_1h': 'reminder_1h',
    };
    const templateKey = templateKeyMap[notification_type];
    let customTemplate = null;
    if (templateKey) {
      try {
        const templates = await base44.asServiceRole.entities.EmailTemplate.filter({
          key: templateKey,
          active: true
        });
        if (templates.length > 0 && templates[0].body && templates[0].body.trim().length > 10) {
          customTemplate = templates[0];
        }
      } catch (e) {
        console.log('Template lookup skipped:', e.message);
      }
    }

    // Template variable replacement
    const replaceVars = (text) => {
      if (!text) return '';
      return text
        .replace(/\{\{client_name\}\}/g, booking.user_name || 'there')
        .replace(/\{\{first_name\}\}/g, (booking.user_name || 'there').split(' ')[0])
        .replace(/\{\{service_name\}\}/g, appointmentType?.name || booking.service_type || 'Session')
        .replace(/\{\{date_time\}\}/g, formatDate(booking.scheduled_date))
        .replace(/\{\{duration\}\}/g, String(appointmentType?.duration || 60))
        .replace(/\{\{zoom_link\}\}/g, booking.zoom_join_url || '')
        .replace(/\{\{zoom_password\}\}/g, booking.zoom_password || '')
        .replace(/\{\{client_email\}\}/g, booking.user_email || '')
        .replace(/\{\{client_phone\}\}/g, booking.client_phone || 'Not provided')
        .replace(/\{\{amount\}\}/g, booking.amount ? `$${(booking.amount / 100).toFixed(2)}` : 'N/A')
        .replace(/\{\{payment_status\}\}/g, booking.payment_status || '')
        .replace(/\{\{current_year\}\}/g, String(new Date().getFullYear()));
    };

    let emailSubject = '';
    let emailBody = '';

    // If a custom template exists and has content, use it
    if (customTemplate) {
      emailSubject = replaceVars(customTemplate.subject);
      emailBody = replaceVars(customTemplate.body);
    } else {
      // Fallback to hardcoded defaults
      switch (notification_type) {
        case 'booking_confirmation_client':
          emailSubject = `Your Session is Confirmed - ${formatDate(booking.scheduled_date)}`;
          emailBody = `
            <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; color: #2B2725;">
              <div style="background: #1E3A32; padding: 40px 20px; text-align: center;">
                <h1 style="color: #F9F5EF; font-size: 32px; margin: 0;">Session Confirmed</h1>
              </div>
              <div style="padding: 40px 20px; background: #F9F5EF;">
                <p style="font-size: 18px; color: #1E3A32; margin-bottom: 20px;">Hi ${booking.user_name},</p>
                <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">Your session with Roberta Fernandez has been confirmed. Here are the details:</p>
                <div style="background: white; padding: 30px; margin: 20px 0; border-left: 4px solid #D8B46B;">
                  <p style="margin: 10px 0;"><strong style="color: #1E3A32;">Service:</strong> ${appointmentType?.name || booking.service_type}</p>
                  <p style="margin: 10px 0;"><strong style="color: #1E3A32;">Date & Time:</strong> ${formatDate(booking.scheduled_date)}</p>
                  <p style="margin: 10px 0;"><strong style="color: #1E3A32;">Duration:</strong> ${appointmentType?.duration || 60} minutes</p>
                  ${booking.zoom_join_url ? `<p style="margin: 10px 0;"><strong style="color: #1E3A32;">Zoom Link:</strong> <a href="${booking.zoom_join_url}" style="color: #D8B46B;">${booking.zoom_join_url}</a></p>` : ''}
                  ${booking.zoom_password ? `<p style="margin: 10px 0;"><strong style="color: #1E3A32;">Zoom Password:</strong> ${booking.zoom_password}</p>` : ''}
                </div>
                <p style="font-size: 16px; line-height: 1.6; margin: 20px 0;">You'll receive reminder emails 24 hours and 1 hour before your session.</p>
                ${booking.notes ? `<div style="background: #E4D9C4; padding: 20px; margin: 20px 0;"><p style="margin: 0; font-size: 14px;"><strong>Your Notes:</strong></p><p style="margin: 10px 0 0 0; font-size: 14px;">${booking.notes}</p></div>` : ''}
                <p style="font-size: 14px; color: #2B2725; margin-top: 30px;">If you need to reschedule or have any questions, please reply to this email or visit your client portal.</p>
                <div style="text-align: center; margin-top: 40px;">
                  <a href="https://yourmindstylist.com/ClientBookings" style="background: #1E3A32; color: #F9F5EF; padding: 15px 40px; text-decoration: none; display: inline-block; font-size: 16px;">View My Bookings</a>
                </div>
              </div>
              <div style="background: #2B2725; padding: 20px; text-align: center;">
                <p style="color: #F9F5EF; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} Your Mind Stylist. All rights reserved.</p>
              </div>
            </div>
          `;
          break;

        case 'booking_confirmation_manager':
          emailSubject = `New Booking: ${booking.user_name} - ${formatDate(booking.scheduled_date)}`;
          emailBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1E3A32;">New Booking Received</h2>
              <div style="background: #F9F5EF; padding: 20px; margin: 20px 0;">
                <p><strong>Client:</strong> ${booking.user_name}</p>
                <p><strong>Email:</strong> ${booking.user_email}</p>
                <p><strong>Phone:</strong> ${booking.client_phone || 'Not provided'}</p>
                <p><strong>Service:</strong> ${appointmentType?.name || booking.service_type}</p>
                <p><strong>Date & Time:</strong> ${formatDate(booking.scheduled_date)}</p>
                <p><strong>Amount:</strong> $${(booking.amount / 100).toFixed(2)}</p>
                <p><strong>Payment Status:</strong> ${booking.payment_status}</p>
              </div>
              ${booking.notes ? `<div style="background: #E4D9C4; padding: 20px; margin: 20px 0;"><p><strong>Client Notes:</strong></p><p>${booking.notes}</p></div>` : ''}
              ${booking.client_goals ? `<div style="background: #E4D9C4; padding: 20px; margin: 20px 0;"><p><strong>Client Goals:</strong></p><p>${booking.client_goals}</p></div>` : ''}
              <a href="https://yourmindstylist.com/ManagerBookings" style="background: #1E3A32; color: white; padding: 12px 30px; text-decoration: none; display: inline-block; margin: 20px 0;">View in Dashboard</a>
            </div>
          `;
          break;

        case 'reminder_24h':
          emailSubject = `Reminder: Your session tomorrow - ${formatDate(booking.scheduled_date)}`;
          emailBody = `
            <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1E3A32;">Session Tomorrow</h2>
              <p>Hi ${booking.user_name},</p>
              <p>This is a friendly reminder that your session with Roberta Fernandez is scheduled for tomorrow:</p>
              <div style="background: #F9F5EF; padding: 20px; margin: 20px 0;">
                <p><strong>Date & Time:</strong> ${formatDate(booking.scheduled_date)}</p>
                <p><strong>Service:</strong> ${appointmentType?.name || booking.service_type}</p>
                ${booking.zoom_join_url ? `<p><strong>Zoom Link:</strong> <a href="${booking.zoom_join_url}">${booking.zoom_join_url}</a></p>` : ''}
              </div>
              <p>Looking forward to connecting with you!</p>
              <p style="margin-top: 20px;">Warmly,<br><strong>Roberta Fernandez</strong><br><span style="color: #6E4F7D;">Your Mind Stylist</span></p>
            </div>
          `;
          break;

        case 'reminder_1h':
          emailSubject = `Starting Soon: Your session in 1 hour`;
          emailBody = `
            <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1E3A32;">Session Starting Soon</h2>
              <p>Hi ${booking.user_name},</p>
              <p>Your session starts in 1 hour. Here's your Zoom link:</p>
              <div style="background: #F9F5EF; padding: 20px; margin: 20px 0; text-align: center;">
                ${booking.zoom_join_url ? `
                  <a href="${booking.zoom_join_url}" style="background: #1E3A32; color: white; padding: 15px 40px; text-decoration: none; display: inline-block; font-size: 18px;">Join Zoom Meeting</a>
                  ${booking.zoom_password ? `<p style="margin-top: 15px;">Password: <strong>${booking.zoom_password}</strong></p>` : ''}
                ` : '<p>Meeting details will be provided shortly.</p>'}
              </div>
              <p>See you soon!</p>
              <p style="margin-top: 20px;">Warmly,<br><strong>Roberta Fernandez</strong><br><span style="color: #6E4F7D;">Your Mind Stylist</span></p>
            </div>
          `;
          break;

        default:
          return Response.json({ error: 'Invalid notification type' }, { status: 400 });
      }
    }

    // Send email
    const recipientEmail = notification_type === 'booking_confirmation_manager'
      ? 'roberta@robertafernandez.com'
      : booking.user_email;

    await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: 'Your Mind Stylist',
      to: recipientEmail,
      subject: emailSubject,
      body: emailBody
    });

    // Log the email send
    try {
      const isReminder = notification_type === 'reminder_24h' || notification_type === 'reminder_1h';
      await base44.asServiceRole.entities.EmailSendLog.create({
        recipient_email: recipientEmail,
        recipient_name: notification_type === 'booking_confirmation_manager' ? 'Roberta Fernandez' : booking.user_name,
        subject: emailSubject,
        email_type: isReminder ? 'booking_reminder' : 'booking_confirmation',
        send_type: 'automated',
        provider: 'base44',
        status: 'sent',
        sent_by: 'system',
      });
    } catch (logErr) {
      console.error('Failed to log email:', logErr.message);
    }

    // Update booking to mark reminder as sent
    if (notification_type === 'reminder_24h') {
      await base44.asServiceRole.entities.Booking.update(booking_id, {
        reminder_24h_sent: true
      });
    } else if (notification_type === 'reminder_1h') {
      await base44.asServiceRole.entities.Booking.update(booking_id, {
        reminder_1h_sent: true
      });
    }

    return Response.json({
      success: true,
      used_custom_template: !!customTemplate,
      template_key: templateKey,
      message: `Notification sent to ${recipientEmail}`
    });

  } catch (error) {
    console.error('Notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});