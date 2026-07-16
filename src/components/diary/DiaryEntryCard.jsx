import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, ChevronDown, ChevronUp, Star } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

const MOOD_EMOJI = {
  joyful: "😄",
  content: "😊",
  calm: "😌",
  neutral: "😐",
  anxious: "😰",
  sad: "😢",
  frustrated: "😤",
  energized: "⚡",
  tired: "😴",
  grateful: "🙏",
};

export default function DiaryEntryCard({ entry, onEdit, onDelete }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg overflow-hidden"
    >
      <Card className="p-6">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{MOOD_EMOJI[entry.mood]}</span>
              <div>
                <h3 className="font-serif text-xl text-[#1E3A32]">
                  {entry.title || format(new Date(entry.date), "MMMM d, yyyy")}
                </h3>
                <p className="text-sm text-[#2B2725]/60">
                  {format(new Date(entry.date), "EEEE")} • Energy: {entry.energy_level}/10
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {entry.is_favorite && <Star size={18} className="text-[#D8B46B] fill-[#D8B46B]" />}
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Edit size={16} />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete} className="text-red-600">
              <Trash2 size={16} />
            </Button>
          </div>
        </div>

        {/* Content Preview */}
        <div className="mb-3">
          <p className="text-[#2B2725]/80 leading-relaxed">
            {isExpanded
              ? entry.content
              : entry.content.substring(0, 200) + (entry.content.length > 200 ? "..." : "")}
          </p>
        </div>

        {/* Tags */}
        {entry.tags && entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {entry.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-[#D8B46B]/10 text-[#2B2725]/70 text-xs rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Expand/Collapse */}
        {entry.content.length > 200 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-[#1E3A32] hover:text-[#D8B46B] flex items-center gap-1"
          >
            {isExpanded ? (
              <>
                Show less <ChevronUp size={14} />
              </>
            ) : (
              <>
                Read more <ChevronDown size={14} />
              </>
            )}
          </button>
        )}
      </Card>
    </motion.div>
  );
}