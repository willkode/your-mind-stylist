import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { quiz_id } = await req.json();

    if (!quiz_id) {
      return Response.json({ error: 'quiz_id is required' }, { status: 400 });
    }

    // Get all attempts for this quiz
    const attempts = await base44.asServiceRole.entities.UserQuizAttempt.filter({ quiz_id });
    
    if (attempts.length === 0) {
      return Response.json({
        message: 'No attempts yet',
        analytics: null
      });
    }

    // Calculate metrics
    const uniqueUsers = [...new Set(attempts.map(a => a.user_id))].length;
    const passedAttempts = attempts.filter(a => a.passed).length;
    const passRate = (passedAttempts / attempts.length) * 100;
    const averageScore = attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length;
    const averageTime = attempts.reduce((sum, a) => sum + (a.time_taken || 0), 0) / attempts.length;

    // Score distribution
    const scoreDistribution = {
      "0-20": 0,
      "21-40": 0,
      "41-60": 0,
      "61-80": 0,
      "81-100": 0
    };

    attempts.forEach(attempt => {
      if (attempt.score <= 20) scoreDistribution["0-20"]++;
      else if (attempt.score <= 40) scoreDistribution["21-40"]++;
      else if (attempt.score <= 60) scoreDistribution["41-60"]++;
      else if (attempt.score <= 80) scoreDistribution["61-80"]++;
      else scoreDistribution["81-100"]++;
    });

    // Question-level analytics
    const questions = await base44.asServiceRole.entities.QuizQuestion.filter({ quiz_id });
    const questionStats = [];

    for (const question of questions) {
      const responses = attempts.flatMap(a => 
        a.answers?.filter(ans => ans.question_id === question.id) || []
      );
      
      const correctResponses = responses.filter(r => r.is_correct).length;
      const correctPercentage = responses.length > 0 
        ? (correctResponses / responses.length) * 100 
        : 0;

      questionStats.push({
        question_id: question.id,
        question_text: question.question_text,
        correct_percentage: Math.round(correctPercentage),
        total_responses: responses.length
      });
    }

    // Save or update analytics
    const existingAnalytics = await base44.asServiceRole.entities.QuizAnalytics.filter({ quiz_id });
    
    const analyticsData = {
      quiz_id,
      total_attempts: attempts.length,
      unique_users: uniqueUsers,
      pass_rate: Math.round(passRate),
      average_score: Math.round(averageScore),
      average_time_taken: Math.round(averageTime),
      question_stats: questionStats,
      score_distribution: scoreDistribution,
      last_calculated: new Date().toISOString()
    };

    if (existingAnalytics.length > 0) {
      await base44.asServiceRole.entities.QuizAnalytics.update(
        existingAnalytics[0].id,
        analyticsData
      );
    } else {
      await base44.asServiceRole.entities.QuizAnalytics.create(analyticsData);
    }

    return Response.json({
      success: true,
      analytics: analyticsData
    });

  } catch (error) {
    console.error('Calculate quiz analytics error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});