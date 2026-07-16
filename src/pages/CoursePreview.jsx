import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertCircle, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import CourseHeader from "../components/courses/CourseHeader";
import ProgressBar from "../components/courses/ProgressBar";
import ModuleNavigator from "../components/courses/ModuleNavigator";
import LessonArea from "../components/courses/LessonArea";

export default function CoursePreview() {
  const navigate = useNavigate();
  const [currentLessonId, setCurrentLessonId] = useState(null);

  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get("id");

  const { data: courses = [] } = useQuery({
    queryKey: ["courses", courseId],
    queryFn: () => base44.entities.Course.filter({ id: courseId }),
    enabled: !!courseId,
  });
  const course = courses[0];

  const { data: modules = [] } = useQuery({
    queryKey: ["modules", course?.id],
    queryFn: () => base44.entities.Module.filter({ course_id: course.id }, "order"),
    enabled: !!course?.id,
  });

  const { data: allLessons = [] } = useQuery({
    queryKey: ["lessons", course?.id],
    queryFn: async () => {
      if (!modules.length) return [];
      const moduleIds = modules.map((m) => m.id);
      const lessonPromises = moduleIds.map((moduleId) =>
        base44.entities.Lesson.filter({ module_id: moduleId }, "order")
      );
      const lessonArrays = await Promise.all(lessonPromises);
      return lessonArrays.flat();
    },
    enabled: !!course?.id && modules.length > 0,
  });

  useEffect(() => {
    if (allLessons.length > 0 && !currentLessonId) {
      setCurrentLessonId(allLessons[0].id);
    }
  }, [allLessons, currentLessonId]);

  const currentLesson = allLessons.find((l) => l.id === currentLessonId);

  if (!course) {
    return (
      <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center">
        <p className="text-[#2B2725]/70">Loading preview...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F5EF]">
      {/* Preview Banner */}
      <div className="bg-gradient-to-r from-[#6E4F7D] to-[#8B659B] text-white p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} />
            <p className="font-medium">
              Preview Mode - This is how students will see your course
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate(createPageUrl("CourseBuilder?id=" + courseId))}
              className="bg-white/10 border-white/20 hover:bg-white/20 text-white"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Editor
            </Button>
            <Button
              onClick={() => navigate(createPageUrl("CourseManager"))}
              className="bg-white text-[#6E4F7D] hover:bg-white/90"
            >
              <X size={16} className="mr-2" />
              Close Preview
            </Button>
          </div>
        </div>
      </div>

      <CourseHeader course={course} userProgress={null} />
      <ProgressBar
        userProgress={null}
        totalLessons={allLessons.length}
        completedLessons={0}
        onContinue={() => {}}
      />

      <div className="flex flex-col lg:flex-row">
        <ModuleNavigator
          modules={modules}
          lessons={allLessons}
          userLessonProgress={[]}
          currentLessonId={currentLessonId}
          onLessonSelect={setCurrentLessonId}
        />
        <div className="flex-1">
          {currentLesson && (
            <LessonArea
              lesson={currentLesson}
              isCompleted={false}
              onMarkComplete={() => {}}
              onAddNote={() => {}}
              onProgressUpdate={() => {}}
              lastPosition={0}
              isLocked={false}
              prerequisiteLessons={[]}
            />
          )}
        </div>
      </div>
    </div>
  );
}