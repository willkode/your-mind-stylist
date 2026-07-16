import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Also trigger MailerLite automation
async function addToMailerLite(email, name, bookingData) {
  try {
    const apiKey = Deno.env.get('MAILERLITE_API_KEY');
    if (!apiKey) return;

    await fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        email,
        fields: {
          name: name || '',
          last_booking_date: new Date().toISOString(),
          last_booking_type: bookingData.service_type
        }
      })
    });
  } catch (error) {
    console.log('MailerLite sync failed (non-critical):', error.message);
  }
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { booking_id, recipient_type } = await req.json();

        console.log('=== SEND BOOKING EMAIL START ===');
        console.log('Booking ID:', booking_id);
        console.log('Recipient type:', recipient_type);

        if (!booking_id || !recipient_type) {
            console.error('Missing required parameters');
            return Response.json({ error: 'booking_id and recipient_type required' }, { status: 400 });
        }

        // Fetch booking details
        const booking = await base44.asServiceRole.entities.Booking.filter({ id: booking_id });
        if (!booking || booking.length === 0) {
            console.error('Booking not found in database');
            return Response.json({ error: 'Booking not found' }, { status: 404 });
        }

        const bookingData = booking[0];
        console.log('Booking data retrieved:', {
            user_email: bookingData.user_email,
            user_name: bookingData.user_name,
            service_type: bookingData.service_type,
            scheduled_date: bookingData.scheduled_date
        });

        // Get custom email template if exists
        const templateKey = recipient_type === 'manager' 
            ? 'booking_confirmation_manager'
            : 'booking_confirmation_client';
        
        const templates = await base44.asServiceRole.entities.EmailTemplate.filter({
            template_key: templateKey,
            active: true
        });
        
        let emailHtml, subject, recipient;

        if (templates.length > 0) {
            // Use custom template
            const template = templates[0];
            subject = template.subject;
            emailHtml = template.body_html;

            const formatAmount = (amount) => {
                return new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                }).format(amount / 100);
            };

            const formatDate = (date, tz = 'America/Los_Angeles') => {
                if (!date) return "Not scheduled yet";
                return new Date(date).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    timeZone: tz,
                    timeZoneName: "short"
                });
            };

            emailHtml = emailHtml
                .replace(/\{\{user_name\}\}/g, bookingData.user_name || '')
                .replace(/\{\{user_email\}\}/g, bookingData.user_email || '')
                .replace(/\{\{service_type\}\}/g, bookingData.service_type?.replace(/_/g, " ").toUpperCase() || '')
                .replace(/\{\{amount\}\}/g, formatAmount(bookingData.amount))
                .replace(/\{\{session_count\}\}/g, bookingData.session_count || '1')
                .replace(/\{\{scheduled_date\}\}/g, formatDate(bookingData.scheduled_date))
                .replace(/\{\{zoom_join_url\}\}/g, bookingData.zoom_join_url || '')
                .replace(/\{\{zoom_start_url\}\}/g, bookingData.zoom_start_url || '')
                .replace(/\{\{zoom_password\}\}/g, bookingData.zoom_password || '')
                .replace(/\{\{notes\}\}/g, bookingData.notes || '')
                .replace(/\{\{booking_id\}\}/g, bookingData.id || '');

            recipient = recipient_type === 'manager' 
                ? 'roberta@yourmindstylist.com'
                : bookingData.user_email;

        } else {
            // Fallback to simple HTML emails
            const formatDateTz = (date, tz) => {
                if (!date) return "Not scheduled yet";
                return new Date(date).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    timeZone: tz,
                    timeZoneName: "short"
                });
            };
            const formatDate = (date) => formatDateTz(date, 'America/Los_Angeles');

            if (recipient_type === 'client') {
                subject = 'Your Session Booking is Confirmed ✓';
                recipient = bookingData.user_email;
                emailHtml = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #1E3A32;">Your Session is Confirmed!</h2>
                        <p>Hi ${bookingData.user_name},</p>
                        <p>Thank you for booking with Your Mind Stylist. We're excited to work with you!</p>
                        <div style="background: #F9F5EF; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="color: #1E3A32; margin-top: 0;">Session Details</h3>
                            <p><strong>Date & Time:</strong> ${formatDate(bookingData.scheduled_date)}</p>
                            <p><strong>Service:</strong> ${bookingData.service_type.replace(/_/g, ' ').toUpperCase()}</p>
                            ${bookingData.zoom_join_url ? `<p><strong>Zoom Link:</strong> <a href="${bookingData.zoom_join_url}" style="color: #D8B46B;">${bookingData.zoom_join_url}</a></p>` : '<p><em>Zoom link will be sent closer to your session date</em></p>'}
                        </div>
                        <p>If you have any questions, please don't hesitate to reach out.</p>
                        <p>Looking forward to our session!</p>
                        <p style="color: #666; margin-top: 40px;">Roberta Fernandez<br>Your Mind Stylist</p>
                    </div>
                `;
            } else if (recipient_type === 'manager') {
                subject = `New Booking: ${bookingData.user_name} - ${bookingData.service_type}`;
                recipient = 'roberta@yourmindstylist.com';
                emailHtml = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #1E3A32;">New Booking Received</h2>
                        <div style="background: #F9F5EF; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="color: #1E3A32; margin-top: 0;">Client Information</h3>
                            <p><strong>Name:</strong> ${bookingData.user_name}</p>
                            <p><strong>Email:</strong> ${bookingData.user_email}</p>
                            <p><strong>Phone:</strong> ${bookingData.client_phone || 'Not provided'}</p>
                            ${bookingData.client_contact_preference ? `<p><strong>Preferred Contact:</strong> ${bookingData.client_contact_preference}</p>` : ''}
                            
                            <h3 style="color: #1E3A32; margin-top: 20px;">Session Details</h3>
                            <p><strong>Date & Time:</strong> ${formatDate(bookingData.scheduled_date)}</p>
                            <p><strong>Service:</strong> ${bookingData.service_type.replace(/_/g, ' ').toUpperCase()}</p>
                            <p><strong>Status:</strong> ${bookingData.booking_status}</p>
                            ${bookingData.zoom_start_url ? `<p><strong>Zoom Host Link:</strong> <a href="${bookingData.zoom_start_url}" style="color: #D8B46B;">${bookingData.zoom_start_url}</a></p>` : '<p><em>Zoom meeting pending creation</em></p>'}
                            
                            ${bookingData.client_how_heard || bookingData.client_goals || bookingData.client_concerns || bookingData.client_previous_experience || bookingData.client_health_considerations ? `
                            <h3 style="color: #1E3A32; margin-top: 20px;">Consultation Form Responses</h3>
                            ${bookingData.client_how_heard ? `<p><strong>How They Heard About You:</strong><br>${bookingData.client_how_heard}</p>` : ''}
                            ${bookingData.client_goals ? `<p><strong>Goals:</strong><br>${bookingData.client_goals}</p>` : ''}
                            ${bookingData.client_concerns ? `<p><strong>Concerns:</strong><br>${bookingData.client_concerns}</p>` : ''}
                            ${bookingData.client_previous_experience ? `<p><strong>Previous Experience:</strong><br>${bookingData.client_previous_experience}</p>` : ''}
                            ${bookingData.client_health_considerations ? `<p><strong>Health Considerations:</strong><br>${bookingData.client_health_considerations}</p>` : ''}
                            ` : ''}
                            
                            ${bookingData.notes ? `<h3 style="color: #1E3A32; margin-top: 20px;">Additional Notes</h3><p>${bookingData.notes}</p>` : ''}
                        </div>
                        <p><a href="https://yourmindstylist.com/ManagerCalendar" style="background: #1E3A32; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">View in Calendar</a></p>
                    </div>
                `;
            } else {
                return Response.json({ error: 'Invalid recipient_type' }, { status: 400 });
            }
        }

        // Send email via Base44 platform (unified provider)
        console.log(`Sending ${recipient_type} email to:`, recipient);
        
        let emailSendStatus = 'unknown';
        let emailSendError = null;

        try {
            await base44.asServiceRole.integrations.Core.SendEmail({
                to: recipient,
                from_name: "Roberta Fernandez",
                subject: subject,
                body: emailHtml,
            });
            emailSendStatus = 'sent';
            console.log('Email sent successfully to:', recipient);
        } catch (emailError) {
            console.error('Failed to send email via Base44:', emailError);
            emailSendStatus = 'failed';
            emailSendError = emailError.message;
            throw emailError;
        } finally {
            // Log every email attempt
            try {
                await base44.asServiceRole.entities.EmailSendLog.create({
                    recipient_email: recipient,
                    recipient_name: recipient_type === 'manager' ? 'Roberta Fernandez' : bookingData.user_name,
                    subject: subject,
                    email_type: 'booking_confirmation',
                    send_type: 'automated',
                    provider: 'base44',
                    status: emailSendStatus,
                    error_message: emailSendError,
                    sent_by: 'system',
                });
            } catch (logErr) {
                console.error('Failed to log email:', logErr.message);
            }
        }

        // Add to MailerLite for automation sequences (client only)
        if (recipient_type === 'client') {
            try {
                await addToMailerLite(bookingData.user_email, bookingData.user_name, bookingData);
                console.log('Added to MailerLite:', bookingData.user_email);
            } catch (mlError) {
                console.error('MailerLite sync failed (non-critical):', mlError.message);
            }
        }

        return Response.json({ success: true, sent_to: recipient });

    } catch (error) {
        console.error('Email send error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});