import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    console.log("[manualEnrollUser] Request received");
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only admins or managers can enroll users
    const userRole = user?.role?.toLowerCase() || '';
    const isAuthorized = userRole === 'admin' || userRole === 'manager' || user?.custom_role === 'manager';
    
    console.log("[manualEnrollUser] User role check:", { userRole, custom_role: user?.custom_role, isAuthorized, fullUser: user });
    
    if (!isAuthorized) {
      console.error("[manualEnrollUser] Authorization failed - not admin/manager");
      return Response.json({ error: 'Forbidden: Admin or manager access required' }, { status: 403 });
    }

    const { user_email, course_id, send_notification, first_name, last_name } = await req.json();
    console.log("[manualEnrollUser] Payload:", { user_email, course_id, send_notification });

    if (!user_email || !course_id) {
      return Response.json({ error: 'user_email and course_id are required' }, { status: 400 });
    }

    // Find the user by email
    console.log("[manualEnrollUser] Fetching users...");
    const allUsers = await base44.asServiceRole.entities.User.list();
    console.log(`[manualEnrollUser] Found ${allUsers.length} users total`);
    const targetUser = allUsers.find(u => u.email?.toLowerCase() === user_email.toLowerCase());
    
    // User must exist - cannot create users programmatically
    if (!targetUser) {
      console.error(`[manualEnrollUser] User not found: ${user_email}`);
      return Response.json({ 
        error: `This person hasn't set up their account yet. Please send them an invite first — once they accept and create their account, you'll be able to enroll them.` 
      }, { status: 404 });
    }
    console.log(`[manualEnrollUser] Found user: ${targetUser.id} (${targetUser.email})`);

    // Check if user already has progress for this course
    const allProgress = await base44.asServiceRole.entities.UserCourseProgress.list();
    const existingProgress = allProgress.find(p => p.user_id === targetUser.id && p.course_id === course_id);

    let progressRecord;
    if (existingProgress) {
      // User already enrolled, just return existing
      progressRecord = existingProgress;
      console.log(`User already enrolled in course ${course_id}`);
    } else {
      // Create new enrollment
      progressRecord = await base44.asServiceRole.entities.UserCourseProgress.create({
        user_id: targetUser.id,
        course_id: course_id,
        status: 'not_started',
        completion_percentage: 0,
      });
      console.log(`Created new enrollment: ${progressRecord.id} for user ${targetUser.id} in course ${course_id}`);
    }

    // Fetch course details for notification
    const course = await base44.asServiceRole.entities.Course.get(course_id);

    // Send notification email if requested
    let emailSent = false;
    if (send_notification) {
      try {
        console.log(`[manualEnrollUser] Sending email to ${targetUser.email}`);
        const emailResult = await base44.asServiceRole.integrations.Core.SendEmail({
          to: targetUser.email,
          from_name: 'Your Mind Stylist',
          subject: `You've been enrolled in ${course.title}!`,
          body: `
            <p>Hi ${targetUser.full_name || targetUser.email},</p>
            <p>You've been enrolled in <strong>${course.title}</strong>. You can access it in your account under the Library section.</p>
            <p>Get started whenever you're ready!</p>
            <p>Best,<br>Roberta</p>
          `,
        });
        console.log(`[manualEnrollUser] Email sent successfully:`, emailResult);
        emailSent = true;
        // Log to EmailSendLog
        try {
          await base44.asServiceRole.entities.EmailSendLog.create({
            recipient_email: targetUser.email,
            recipient_name: targetUser.full_name || targetUser.email,
            subject: `You've been enrolled in ${course.title}!`,
            email_type: 'enrollment',
            send_type: 'individual',
            provider: 'base44',
            status: 'sent',
            sent_by: user.email,
          });
        } catch (logErr) {
          console.error('[manualEnrollUser] Failed to log email:', logErr?.message);
        }
      } catch (emailError) {
        console.error('[manualEnrollUser] Email send error:', emailError?.message || emailError);
        // Log failure
        try {
          await base44.asServiceRole.entities.EmailSendLog.create({
            recipient_email: targetUser.email,
            recipient_name: targetUser.full_name || targetUser.email,
            subject: `You've been enrolled in ${course.title}!`,
            email_type: 'enrollment',
            send_type: 'individual',
            provider: 'base44',
            status: 'failed',
            error_message: emailError?.message,
            sent_by: user.email,
          });
        } catch (logErr) {
          console.error('[manualEnrollUser] Failed to log email error:', logErr?.message);
        }
        // Don't throw - enrollment was successful even if email failed
        emailSent = false;
      }
    }

    console.log(`[manualEnrollUser] Enrollment complete. Email sent: ${emailSent}`);
    return Response.json({
      success: true,
      message: `${targetUser.full_name || targetUser.email} enrolled in ${course.title}`,
      progressRecord,
      emailSent,
    });
  } catch (error) {
    console.error('[manualEnrollUser] Unexpected error:', error);
    return Response.json({ error: error?.message || 'Unknown error' }, { status: 500 });
  }
});