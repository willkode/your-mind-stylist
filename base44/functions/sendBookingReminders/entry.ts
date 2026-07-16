import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Verify admin/manager access
        const user = await base44.auth.me();
        if (!user || !['admin', 'manager'].includes(user.role)) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const now = new Date();
        const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const in1Hour = new Date(now.getTime() + 60 * 60 * 1000);

        // Fetch all confirmed bookings with scheduled dates
        const bookings = await base44.asServiceRole.entities.Booking.filter({
            booking_status: 'confirmed',
        });

        const sent = {
            reminder_24h: [],
            reminder_1h: []
        };

        for (const booking of bookings) {
            if (!booking.scheduled_date) continue;
            
            const scheduledDate = new Date(booking.scheduled_date);
            
            // Check for 24-hour reminder
            if (!booking.reminder_24h_sent && scheduledDate > now && scheduledDate <= in24Hours) {
                // Send 24-hour reminder
                await sendReminder(base44, booking, '24h');
                await base44.asServiceRole.entities.Booking.update(booking.id, {
                    reminder_24h_sent: true
                });
                sent.reminder_24h.push(booking.id);
            }
            
            // Check for 1-hour reminder
            if (!booking.reminder_1h_sent && scheduledDate > now && scheduledDate <= in1Hour) {
                // Send 1-hour reminder
                await sendReminder(base44, booking, '1h');
                await base44.asServiceRole.entities.Booking.update(booking.id, {
                    reminder_1h_sent: true
                });
                sent.reminder_1h.push(booking.id);
            }
        }

        return Response.json({
            success: true,
            sent_24h: sent.reminder_24h.length,
            sent_1h: sent.reminder_1h.length,
            details: sent
        });

    } catch (error) {
        console.error('Reminder send error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

async function sendReminder(base44, booking, reminderType) {
    // Get reminder email template
    const templateKey = reminderType === '24h' ? 'booking_reminder_24h' : 'booking_reminder_1h';
    const templates = await base44.asServiceRole.entities.EmailTemplate.filter({
        template_key: templateKey,
        active: true
    });

    let subject, emailHtml;

    if (templates.length > 0) {
        // Use custom template
        const template = templates[0];
        subject = template.subject;
        emailHtml = template.body_html;

        // Helper functions
        const formatDate = (date) => {
            return new Date(date).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit"
            });
        };

        // Replace variables
        emailHtml = emailHtml
            .replace(/\{\{user_name\}\}/g, booking.user_name || '')
            .replace(/\{\{service_type\}\}/g, booking.service_type?.replace(/_/g, " ").toUpperCase() || '')
            .replace(/\{\{scheduled_date\}\}/g, formatDate(booking.scheduled_date))
            .replace(/\{\{zoom_join_url\}\}/g, booking.zoom_join_url || '')
            .replace(/\{\{zoom_password\}\}/g, booking.zoom_password || '');

    } else {
        // Fallback default reminder
        const timeframe = reminderType === '24h' ? '24 hours' : '1 hour';
        subject = `Reminder: Your session is in ${timeframe}`;
        
        const formatDate = (date) => {
            return new Date(date).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit"
            });
        };

        emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #F9F5EF;">
                <div style="background-color: #1E3A32; padding: 40px 20px; text-align: center;">
                    <h1 style="color: #F9F5EF; font-family: Georgia, serif; font-size: 28px; margin: 0;">
                        Session Reminder
                    </h1>
                    <p style="color: #D8B46B; font-size: 14px; margin-top: 10px;">
                        Your session is coming up in ${timeframe}
                    </p>
                </div>
                
                <div style="background-color: #FFFFFF; padding: 40px 30px;">
                    <p style="color: #2B2725; font-size: 16px; line-height: 1.6; margin-top: 0;">
                        Hi ${booking.user_name},
                    </p>
                    
                    <p style="color: #2B2725; font-size: 16px; line-height: 1.6;">
                        This is a friendly reminder that your <strong>${booking.service_type?.replace(/_/g, ' ')}</strong> session is scheduled for:
                    </p>
                    
                    <div style="background-color: #F9F5EF; border: 2px solid #D8B46B; padding: 20px; margin: 20px 0; text-align: center;">
                        <p style="font-size: 18px; color: #1E3A32; font-weight: 600; margin: 0;">
                            ${formatDate(booking.scheduled_date)}
                        </p>
                    </div>
                    
                    ${booking.zoom_join_url ? `
                        <div style="background-color: #E8F4FD; border: 2px solid #2D8CFF; padding: 20px; margin: 20px 0;">
                            <p style="color: #1E3A32; font-weight: 600; margin: 0 0 10px 0;">🎥 Join via Zoom:</p>
                            <a href="${booking.zoom_join_url}" style="color: #2D8CFF; word-break: break-all;">${booking.zoom_join_url}</a>
                            ${booking.zoom_password ? `<p style="margin-top: 10px; color: #2B2725;">Password: <strong>${booking.zoom_password}</strong></p>` : ''}
                        </div>
                    ` : ''}
                    
                    <p style="color: #2B2725; font-size: 16px; line-height: 1.6;">
                        Looking forward to our session!
                    </p>
                    
                    <p style="color: #2B2725; font-size: 16px; line-height: 1.6; margin-bottom: 0;">
                        Roberta Fernandez<br />
                        <span style="color: #D8B46B; font-size: 14px;">Your Mind Stylist</span>
                    </p>
                </div>
                
                <div style="background-color: #F9F5EF; padding: 30px 20px; text-align: center; border-top: 1px solid #E4D9C4;">
                    <p style="color: #2B2725; font-size: 12px; opacity: 0.6; margin: 0;">
                        © ${new Date().getFullYear()} Your Mind Stylist. All rights reserved.
                    </p>
                </div>
            </div>
        `;
    }

    // Send email
    await base44.asServiceRole.integrations.Core.SendEmail({
        to: booking.user_email,
        subject: subject,
        body: emailHtml
    });
}