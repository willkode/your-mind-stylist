import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { motion } from "framer-motion";
import { Lock, Unlock, BookOpen, Headphones, FileText, Sparkles, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const CONTENT_ICONS = {
  course: BookOpen,
  lesson: BookOpen,
  resource: FileText,
  audio: Headphones,
  tool: Sparkles,
  feature: Sparkles
};

export default function UnlockedContentPanel({ depthMarker }) {
  const unlockedContent = depthMarker?.unlocked_content || [];
  const currentLevel = depthMarker?.current_depth_level || 1;

  // Mock some locked content for preview (in real app, this would come from content catalog)
  const upcomingContent = [
    { level: currentLevel + 1, title: "Advanced Emotional Mapping", type: "course" },
    { level: currentLevel + 1, title: "Deep State Anchoring", type: "audio" },
    { level: currentLevel + 2, title: "Master Class: Integration", type: "lesson" },
  ].filter(c => c.level <= 10);

  const newUnlocked = unlockedContent.filter(c => !c.viewed);

  return (
    <div className="space-y-6">
      {/* Newly Unlocked */}
      {newUnlocked.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-[#D8B46B]/20 to-[#A6B7A3]/20 rounded-xl p-6 border-2 border-[#D8B46B]"
        >
          <div className="flex items-center gap-2 mb-4">
            <Unlock size={24} className="text-[#D8B46B]" />
            <h3 className="font-serif text-xl text-[#1E3A32]">
              New Content Unlocked!
            </h3>
          </div>
          <div className="space-y-3">
            {newUnlocked.map((content, idx) => {
              const Icon = CONTENT_ICONS[content.content_type] || Sparkles;
              return (
                <motion.div
                  key={content.content_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#D8B46B]/20 flex items-center justify-center">
                      <Icon size={20} className="text-[#D8B46B]" />
                    </div>
                    <div>
                      <p className="font-medium text-[#1E3A32]">{content.content_title}</p>
                      <p className="text-xs text-[#2B2725]/60 capitalize">{content.content_type}</p>
                    </div>
                  </div>
                  <Button size="sm" className="bg-[#1E3A32]">
                    Explore <ChevronRight size={16} className="ml-1" />
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* All Unlocked Content */}
      <div className="bg-white rounded-xl p-6 shadow-md">
        <h3 className="font-serif text-xl text-[#1E3A32] mb-4">
          Your Unlocked Collection
        </h3>
        {unlockedContent.length === 0 ? (
          <p className="text-[#2B2725]/60 text-center py-8">
            Complete reflections and milestones to unlock exclusive content
          </p>
        ) : (
          <div className="space-y-2">
            {unlockedContent.map((content) => {
              const Icon = CONTENT_ICONS[content.content_type] || Sparkles;
              return (
                <div
                  key={content.content_id}
                  className="flex items-center gap-3 p-3 rounded hover:bg-[#F9F5EF] transition-colors"
                >
                  <Icon size={18} className="text-[#2B2725]/60" />
                  <div className="flex-1">
                    <p className="text-sm text-[#1E3A32]">{content.content_title}</p>
                    <p className="text-xs text-[#2B2725]/50 capitalize">{content.content_type}</p>
                  </div>
                  {content.viewed && (
                    <span className="text-xs text-green-600">✓ Viewed</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Coming Soon */}
      {upcomingContent.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h3 className="font-serif text-xl text-[#1E3A32] mb-4">
            Unlocks at Ring {currentLevel + 1}
          </h3>
          <div className="space-y-2">
            {upcomingContent.map((content, idx) => {
              const Icon = CONTENT_ICONS[content.type] || Sparkles;
              return (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 rounded bg-[#F9F5EF]/50 opacity-60"
                >
                  <Lock size={18} className="text-[#2B2725]/40" />
                  <div className="flex-1">
                    <p className="text-sm text-[#1E3A32]">{content.title}</p>
                    <p className="text-xs text-[#2B2725]/50 capitalize">{content.type}</p>
                  </div>
                  <span className="text-xs text-[#2B2725]/40">Ring {content.level}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}