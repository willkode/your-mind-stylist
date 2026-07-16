import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { lesson_id, completed, watch_time, last_position } = await req.json();

    // Get or create lesson progress
    let progressRecords = await base44.entities.UserLessonProgress.filter({
      user_id: user.id,
      lesson_id
    });

    let progress;
    if (progressRecords.length === 0) {
      // Create new progress record
      progress = await base44.entities.UserLessonProgress.create({
        user_id: user.id,
        lesson_id,
        completed: completed || false,
        watch_time: watch_time || 0,
        last_position: last_position || 0,
        completed_date: completed ? new Date().toISOString() : null
      });
    } else {
      // Update existing progress
      progress = progressRecords[0];
      const updateData = {
        watch_time: watch_time !== undefined ? watch_time : progress.watch_time,
        last_position: last_position !== undefined ? last_position : progress.last_position
      };

      if (completed && !progress.completed) {
        updateData.completed = true;
        updateData.completed_date = new Date().toISOString();
      }

      await base44.entities.UserLessonProgress.update(progress.id, updateData);
      progress = { ...progress, ...updateData };
    }

    // Get lesson to find module and course
    const lessons = await base44.entities.Lesson.filter({ id: lesson_id });
    if (!lessons || lessons.length === 0) {
      return Response.json({ error: 'Lesson not found' }, { status: 404 });
    }
    const lesson = lessons[0];

    // Get module to find course
    const modules = await base44.entities.Module.filter({ id: lesson.module_id });
    if (!modules || modules.length === 0) {
      return Response.json({ error: 'Module not found' }, { status: 404 });
    }
    const module = modules[0];
    const course_id = module.course_id;

    // Recalculate course progress
    const allLessons = await base44.entities.Lesson.list();
    const courseLessons = allLessons.filter(l => {
      const lessonModules = allLessons.map(lesson => lesson.module_id);
      const courseModules = modules.filter(m => m.course_id === course_id).map(m => m.id);
      return courseModules.includes(l.module_id);
    });

    const allProgress = await base44.entities.UserLessonProgress.filter({
      user_id: user.id
    });

    const completedLessons = courseLessons.filter(l => 
      allProgress.some(p => p.lesson_id === l.id && p.completed)
    );

    const completionPercentage = courseLessons.length > 0
      ? Math.round((completedLessons.length / courseLessons.length) * 100)
      : 0;

    const allCompleted = completionPercentage === 100;

    // Update or create course progress
    let courseProgressRecords = await base44.entities.UserCourseProgress.filter({
      user_id: user.id,
      course_id
    });

    const courseProgressData = {
      completion_percentage: completionPercentage,
      last_accessed_lesson_id: lesson_id,
      status: allCompleted ? 'completed' : (completionPercentage > 0 ? 'in_progress' : 'not_started')
    };

    if (allCompleted && (!courseProgressRecords.length || !courseProgressRecords[0].completed_date)) {
      courseProgressData.completed_date = new Date().toISOString();
    }

    if (!courseProgressRecords.length && courseProgressData.status !== 'not_started') {
      courseProgressData.started_date = new Date().toISOString();
    }

    if (courseProgressRecords.length === 0) {
      await base44.entities.UserCourseProgress.create({
        user_id: user.id,
        course_id,
        ...courseProgressData
      });
    } else {
      await base44.entities.UserCourseProgress.update(
        courseProgressRecords[0].id,
        courseProgressData
      );
    }

    return Response.json({
      success: true,
      lesson_progress: progress,
      course_progress: {
        completion_percentage: completionPercentage,
        status: courseProgressData.status
      }
    });

  } catch (error) {
    console.error('Update lesson progress error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});