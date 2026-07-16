import React from "react";
import { Headphones, Video, FileText, CheckCircle2, Circle, PlayCircle, Lock, Clock, StickyNote } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export default function ModuleNavigator({ modules, lessons, userLessonProgress, currentLessonId, onLessonSelect, lessonIdsWithNotes = new Set(), onOpenNotes, totalNotesCount = 0 }) {
  const getTypeIcon = (type) => {
    const iconMap = {
      audio: Headphones,
      video: Video,
      text: FileText,
      hybrid: Video,
    };
    const Icon = iconMap[type] || FileText;
    return <Icon size={14} />;
  };

  const getLessonStatus = (lessonId) => {
    const progress = userLessonProgress.find(p => p.lesson_id === lessonId);
    if (progress?.completed) return "completed";
    if (progress && progress.watch_time > 0) return "in_progress";
    return "not_started";
  };

  const getStatusIcon = (status) => {
    if (status === "completed") return <CheckCircle2 size={16} className="text-green-600" />;
    if (status === "in_progress") return <PlayCircle size={16} className="text-blue-600" />;
    return <Circle size={16} className="text-gray-400" />;
  };

  const isLessonLocked = (lesson) => {
    if (!lesson.prerequisites || lesson.prerequisites.length === 0) return false;
    return !lesson.prerequisites.every(prereqId => 
      userLessonProgress.some(p => p.lesson_id === prereqId && p.completed)
    );
  };

  const getModuleProgress = (moduleId) => {
    const moduleLessons = lessons.filter(l => l.module_id === moduleId);
    if (moduleLessons.length === 0) return 0;
    const completed = moduleLessons.filter(l => getLessonStatus(l.id) === "completed").length;
    return Math.round((completed / moduleLessons.length) * 100);
  };

  return (
    <div className="w-full lg:w-80 bg-white border-r border-[#E4D9C4] lg:sticky lg:top-0 lg:h-screen flex flex-col">
      <div className="p-6 border-b border-[#E4D9C4]">
        <h2 className="font-serif text-xl text-[#1E3A32]">Course Content</h2>
      </div>
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4">
          {modules.map((module) => {
            const moduleLessons = lessons.filter(l => l.module_id === module.id);
            const progress = getModuleProgress(module.id);
            
            return (
              <div key={module.id} className="mb-6">
                <div className="px-2 mb-3">
                  <h3 className="font-medium text-[#1E3A32] mb-2">
                    {module.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-[#E4D9C4] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#D8B46B] transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-[#2B2725]/60 tabular-nums">{progress}%</span>
                  </div>
                </div>
                <div className="space-y-1">
                  {moduleLessons.map((lesson) => {
                    const status = getLessonStatus(lesson.id);
                    const isActive = lesson.id === currentLessonId;
                    const locked = isLessonLocked(lesson);
                    const hasNotes = lessonIdsWithNotes.has(lesson.id);
                    
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => !locked && onLessonSelect(lesson.id)}
                        disabled={locked}
                        className={cn(
                          "w-full text-left p-3 rounded-lg transition-colors",
                          locked && "opacity-50 cursor-not-allowed",
                          isActive && !locked
                            ? "bg-[#D8B46B]/20 border border-[#D8B46B]"
                            : !locked && "hover:bg-[#F9F5EF]"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            {locked ? (
                              <Lock size={16} className="text-[#2B2725]/40" />
                            ) : (
                              getStatusIcon(status)
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                           <div className="flex items-center gap-2 mb-1">
                             <p className={cn(
                               "text-sm font-medium",
                               isActive ? "text-[#1E3A32]" : "text-[#2B2725]/80"
                             )}>
                               {lesson.title}
                             </p>
                             {hasNotes && (
                               <StickyNote size={14} className="text-[#D8B46B] flex-shrink-0" title="Notes added" />
                             )}
                           </div>
                           <div className="flex items-center gap-2 text-xs text-[#2B2725]/60">
                             {getTypeIcon(lesson.type)}
                             {lesson.duration && <span>{lesson.duration}</span>}
                             {lesson.estimated_time && (
                               <>
                                 <span>•</span>
                                 <Clock size={12} />
                                 <span>{lesson.estimated_time}m</span>
                               </>
                             )}
                           </div>
                           {locked && (
                             <p className="text-xs text-[#2B2725]/60 mt-1">Complete prerequisites first</p>
                           )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Sticky My Notes tab */}
      <button
        onClick={onOpenNotes}
        className="w-full p-4 border-t border-[#E4D9C4] flex items-center gap-3 hover:bg-[#D8B46B]/10 transition-colors bg-white"
      >
        <StickyNote size={18} className="text-[#D8B46B]" />
        <span className="text-sm font-medium text-[#1E3A32]">My Notes</span>
        {totalNotesCount > 0 && (
          <span className="ml-auto text-xs bg-[#D8B46B]/20 text-[#1E3A32] px-2 py-0.5 rounded-full">
            {totalNotesCount}
          </span>
        )}
      </button>
    </div>
  );
}