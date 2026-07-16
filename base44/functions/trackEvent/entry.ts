import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { startOfWeek, format } from 'npm:date-fns';

async function updateStreak(base44, userId) {
  const today = format(new Date(), 'yyyy-MM-dd');
  
  // Get or create streak record
  const streaks = await base44.asServiceRole.entities.UserStreak.filter({ user_id: userId });
  let streak = streaks[0];
  
  if (!streak) {
    // Create new streak
    streak = await base44.asServiceRole.entities.UserStreak.create({
      user_id: userId,
      current_streak: 1,
      longest_streak: 1,
      last_activity_date: today,
      streak_active: true
    });
  } else {
    const lastActivity = new Date(streak.last_activity_date);
    const now = new Date();
    const diffDays = Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      // Same day, no change
      return streak;
    } else if (diffDays === 1) {
      // Next day, increment
      const newStreak = streak.current_streak + 1;
      await base44.asServiceRole.entities.UserStreak.update(streak.id, {
        current_streak: newStreak,
        longest_streak: Math.max(newStreak, streak.longest_streak),
        last_activity_date: today,
        streak_active: true
      });
    } else if (diffDays > 1) {
      // Broken, reset
      await base44.asServiceRole.entities.UserStreak.update(streak.id, {
        current_streak: 1,
        last_activity_date: today,
        streak_active: false
      });
    }
  }
  
  return streak;
}

async function updateMomentum(base44, userId, points) {
  const weekStart = format(startOfWeek(new Date()), 'yyyy-MM-dd');
  const today = format(new Date(), 'yyyy-MM-dd');
  
  // Get or create momentum log
  const logs = await base44.asServiceRole.entities.MomentumLog.filter({ 
    user_id: userId,
    week_start: weekStart 
  });
  
  let log = logs[0];
  
  if (!log) {
    log = await base44.asServiceRole.entities.MomentumLog.create({
      user_id: userId,
      week_start: weekStart,
      daily_points: { [today]: points },
      total_points: points,
      last_activity: new Date().toISOString()
    });
  } else {
    const dailyPoints = log.daily_points || {};
    const currentDailyPoints = dailyPoints[today] || 0;
    
    // Cap at 10 points per day
    if (currentDailyPoints < 10) {
      const newDailyPoints = Math.min(currentDailyPoints + points, 10);
      dailyPoints[today] = newDailyPoints;
      
      const totalPoints = Object.values(dailyPoints).reduce((a, b) => a + b, 0);
      
      await base44.asServiceRole.entities.MomentumLog.update(log.id, {
        daily_points: dailyPoints,
        total_points: totalPoints,
        last_activity: new Date().toISOString()
      });
    }
  }
  
  return log;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { event_type, points = 1, metadata = {} } = await req.json();
    
    if (!event_type) {
      return Response.json({ error: 'event_type is required' }, { status: 400 });
    }
    
    // Create constellation event
    await base44.asServiceRole.entities.ConstellationEvent.create({
      user_id: user.id,
      event_type,
      points,
      metadata
    });
    
    // Update streak if applicable
    const meaningfulEvents = [
      'lesson_completed', 'note_created', 'session_completed', 
      'module_completed', 'app_session'
    ];
    
    if (meaningfulEvents.includes(event_type)) {
      await updateStreak(base44, user.id);
      await updateMomentum(base44, user.id, points);
    }
    
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});