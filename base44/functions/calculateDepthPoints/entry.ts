import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Calculate and award depth points based on user activity
 * Called after significant events (reflection, milestone, completion)
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create depth marker
    let depthMarker = await base44.asServiceRole.entities.DepthMarker.filter({ 
      created_by: user.email 
    });
    
    if (depthMarker.length === 0) {
      depthMarker = await base44.asServiceRole.entities.DepthMarker.create({
        current_depth_level: 1,
        total_depth_points: 0,
        points_to_next_level: 100,
        growth_rings: [],
        mastery_areas: {
          emotional_awareness: 0,
          consistent_practice: 0,
          breakthrough_capacity: 0,
          integration_depth: 0,
          reflective_wisdom: 0
        },
        unlocked_content: [],
        achievements: []
      });
    } else {
      depthMarker = depthMarker[0];
    }

    // Fetch all user activity for calculation
    const [reflections, milestones, snapshots, checkIns, lessonProgress] = await Promise.all([
      base44.asServiceRole.entities.LearningReflection.filter({ created_by: user.email }),
      base44.asServiceRole.entities.Milestone.filter({ created_by: user.email }),
      base44.asServiceRole.entities.TransformationSnapshot.filter({ created_by: user.email }),
      base44.asServiceRole.entities.DailyStyleCheck.filter({ created_by: user.email }),
      base44.asServiceRole.entities.UserLessonProgress.filter({ user_id: user.id })
    ]);

    // POINT CALCULATION SYSTEM
    const pointSources = {
      reflection_basic: 5,
      reflection_breakthrough: 15,
      milestone_earned: 10,
      lesson_completed: 8,
      snapshot_taken: 12,
      daily_checkin: 3,
      streak_bonus_7: 20,
      streak_bonus_30: 50,
      first_of_type: 10 // bonus for first time doing something
    };

    // Calculate total points from all sources
    let totalPoints = 0;
    
    // Reflections
    totalPoints += reflections.length * pointSources.reflection_basic;
    totalPoints += reflections.filter(r => r.breakthrough_tagged).length * pointSources.reflection_breakthrough;
    
    // Milestones
    totalPoints += milestones.length * pointSources.milestone_earned;
    
    // Lessons
    totalPoints += lessonProgress.filter(l => l.completed).length * pointSources.lesson_completed;
    
    // Snapshots
    totalPoints += snapshots.length * pointSources.snapshot_taken;
    
    // Check-ins
    totalPoints += checkIns.length * pointSources.daily_checkin;

    // Streak bonuses
    const sortedCheckIns = checkIns.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    let currentStreak = 0;
    for (let i = 0; i < sortedCheckIns.length - 1; i++) {
      const daysDiff = Math.floor((new Date(sortedCheckIns[i].created_date) - new Date(sortedCheckIns[i + 1].created_date)) / (1000 * 60 * 60 * 24));
      if (daysDiff <= 2) currentStreak++;
      else break;
    }
    if (currentStreak >= 30) totalPoints += pointSources.streak_bonus_30;
    else if (currentStreak >= 7) totalPoints += pointSources.streak_bonus_7;

    // Calculate depth level (every 100 points = 1 level, max level 10)
    const newLevel = Math.min(10, Math.floor(totalPoints / 100) + 1);
    const pointsToNext = newLevel < 10 ? (newLevel * 100) - totalPoints : 0;

    // Check if leveled up
    const leveledUp = newLevel > depthMarker.current_depth_level;
    let newRing = null;

    if (leveledUp) {
      const ringNames = [
        "Awakening", "Noticing", "Shifting", "Anchoring", "Deepening",
        "Integrating", "Embodying", "Radiating", "Mastering", "Illuminating"
      ];
      
      newRing = {
        ring_number: newLevel,
        unlocked_date: new Date().toISOString(),
        ring_name: ringNames[newLevel - 1],
        unlocked_content_ids: [] // TODO: Add actual content unlock logic
      };
    }

    // MASTERY CALCULATION
    const masteryAreas = {
      emotional_awareness: Math.min(100, (snapshots.length * 15) + (reflections.filter(r => r.mood_before && r.mood_after).length * 5)),
      consistent_practice: Math.min(100, (currentStreak * 3) + (checkIns.length * 1)),
      breakthrough_capacity: Math.min(100, reflections.filter(r => r.breakthrough_tagged).length * 8),
      integration_depth: Math.min(100, (lessonProgress.filter(l => l.completed).length * 4) + (snapshots.length * 6)),
      reflective_wisdom: Math.min(100, reflections.length * 2 + (reflections.filter(r => r.reflection_text && r.reflection_text.length > 200).length * 3))
    };

    // Update depth marker
    const updatedMarker = await base44.asServiceRole.entities.DepthMarker.update(depthMarker.id, {
      current_depth_level: newLevel,
      total_depth_points: totalPoints,
      points_to_next_level: pointsToNext,
      growth_rings: leveledUp 
        ? [...(depthMarker.growth_rings || []), newRing]
        : depthMarker.growth_rings,
      mastery_areas: masteryAreas,
      last_points_earned: new Date().toISOString()
    });

    return Response.json({
      success: true,
      depth_marker: updatedMarker,
      leveled_up: leveledUp,
      new_level: leveledUp ? newLevel : null,
      new_ring: newRing,
      points_awarded: totalPoints - (depthMarker.total_depth_points || 0)
    });

  } catch (error) {
    console.error('Depth calculation error:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});