import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, GripVertical, RefreshCw } from "lucide-react";

function secondsToTimestamp(totalSeconds) {
  if (!totalSeconds && totalSeconds !== 0) return "";
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);
  if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function timestampToSeconds(str) {
  if (!str) return 0;
  const parts = str.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

export default function AudiobookChapterEditor({ chapters = [], onChange }) {
  const addChapter = () => {
    const lastChapter = chapters[chapters.length - 1];
    const nextStart = lastChapter
      ? lastChapter.start_seconds + (lastChapter.duration_seconds || 300)
      : 0;
    onChange([
      ...chapters,
      { title: `Chapter ${chapters.length + 1}`, start_seconds: nextStart, duration_seconds: 300 },
    ]);
  };

  const updateChapter = (index, field, value) => {
    const updated = [...chapters];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeChapter = (index) => {
    onChange(chapters.filter((_, i) => i !== index));
  };

  const recalculateStartTimes = () => {
    let cumulative = 0;
    const recalculated = chapters.map((chapter) => {
      const updated = { ...chapter, start_seconds: cumulative };
      cumulative += chapter.duration_seconds || 0;
      return updated;
    });
    onChange(recalculated);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-medium text-[#1E3A32]">Chapters</h3>
          <p className="text-xs text-[#2B2725]/50 mt-0.5">
            Add chapter markers so listeners can jump to specific sections
          </p>
        </div>
        <div className="flex gap-2">
          {chapters.length > 0 && (
            <Button size="sm" variant="outline" onClick={recalculateStartTimes} className="gap-1 text-xs" title="Set each chapter's start time to the cumulative sum of all previous durations">
              <RefreshCw size={14} /> Recalculate Starts
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={addChapter} className="gap-1 text-xs">
            <Plus size={14} /> Add Chapter
          </Button>
        </div>
      </div>

      {chapters.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-[#E4D9C4] rounded-lg">
          <p className="text-sm text-[#2B2725]/40">
            No chapters yet. Click "Add Chapter" to start.
          </p>
          <p className="text-xs text-[#2B2725]/30 mt-1">
            Tip: Use timestamps from your audio editing software (e.g. Audacity, GarageBand)
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Header */}
          <div className="grid grid-cols-[1fr_120px_120px_40px] gap-2 px-2 text-xs text-[#2B2725]/40 font-medium">
            <span>Title</span>
            <span>Start Time</span>
            <span>Duration</span>
            <span></span>
          </div>

          {chapters.map((chapter, index) => (
            <div
              key={index}
              className="grid grid-cols-[1fr_120px_120px_40px] gap-2 items-center bg-white p-2 rounded border border-[#E4D9C4]"
            >
              <div className="flex items-center gap-2">
                <GripVertical size={14} className="text-[#2B2725]/20 flex-shrink-0" />
                <Input
                  value={chapter.title}
                  onChange={(e) => updateChapter(index, "title", e.target.value)}
                  className="h-8 text-sm"
                  placeholder="Chapter title"
                />
              </div>
              <Input
                value={secondsToTimestamp(chapter.start_seconds)}
                onChange={(e) => updateChapter(index, "start_seconds", timestampToSeconds(e.target.value))}
                className="h-8 text-sm text-center"
                placeholder="0:00"
              />
              <Input
                value={secondsToTimestamp(chapter.duration_seconds)}
                onChange={(e) => updateChapter(index, "duration_seconds", timestampToSeconds(e.target.value))}
                className="h-8 text-sm text-center"
                placeholder="5:00"
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-red-400 hover:text-red-600"
                onClick={() => removeChapter(index)}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}