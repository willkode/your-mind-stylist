import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Star, Filter, Sparkles, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function NotesTimeline({ notes = [], onSpotlight }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmotion, setSelectedEmotion] = useState("all");
  const [selectedTag, setSelectedTag] = useState("all");

  const emotions = ["calm", "clarity", "resistance", "overwhelm", "confidence", "curiosity", "tension", "momentum"];
  
  const emotionColors = {
    calm: "bg-[#A6B7A3] text-white",
    clarity: "bg-[#D8B46B] text-[#1E3A32]",
    resistance: "bg-[#6E4F7D] text-white",
    overwhelm: "bg-[#2B2725] text-white",
    confidence: "bg-[#1E3A32] text-white",
    curiosity: "bg-[#E4D9C4] text-[#1E3A32]",
    tension: "bg-[#8B7355] text-white",
    momentum: "bg-[#5A8B7A] text-white",
  };

  // Extract all unique tags from notes
  const allTags = [...new Set(notes.flatMap(note => note.tags || []))];

  // Filter notes
  const filteredNotes = notes.filter(note => {
    const matchesSearch = !searchQuery || 
      note.content?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesEmotion = selectedEmotion === "all" || 
      note.sentiment_primary === selectedEmotion;
    
    const matchesTag = selectedTag === "all" || 
      (note.tags || []).includes(selectedTag);

    return matchesSearch && matchesEmotion && matchesTag;
  });

  // Group notes by date
  const groupedNotes = filteredNotes.reduce((groups, note) => {
    const date = format(new Date(note.created_date), 'MMMM d, yyyy');
    if (!groups[date]) groups[date] = [];
    groups[date].push(note);
    return groups;
  }, {});

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2B2725]/40" />
          <Input
            placeholder="Search your notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-[#E4D9C4] focus:border-[#D8B46B] focus:ring-[#D8B46B]"
          />
        </div>

        {/* Emotion Filters */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Filter size={16} className="text-[#2B2725]/60" />
            <span className="text-xs text-[#2B2725]/60 tracking-wide uppercase">Filter by Emotion</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={selectedEmotion === "all" ? "default" : "outline"}
              onClick={() => setSelectedEmotion("all")}
              className={selectedEmotion === "all" ? "bg-[#1E3A32]" : ""}
            >
              All
            </Button>
            {emotions.map(emotion => (
              <Button
                key={emotion}
                size="sm"
                variant={selectedEmotion === emotion ? "default" : "outline"}
                onClick={() => setSelectedEmotion(emotion)}
                className={selectedEmotion === emotion ? emotionColors[emotion] : ""}
              >
                {emotion}
              </Button>
            ))}
          </div>
        </div>

        {/* Tag Filters */}
        {allTags.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-[#2B2725]/60" />
              <span className="text-xs text-[#2B2725]/60 tracking-wide uppercase">Filter by Tag</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={selectedTag === "all" ? "default" : "outline"}
                onClick={() => setSelectedTag("all")}
                className={selectedTag === "all" ? "bg-[#1E3A32]" : ""}
              >
                All Tags
              </Button>
              {allTags.map(tag => (
                <Button
                  key={tag}
                  size="sm"
                  variant={selectedTag === tag ? "default" : "outline"}
                  onClick={() => setSelectedTag(tag)}
                  className={selectedTag === tag ? "bg-[#D8B46B] text-[#1E3A32]" : ""}
                >
                  {tag}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        {Object.keys(groupedNotes).length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-[#2B2725]/60 mb-2">No notes found</p>
            <p className="text-[#2B2725]/40 text-sm">Try adjusting your filters or search term</p>
          </motion.div>
        ) : (
          Object.entries(groupedNotes).map(([date, dayNotes]) => (
            <motion.div
              key={date}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Date Header */}
              <div className="flex items-center gap-3 mb-4">
                <Calendar size={16} className="text-[#D8B46B]" />
                <h3 className="font-serif text-lg text-[#1E3A32]">{date}</h3>
                <div className="flex-1 h-px bg-[#E4D9C4]" />
              </div>

              {/* Notes for this date */}
              <div className="space-y-3 pl-8">
                <AnimatePresence>
                  {dayNotes.map((note) => (
                    <motion.div
                      key={note.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="bg-white p-6 border-l-4 border-[#D8B46B] relative group"
                    >
                      {/* Spotlight Button */}
                      <button
                        onClick={() => onSpotlight(note.id, !note.spotlight)}
                        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Star
                          size={18}
                          className={note.spotlight ? "fill-[#D8B46B] text-[#D8B46B]" : "text-[#2B2725]/40"}
                        />
                      </button>

                      {/* Source Context */}
                      {note.source_type && note.source_type !== 'freeform' && (
                        <div className="text-xs text-[#2B2725]/60 mb-2 italic">
                          From: <span className="font-medium capitalize">{note.source_type}</span>
                          {note.source_title && <span> — {note.source_title}</span>}
                        </div>
                      )}

                       {/* Note Content */}
                       <p className="text-[#2B2725] leading-relaxed mb-4 pr-8">{note.content}</p>

                       {/* Tags & Emotion */}
                       <div className="flex flex-wrap gap-2">
                         {note.sentiment_primary && (
                           <Badge className={emotionColors[note.sentiment_primary]}>
                             {note.sentiment_primary}
                           </Badge>
                         )}
                         {(note.tags || []).map(tag => (
                           <Badge key={tag} variant="outline" className="border-[#D8B46B] text-[#2B2725]">
                             {tag}
                           </Badge>
                         ))}
                       </div>

                      {/* Spotlight Indicator */}
                      {note.spotlight && (
                        <div className="absolute top-0 right-0 w-8 h-8 bg-[#D8B46B]/10 flex items-center justify-center">
                          <Star size={14} className="fill-[#D8B46B] text-[#D8B46B]" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}