import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  Trophy, Sparkles, Heart, BookOpen, Calendar, 
  Target, Zap, Star, Crown, Award, Share2 
} from "lucide-react";
import ShareAchievement from "./ShareAchievement";
import confetti from "canvas-confetti";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const MILESTONE_ICONS = {
  consistency: Calendar,
  emotional_shift: Heart,
  learning: BookOpen,
  engagement: Target,
  breakthrough: Sparkles,
  custom: Award
};

export default function MilestoneCelebration({ milestone, onClose }) {
  const queryClient = useQueryClient();
  const [showShare, setShowShare] = useState(false);
  
  useEffect(() => {
    // Fire confetti
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#D8B46B', '#1E3A32', '#A6B7A3']
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#D8B46B', '#1E3A32', '#A6B7A3']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, []);

  const markCelebratedMutation = useMutation({
    mutationFn: () => 
      base44.entities.Milestone.update(milestone.id, {
        celebrated: true,
        celebration_shown_date: new Date().toISOString()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["milestones"] });
      if (onClose) onClose();
    }
  });

  const IconComponent = MILESTONE_ICONS[milestone.milestone_type] || Award;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-6"
    >
      <motion.div
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 50 }}
        className="bg-gradient-to-br from-[#1E3A32] via-[#2B4A40] to-[#1E3A32] text-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
      >
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#D8B46B]/20 to-transparent pointer-events-none"></div>

        {/* Content */}
        <div className="relative p-8 text-center">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mb-6"
          >
            <div className="w-24 h-24 mx-auto bg-[#D8B46B] rounded-full flex items-center justify-center shadow-lg">
              <IconComponent size={48} className="text-[#1E3A32]" />
            </div>
          </motion.div>

          {/* Milestone Achieved Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#D8B46B]/20 border border-[#D8B46B] rounded-full mb-4">
              <Trophy size={16} className="text-[#D8B46B]" />
              <span className="text-[#D8B46B] text-sm font-medium tracking-wide uppercase">
                Milestone Achieved
              </span>
            </div>
          </motion.div>

          {/* Title */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="font-serif text-3xl md:text-4xl mb-4"
          >
            {milestone.milestone_name}
          </motion.h2>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-white/80 text-lg leading-relaxed mb-6"
          >
            {milestone.milestone_description}
          </motion.p>

          {/* Points/Depth (if applicable) */}
          {milestone.points_awarded > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="mb-6"
            >
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 rounded-lg">
                <Star size={20} className="text-[#D8B46B]" />
                <span className="text-xl font-medium">
                  +{milestone.points_awarded} Depth Points
                </span>
              </div>
            </motion.div>
          )}

          {/* Metadata (Streak, Improvement, etc.) */}
          {milestone.metadata && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mb-6 p-4 bg-white/5 rounded-lg"
            >
              {milestone.metadata.streak_count && (
                <div className="flex items-center justify-center gap-2 text-sm">
                  <Zap size={16} className="text-[#D8B46B]" />
                  <span>{milestone.metadata.streak_count}-day streak</span>
                </div>
              )}
              {milestone.metadata.improvement_percentage && (
                <div className="flex items-center justify-center gap-2 text-sm mt-2">
                  <Target size={16} className="text-[#A6B7A3]" />
                  <span>{milestone.metadata.improvement_percentage}% improvement</span>
                </div>
              )}
            </motion.div>
          )}

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <Button
              onClick={() => setShowShare(true)}
              variant="outline"
              className="border-[#D8B46B] text-[#D8B46B] hover:bg-[#D8B46B]/10"
              size="lg"
            >
              <Share2 size={18} className="mr-2" />
              Share Achievement
            </Button>
            <Button
              onClick={() => markCelebratedMutation.mutate()}
              disabled={markCelebratedMutation.isPending}
              className="bg-[#D8B46B] hover:bg-[#C9A55B] text-[#1E3A32] font-medium px-8"
              size="lg"
            >
              {markCelebratedMutation.isPending ? "Saving..." : "Continue Your Journey"}
            </Button>
          </motion.div>
          
          {showShare && (
            <ShareAchievement 
              milestone={milestone} 
              onClose={() => setShowShare(false)} 
            />
          )}

          <p className="text-white/60 text-xs mt-4">
            This achievement has been added to your transformation story
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}