import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { X, Camera } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const MOODS = [
  { value: "joyful", label: "Joyful", emoji: "😊" },
  { value: "content", label: "Content", emoji: "😌" },
  { value: "calm", label: "Calm", emoji: "😇" },
  { value: "neutral", label: "Neutral", emoji: "😐" },
  { value: "anxious", label: "Anxious", emoji: "😰" },
  { value: "sad", label: "Sad", emoji: "😢" },
  { value: "frustrated", label: "Frustrated", emoji: "😤" },
  { value: "energized", label: "Energized", emoji: "⚡" },
  { value: "tired", label: "Tired", emoji: "😴" },
  { value: "grateful", label: "Grateful", emoji: "🙏" }
];

export default function SnapshotCapture({ 
  snapshotType, 
  relatedId, 
  relatedTitle,
  isStart = true,
  onComplete,
  onSkip 
}) {
  const queryClient = useQueryClient();
  const [calmScore, setCalmScore] = useState([50]);
  const [groundedScore, setGroundedScore] = useState([50]);
  const [openScore, setOpenScore] = useState([50]);
  const [mood, setMood] = useState("neutral");
  const [energy, setEnergy] = useState([5]);
  const [notes, setNotes] = useState("");
  const [intentions, setIntentions] = useState("");

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.TransformationSnapshot.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["snapshots"] });
      if (onComplete) onComplete();
    }
  });

  const handleSave = () => {
    saveMutation.mutate({
      snapshot_type: snapshotType,
      related_id: relatedId,
      related_title: relatedTitle,
      calm_score: calmScore[0],
      grounded_score: groundedScore[0],
      open_score: openScore[0],
      overall_mood: mood,
      energy_level: energy[0],
      notes: notes || null,
      intentions: isStart ? intentions : null,
      outcomes: !isStart ? intentions : null
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6 overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full my-8"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1E3A32] to-[#2B4A40] text-white p-6 rounded-t-xl">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <Camera size={24} className="text-[#D8B46B]" />
              <div>
                <h2 className="font-serif text-2xl">Transformation Snapshot</h2>
                <p className="text-white/80 text-sm mt-1">
                  {isStart ? "Capture where you are right now" : "Reflect on what's shifted"}
                </p>
              </div>
            </div>
            <button onClick={onSkip} className="text-white/60 hover:text-white">
              <X size={24} />
            </button>
          </div>
          {relatedTitle && (
            <p className="text-white/70 text-sm">{relatedTitle}</p>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Calm vs Activated */}
          <div>
            <label className="block text-sm font-medium text-[#1E3A32] mb-3">
              Calm vs Activated
            </label>
            <div className="flex items-center gap-4">
              <span className="text-xs text-[#2B2725]/60 w-20">Activated</span>
              <Slider
                value={calmScore}
                onValueChange={setCalmScore}
                max={100}
                step={1}
                className="flex-1"
              />
              <span className="text-xs text-[#2B2725]/60 w-20 text-right">Calm</span>
            </div>
            <p className="text-xs text-[#2B2725]/50 text-center mt-2">{calmScore[0]}</p>
          </div>

          {/* Grounded vs Scattered */}
          <div>
            <label className="block text-sm font-medium text-[#1E3A32] mb-3">
              Grounded vs Scattered
            </label>
            <div className="flex items-center gap-4">
              <span className="text-xs text-[#2B2725]/60 w-20">Scattered</span>
              <Slider
                value={groundedScore}
                onValueChange={setGroundedScore}
                max={100}
                step={1}
                className="flex-1"
              />
              <span className="text-xs text-[#2B2725]/60 w-20 text-right">Grounded</span>
            </div>
            <p className="text-xs text-[#2B2725]/50 text-center mt-2">{groundedScore[0]}</p>
          </div>

          {/* Open vs Guarded */}
          <div>
            <label className="block text-sm font-medium text-[#1E3A32] mb-3">
              Open vs Guarded
            </label>
            <div className="flex items-center gap-4">
              <span className="text-xs text-[#2B2725]/60 w-20">Guarded</span>
              <Slider
                value={openScore}
                onValueChange={setOpenScore}
                max={100}
                step={1}
                className="flex-1"
              />
              <span className="text-xs text-[#2B2725]/60 w-20 text-right">Open</span>
            </div>
            <p className="text-xs text-[#2B2725]/50 text-center mt-2">{openScore[0]}</p>
          </div>

          {/* Mood Selection */}
          <div>
            <label className="block text-sm font-medium text-[#1E3A32] mb-3">
              Overall Mood
            </label>
            <div className="grid grid-cols-5 gap-2">
              {MOODS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMood(m.value)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    mood === m.value
                      ? "border-[#D8B46B] bg-[#D8B46B]/10"
                      : "border-[#E4D9C4] hover:border-[#D8B46B]/50"
                  }`}
                >
                  <div className="text-2xl mb-1">{m.emoji}</div>
                  <div className="text-xs text-[#2B2725]">{m.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Energy Level */}
          <div>
            <label className="block text-sm font-medium text-[#1E3A32] mb-3">
              Energy Level (1-10)
            </label>
            <Slider
              value={energy}
              onValueChange={setEnergy}
              min={1}
              max={10}
              step={1}
              className="mb-2"
            />
            <p className="text-xs text-[#2B2725]/50 text-center">{energy[0]}/10</p>
          </div>

          {/* Intentions or Outcomes */}
          <div>
            <label className="block text-sm font-medium text-[#1E3A32] mb-2">
              {isStart ? "What do you hope to achieve?" : "What actually changed?"}
            </label>
            <Textarea
              value={intentions}
              onChange={(e) => setIntentions(e.target.value)}
              placeholder={isStart 
                ? "Your intentions for this journey..."
                : "Reflect on the shifts you experienced..."
              }
              className="h-24"
            />
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-[#1E3A32] mb-2">
              Additional Notes (Optional)
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything else you want to remember about this moment..."
              className="h-20"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 bg-[#F9F5EF] rounded-b-xl flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={onSkip}
            className="text-[#2B2725]/60"
          >
            Skip for Now
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="bg-[#1E3A32] hover:bg-[#2B2725] text-white px-8"
          >
            {saveMutation.isPending ? "Saving..." : "Capture Snapshot"}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}