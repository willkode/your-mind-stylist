import React from "react";
import { CheckCircle, Circle, Lock } from "lucide-react";
import { motion } from "framer-motion";

export default function LessonProgressTracker({ 
  modules, 
  lessons, 
  progress, 
  currentLessonId,
  onLessonSelect 
}) {
  const getLessonStatus = (lessonId) => {
    const lessonProgress = progress.find(p => p.lesson_id === lessonId);
    return lessonProgress?.completed ? 'completed' : 'in-progress';
  };

  const isLessonLocked = (lesson) => {
    if (!lesson.prerequisites || lesson.prerequisites.length === 0) {
      return false;
    }
    
    return lesson.prerequisites.some(prereqId => {
      const prereqProgress = progress.find(p => p.lesson_id === prereqId);
      return !prereqProgress || !prereqProgress.completed;
    });
  };

  return (
    <div className="space-y-6">
      {modules.map((module, moduleIndex) => {
        const moduleLessons = lessons
          .filter(l => l.module_id === module.id)
          .sort((a, b) => a.order - b.order);

        const completedLessons = moduleLessons.filter(l => 
          progress.some(p => p.lesson_id === l.id && p.completed)
        );

        const moduleProgress = moduleLessons.length > 0
          ? Math.round((completedLessons.length / moduleLessons.length) * 100)
          : 0;

        return (
          <motion.div
            key={module.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: moduleIndex * 0.1 }}
            className="bg-white rounded-lg p-6"
          >
            <div className="mb-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-serif text-xl text-[#1E3A32]">{module.title}</h3>
                <span className="text-sm text-[#2B2725]/60">
                  {completedLessons.length}/{moduleLessons.length} completed
                </span>
              </div>
              {module.description && (
                <p className="text-sm text-[#2B2725]/70 mb-3">{module.description}</p>
              )}
              <div className="w-full bg-[#E4D9C4] rounded-full h-2">
                <div 
                  className="bg-[#D8B46B] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${moduleProgress}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              {moduleLessons.map((lesson, lessonIndex) => {
                const status = getLessonStatus(lesson.id);
                const locked = isLessonLocked(lesson);
                const isCurrent = lesson.id === currentLessonId;

                return (
                  <button
                    key={lesson.id}
                    onClick={() => !locked && onLessonSelect(lesson.id)}
                    disabled={locked}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                      isCurrent
                        ? 'bg-[#D8B46B]/20 border-2 border-[#D8B46B]'
                        : locked
                        ? 'bg-gray-50 cursor-not-allowed opacity-50'
                        : 'hover:bg-[#F9F5EF] border-2 border-transparent'
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {locked ? (
                        <Lock size={20} className="text-[#2B2725]/40" />
                      ) : status === 'completed' ? (
                        <CheckCircle size={20} className="text-[#A6B7A3]" />
                      ) : (
                        <Circle size={20} className="text-[#2B2725]/40" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${isCurrent ? 'text-[#1E3A32]' : 'text-[#2B2725]'}`}>
                        {lessonIndex + 1}. {lesson.title}
                      </p>
                      {lesson.duration && (
                        <p className="text-xs text-[#2B2725]/60">{lesson.duration}</p>
                      )}
                    </div>

                    {lesson.type && (
                      <span className="text-xs px-2 py-1 bg-[#E4D9C4] text-[#2B2725]/70 rounded">
                        {lesson.type}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}