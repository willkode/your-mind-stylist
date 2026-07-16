import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { startOfWeek, format } from 'npm:date-fns';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get constellation points
    const events = await base44.entities.ConstellationEvent.filter({ user_id: user.id });
    const totalPoints = events.reduce((sum, e) => sum + (e.points || 1), 0);
    
    // Get recent sentiment
    const notes = await base44.entities.Note.filter({ user_id: user.id }, '-created_date', 5);
    const recentSentiment = notes.length > 0 ? notes[0].sentiment_primary : null;
    
    // Get momentum
    const weekStart = format(startOfWeek(new Date()), 'yyyy-MM-dd');
    const momentumLogs = await base44.entities.MomentumLog.filter({ 
      user_id: user.id,
      week_start: weekStart 
    });
    const weeklyPoints = momentumLogs.length > 0 ? momentumLogs[0].total_points : 0;
    
    // Get streak
    const streaks = await base44.entities.UserStreak.filter({ user_id: user.id });
    const streak = streaks.length > 0 ? streaks[0] : null;
    
    return Response.json({
      constellation: {
        totalPoints,
        recentEvents: events.slice(0, 5)
      },
      sentiment: recentSentiment,
      momentum: {
        weeklyPoints,
        weekStart
      },
      streak: streak ? {
        current: streak.current_streak,
        longest: streak.longest_streak,
        active: streak.streak_active
      } : null
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});