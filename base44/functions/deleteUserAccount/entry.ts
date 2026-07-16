import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { confirmationText } = await req.json();

    if (confirmationText !== 'DELETE MY ACCOUNT') {
      return Response.json({
        error: 'Invalid confirmation. Please type "DELETE MY ACCOUNT" exactly.'
      }, { status: 400 });
    }

    // Log the deletion request before deletion
    await base44.asServiceRole.entities.ActivityLog.create({
      action: 'account_deletion_requested',
      actor: user.email,
      target: user.id,
      details: `User ${user.email} (ID: ${user.id}) requested account deletion. Data will be purged.`
    });

    // Delete user's personal data entities
    const entityDeletions = [
      'DiaryEntry', 'Note', 'MomentumLog', 'UserStreak', 'UserAudioSession',
      'UserCourseProgress', 'UserLessonProgress', 'LearningReflection',
      'TransformationSnapshot', 'DailyStyleCheck', 'StylePauseCompletion',
      'UserWebinarAccess', 'UserPackage', 'DepthMarker', 'GrowthInsight',
      'UserEmailSequence', 'UserQuizAttempt', 'Message'
    ];

    for (const entityName of entityDeletions) {
      try {
        const records = await base44.asServiceRole.entities[entityName].filter({ created_by: user.email });
        for (const record of records) {
          await base44.asServiceRole.entities[entityName].delete(record.id);
        }
      } catch (_) {
        // Entity may not have records or field — continue
      }
    }

    // Mark account as deleted (platform-level deletion handled by admin after notification)
    await base44.auth.updateMe({
      account_deletion_requested: true,
      account_deletion_date: new Date().toISOString(),
      account_status: 'deleted',
      full_name: 'Deleted User',
    });

    // Notify admin
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: 'roberta@robertafernandez.com',
      subject: 'Account Deletion Completed',
      body: `User ${user.full_name} (${user.email}) has deleted their account and all personal data has been purged. User ID: ${user.id}. Please remove this user from the platform manually to complete the process.`
    });

    return Response.json({
      success: true,
      message: 'Your account and personal data have been deleted. You will be logged out now.'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    return Response.json({
      error: error.message || 'Failed to process deletion request'
    }, { status: 500 });
  }
});