import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Detect and award milestones for a user based on their activity
 * Call this after significant user actions (lesson complete, check-in, etc.)
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { trigger_type, related_id } = await req.json();

    // Fetch user's existing milestones
    const existingMilestones = await base44.asServiceRole.entities.Milestone.filter({
      created_by: user.email
    });

    const existingKeys = existingMilestones.map(m => m.milestone_key);
    const newMilestones = [];

    // CONSISTENCY MILESTONES
    if (trigger_type === 'check_in' || trigger_type === 'diary_entry') {
      const checkIns = await base44.asServiceRole.entities.DailyStyleCheck.filter({
        created_by: user.email
      }, '-created_date');

      // 7-day streak
      if (checkIns.length >= 7 && !existingKeys.includes('streak_7')) {
        const last7Days = checkIns.slice(0, 7);
        const dates = last7Days.map(c => new Date(c.created_date).toDateString());
        const uniqueDates = [...new Set(dates)];
        
        if (uniqueDates.length >= 7) {
          newMilestones.push({
            milestone_type: 'consistency',
            milestone_key: 'streak_7',
            milestone_name: '7-Day Awareness Streak',
            milestone_description: 'You checked in with yourself 7 days in a row. Consistency is building.',
            icon: '🔥',
            points_awarded: 100,
            metadata: { streak_count: 7 }
          });
        }
      }

      // 30-day streak
      if (checkIns.length >= 30 && !existingKeys.includes('streak_30')) {
        const last30Days = checkIns.slice(0, 30);
        const dates = last30Days.map(c => new Date(c.created_date).toDateString());
        const uniqueDates = [...new Set(dates)];
        
        if (uniqueDates.length >= 30) {
          newMilestones.push({
            milestone_type: 'consistency',
            milestone_key: 'streak_30',
            milestone_name: '30-Day Mastery Streak',
            milestone_description: 'A full month of daily check-ins. This is real commitment.',
            icon: '🔥',
            points_awarded: 500,
            metadata: { streak_count: 30 }
          });
        }
      }
    }

    // LEARNING MILESTONES
    if (trigger_type === 'lesson_complete') {
      const lessonProgress = await base44.asServiceRole.entities.UserLessonProgress.filter({
        user_id: user.id,
        completed: true
      });

      // First lesson
      if (lessonProgress.length === 1 && !existingKeys.includes('first_lesson')) {
        newMilestones.push({
          milestone_type: 'learning',
          milestone_key: 'first_lesson',
          milestone_name: 'First Step Taken',
          milestone_description: 'You completed your first lesson. Every journey begins somewhere.',
          icon: '📚',
          points_awarded: 50
        });
      }

      // 10 lessons
      if (lessonProgress.length >= 10 && !existingKeys.includes('lessons_10')) {
        newMilestones.push({
          milestone_type: 'learning',
          milestone_key: 'lessons_10',
          milestone_name: 'Knowledge Builder',
          milestone_description: '10 lessons completed. You\'re building real depth.',
          icon: '📖',
          points_awarded: 200
        });
      }
    }

    if (trigger_type === 'module_complete') {
      const moduleProgress = await base44.asServiceRole.entities.UserCourseProgress.filter({
        user_id: user.id
      });

      const completedModules = moduleProgress.filter(p => p.status === 'completed');

      // First module
      if (completedModules.length === 1 && !existingKeys.includes('first_module')) {
        newMilestones.push({
          milestone_type: 'learning',
          milestone_key: 'first_module',
          milestone_name: 'Module Master',
          milestone_description: 'First complete module finished. You\'re committed.',
          icon: '🎓',
          points_awarded: 150
        });
      }
    }

    if (trigger_type === 'course_complete') {
      const courseProgress = await base44.asServiceRole.entities.UserCourseProgress.filter({
        user_id: user.id,
        status: 'completed'
      });

      // First course
      if (courseProgress.length === 1 && !existingKeys.includes('first_course')) {
        newMilestones.push({
          milestone_type: 'learning',
          milestone_key: 'first_course',
          milestone_name: 'Course Champion',
          milestone_description: 'Your first complete course. This is real transformation work.',
          icon: '🏆',
          points_awarded: 300
        });
      }
    }

    // ENGAGEMENT MILESTONES
    if (trigger_type === 'consultation') {
      const bookings = await base44.asServiceRole.entities.Booking.filter({
        user_email: user.email,
        booking_status: 'completed'
      });

      // First consultation
      if (bookings.length === 1 && !existingKeys.includes('first_consultation')) {
        newMilestones.push({
          milestone_type: 'engagement',
          milestone_key: 'first_consultation',
          milestone_name: 'The Work Begins',
          milestone_description: 'First consultation with Roberta completed. You\'re investing in yourself.',
          icon: '💬',
          points_awarded: 200
        });
      }
    }

    if (trigger_type === 'style_pause') {
      const pauses = await base44.asServiceRole.entities.StylePauseCompletion.filter({
        created_by: user.email,
        completion_status: 'completed'
      });

      // First pause
      if (pauses.length === 1 && !existingKeys.includes('first_pause')) {
        newMilestones.push({
          milestone_type: 'engagement',
          milestone_key: 'first_pause',
          milestone_name: 'First Pause',
          milestone_description: 'You took your first Style Pause. Learning to reset.',
          icon: '⏸️',
          points_awarded: 50
        });
      }

      // 10 pauses
      if (pauses.length >= 10 && !existingKeys.includes('pauses_10')) {
        newMilestones.push({
          milestone_type: 'engagement',
          milestone_key: 'pauses_10',
          milestone_name: 'Pause Practitioner',
          milestone_description: '10 Style Pauses completed. You\'re building the habit.',
          icon: '⏸️',
          points_awarded: 150
        });
      }
    }

    // EMOTIONAL SHIFT MILESTONES
    if (trigger_type === 'check_in') {
      const recentCheckIns = await base44.asServiceRole.entities.DailyStyleCheck.filter({
        created_by: user.email
      }, '-created_date', 30);

      // Calculate average calm score (if we have data)
      const calmScores = recentCheckIns
        .filter(c => c.state_key === 'calm_activated')
        .map(c => c.state_value);

      if (calmScores.length >= 10) {
        const avgCalm = calmScores.reduce((a, b) => a + b, 0) / calmScores.length;
        
        // First calm week (avg > 60)
        if (avgCalm > 60 && !existingKeys.includes('calm_week')) {
          newMilestones.push({
            milestone_type: 'emotional_shift',
            milestone_key: 'calm_week',
            milestone_name: 'Calm Emerging',
            milestone_description: 'Your calm scores are rising. The work is showing results.',
            icon: '😌',
            points_awarded: 150,
            metadata: { improvement_percentage: Math.round(avgCalm) }
          });
        }
      }
    }

    // BREAKTHROUGH MILESTONES
    const breakthroughReflections = await base44.asServiceRole.entities.LearningReflection.filter({
      created_by: user.email,
      breakthrough_tagged: true
    });

    if (breakthroughReflections.length === 1 && !existingKeys.includes('first_breakthrough')) {
      newMilestones.push({
        milestone_type: 'breakthrough',
        milestone_key: 'first_breakthrough',
        milestone_name: 'First Breakthrough',
        milestone_description: 'You tagged your first aha moment. This is what transformation looks like.',
        icon: '💡',
        points_awarded: 100
      });
    }

    // Create new milestones
    const created = [];
    for (const milestone of newMilestones) {
      const created_milestone = await base44.asServiceRole.entities.Milestone.create({
        ...milestone,
        unlocked_date: new Date().toISOString(),
        celebrated: false
      });
      created.push(created_milestone);
    }

    return Response.json({
      success: true,
      milestones_detected: created.length,
      milestones: created
    });

  } catch (error) {
    console.error('Milestone detection error:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});