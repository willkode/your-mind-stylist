import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch user's learning data
        const [courseProgress, lessonProgress, reflections, snapshots, depthMarker] = await Promise.all([
            base44.entities.UserCourseProgress.filter({ user_id: user.id }),
            base44.entities.UserLessonProgress.filter({ user_id: user.id }),
            base44.entities.LearningReflection.filter({ created_by: user.email }),
            base44.entities.TransformationSnapshot.list('-created_date', 10),
            base44.entities.DepthMarker.filter({ created_by: user.email })
        ]);

        // Fetch all available courses
        const allCourses = await base44.asServiceRole.entities.Course.filter({ 
            status: 'published',
            visibility: 'public'
        });

        // Calculate user preferences and patterns
        const completedCourseIds = courseProgress
            .filter(cp => cp.status === 'completed')
            .map(cp => cp.course_id);

        const inProgressCourseIds = courseProgress
            .filter(cp => cp.status === 'in_progress')
            .map(cp => cp.course_id);

        // Analyze emotional patterns from reflections
        const emotionalTrends = reflections.reduce((acc, ref) => {
            if (ref.mood_after && ref.mood_before) {
                const improvement = ref.mood_after !== ref.mood_before;
                if (improvement) {
                    acc.positive++;
                } else {
                    acc.neutral++;
                }
            }
            return acc;
        }, { positive: 0, neutral: 0 });

        // Determine user's current depth level
        const currentDepthLevel = depthMarker[0]?.current_depth_level || 1;

        // Analyze course types user prefers
        const completedCourses = allCourses.filter(c => completedCourseIds.includes(c.id));
        const preferredTypes = completedCourses.reduce((acc, course) => {
            acc[course.type] = (acc[course.type] || 0) + 1;
            return acc;
        }, {});

        // Get courses user hasn't started
        const availableCourses = allCourses.filter(course => 
            !completedCourseIds.includes(course.id) && 
            !inProgressCourseIds.includes(course.id)
        );

        // Score and rank courses
        const recommendations = availableCourses.map(course => {
            let score = 0;
            let reasons = [];

            // Score based on preferred course type
            if (preferredTypes[course.type]) {
                score += preferredTypes[course.type] * 10;
                reasons.push(`You've enjoyed ${course.type} courses before`);
            }

            // Score based on difficulty progression
            const userLevel = currentDepthLevel <= 3 ? 'Intro' : currentDepthLevel <= 6 ? 'Intermediate' : 'Deep Work';
            if (course.difficulty === userLevel) {
                score += 20;
                reasons.push(`Matches your current depth level (${userLevel})`);
            } else if (course.difficulty === 'Intro' && currentDepthLevel <= 5) {
                score += 15;
                reasons.push('Perfect for building foundations');
            } else if (course.difficulty === 'Intermediate' && currentDepthLevel >= 4) {
                score += 15;
                reasons.push('Ready for intermediate work');
            }

            // Score based on emotional improvement patterns
            if (emotionalTrends.positive > emotionalTrends.neutral * 2) {
                // User responds well to deep emotional work
                if (course.type === 'Toolkit Module' || course.type === 'Audio-Based Program') {
                    score += 15;
                    reasons.push('Your reflections show strong emotional growth with similar programs');
                }
            }

            // Boost popular courses
            if (course.type === 'Training Program') {
                score += 5;
                reasons.push('Highly structured learning path');
            }

            // Penalize if prerequisites not met
            if (course.prerequisites && course.prerequisites.length > 0) {
                const prereqsMet = course.prerequisites.every(prereqId => 
                    completedCourseIds.includes(prereqId)
                );
                if (!prereqsMet) {
                    score -= 50;
                    reasons.push('Prerequisites needed first');
                }
            } else {
                score += 10;
                reasons.push('No prerequisites - start anytime');
            }

            return {
                course,
                score,
                reasons: reasons.slice(0, 3) // Top 3 reasons
            };
        });

        // Sort by score and take top recommendations
        recommendations.sort((a, b) => b.score - a.score);
        const topRecommendations = recommendations.slice(0, 6);

        // Generate AI-powered insight about user's learning journey
        const journeyInsight = generateJourneyInsight(
            completedCourses.length,
            inProgressCourseIds.length,
            currentDepthLevel,
            emotionalTrends
        );

        return Response.json({
            recommendations: topRecommendations.map(rec => ({
                id: rec.course.id,
                title: rec.course.title,
                subtitle: rec.course.subtitle,
                type: rec.course.type,
                difficulty: rec.course.difficulty,
                duration: rec.course.duration,
                thumbnail: rec.course.thumbnail,
                score: rec.score,
                reasons: rec.reasons
            })),
            insight: journeyInsight,
            userStats: {
                completedCourses: completedCourseIds.length,
                inProgressCourses: inProgressCourseIds.length,
                currentDepthLevel,
                emotionalGrowthRate: emotionalTrends.positive > 0 
                    ? Math.round((emotionalTrends.positive / (emotionalTrends.positive + emotionalTrends.neutral)) * 100)
                    : 0
            }
        });

    } catch (error) {
        console.error('Learning path generation error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

function generateJourneyInsight(completedCount, inProgressCount, depthLevel, emotionalTrends) {
    if (completedCount === 0 && inProgressCount === 0) {
        return "You're just beginning your transformation journey. The courses recommended below are perfect starting points based on what others have found transformative.";
    }

    if (completedCount >= 3 && depthLevel >= 5) {
        return `You've completed ${completedCount} programs and reached Depth Level ${depthLevel}. You're ready for advanced work that will deepen your mastery and emotional intelligence.`;
    }

    if (emotionalTrends.positive > emotionalTrends.neutral * 2) {
        return `Your reflections show exceptional emotional growth. The programs below build on that momentum and will help you integrate these shifts even deeper.`;
    }

    if (inProgressCount > 0) {
        return `You have ${inProgressCount} program${inProgressCount > 1 ? 's' : ''} in progress. These recommendations complement your current work and offer natural next steps.`;
    }

    return `Based on your learning patterns and progress, these courses are personalized for your journey right now.`;
}