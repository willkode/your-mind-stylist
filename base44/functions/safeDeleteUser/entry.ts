import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth.me();

    if (!caller) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin or manager can safe-delete
    const callerRole = caller.custom_role || caller.role;
    if (callerRole !== 'admin' && callerRole !== 'manager') {
      return Response.json({ error: 'Forbidden: requires admin or manager role' }, { status: 403 });
    }

    const { userId, confirmationEmail } = await req.json();

    if (!userId || !confirmationEmail) {
      return Response.json({ error: 'Missing userId or confirmationEmail' }, { status: 400 });
    }

    // Fetch target user
    const allUsers = await base44.asServiceRole.entities.User.list();
    const targetUser = allUsers.find(u => u.id === userId);

    if (!targetUser) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent self-deletion
    if (targetUser.id === caller.id) {
      return Response.json({ error: 'You cannot delete your own account' }, { status: 403 });
    }

    // Prevent deleting admins or managers
    const targetRole = targetUser.custom_role || targetUser.role;
    if (targetRole === 'admin' || targetRole === 'manager') {
      return Response.json({ error: 'Cannot delete admin or manager accounts' }, { status: 403 });
    }

    // Validate confirmation email matches
    if (confirmationEmail.toLowerCase() !== targetUser.email.toLowerCase()) {
      return Response.json({ error: 'Confirmation email does not match the user\'s email' }, { status: 400 });
    }

    // Log the deletion BEFORE making changes
    await base44.asServiceRole.entities.ActivityLog.create({
      action: 'safe_delete_user',
      actor: caller.email,
      target: targetUser.email,
      details: `Manager ${caller.email} initiated safe-delete for user ${targetUser.full_name} (${targetUser.email}, ID: ${targetUser.id}). Profile anonymized, personal data purged.`
    });

    // Purge personal/progress data entities
    const entitiesToPurge = [
      'DiaryEntry', 'Note', 'MomentumLog', 'UserStreak', 'UserAudioSession',
      'UserCourseProgress', 'UserLessonProgress', 'LearningReflection',
      'TransformationSnapshot', 'DailyStyleCheck', 'StylePauseCompletion',
      'UserWebinarAccess', 'UserPackage', 'DepthMarker', 'GrowthInsight',
      'UserEmailSequence', 'UserQuizAttempt', 'Message'
    ];

    let purgedCount = 0;
    for (const entityName of entitiesToPurge) {
      try {
        const records = await base44.asServiceRole.entities[entityName].filter({ created_by: targetUser.email });
        for (const record of records) {
          await base44.asServiceRole.entities[entityName].delete(record.id);
          purgedCount++;
        }
      } catch (_) {
        // Entity may not have records — continue
      }
    }

    // Also purge UserCourseProgress and UserAudiobookProgress by user_id
    try {
      const courseProgress = await base44.asServiceRole.entities.UserCourseProgress.filter({ user_id: targetUser.id });
      for (const record of courseProgress) {
        await base44.asServiceRole.entities.UserCourseProgress.delete(record.id);
        purgedCount++;
      }
    } catch (_) {}

    try {
      const audiobookProgress = await base44.asServiceRole.entities.UserAudiobookProgress.filter({ user_id: targetUser.id });
      for (const record of audiobookProgress) {
        await base44.asServiceRole.entities.UserAudiobookProgress.delete(record.id);
        purgedCount++;
      }
    } catch (_) {}

    // Anonymize user profile fields — preserve email, id, role, stripe, purchases
    await base44.asServiceRole.entities.User.update(targetUser.id, {
      full_name: 'Deleted User',
      first_name: null,
      last_name: null,
      username: null,
      profile_photo: null,
      bio: null,
      phone: null,
      address_line1: null,
      address_line2: null,
      city: null,
      state: null,
      zip: null,
      country: null,
      manager_notes: null,
      account_status: 'deleted',
      account_deletion_date: new Date().toISOString(),
      onboarding_completed: false,
      profile_complete: false,
      // Preserve: email, id, role, custom_role, stripe_customer_id, 
      // purchased_product_ids, subscription_status, created_date
    });

    return Response.json({
      success: true,
      message: `User ${targetUser.email} has been safely deleted. ${purgedCount} personal data records purged.`,
      purgedCount
    });
  } catch (error) {
    console.error('Safe delete error:', error);
    return Response.json({ error: error.message || 'Failed to process deletion' }, { status: 500 });
  }
});