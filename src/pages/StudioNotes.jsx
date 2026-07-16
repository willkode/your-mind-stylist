import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, Plus, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import NotesTimeline from "@/components/studio/NotesTimeline";
import NotesDrawer from "@/components/studio/NotesDrawer";
import EmotionalTrends from "@/components/studio/EmotionalTrends";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function StudioNotes() {
  const [notesDrawerOpen, setNotesDrawerOpen] = useState(false);
  const [pullRefreshY, setPullRefreshY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['notes'],
    queryFn: async () => {
      const allNotes = await base44.entities.Note.list('-created_date');
      return allNotes;
    },
  });

  const spotlightMutation = useMutation({
    mutationFn: async ({ noteId, spotlight }) => {
      await base44.entities.Note.update(noteId, { spotlight });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });

  const exportAsJSON = () => {
    const dataStr = JSON.stringify(notes, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `mind-styling-notes-${format(new Date(), 'yyyy-MM-dd')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const exportAsText = () => {
    let content = `Mind Styling Studio - Your Notes\nExported: ${format(new Date(), 'MMMM d, yyyy')}\n\n`;
    content += '='.repeat(60) + '\n\n';
    
    notes.forEach((note, index) => {
      content += `${index + 1}. ${format(new Date(note.created_date), 'MMMM d, yyyy h:mm a')}\n`;
      if (note.sentiment_primary) {
        content += `   Emotion: ${note.sentiment_primary}\n`;
      }
      if (note.tags && note.tags.length > 0) {
        content += `   Tags: ${note.tags.join(', ')}\n`;
      }
      content += `\n${note.content}\n\n`;
      content += '-'.repeat(60) + '\n\n';
    });
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mind-styling-notes-${format(new Date(), 'yyyy-MM-dd')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.refetchQueries({ queryKey: ['notes'] });
    setTimeout(() => {
      setIsRefreshing(false);
      setPullRefreshY(0);
    }, 500);
  };

  // Format trends data for EmotionalTrends component
  const trendsData = notes
    .filter(note => note.sentiment_primary)
    .map(note => ({
      date: new Date(note.created_date).toLocaleDateString(),
      emotion: note.sentiment_primary,
    }));

  if (isLoading) {
    return (
      <div className="bg-[#F9F5EF] min-h-screen pt-32 pb-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex items-center justify-center py-20">
            <div className="animate-pulse text-[#2B2725]/60">Loading your notes...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F9F5EF] min-h-screen pt-32 pb-24">
      <NotesDrawer
        isOpen={notesDrawerOpen}
        onClose={() => setNotesDrawerOpen(false)}
        sourceType="freeform"
      />

      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0.3, bottom: 0 }}
          onDragEnd={(e, info) => {
            if (info.offset.y > 100 && window.scrollY === 0) {
              handleRefresh();
            }
          }}
          onDrag={(e, info) => {
            if (window.scrollY === 0 && info.offset.y > 0) {
              setPullRefreshY(Math.min(info.offset.y, 100));
            }
          }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="touch-pan-y"
        >
          {/* Pull to Refresh Indicator */}
          {pullRefreshY > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: pullRefreshY / 100 }}
              className="flex justify-center py-4"
            >
              <div className={`text-[#D8B46B] ${isRefreshing ? 'animate-spin' : ''}`}>
                {isRefreshing ? '↻' : '↓'} {isRefreshing ? 'Refreshing...' : 'Pull to refresh'}
              </div>
            </motion.div>
          )}
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-[#D8B46B] text-xs tracking-[0.3em] uppercase mb-2 block">
                Mind Styling Studio
              </span>
              <h1 className="font-serif text-3xl md:text-4xl text-[#1E3A32] flex items-center gap-3">
                <BookOpen size={32} className="text-[#D8B46B]" />
                Your Notes
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {notes.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="border-[#E4D9C4]">
                      <Download size={18} className="mr-2" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={exportAsText}>
                      Export as Text (.txt)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={exportAsJSON}>
                      Export as JSON (.json)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <Button
                onClick={() => setNotesDrawerOpen(true)}
                className="bg-[#1E3A32] hover:bg-[#2B2725] text-[#F9F5EF]"
              >
                <Plus size={18} className="mr-2" />
                New Note
              </Button>
            </div>
          </div>

          {/* Emotional Trends */}
          {trendsData.length > 0 && (
            <div className="mb-8">
              <EmotionalTrends trendsData={trendsData} />
            </div>
          )}

          {/* Spotlighted Notes */}
          {notes.filter(n => n.spotlight).length > 0 && (
            <div className="mb-8">
              <h2 className="font-serif text-xl text-[#1E3A32] mb-4 flex items-center gap-2">
                Your Spotlights
              </h2>
              <NotesTimeline
                notes={notes.filter(n => n.spotlight)}
                onSpotlight={(id, value) => spotlightMutation.mutate({ noteId: id, spotlight: value })}
              />
            </div>
          )}

          {/* All Notes */}
          <div>
            <h2 className="font-serif text-xl text-[#1E3A32] mb-4">
              All Notes ({notes.length})
            </h2>
            <NotesTimeline
              notes={notes}
              onSpotlight={(id, value) => spotlightMutation.mutate({ noteId: id, spotlight: value })}
            />
          </div>

          {/* Empty State */}
          {notes.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <BookOpen size={64} className="text-[#D8B46B]/30 mx-auto mb-6" />
              <h3 className="font-serif text-2xl text-[#1E3A32] mb-3">
                Your notes will live here
              </h3>
              <p className="text-[#2B2725]/60 mb-8 max-w-md mx-auto">
                Start capturing your thoughts, insights, and emotional shifts as you move through
                your Mind Styling journey.
              </p>
              <Button
                onClick={() => setNotesDrawerOpen(true)}
                className="bg-[#1E3A32] hover:bg-[#2B2725] text-[#F9F5EF]"
              >
                <Plus size={18} className="mr-2" />
                Create Your First Note
              </Button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}