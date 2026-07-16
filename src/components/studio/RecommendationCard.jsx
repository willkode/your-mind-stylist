import React from "react";
import { motion } from "framer-motion";
import { Sparkles, BookOpen, Headphones, Edit3, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";

export default function RecommendationCard({ recommendation, onTakeAction, className = "" }) {
  const getIcon = () => {
    switch (recommendation.type) {
      case 'audio_session':
        return Headphones;
      case 'lesson':
        return BookOpen;
      case 'reflection':
        return Edit3;
      case 'celebration':
        return Award;
      default:
        return Sparkles;
    }
  };

  const Icon = getIcon();

  const handleAction = () => {
    if (recommendation.type === 'reflection' && recommendation.prompt) {
      onTakeAction(recommendation.prompt);
    } else if (recommendation.type === 'audio_session') {
      window.location.href = createPageUrl('StudioAudio');
    } else if (recommendation.type === 'lesson') {
      window.location.href = createPageUrl('Library') + '?tab=courses';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br from-[#6E4F7D]/10 to-[#D8B46B]/10 p-6 rounded-lg border border-[#6E4F7D]/20 ${className}`}
    >
      <div className="flex items-start gap-4">
        <div className="text-[#6E4F7D] opacity-80">
          <Icon size={24} />
        </div>
        <div className="flex-1">
          <p className="text-xs text-[#2B2725]/60 uppercase tracking-wider mb-2">
            Suggested for You
          </p>
          <h3 className="font-serif text-xl text-[#1E3A32] mb-2">
            {recommendation.title}
          </h3>
          <p className="text-[#2B2725]/70 text-sm leading-relaxed mb-4">
            {recommendation.description}
          </p>
          
          {recommendation.type !== 'celebration' && (
            <Button
              onClick={handleAction}
              variant="outline"
              size="sm"
              className="border-[#6E4F7D] text-[#1E3A32] hover:bg-[#6E4F7D]/10"
            >
              {recommendation.action || (
                recommendation.type === 'reflection' ? 'Reflect on This' :
                recommendation.type === 'audio_session' ? 'Browse Sessions' :
                'Explore'
              )}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}