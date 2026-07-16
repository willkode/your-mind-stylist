import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { waitlist_id, method, message, send_email } = await req.json();

    // Get waitlist entry
    const entries = await base44.asServiceRole.entities.WaitingList.filter({ id: waitlist_id });
    if (!entries || entries.length === 0) {
      return Response.json({ error: 'Waitlist entry not found' }, { status: 404 });
    }

    const entry = entries[0];

    // Add to communication log
    const communicationLog = entry.communication_log || [];
    communicationLog.push({
      date: new Date().toISOString(),
      method: method || 'note',
      message,
      sent_by: user.email
    });

    await base44.asServiceRole.entities.WaitingList.update(entry.id, {
      communication_log: communicationLog,
      manager_notes: entry.manager_notes 
        ? `${entry.manager_notes}\n\n[${new Date().toLocaleDateString()}] ${message}`
        : message
    });

    // Send email if requested
    if (send_email && method === 'email') {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: entry.user_email,
          subject: 'Update on Your Appointment Request',
          body: `Hi ${entry.user_name},\n\n${message}\n\nBest regards,\nYour Mind Stylist Team`
        });
      } catch (emailError) {
        console.error('Email send error:', emailError);
        return Response.json({ 
          success: true, 
          logged: true, 
          email_sent: false,
          error: 'Failed to send email'
        });
      }
    }

    return Response.json({
      success: true,
      logged: true,
      email_sent: send_email && method === 'email'
    });

  } catch (error) {
    console.error('Send communication error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});