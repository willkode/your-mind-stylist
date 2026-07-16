import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, Zap, X } from "lucide-react";
import { motion } from "framer-motion";

export default function EmotionalCheckIn({ type, lessonTitle, onComplete, onSkip }) {
  const [mood, setMood] = useState("");
  const [energy, setEnergy] = useState(5);

  const moods = [
    { value: "joyful", label: "Joyful", emoji: "😊" },
    { value: "content", label: "Content", emoji: "🙂" },
    { value: "calm", label: "Calm", emoji: "😌" },
    { value: "neutral", label: "Neutral", emoji: "😐" },
    { value: "anxious", label: "Anxious", emoji: "😰" },
    { value: "frustrated", label: "Frustrated", emoji: "😤" },
    { value: "tired", label: "Tired", emoji: "😴" },
    { value: "energized", label: "Energized", emoji: "⚡" },
    { value: "curious", label: "Curious", emoji: "🤔" },
    { value: "hopeful", label: "Hopeful", emoji: "🌟" },
  ];

  const handleSubmit = () => {
    onComplete({ mood, energy });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg max-w-md w-full p-8 relative"
      >
        <button
          onClick={onSkip}
          className="absolute top-4 right-4 text-[#2B2725]/40 hover:text-[#2B2725]"
        >
          <X size={20} />
        </button>

        <div className="mb-6">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D8B46B] to-[#A6B7A3] flex items-center justify-center mb-4">
            <Heart size={24} className="text-white" />
          </div>
          <h2 className="font-serif text-2xl text-[#1E3A32] mb-2">
            {type === "before" ? "Before You Begin" : "How Are You Feeling?"}
          </h2>
          <p className="text-[#2B2725]/70">
            {type === "before" 
              ? "Take a moment to check in with yourself before starting this lesson."
              : "Reflect on how you're feeling after completing this lesson."}
          </p>
          <p className="text-sm text-[#2B2725]/50 mt-1 italic">
            {lessonTitle}
          </p>
        </div>

        <div className="space-y-6">
          {/* Mood Selection */}
          <div>
            <Label className="flex items-center gap-2 mb-3">
              <Heart size={16} className="text-[#D8B46B]" />
              How do you feel right now?
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {moods.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMood(m.value)}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    mood === m.value
                      ? "border-[#D8B46B] bg-[#D8B46B]/10"
                      : "border-[#E4D9C4] hover:border-[#D8B46B]/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{m.emoji}</span>
                    <span className="text-sm">{m.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Energy Level */}
          <div>
            <Label className="flex items-center gap-2 mb-3">
              <Zap size={16} className="text-[#A6B7A3]" />
              Energy Level: {energy}/10
            </Label>
            <input
              type="range"
              min="1"
              max="10"
              value={energy}
              onChange={(e) => setEnergy(parseInt(e.target.value))}
              className="w-full h-2 bg-[#E4D9C4] rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #A6B7A3 0%, #A6B7A3 ${(energy - 1) * 11.11}%, #E4D9C4 ${(energy - 1) * 11.11}%, #E4D9C4 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-[#2B2725]/40 mt-1">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <Button
            variant="outline"
            onClick={onSkip}
            className="flex-1"
          >
            Skip
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!mood}
            className="flex-1 bg-[#1E3A32] hover:bg-[#2B2725]"
          >
            Continue
          </Button>
        </div>
      </motion.div>
    </div>
  );
}