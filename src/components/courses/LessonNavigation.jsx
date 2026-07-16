import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import ReflectionPrompt from "../transformation/ReflectionPrompt";
import { base44 } from "@/api/base44Client";

export default function LessonNavigation({ 
  currentLesson, 
  allLessons, 
  modules,
  userLessonProgress,
  onLessonSelect,
  onMarkComplete,
  isCompleted 
}) {
  const [showReflection, setShowReflection] = useState(false);
  const currentIndex = allLessons.findIndex(l => l.id === currentLesson.id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const getLessonModule = (lesson) => {
    return modules.find(m => m.id === lesson.module_id);
  };

  const isNextLessonLocked = () => {
    if (!nextLesson) return false;
    if (!nextLesson.prerequisites || nextLesson.prerequisites.length === 0) return false;
    return !nextLesson.prerequisites.every(prereqId =>
      userLessonProgress.some(p => p.lesson_id === prereqId && p.completed)
    );
  };

  const handleNext = () => {
    if (!isCompleted && currentLesson.required) {
      if (confirm("Mark this lesson as complete before moving to the next?")) {
        onMarkComplete();
        setTimeout(() => {
          if (nextLesson) onLessonSelect(nextLesson.id);
        }, 500);
      }
    } else {
      if (nextLesson) onLessonSelect(nextLesson.id);
    }
  };

  return (
    <div className="sticky bottom-0 bg-white border-t-2 border-[#E4D9C4] p-6 mt-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-4">
          {/* Previous Lesson */}
          <div className="flex-1">
            {prevLesson && (
              <Button
                variant="outline"
                onClick={() => onLessonSelect(prevLesson.id)}
                className="w-full justify-start"
              >
                <ArrowLeft size={16} className="mr-2" />
                <div className="text-left flex-1 min-w-0">
                  <p className="text-xs text-[#2B2725]/60">Previous</p>
                  <p className="text-sm font-medium text-[#1E3A32] truncate">
                    {prevLesson.title}
                  </p>
                </div>
              </Button>
            )}
          </div>

          {/* Mark Complete */}
          <Button
            onClick={async () => {
              if (!isCompleted) {
                onMarkComplete();
                setShowReflection(true);
                
                // Trigger milestone detection
                try {
                  await base44.functions.invoke('detectMilestones', {
                    trigger_type: 'lesson_complete',
                    related_id: currentLesson.id
                  });
                } catch (error) {
                  console.error('Milestone detection failed:', error);
                }
              }
            }}
            disabled={isCompleted}
            className="bg-[#1E3A32] hover:bg-[#2B2725] text-white px-6"
          >
            <CheckCircle size={16} className="mr-2" />
            {isCompleted ? "Completed" : "Mark Complete"}
          </Button>
          
          {showReflection && (
            <ReflectionPrompt
              reflectionType="lesson"
              relatedId={currentLesson.id}
              relatedTitle={currentLesson.title}
              onComplete={() => setShowReflection(false)}
              onSkip={() => setShowReflection(false)}
              promptText="Before you move on... what resonated with you in this lesson?"
              showMoodTracking={false}
              showBreakthroughTag={true}
            />
          )}

          {/* Next Lesson */}
          <div className="flex-1">
            {nextLesson && (
              <Button
                variant={isNextLessonLocked() ? "outline" : "default"}
                onClick={handleNext}
                disabled={isNextLessonLocked()}
                className={cn(
                  "w-full justify-end",
                  !isNextLessonLocked() && "bg-[#D8B46B] hover:bg-[#C9A55B] text-[#1E3A32]"
                )}
              >
                <div className="text-right flex-1 min-w-0">
                  <p className="text-xs opacity-80">
                    {isNextLessonLocked() ? "Locked" : "Next"}
                  </p>
                  <p className="text-sm font-medium truncate">
                    {nextLesson.title}
                  </p>
                </div>
                <ArrowRight size={16} className="ml-2" />
              </Button>
            )}
          </div>
        </div>

        {/* Course Completion */}
        {!nextLesson && isCompleted && (
          <div className="mt-4 text-center p-4 bg-gradient-to-r from-[#A6B7A3]/20 to-[#D8B46B]/20 rounded-lg">
            <p className="text-sm font-medium text-[#1E3A32]">
              🎉 You've completed all lessons in this course!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}