import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
            return Response.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { course_id } = await req.json();

        if (!course_id) {
            return Response.json({ error: 'course_id required' }, { status: 400 });
        }

        // Fetch all data
        const [course, modules, lessons, quizzes, courseProgress, lessonProgress, quizAttempts] = await Promise.all([
            base44.asServiceRole.entities.Course.filter({ id: course_id }),
            base44.asServiceRole.entities.Module.filter({ course_id }),
            base44.asServiceRole.entities.Lesson.filter({ course_id }),
            base44.asServiceRole.entities.Quiz.filter({ course_id }),
            base44.asServiceRole.entities.UserCourseProgress.filter({ course_id }),
            base44.asServiceRole.entities.UserLessonProgress.filter({ course_id }),
            base44.asServiceRole.entities.UserQuizAttempt.filter({ quiz_id: { $in: [] } }) // Will refetch with quiz IDs
        ]);

        if (!course || course.length === 0) {
            return Response.json({ error: 'Course not found' }, { status: 404 });
        }

        // Get all quiz attempts for this course's quizzes
        const quizIds = quizzes.map(q => q.id);
        const allQuizAttempts = quizIds.length > 0 
            ? await base44.asServiceRole.entities.UserQuizAttempt.list('-created_date', 1000)
            : [];
        const courseQuizAttempts = allQuizAttempts.filter(a => quizIds.includes(a.quiz_id));

        // Calculate overall stats
        const totalEnrolled = courseProgress.length;
        const completedCount = courseProgress.filter(p => p.status === 'completed').length;
        const inProgressCount = courseProgress.filter(p => p.status === 'in_progress').length;
        const completionRate = totalEnrolled > 0 ? (completedCount / totalEnrolled) * 100 : 0;

        // Calculate average completion time
        const completedWithDates = courseProgress.filter(p => 
            p.status === 'completed' && p.started_date && p.completed_date
        );
        const avgCompletionDays = completedWithDates.length > 0
            ? completedWithDates.reduce((sum, p) => {
                const days = (new Date(p.completed_date) - new Date(p.started_date)) / (1000 * 60 * 60 * 24);
                return sum + days;
            }, 0) / completedWithDates.length
            : 0;

        // Progress distribution
        const progressBuckets = {
            '0-25%': 0,
            '26-50%': 0,
            '51-75%': 0,
            '76-99%': 0,
            '100%': 0
        };

        courseProgress.forEach(p => {
            const pct = p.completion_percentage || 0;
            if (pct === 0) progressBuckets['0-25%']++;
            else if (pct <= 25) progressBuckets['0-25%']++;
            else if (pct <= 50) progressBuckets['26-50%']++;
            else if (pct <= 75) progressBuckets['51-75%']++;
            else if (pct < 100) progressBuckets['76-99%']++;
            else progressBuckets['100%']++;
        });

        // Module completion rates
        const moduleStats = modules.map(module => {
            const moduleLessons = lessons.filter(l => l.module_id === module.id);
            const moduleLessonIds = moduleLessons.map(l => l.id);
            const moduleLessonProgress = lessonProgress.filter(lp => 
                moduleLessonIds.includes(lp.lesson_id)
            );

            const uniqueUsers = [...new Set(moduleLessonProgress.map(lp => lp.user_id))];
            const completedUsers = uniqueUsers.filter(userId => {
                const userProgress = moduleLessonProgress.filter(lp => 
                    lp.user_id === userId && lp.completed
                );
                return userProgress.length === moduleLessons.length;
            });

            return {
                module_id: module.id,
                module_title: module.title,
                module_order: module.order || 0,
                total_lessons: moduleLessons.length,
                started_count: uniqueUsers.length,
                completed_count: completedUsers.length,
                completion_rate: uniqueUsers.length > 0 ? (completedUsers.length / uniqueUsers.length) * 100 : 0
            };
        }).sort((a, b) => a.module_order - b.module_order);

        // Lesson drop-off analysis
        const lessonStats = lessons.map(lesson => {
            const lessonProgressRecords = lessonProgress.filter(lp => lp.lesson_id === lesson.id);
            const started = lessonProgressRecords.length;
            const completed = lessonProgressRecords.filter(lp => lp.completed).length;
            const avgProgress = started > 0 
                ? lessonProgressRecords.reduce((sum, lp) => sum + (lp.progress_percentage || 0), 0) / started
                : 0;

            return {
                lesson_id: lesson.id,
                lesson_title: lesson.title,
                module_id: lesson.module_id,
                order: lesson.order || 0,
                started_count: started,
                completed_count: completed,
                completion_rate: started > 0 ? (completed / started) * 100 : 0,
                avg_progress: avgProgress,
                drop_off_rate: started > 0 ? ((started - completed) / started) * 100 : 0
            };
        }).sort((a, b) => {
            if (a.module_id !== b.module_id) {
                const modA = modules.find(m => m.id === a.module_id);
                const modB = modules.find(m => m.id === b.module_id);
                return (modA?.order || 0) - (modB?.order || 0);
            }
            return a.order - b.order;
        });

        // Quiz performance
        const quizStats = quizzes.map(quiz => {
            const attempts = courseQuizAttempts.filter(a => a.quiz_id === quiz.id);
            const uniqueUsers = [...new Set(attempts.map(a => a.user_id))];
            const passedAttempts = attempts.filter(a => a.passed);
            const avgScore = attempts.length > 0
                ? attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attempts.length
                : 0;

            return {
                quiz_id: quiz.id,
                quiz_title: quiz.title,
                total_attempts: attempts.length,
                unique_users: uniqueUsers.length,
                passed_count: passedAttempts.length,
                pass_rate: attempts.length > 0 ? (passedAttempts.length / attempts.length) * 100 : 0,
                avg_score: avgScore
            };
        });

        // Difficult questions
        const allQuestions = [];
        for (const quiz of quizzes) {
            const questions = await base44.asServiceRole.entities.QuizQuestion.filter({ quiz_id: quiz.id });
            allQuestions.push(...questions.map(q => ({ ...q, quiz_title: quiz.title })));
        }

        const difficultQuestions = allQuestions
            .filter(q => q.times_answered > 5)
            .map(q => ({
                question_id: q.id,
                quiz_title: q.quiz_title,
                question_text: q.question_text.substring(0, 100),
                times_answered: q.times_answered || 0,
                times_correct: q.times_correct || 0,
                correct_rate: q.times_answered > 0 ? (q.times_correct / q.times_answered) * 100 : 0,
                difficulty: q.difficulty || 'medium'
            }))
            .sort((a, b) => a.correct_rate - b.correct_rate)
            .slice(0, 10);

        // Engagement over time (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentProgress = courseProgress.filter(p => 
            p.started_date && new Date(p.started_date) >= thirtyDaysAgo
        );

        const dailyEngagement = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            const started = recentProgress.filter(p => 
                p.started_date && p.started_date.startsWith(dateStr)
            ).length;
            
            const completed = recentProgress.filter(p => 
                p.completed_date && p.completed_date.startsWith(dateStr)
            ).length;

            dailyEngagement.push({
                date: dateStr,
                started,
                completed
            });
        }

        // Save analytics
        const analyticsData = {
            course_id,
            total_enrolled: totalEnrolled,
            completed_count: completedCount,
            in_progress_count: inProgressCount,
            completion_rate: completionRate,
            avg_completion_days: avgCompletionDays,
            progress_distribution: progressBuckets,
            module_stats: moduleStats,
            lesson_stats: lessonStats,
            quiz_stats: quizStats,
            difficult_questions: difficultQuestions,
            daily_engagement: dailyEngagement,
            last_calculated: new Date().toISOString()
        };

        // Update or create analytics record
        const existingAnalytics = await base44.asServiceRole.entities.CourseAnalytics.filter({ course_id });
        if (existingAnalytics && existingAnalytics.length > 0) {
            await base44.asServiceRole.entities.CourseAnalytics.update(existingAnalytics[0].id, analyticsData);
        } else {
            await base44.asServiceRole.entities.CourseAnalytics.create(analyticsData);
        }

        return Response.json({
            success: true,
            analytics: analyticsData
        });

    } catch (error) {
        console.error('Calculate course analytics error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});