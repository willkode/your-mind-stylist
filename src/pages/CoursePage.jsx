import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import CourseHeader from "../components/courses/CourseHeader";
import ProgressBar from "../components/courses/ProgressBar";
import ModuleNavigator from "../components/courses/ModuleNavigator";
import LessonArea from "../components/courses/LessonArea";
import LessonNavigation from "../components/courses/LessonNavigation";
import NotesDrawer from "../components/studio/NotesDrawer";
import CourseNotesDrawer from "../components/courses/CourseNotesDrawer";
import EmotionalCheckIn from "../components/courses/EmotionalCheckIn";

export default function CoursePage() {
  const queryClient = useQueryClient();
  const [currentLessonId, setCurrentLessonId] = useState(null);
  const [notesDrawerOpen, setNotesDrawerOpen] = useState(false);
  const [courseNotesDrawerOpen, setCourseNotesDrawerOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [showEmotionalCheckIn, setShowEmotionalCheckIn] = useState(false);
  const [checkInType, setCheckInType] = useState("before"); // "before" or "after"

  // Get course slug or id from URL
  const urlParams = new URLSearchParams(window.location.search);
  const courseSlug = urlParams.get("slug");
  const courseId = urlParams.get("id") || urlParams.get("courseId") || urlParams.get("courseid");

  // Fetch user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        // Check if user should take start snapshot
        if (currentUser && course) {
          const existingSnapshots = await base44.entities.TransformationSnapshot.filter({
            created_by: currentUser.email,
            snapshot_type: 'course_start',
            related_id: course.id
          });
          
          // Snapshot check removed — no longer needed
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    fetchUser();
  }, []);

  // Fetch course
  const { data: courses = [] } = useQuery({
    queryKey: ["courses", courseSlug, courseId],
    queryFn: async () => {
      if (courseSlug) {
        return base44.entities.Course.filter({ slug: courseSlug, status: "published" });
      } else if (courseId) {
        const course = await base44.entities.Course.get(courseId);
        return course ? [course] : [];
      }
      return [];
    },
    enabled: !!(courseSlug || courseId),
  });
  const course = courses[0];

  // Fetch modules
  const { data: modules = [] } = useQuery({
    queryKey: ["modules", course?.id],
    queryFn: () => base44.entities.Module.filter({ course_id: course.id }, "order"),
    enabled: !!course?.id,
  });

  // Fetch lessons
  const { data: allLessons = [] } = useQuery({
    queryKey: ["lessons", course?.id],
    queryFn: async () => {
      if (!modules.length) return [];
      const moduleIds = modules.map(m => m.id);
      const lessonPromises = moduleIds.map(moduleId =>
        base44.entities.Lesson.filter({ module_id: moduleId }, "order")
      );
      const lessonArrays = await Promise.all(lessonPromises);
      return lessonArrays.flat();
    },
    enabled: !!course?.id && modules.length > 0,
  });

  // Fetch user progress
  const { data: userProgress = [] } = useQuery({
    queryKey: ["userCourseProgress", course?.id, user?.id],
    queryFn: () =>
      base44.entities.UserCourseProgress.filter({
        user_id: user.id,
        course_id: course.id,
      }),
    enabled: !!course?.id && !!user?.id,
  });
  const progress = userProgress[0];

  // Fetch lesson progress
  const { data: userLessonProgress = [] } = useQuery({
    queryKey: ["userLessonProgress", user?.id],
    queryFn: () => base44.entities.UserLessonProgress.filter({ user_id: user.id }),
    enabled: !!user?.id,
  });

  // Fetch lesson notes to show indicator in module navigator and in lesson area
  const { data: lessonNotes = [] } = useQuery({
    queryKey: ["lessonNotes", user?.id, course?.id],
    queryFn: async () => {
      const notes = await base44.entities.Note.filter({ source_type: "lesson" }, "-created_date");
      // Filter client-side to only show current user's notes
      return notes.filter(n => n.user_id === user.id || n.created_by === user.email);
    },
    enabled: !!user?.id && !!course?.id,
  });
  const lessonIdsWithNotes = new Set(lessonNotes.map(n => n.source_id).filter(Boolean));
  const currentLessonNotes = lessonNotes.filter(n => n.source_id === currentLessonId);

  // Set initial lesson
  useEffect(() => {
    if (allLessons.length > 0 && !currentLessonId) {
      // Find last accessed lesson or first lesson
      const lastLessonId = progress?.last_accessed_lesson_id;
      if (lastLessonId && allLessons.find(l => l.id === lastLessonId)) {
        setCurrentLessonId(lastLessonId);
      } else {
        setCurrentLessonId(allLessons[0].id);
      }
    }
  }, [allLessons, currentLessonId, progress]);

  // Create/update course progress
  const progressMutation = useMutation({
    mutationFn: async ({ status, lessonId }) => {
      if (progress) {
        return base44.entities.UserCourseProgress.update(progress.id, {
          status,
          last_accessed_lesson_id: lessonId,
        });
      } else {
        return base44.entities.UserCourseProgress.create({
          user_id: user.id,
          course_id: course.id,
          status,
          last_accessed_lesson_id: lessonId,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userCourseProgress"] });
    },
  });

  // Update lesson progress (watch time)
  const progressUpdateMutation = useMutation({
    mutationFn: async ({ lessonId, watchTime }) => {
      const existingProgress = userLessonProgress.find(p => p.lesson_id === lessonId);
      if (existingProgress) {
        return base44.entities.UserLessonProgress.update(existingProgress.id, {
          watch_time: watchTime,
          last_position: watchTime,
        });
      } else {
        return base44.entities.UserLessonProgress.create({
          user_id: user.id,
          lesson_id: lessonId,
          watch_time: watchTime,
          last_position: watchTime,
        });
      }
    },
  });

  // Mark lesson complete
  const lessonCompleteMutation = useMutation({
    mutationFn: async (lessonId) => {
      const existingProgress = userLessonProgress.find(p => p.lesson_id === lessonId);
      if (existingProgress) {
        return base44.entities.UserLessonProgress.update(existingProgress.id, {
          completed: true,
          completed_date: new Date().toISOString(),
        });
      } else {
        return base44.entities.UserLessonProgress.create({
          user_id: user.id,
          lesson_id: lessonId,
          completed: true,
          completed_date: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userLessonProgress"] });
      // Update course completion percentage
      const completedCount = userLessonProgress.filter(p => p.completed).length + 1;
      const percentage = (completedCount / allLessons.length) * 100;
      const newStatus = percentage === 100 ? "completed" : "in_progress";
      
      if (progress) {
        base44.entities.UserCourseProgress.update(progress.id, {
          completion_percentage: percentage,
          status: newStatus,
          ...(newStatus === "completed" && { completed_date: new Date().toISOString() }),
        });
      }
    },
  });

  const handleContinue = () => {
    if (!progress || progress.status === "not_started") {
      progressMutation.mutate({ status: "in_progress", lessonId: currentLessonId });
    }
    // Scroll to lesson area
    document.getElementById("lesson-area")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleLessonSelect = (lessonId) => {
    // Check if lesson is locked
    const lesson = allLessons.find(l => l.id === lessonId);
    if (lesson?.prerequisites && lesson.prerequisites.length > 0) {
      const allPrereqsCompleted = lesson.prerequisites.every(prereqId =>
        userLessonProgress.some(p => p.lesson_id === prereqId && p.completed)
      );
      if (!allPrereqsCompleted) {
        alert("Please complete the prerequisite lessons first");
        return;
      }
    }

    // Check if user hasn't tracked emotional state before for this lesson (only if enabled)
    const lessonProgress = userLessonProgress.find(p => p.lesson_id === lessonId);
    if (lesson?.enable_checkin && !lessonProgress?.mood_before && !lessonProgress?.completed) {
      setCheckInType("before");
      setShowEmotionalCheckIn(true);
    }

    setCurrentLessonId(lessonId);
    progressMutation.mutate({ 
      status: progress?.status === "completed" ? "completed" : "in_progress", 
      lessonId 
    });
  };

  const handleMarkComplete = () => {
    // Show emotional check-in after completion (only if enabled and not completed yet)
    const currentLesson = allLessons.find(l => l.id === currentLessonId);
    const lessonProgress = userLessonProgress.find(p => p.lesson_id === currentLessonId);
    // Only show popup if lesson is enabled for check-in, NOT completed yet, and hasn't recorded mood_after
    if (currentLesson?.enable_checkin && !lessonProgress?.completed && !lessonProgress?.mood_after) {
      setCheckInType("after");
      setShowEmotionalCheckIn(true);
    } else {
      lessonCompleteMutation.mutate(currentLessonId);
    }
  };

  const handleProgressUpdate = (watchTime) => {
    progressUpdateMutation.mutate({ lessonId: currentLessonId, watchTime });
  };

  const currentLesson = allLessons.find(l => l.id === currentLessonId);
  const completedLessons = userLessonProgress.filter(p => p.completed).length;
  const currentLessonProgress = userLessonProgress.find(p => p.lesson_id === currentLessonId);
  const isCurrentLessonCompleted = currentLessonProgress?.completed;

  const isCurrentLessonLocked = () => {
    if (!currentLesson?.prerequisites || currentLesson.prerequisites.length === 0) return false;
    return !currentLesson.prerequisites.every(prereqId =>
      userLessonProgress.some(p => p.lesson_id === prereqId && p.completed)
    );
  };

  const getPrerequisiteLessons = () => {
    if (!currentLesson?.prerequisites) return [];
    return allLessons.filter(l => currentLesson.prerequisites.includes(l.id));
  };

  if (!course) {
    return (
      <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center">
        <p className="text-[#2B2725]/70">Loading course...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F5EF]">
      <CourseHeader course={course} userProgress={progress} />
      <ProgressBar
        userProgress={progress}
        totalLessons={allLessons.length}
        completedLessons={completedLessons}
        onContinue={handleContinue}
      />
      <div className="flex flex-col lg:flex-row" id="lesson-area">
        <ModuleNavigator
          modules={modules}
          lessons={allLessons}
          userLessonProgress={userLessonProgress}
          currentLessonId={currentLessonId}
          onLessonSelect={handleLessonSelect}
          lessonIdsWithNotes={lessonIdsWithNotes}
          onOpenNotes={() => setCourseNotesDrawerOpen(true)}
          totalNotesCount={lessonNotes.length}
        />
        <div className="flex-1 flex flex-col">
          {currentLesson && (
            <>
              <LessonArea
                lesson={currentLesson}
                isCompleted={isCurrentLessonCompleted}
                onMarkComplete={handleMarkComplete}
                onAddNote={() => setNotesDrawerOpen(true)}
                onProgressUpdate={handleProgressUpdate}
                lastPosition={currentLessonProgress?.last_position || 0}
                isLocked={isCurrentLessonLocked()}
                prerequisiteLessons={getPrerequisiteLessons()}
                lessonNotes={currentLessonNotes}
              />
              {!isCurrentLessonLocked() && (
                <LessonNavigation
                  currentLesson={currentLesson}
                  allLessons={allLessons}
                  modules={modules}
                  userLessonProgress={userLessonProgress}
                  onLessonSelect={handleLessonSelect}
                  onMarkComplete={handleMarkComplete}
                  isCompleted={isCurrentLessonCompleted}
                />
              )}
            </>
          )}
        </div>
      </div>
      <NotesDrawer
        isOpen={notesDrawerOpen}
        onClose={() => setNotesDrawerOpen(false)}
        context={{
          source_type: "lesson",
          source_id: currentLessonId,
          source_title: currentLesson?.title,
        }}
      />
      <CourseNotesDrawer
        isOpen={courseNotesDrawerOpen}
        onClose={() => setCourseNotesDrawerOpen(false)}
        notes={lessonNotes}
        lessons={allLessons}
        onNavigateToLesson={(lessonId) => {
          handleLessonSelect(lessonId);
          setCourseNotesDrawerOpen(false);
        }}
      />
      {showEmotionalCheckIn && currentLesson && (
        <EmotionalCheckIn
          type={checkInType}
          lessonTitle={currentLesson.title}
          onComplete={(data) => {
            setShowEmotionalCheckIn(false);
            if (checkInType === "after") {
              lessonCompleteMutation.mutate(currentLessonId);
            }
          }}
          onSkip={() => {
            setShowEmotionalCheckIn(false);
            if (checkInType === "after") {
              lessonCompleteMutation.mutate(currentLessonId);
            }
          }}
        />
      )}
    </div>
  );
}