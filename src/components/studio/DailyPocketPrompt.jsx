import React, { useState } from "react";
import { motion } from "framer-motion";
import { Lightbulb, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DailyPocketPrompt({ prompt, onCreateNote, className = "" }) {
  const [showNoteOption, setShowNoteOption] = useState(false);

  const handleQuickNote = () => {
    if (onCreateNote) {
      onCreateNote({
        prompt_text: prompt,
        source_type: 'freeform',
        source_title: 'Today\'s Pocket Prompt',
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className={`bg-gradient-to-br from-[#D8B46B]/10 to-[#A6B7A3]/10 p-6 rounded-lg border border-[#D8B46B]/20 ${className}`}
    >
      <div className="flex items-start gap-4">
        <div className="text-[#D8B46B] opacity-80">
          <Lightbulb size={24} />
        </div>
        <div className="flex-1">
          <p className="text-xs text-[#2B2725]/60 uppercase tracking-wider mb-2">
            Today's Pocket Prompt
          </p>
          <p className="font-serif text-xl text-[#1E3A32] mb-4">
            {prompt || "What story are you carrying today?"}
          </p>
          <Button
            onClick={handleQuickNote}
            variant="outline"
            size="sm"
            className="border-[#D8B46B] text-[#1E3A32] hover:bg-[#D8B46B]/10"
          >
            <Edit3 size={14} className="mr-2" />
            Reflect on this
          </Button>
        </div>
      </div>
    </motion.div>
  );
}