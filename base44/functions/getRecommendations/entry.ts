import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user's recent notes with sentiment
        const notes = await base44.entities.Note.filter(
            { user_id: user.id },
            '-created_date',
            5
        );

        // Get recent constellation events
        const events = await base44.entities.ConstellationEvent.filter(
            { user_id: user.id },
            '-created_date',
            10
        );

        // Get momentum data
        const momentumLogs = await base44.entities.MomentumLog.filter(
            { user_id: user.id },
            '-week_start',
            1
        );

        // Get user streak
        const streaks = await base44.entities.UserStreak.filter({ user_id: user.id });
        const streak = streaks[0];

        // Analyze patterns
        const recentSentiments = notes
            .filter(n => n.data.sentiment_primary)
            .map(n => n.data.sentiment_primary);

        const dominantSentiment = getMostCommon(recentSentiments);
        const weeklyPoints = momentumLogs[0]?.data?.total_points || 0;
        const currentStreak = streak?.data?.current_streak || 0;

        // Generate recommendations
        const recommendations = [];

        // Sentiment-based recommendations
        if (dominantSentiment === 'overwhelm' || dominantSentiment === 'tension') {
            recommendations.push({
                type: 'audio_session',
                title: 'A Reset Might Serve You Right Now',
                description: 'Your recent notes suggest some internal pressure. A calming session could help.',
                category: 'Calm & Nervous System Resets',
                priority: 'high',
                reason: 'emotional_state'
            });
        }

        if (dominantSentiment === 'resistance') {
            recommendations.push({
                type: 'reflection',
                title: 'What\'s the Resistance Protecting?',
                description: 'Resistance often carries wisdom. A moment of gentle inquiry might reveal something.',
                prompt: 'What am I protecting myself from by resisting this?',
                priority: 'medium',
                reason: 'emotional_pattern'
            });
        }

        if (dominantSentiment === 'clarity' || dominantSentiment === 'confidence') {
            recommendations.push({
                type: 'lesson',
                title: 'Keep Building on This Clarity',
                description: 'You\'re in a clear, receptive state. Perfect time for deeper learning.',
                priority: 'medium',
                reason: 'optimal_state'
            });
        }

        // Momentum-based recommendations
        if (weeklyPoints < 10) {
            recommendations.push({
                type: 'gentle_nudge',
                title: 'A Small Step Forward',
                description: 'Even a few minutes of presence this week would serve you.',
                action: 'Take a 5-minute audio session',
                priority: 'low',
                reason: 'low_momentum'
            });
        }

        if (weeklyPoints >= 30) {
            recommendations.push({
                type: 'celebration',
                title: 'You\'re Building Beautiful Momentum',
                description: 'Your consistency this week is remarkable. Notice how this feels.',
                priority: 'low',
                reason: 'high_momentum'
            });
        }

        // Streak-based recommendations
        if (currentStreak >= 7) {
            recommendations.push({
                type: 'reflection',
                title: 'A Week of Showing Up',
                description: 'You\'ve been present for yourself for a full week. What\'s different?',
                prompt: 'How has showing up for myself this week changed how I feel?',
                priority: 'low',
                reason: 'streak_milestone'
            });
        }

        // Pattern-based recommendations
        const hasNotesButNoLessons = notes.length > 3 && 
            !events.some(e => e.data.event_type === 'lesson_completed');
        
        if (hasNotesButNoLessons) {
            recommendations.push({
                type: 'lesson',
                title: 'Time to Expand Your Toolkit?',
                description: 'You\'re reflecting beautifully. A structured lesson might give you new language for what you\'re experiencing.',
                priority: 'medium',
                reason: 'balance_reflection_learning'
            });
        }

        // Default recommendation if none generated
        if (recommendations.length === 0) {
            recommendations.push({
                type: 'audio_session',
                title: 'Start Where You Are',
                description: 'A gentle session to ground yourself and check in.',
                category: 'Calm & Nervous System Resets',
                priority: 'low',
                reason: 'default'
            });
        }

        // Sort by priority and take top 2
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const topRecommendations = recommendations
            .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
            .slice(0, 2);

        // Track recommendation event
        await base44.asServiceRole.functions.invoke('trackEvent', {
            event_type: 'recommendation_served',
            points: 0,
            metadata: {
                recommendations: topRecommendations.map(r => r.type),
                dominant_sentiment: dominantSentiment
            }
        });

        return Response.json({ 
            recommendations: topRecommendations,
            context: {
                dominant_sentiment: dominantSentiment,
                weekly_points: weeklyPoints,
                current_streak: currentStreak,
                recent_activity: events.slice(0, 3).map(e => e.data.event_type)
            }
        });

    } catch (error) {
        console.error('Recommendation error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

function getMostCommon(arr) {
    if (!arr || arr.length === 0) return null;
    
    const counts = {};
    let maxCount = 0;
    let mostCommon = null;
    
    arr.forEach(item => {
        counts[item] = (counts[item] || 0) + 1;
        if (counts[item] > maxCount) {
            maxCount = counts[item];
            mostCommon = item;
        }
    });
    
    return mostCommon;
}