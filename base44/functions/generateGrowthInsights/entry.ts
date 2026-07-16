import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Generate AI-powered insights about user's transformation patterns
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Gather all user data
    const [reflections, milestones, snapshots, checkIns, lessonProgress, bookings] = await Promise.all([
      base44.asServiceRole.entities.LearningReflection.filter({ created_by: user.email }),
      base44.asServiceRole.entities.Milestone.filter({ created_by: user.email }),
      base44.asServiceRole.entities.TransformationSnapshot.filter({ created_by: user.email }),
      base44.asServiceRole.entities.DailyStyleCheck.filter({ created_by: user.email }),
      base44.asServiceRole.entities.UserLessonProgress.filter({ user_id: user.id }),
      base44.asServiceRole.entities.Booking.filter({ user_email: user.email })
    ]);

    // Check if we already generated insights recently (last 24 hours)
    const existingInsights = await base44.asServiceRole.entities.GrowthInsight.filter({
      created_by: user.email,
      viewed: false
    });

    const recentInsights = existingInsights.filter(insight => {
      const created = new Date(insight.created_date);
      const hoursSince = (Date.now() - created.getTime()) / (1000 * 60 * 60);
      return hoursSince < 24;
    });

    if (recentInsights.length > 0) {
      return Response.json({
        success: true,
        message: 'Recent insights already exist',
        insights: recentInsights
      });
    }

    // ADVANCED PATTERN DETECTION
    
    // 1. Engagement patterns - when are they most active?
    const activityByDayOfWeek = {};
    const activityByTimeOfDay = {};
    [...reflections, ...checkIns].forEach(item => {
      const date = new Date(item.created_date);
      const day = date.toLocaleDateString('en-US', { weekday: 'long' });
      const hour = date.getHours();
      activityByDayOfWeek[day] = (activityByDayOfWeek[day] || 0) + 1;
      const timeSlot = hour < 6 ? 'early_morning' : hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
      activityByTimeOfDay[timeSlot] = (activityByTimeOfDay[timeSlot] || 0) + 1;
    });
    const mostActiveDay = Object.entries(activityByDayOfWeek).sort((a, b) => b[1] - a[1])[0];
    const mostActiveTime = Object.entries(activityByTimeOfDay).sort((a, b) => b[1] - a[1])[0];

    // 2. Emotional trajectory - are they improving?
    const sortedSnapshots = snapshots.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    let emotionalTrajectory = 'stable';
    if (sortedSnapshots.length >= 2) {
      const first = sortedSnapshots[0];
      const last = sortedSnapshots[sortedSnapshots.length - 1];
      const avgImprovement = ((last.calm_score - first.calm_score) + 
                              (last.grounded_score - first.grounded_score) + 
                              (last.open_score - first.open_score)) / 3;
      emotionalTrajectory = avgImprovement > 10 ? 'improving' : avgImprovement < -10 ? 'declining' : 'stable';
    }

    // 3. Consistency patterns - streaks and gaps
    const sortedCheckIns = checkIns.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    let currentStreak = 0;
    let longestGap = 0;
    for (let i = 0; i < sortedCheckIns.length - 1; i++) {
      const daysDiff = Math.floor((new Date(sortedCheckIns[i].created_date) - new Date(sortedCheckIns[i + 1].created_date)) / (1000 * 60 * 60 * 24));
      if (daysDiff <= 2) {
        currentStreak++;
      } else {
        longestGap = Math.max(longestGap, daysDiff);
      }
    }

    // 4. Content preferences - what resonates most?
    const reflectionsByType = reflections.reduce((acc, r) => {
      acc[r.reflection_type] = (acc[r.reflection_type] || 0) + 1;
      return acc;
    }, {});
    const favoriteReflectionType = Object.entries(reflectionsByType).sort((a, b) => b[1] - a[1])[0];

    // 5. Breakthrough triggers - what creates aha moments?
    const breakthroughReflections = reflections.filter(r => r.breakthrough_tagged);
    const breakthroughTriggers = breakthroughReflections.reduce((acc, r) => {
      acc[r.reflection_type] = (acc[r.reflection_type] || 0) + 1;
      return acc;
    }, {});
    const topBreakthroughSource = Object.entries(breakthroughTriggers).sort((a, b) => b[1] - a[1])[0];

    // 6. Mood shift analysis
    const moodShifts = reflections
      .filter(r => r.mood_before && r.mood_after)
      .map(r => {
        const moodValues = {
          'joyful': 9, 'grateful': 9, 'energized': 8, 'content': 7, 'calm': 6,
          'neutral': 5, 'tired': 4, 'anxious': 3, 'frustrated': 2, 'sad': 1
        };
        return (moodValues[r.mood_after] || 5) - (moodValues[r.mood_before] || 5);
      });
    const avgMoodShift = moodShifts.length > 0 ? moodShifts.reduce((a, b) => a + b, 0) / moodShifts.length : 0;

    // 7. Time since last activity - engagement warning
    const lastActivity = [...reflections, ...checkIns, ...snapshots]
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
    const daysSinceLastActivity = lastActivity 
      ? Math.floor((Date.now() - new Date(lastActivity.created_date).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    // 8. Recent keywords from reflections
    const recentKeywords = reflections
      .slice(0, 10)
      .map(r => r.what_shifted || r.reflection_text || '')
      .join(' ')
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 5)
      .slice(0, 20)
      .join(', ');

    // Build comprehensive context
    const context = {
      // Basic stats
      total_reflections: reflections.length,
      total_milestones: milestones.length,
      total_snapshots: snapshots.length,
      total_checkins: checkIns.length,
      lessons_completed: lessonProgress.filter(lp => lp.completed).length,
      sessions_booked: bookings.filter(b => b.booking_status === 'completed').length,
      breakthrough_moments: breakthroughReflections.length,
      
      // Advanced patterns
      most_active_day: mostActiveDay ? mostActiveDay[0] : 'unknown',
      most_active_time: mostActiveTime ? mostActiveTime[0] : 'unknown',
      emotional_trajectory: emotionalTrajectory,
      current_streak: currentStreak,
      longest_gap_days: longestGap,
      favorite_content: favoriteReflectionType ? favoriteReflectionType[0] : 'unknown',
      breakthrough_source: topBreakthroughSource ? topBreakthroughSource[0] : 'unknown',
      avg_mood_shift: avgMoodShift.toFixed(2),
      days_since_last_activity: daysSinceLastActivity,
      recent_keywords: recentKeywords,
      
      // Detailed trends
      snapshot_trends: sortedSnapshots.slice(-3).map(s => ({
        date: s.created_date,
        calm: s.calm_score,
        grounded: s.grounded_score,
        open: s.open_score,
        energy: s.energy_level
      })),
      recent_reflections: reflections.slice(0, 5).map(r => ({
        type: r.reflection_type,
        what_shifted: r.what_shifted,
        breakthrough: r.breakthrough_tagged
      }))
    };

    // Call AI to generate insights with advanced pattern data
    const aiPrompt = `You are a compassionate, insightful transformation coach analyzing deep patterns in a user's personal growth journey.

ACTIVITY SUMMARY:
- ${context.total_reflections} reflections written
- ${context.total_milestones} milestones achieved
- ${context.lessons_completed} lessons completed
- ${context.sessions_booked} private coaching sessions completed
- ${context.breakthrough_moments} breakthrough moments tagged

PATTERN INTELLIGENCE:
- Most active: ${context.most_active_day}s during ${context.most_active_time}
- Emotional trajectory: ${context.emotional_trajectory}
- Current engagement streak: ${context.current_streak} days
- Longest gap between check-ins: ${context.longest_gap_days} days
- Days since last activity: ${context.days_since_last_activity}
- Favorite reflection type: ${context.favorite_content}
- Breakthrough source: ${context.breakthrough_source}
- Average mood improvement per session: ${context.avg_mood_shift} points

RECENT TRANSFORMATION DATA:
${JSON.stringify(context.snapshot_trends, null, 2)}

RECENT REFLECTIONS:
${JSON.stringify(context.recent_reflections, null, 2)}

RECURRING THEMES:
${context.recent_keywords}

INSTRUCTIONS:
Generate 2-4 deeply insightful observations that:

1. RECOGNIZE SPECIFIC PATTERNS - Don't be generic. Reference actual data (e.g., "Your breakthroughs happen most during consultations" or "You show up most on Tuesdays")

2. PREDICT NEXT STEPS - Based on their patterns, suggest what might serve them next (e.g., "You might be ready for deeper module work" or "Consider booking a session to process what's emerging")

3. CELEBRATE QUIETLY - Notice genuine progress without being overly effusive

4. WARN COMPASSIONATELY - If engagement is dropping or gaps are widening, gently invite them back

5. PERSONALIZE - Use their actual themes, not generic wellness advice

Priority guidelines:
- HIGH: Urgent engagement warnings, breakthrough opportunities, significant pattern shifts
- MEDIUM: Growth opportunities, consistency nudges, content recommendations
- LOW: Gentle observations, long-term trends

Return as JSON with this structure:
{
  "insights": [{
    "insight_type": "pattern" | "trend" | "prediction" | "celebration" | "recommendation" | "observation",
    "insight_category": "emotional" | "learning" | "consistency" | "growth" | "connection" | "breakthrough",
    "insight_text": "One compelling sentence that feels true and specific",
    "insight_detail": "2-3 sentences with context, data, and gentle next step if applicable",
    "priority": "low" | "medium" | "high"
  }]
}`;

    const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: aiPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          insights: {
            type: "array",
            items: {
              type: "object",
              properties: {
                insight_type: { type: "string" },
                insight_category: { type: "string" },
                insight_text: { type: "string" },
                insight_detail: { type: "string" },
                priority: { type: "string" }
              }
            }
          }
        }
      }
    });

    const insights = aiResponse.insights || [];
    const createdInsights = [];

    // Save insights to database
    for (const insight of insights) {
      const created = await base44.asServiceRole.entities.GrowthInsight.create({
        insight_type: insight.insight_type,
        insight_category: insight.insight_category,
        insight_text: insight.insight_text,
        insight_detail: insight.insight_detail || null,
        data_sources: ['reflections', 'snapshots', 'check_ins', 'milestones'],
        confidence_score: 85,
        generated_by: 'ai',
        viewed: false,
        priority: insight.priority || 'medium'
      });
      createdInsights.push(created);
    }

    return Response.json({
      success: true,
      insights_generated: createdInsights.length,
      insights: createdInsights
    });

  } catch (error) {
    console.error('Insight generation error:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});