import React, { useState } from "react";
import { StickyNote, ChevronDown, ChevronUp, Trash2, Star } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function LessonNotes({ notes = [], onAddNote }) {
  const [expanded, setExpanded] = useState(true);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (noteId) => base44.entities.Note.delete(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessonNotes"] });
    },
  });

  const spotlightMutation = useMutation({
    mutationFn: ({ noteId, spotlight }) => base44.entities.Note.update(noteId, { spotlight }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessonNotes"] });
    },
  });

  if (notes.length === 0) return null;

  return (
    <div className="bg-white p-6 rounded-lg mb-8 border border-[#D8B46B]/30">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <StickyNote size={18} className="text-[#D8B46B]" />
          <h2 className="font-serif text-xl text-[#1E3A32]">
            Your Notes ({notes.length})
          </h2>
        </div>
        {expanded ? (
          <ChevronUp size={18} className="text-[#2B2725]/60" />
        ) : (
          <ChevronDown size={18} className="text-[#2B2725]/60" />
        )}
      </button>

      {expanded && (
        <div className="mt-4 space-y-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className="p-4 bg-[#F9F5EF] rounded-lg border-l-3 border-[#D8B46B]"
              style={{ borderLeftWidth: "3px" }}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-xs text-[#2B2725]/50">
                  {format(new Date(note.created_date), "MMM d, yyyy · h:mm a")}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => spotlightMutation.mutate({ noteId: note.id, spotlight: !note.spotlight })}
                    className="p-1 hover:bg-[#D8B46B]/20 rounded transition-colors"
                    title={note.spotlight ? "Remove spotlight" : "Spotlight this note"}
                  >
                    <Star
                      size={14}
                      className={note.spotlight ? "text-[#D8B46B] fill-[#D8B46B]" : "text-[#2B2725]/30"}
                    />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm("Delete this note?")) {
                        deleteMutation.mutate(note.id);
                      }
                    }}
                    className="p-1 hover:bg-red-50 rounded transition-colors"
                    title="Delete note"
                  >
                    <Trash2 size={14} className="text-[#2B2725]/30 hover:text-red-500" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-[#2B2725]/80 whitespace-pre-wrap">{note.content}</p>
              {note.tags && note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {note.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 text-xs bg-[#D8B46B]/15 text-[#1E3A32] rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
          <Button
            onClick={onAddNote}
            variant="outline"
            className="w-full border-[#D8B46B] hover:bg-[#D8B46B]/10 text-sm"
          >
            <StickyNote size={14} className="mr-2" />
            Add Another Note
          </Button>
        </div>
      )}
    </div>
  );
}