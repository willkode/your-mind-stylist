import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Seeds demo transformation data for showcase purposes
 * Creates a realistic 90-day transformation journey
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'manager' && user.role !== 'admin')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const demo_email = body.demo_email || 'demo@yourmindstylist.com';

    // Create demo user if doesn't exist
    const demoUser = { email: demo_email };

    // Clear existing demo data
    const existingReflections = await base44.asServiceRole.entities.LearningReflection.filter({ created_by: demo_email });
    const existingMilestones = await base44.asServiceRole.entities.Milestone.filter({ created_by: demo_email });
    const existingSnapshots = await base44.asServiceRole.entities.TransformationSnapshot.filter({ created_by: demo_email });
    const existingCheckIns = await base44.asServiceRole.entities.DailyStyleCheck.filter({ created_by: demo_email });

    for (const item of [...existingReflections, ...existingMilestones, ...existingSnapshots, ...existingCheckIns]) {
      await base44.asServiceRole.entities[item.__entity_name].delete(item.id);
    }

    const now = new Date();
    const created = { reflections: [], milestones: [], snapshots: [], checkIns: [] };

    // Day 1 - Start
    const day1 = new Date(now);
    day1.setDate(day1.getDate() - 90);

    created.snapshots.push(await base44.asServiceRole.entities.TransformationSnapshot.create({
      created_by: demo_email,
      created_date: day1.toISOString(),
      snapshot_type: 'course_start',
      related_id: 'demo-course-1',
      related_title: 'Mind Styling Fundamentals',
      calm_score: 35,
      grounded_score: 40,
      open_score: 45,
      overall_mood: 'anxious',
      energy_level: 4,
      intentions: 'I want to feel more in control of my thoughts and reactions. I notice I get overwhelmed easily and want to develop better emotional regulation.',
      notes: 'Feeling hopeful but uncertain about where to start.'
    }));

    // Week 1 - First reflections
    const day3 = new Date(day1);
    day3.setDate(day3.getDate() + 3);

    created.reflections.push(await base44.asServiceRole.entities.LearningReflection.create({
      created_by: demo_email,
      created_date: day3.toISOString(),
      reflection_type: 'lesson',
      related_id: 'demo-lesson-1',
      related_title: 'Understanding Your Mental Patterns',
      reflection_text: 'This lesson made me realize how often I run on autopilot. I never noticed how my thoughts spiral until now.',
      what_shifted: 'I can see my patterns more clearly now',
      mood_before: 'neutral',
      mood_after: 'content',
      energy_before: 5,
      energy_after: 6,
      breakthrough_tagged: false
    }));

    created.milestones.push(await base44.asServiceRole.entities.Milestone.create({
      created_by: demo_email,
      created_date: day3.toISOString(),
      milestone_type: 'learning',
      milestone_key: 'first_lesson',
      milestone_name: 'First Step Taken',
      milestone_description: 'You completed your first lesson. Every journey begins somewhere.',
      icon: '📚',
      unlocked_date: day3.toISOString(),
      celebrated: true,
      points_awarded: 50
    }));

    // Week 2 - Daily check-ins start
    for (let i = 7; i < 14; i++) {
      const checkInDay = new Date(day1);
      checkInDay.setDate(checkInDay.getDate() + i);
      
      created.checkIns.push(await base44.asServiceRole.entities.DailyStyleCheck.create({
        created_by: demo_email,
        created_date: checkInDay.toISOString(),
        state_key: 'calm_activated',
        state_value: 40 + i * 2
      }));
    }

    created.milestones.push(await base44.asServiceRole.entities.Milestone.create({
      created_by: demo_email,
      created_date: new Date(day1.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      milestone_type: 'consistency',
      milestone_key: 'streak_7',
      milestone_name: '7-Day Awareness Streak',
      milestone_description: 'You checked in with yourself 7 days in a row. Consistency is building.',
      icon: '🔥',
      unlocked_date: new Date(day1.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      celebrated: true,
      points_awarded: 100,
      metadata: { streak_count: 7 }
    }));

    // Week 3 - First breakthrough
    const day21 = new Date(day1);
    day21.setDate(day21.getDate() + 21);

    created.reflections.push(await base44.asServiceRole.entities.LearningReflection.create({
      created_by: demo_email,
      created_date: day21.toISOString(),
      reflection_type: 'consultation',
      related_id: 'demo-session-1',
      related_title: 'Private Session with Roberta',
      reflection_text: 'Today\'s session was transformative. Roberta helped me see how my need to control everything stems from childhood experiences. The reframe around "trusting the process" instead of forcing outcomes really landed.',
      what_shifted: 'I don\'t have to control everything to be safe',
      mood_before: 'anxious',
      mood_after: 'calm',
      energy_before: 4,
      energy_after: 7,
      breakthrough_tagged: true,
      tags: ['control', 'trust', 'childhood patterns']
    }));

    created.milestones.push(await base44.asServiceRole.entities.Milestone.create({
      created_by: demo_email,
      created_date: day21.toISOString(),
      milestone_type: 'breakthrough',
      milestone_key: 'first_breakthrough',
      milestone_name: 'First Breakthrough',
      milestone_description: 'You tagged your first aha moment. This is what transformation looks like.',
      icon: '💡',
      unlocked_date: day21.toISOString(),
      celebrated: true,
      points_awarded: 100
    }));

    // Month 1 snapshot
    const day30 = new Date(day1);
    day30.setDate(day30.getDate() + 30);

    created.snapshots.push(await base44.asServiceRole.entities.TransformationSnapshot.create({
      created_by: demo_email,
      created_date: day30.toISOString(),
      snapshot_type: 'monthly',
      calm_score: 55,
      grounded_score: 60,
      open_score: 58,
      overall_mood: 'content',
      energy_level: 6,
      notes: 'I can feel the shifts happening. Still have moments of overwhelm but I catch them faster now.'
    }));

    // Week 6 - More reflections
    const day42 = new Date(day1);
    day42.setDate(day42.getDate() + 42);

    created.reflections.push(await base44.asServiceRole.entities.LearningReflection.create({
      created_by: demo_email,
      created_date: day42.toISOString(),
      reflection_type: 'lesson',
      related_id: 'demo-lesson-5',
      related_title: 'Emotional State Shifting',
      reflection_text: 'The technique for shifting my state in real-time is incredible. I used it today before a difficult conversation and it completely changed how I showed up.',
      what_shifted: 'I can choose my state instead of being controlled by it',
      mood_before: 'frustrated',
      mood_after: 'calm',
      energy_before: 5,
      energy_after: 8,
      breakthrough_tagged: true,
      tags: ['state shifting', 'emotional control']
    }));

    created.milestones.push(await base44.asServiceRole.entities.Milestone.create({
      created_by: demo_email,
      created_date: day42.toISOString(),
      milestone_type: 'learning',
      milestone_key: 'lessons_10',
      milestone_name: 'Knowledge Builder',
      milestone_description: '10 lessons completed. You\'re building real depth.',
      icon: '📖',
      unlocked_date: day42.toISOString(),
      celebrated: true,
      points_awarded: 200
    }));

    // Month 2 - Emotional shift
    const day60 = new Date(day1);
    day60.setDate(day60.getDate() + 60);

    created.snapshots.push(await base44.asServiceRole.entities.TransformationSnapshot.create({
      created_by: demo_email,
      created_date: day60.toISOString(),
      snapshot_type: 'monthly',
      calm_score: 70,
      grounded_score: 72,
      open_score: 68,
      overall_mood: 'calm',
      energy_level: 7,
      notes: 'The difference is night and day. I feel more like myself than I have in years.'
    }));

    created.milestones.push(await base44.asServiceRole.entities.Milestone.create({
      created_by: demo_email,
      created_date: day60.toISOString(),
      milestone_type: 'emotional_shift',
      milestone_key: 'calm_week',
      milestone_name: 'Calm Emerging',
      milestone_description: 'Your calm scores are rising. The work is showing results.',
      icon: '😌',
      unlocked_date: day60.toISOString(),
      celebrated: true,
      points_awarded: 150,
      metadata: { improvement_percentage: 70 }
    }));

    // Month 3 - Integration
    const day85 = new Date(day1);
    day85.setDate(day85.getDate() + 85);

    created.reflections.push(await base44.asServiceRole.entities.LearningReflection.create({
      created_by: demo_email,
      created_date: day85.toISOString(),
      reflection_type: 'weekly',
      reflection_text: 'Looking back at where I started feels surreal. The tools have become second nature. I notice when I\'m slipping into old patterns and can course-correct almost immediately. This isn\'t just knowledge anymore - it\'s integration.',
      what_shifted: 'This work has become part of who I am',
      mood_before: 'grateful',
      mood_after: 'grateful',
      energy_before: 8,
      energy_after: 8,
      breakthrough_tagged: false,
      tags: ['integration', 'growth', 'reflection']
    }));

    // Final snapshot
    created.snapshots.push(await base44.asServiceRole.entities.TransformationSnapshot.create({
      created_by: demo_email,
      created_date: now.toISOString(),
      snapshot_type: 'course_end',
      related_id: 'demo-course-1',
      related_title: 'Mind Styling Fundamentals',
      calm_score: 78,
      grounded_score: 82,
      open_score: 75,
      overall_mood: 'content',
      energy_level: 8,
      outcomes: 'I feel fundamentally different. More grounded, more aware, more able to choose my responses. The tools work, and I trust myself now.',
      notes: 'Excited to keep deepening this practice.'
    }));

    return Response.json({
      success: true,
      demo_user: demo_email,
      data_created: {
        reflections: created.reflections.length,
        milestones: created.milestones.length,
        snapshots: created.snapshots.length,
        check_ins: created.checkIns.length
      }
    });

  } catch (error) {
    console.error('Demo data seed error:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});