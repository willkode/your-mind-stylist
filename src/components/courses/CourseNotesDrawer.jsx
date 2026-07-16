import React, { useState } from "react";
import { X, StickyNote, Trash2, Star, Search } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

export default function CourseNotesDrawer({ isOpen, onClose, notes = [], lessons = [], onNavigateToLesson }) {
  const [searchTerm, setSearchTerm] = useState("");
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

  const filteredNotes = notes.filter(n => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const lesson = lessons.find(l => l.id === n.source_id);
    return (
      n.content?.toLowerCase().includes(term) ||
      lesson?.title?.toLowerCase().includes(term) ||
      n.tags?.some(t => t.toLowerCase().includes(term))
    );
  });

  // Group notes by lesson
  const notesByLesson = {};
  filteredNotes.forEach(note => {
    const lessonId = note.source_id || "other";
    if (!notesByLesson[lessonId]) notesByLesson[lessonId] = [];
    notesByLesson[lessonId].push(note);
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 z-40"
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 w-full md:w-[420px] bg-[#F9F5EF] shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-5 border-b border-[#E4D9C4]">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <StickyNote size={20} className="text-[#D8B46B]" />
                  <h3 className="font-serif text-xl text-[#1E3A32]">My Notes</h3>
                  <span className="text-sm text-[#2B2725]/50">({notes.length})</span>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-[#E4D9C4] rounded transition-colors"
                >
                  <X size={20} className="text-[#2B2725]" />
                </button>
              </div>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2B2725]/40" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search notes..."
                  className="w-full pl-9 pr-3 py-2 border border-[#E4D9C4] rounded-lg text-sm focus:outline-none focus:border-[#D8B46B] bg-white"
                />
              </div>
            </div>

            {/* Notes list */}
            <div className="flex-1 overflow-y-auto p-5">
              {notes.length === 0 ? (
                <div className="text-center py-12">
                  <StickyNote size={40} className="mx-auto text-[#D8B46B]/40 mb-3" />
                  <p className="text-[#2B2725]/60 text-sm">No notes yet</p>
                  <p className="text-[#2B2725]/40 text-xs mt-1">
                    Add notes as you go through your lessons
                  </p>
                </div>
              ) : filteredNotes.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-[#2B2725]/60 text-sm">No notes match your search</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(notesByLesson).map(([lessonId, lessonNotes]) => {
                    const lesson = lessons.find(l => l.id === lessonId);
                    return (
                      <div key={lessonId}>
                        {lesson && (
                          <button
                            onClick={() => {
                              onNavigateToLesson(lessonId);
                              onClose();
                            }}
                            className="text-xs font-medium text-[#D8B46B] uppercase tracking-wider mb-2 hover:text-[#1E3A32] transition-colors"
                          >
                            {lesson.title} →
                          </button>
                        )}
                        <div className="space-y-2">
                          {lessonNotes.map((note) => (
                            <NoteCard
                              key={note.id}
                              note={note}
                              onDelete={() => deleteMutation.mutate(note.id)}
                              onToggleSpotlight={() =>
                                spotlightMutation.mutate({ noteId: note.id, spotlight: !note.spotlight })
                              }
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function NoteCard({ note, onDelete, onToggleSpotlight }) {
  return (
    <div
      className="p-3 bg-white rounded-lg border-l-3 border-[#D8B46B]"
      style={{ borderLeftWidth: "3px" }}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-[10px] text-[#2B2725]/40">
          {format(new Date(note.created_date), "MMM d, yyyy · h:mm a")}
        </p>
        <div className="flex items-center gap-0.5">
          <button
            onClick={onToggleSpotlight}
            className="p-1 hover:bg-[#D8B46B]/20 rounded transition-colors"
          >
            <Star
              size={12}
              className={note.spotlight ? "text-[#D8B46B] fill-[#D8B46B]" : "text-[#2B2725]/25"}
            />
          </button>
          <button
            onClick={() => {
              if (window.confirm("Delete this note?")) onDelete();
            }}
            className="p-1 hover:bg-red-50 rounded transition-colors"
          >
            <Trash2 size={12} className="text-[#2B2725]/25 hover:text-red-500" />
          </button>
        </div>
      </div>
      <p className="text-sm text-[#2B2725]/80 whitespace-pre-wrap leading-relaxed">{note.content}</p>
      {note.tags && note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {note.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-[10px] bg-[#D8B46B]/15 text-[#1E3A32] rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}