import React from "react";
import { Play, CheckCircle2 } from "lucide-react";

function formatDuration(seconds) {
  if (!seconds) return "--:--";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function ChapterList({
  chapters = [],
  currentChapterIndex,
  currentPositionSeconds,
  onChapterSelect,
}) {
  if (!chapters.length) {
    return (
      <div className="text-center py-8 text-[#2B2725]/40 text-sm">
        No chapters available
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xs text-[#2B2725]/50 uppercase tracking-[0.2em] mb-3 font-medium">
        Chapters ({chapters.length})
      </h3>
      <div
        className="max-h-[400px] md:max-h-[600px] overflow-y-scroll overscroll-contain relative"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="space-y-1 pb-4">
          {chapters.map((chapter, index) => {
            const isActive = index === currentChapterIndex;
            const chapterEnd = chapter.start_seconds + (chapter.duration_seconds || 0);
            const isCompleted = currentPositionSeconds > chapterEnd && index < currentChapterIndex;

            return (
              <button
                key={index}
                onClick={() => onChapterSelect(index)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center gap-3 group ${
                  isActive
                    ? "bg-[#1E3A32]/10 border border-[#1E3A32]/20"
                    : "hover:bg-[#E4D9C4]/50"
                }`}
              >
                {/* Chapter number / status */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium">
                  {isCompleted ? (
                    <CheckCircle2 size={18} className="text-[#A6B7A3]" />
                  ) : isActive ? (
                    <div className="w-8 h-8 rounded-full bg-[#1E3A32] text-white flex items-center justify-center">
                      <Play size={12} className="ml-0.5" />
                    </div>
                  ) : (
                    <span className="text-[#2B2725]/40">{index + 1}</span>
                  )}
                </div>

                {/* Chapter info */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${isActive ? "text-[#1E3A32] font-medium" : "text-[#2B2725]/80"}`}>
                    {chapter.title}
                  </p>
                  <p className="text-xs text-[#2B2725]/40 mt-0.5">
                    {formatDuration(chapter.start_seconds)} • {formatDuration(chapter.duration_seconds)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      {chapters.length > 6 && (
        <p className="text-[10px] text-[#2B2725]/40 text-center mt-2 italic">
          Scroll for all {chapters.length} chapters
        </p>
      )}
    </div>
  );
}