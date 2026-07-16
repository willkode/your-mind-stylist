import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Heart, X } from "lucide-react";

const MOODS = [
  { value: "joyful", emoji: "😊", label: "Joyful" },
  { value: "content", emoji: "😌", label: "Content" },
  { value: "calm", emoji: "😇", label: "Calm" },
  { value: "neutral", emoji: "😐", label: "Neutral" },
  { value: "anxious", emoji: "😰", label: "Anxious" },
  { value: "sad", emoji: "😢", label: "Sad" },
  { value: "frustrated", emoji: "😤", label: "Frustrated" },
  { value: "energized", emoji: "⚡", label: "Energized" },
  { value: "tired", emoji: "😴", label: "Tired" },
  { value: "grateful", emoji: "🙏", label: "Grateful" },
];

export default function ReflectionPrompt({
  reflectionType,
  relatedId,
  relatedTitle,
  onComplete,
  onSkip,
  promptText,
  showMoodTracking = true,
  showBreakthroughTag = true,
}) {
  const queryClient = useQueryClient();
  const [reflection, setReflection] = useState({
    reflection_text: "",
    what_shifted: "",
    mood_after: "",
    energy_after: 5,
    breakthrough_tagged: false,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.LearningReflection.create({
        reflection_type: reflectionType,
        related_id: relatedId,
        related_title: relatedTitle,
        ...reflection,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learning-reflections"] });
      if (onComplete) onComplete();
    },
  });

  const handleSave = () => {
    if (!reflection.reflection_text.trim()) {
      alert("Please share at least a brief reflection");
      return;
    }
    saveMutation.mutate();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1E3A32] to-[#2B4A40] text-white p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles size={24} className="text-[#D8B46B]" />
              <h2 className="font-serif text-2xl">Reflection Moment</h2>
            </div>
            {onSkip && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onSkip}
                className="text-white hover:text-[#D8B46B]"
              >
                <X size={20} />
              </Button>
            )}
          </div>
          <p className="text-white/80">
            {promptText || "Take a moment to reflect on what just happened..."}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* What Shifted */}
          <div>
            <Label className="text-[#1E3A32] font-medium mb-2 block">
              What shifted for you? ✨
            </Label>
            <Textarea
              value={reflection.what_shifted}
              onChange={(e) =>
                setReflection({ ...reflection, what_shifted: e.target.value })
              }
              placeholder="One thing that resonated or changed..."
              rows={2}
              className="resize-none"
            />
          </div>

          {/* Full Reflection */}
          <div>
            <Label className="text-[#1E3A32] font-medium mb-2 block">
              Your Reflection (Optional - go deeper if you'd like)
            </Label>
            <Textarea
              value={reflection.reflection_text}
              onChange={(e) =>
                setReflection({ ...reflection, reflection_text: e.target.value })
              }
              placeholder="What are you noticing? What do you want to remember?"
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Mood After */}
          {showMoodTracking && (
            <div>
              <Label className="text-[#1E3A32] font-medium mb-3 block">
                How are you feeling now?
              </Label>
              <div className="grid grid-cols-5 gap-2">
                {MOODS.map((mood) => (
                  <button
                    key={mood.value}
                    onClick={() =>
                      setReflection({ ...reflection, mood_after: mood.value })
                    }
                    className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                      reflection.mood_after === mood.value
                        ? "border-[#D8B46B] bg-[#D8B46B]/10"
                        : "border-[#E4D9C4] hover:border-[#D8B46B]/50"
                    }`}
                  >
                    <span className="text-2xl">{mood.emoji}</span>
                    <span className="text-xs text-[#2B2725]/70">{mood.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Energy Level */}
          {showMoodTracking && (
            <div>
              <Label className="text-[#1E3A32] font-medium mb-2 block">
                Energy Level: {reflection.energy_after}/10
              </Label>
              <input
                type="range"
                min="1"
                max="10"
                value={reflection.energy_after}
                onChange={(e) =>
                  setReflection({
                    ...reflection,
                    energy_after: parseInt(e.target.value),
                  })
                }
                className="w-full h-2 bg-[#E4D9C4] rounded-lg appearance-none cursor-pointer accent-[#D8B46B]"
              />
              <div className="flex justify-between text-xs text-[#2B2725]/60 mt-1">
                <span>Depleted</span>
                <span>Energized</span>
              </div>
            </div>
          )}

          {/* Breakthrough Tag */}
          {showBreakthroughTag && (
            <div className="bg-[#F9F5EF] p-4 rounded-lg">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reflection.breakthrough_tagged}
                  onChange={(e) =>
                    setReflection({
                      ...reflection,
                      breakthrough_tagged: e.target.checked,
                    })
                  }
                  className="w-5 h-5 accent-[#D8B46B]"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <Heart className="text-[#D8B46B]" size={18} />
                    <span className="font-medium text-[#1E3A32]">
                      This was a breakthrough moment
                    </span>
                  </div>
                  <p className="text-sm text-[#2B2725]/70 ml-7">
                    Mark this as an "aha" moment in your journey
                  </p>
                </div>
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#E4D9C4] flex items-center justify-between">
          {onSkip && (
            <Button variant="ghost" onClick={onSkip} className="text-[#2B2725]/60">
              Skip for now
            </Button>
          )}
          <div className="flex gap-3 ml-auto">
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending || !reflection.what_shifted.trim()}
              className="bg-[#1E3A32] hover:bg-[#2B4A40] text-white"
            >
              {saveMutation.isPending ? "Saving..." : "Save Reflection"}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}