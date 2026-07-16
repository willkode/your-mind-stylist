import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { action_type } = await req.json();

        // Get or create user streak
        let streaks = await base44.entities.UserStreak.filter({ user_id: user.id });
        let streak = streaks[0];

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        if (!streak) {
            // Create new streak
            streak = await base44.asServiceRole.entities.UserStreak.create({
                user_id: user.id,
                current_streak: 1,
                longest_streak: 1,
                last_activity_date: today.toISOString().split('T')[0],
                streak_active: true
            });

            // Track constellation event
            await base44.asServiceRole.functions.invoke('trackEvent', {
                event_type: 'streak_day_completed',
                points: 1,
                metadata: { day: 1 }
            });

            return Response.json({ 
                streak: streak.data,
                is_new_day: true,
                event: 'streak_started'
            });
        }

        const lastActivity = new Date(streak.data.last_activity_date);
        const hoursSinceLastActivity = (now - lastActivity) / (1000 * 60 * 60);

        // Check if streak is broken (48+ hours)
        if (hoursSinceLastActivity > 48) {
            const updated = await base44.asServiceRole.entities.UserStreak.update(streak.id, {
                current_streak: 1,
                last_activity_date: today.toISOString().split('T')[0],
                streak_active: true
            });

            await base44.asServiceRole.functions.invoke('trackEvent', {
                event_type: 'streak_day_completed',
                points: 1,
                metadata: { day: 1, previous_streak: streak.data.current_streak }
            });

            return Response.json({ 
                streak: updated.data,
                is_new_day: true,
                event: 'streak_restarted',
                previous_streak: streak.data.current_streak
            });
        }

        // Check if this is a new day
        const lastActivityDay = new Date(lastActivity.getFullYear(), lastActivity.getMonth(), lastActivity.getDate());
        const isNewDay = today > lastActivityDay;

        if (isNewDay) {
            const newStreak = streak.data.current_streak + 1;
            const newLongest = Math.max(newStreak, streak.data.longest_streak);

            const updated = await base44.asServiceRole.entities.UserStreak.update(streak.id, {
                current_streak: newStreak,
                longest_streak: newLongest,
                last_activity_date: today.toISOString().split('T')[0]
            });

            await base44.asServiceRole.functions.invoke('trackEvent', {
                event_type: 'streak_day_completed',
                points: 1,
                metadata: { day: newStreak }
            });

            return Response.json({ 
                streak: updated.data,
                is_new_day: true,
                event: 'streak_continued'
            });
        }

        // Same day activity - just update timestamp
        return Response.json({ 
            streak: streak.data,
            is_new_day: false,
            event: 'same_day_activity'
        });

    } catch (error) {
        console.error('Streak tracking error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});