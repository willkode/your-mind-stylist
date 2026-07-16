import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Save, X } from "lucide-react";
import { motion } from "framer-motion";

const MOODS = [
  { value: "joyful", label: "😄 Joyful", color: "#FFD700" },
  { value: "content", label: "😊 Content", color: "#A6B7A3" },
  { value: "calm", label: "😌 Calm", color: "#6E4F7D" },
  { value: "neutral", label: "😐 Neutral", color: "#D8B46B" },
  { value: "anxious", label: "😰 Anxious", color: "#FFA500" },
  { value: "sad", label: "😢 Sad", color: "#4169E1" },
  { value: "frustrated", label: "😤 Frustrated", color: "#DC143C" },
  { value: "energized", label: "⚡ Energized", color: "#FF6347" },
  { value: "tired", label: "😴 Tired", color: "#708090" },
  { value: "grateful", label: "🙏 Grateful", color: "#DAA520" },
];

export default function DiaryEntryEditor({ entry, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    title: "",
    content: "",
    mood: "neutral",
    energy_level: 5,
    tags: [],
    prompt_used: "",
    is_favorite: false,
  });

  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (entry) {
      setFormData({
        date: entry.date || new Date().toISOString().split("T")[0],
        title: entry.title || "",
        content: entry.content || "",
        mood: entry.mood || "neutral",
        energy_level: entry.energy_level || 5,
        tags: entry.tags || [],
        prompt_used: entry.prompt_used || "",
        is_favorite: entry.is_favorite || false,
      });
    }
  }, [entry]);

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white p-6 rounded-lg mb-6"
    >
      <form onSubmit={handleSubmit}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-serif text-2xl text-[#1E3A32]">
            {entry?.id ? "Edit Entry" : "New Entry"}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="text-[#2B2725]/60 hover:text-[#2B2725]"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Date */}
          <div>
            <Label>Date</Label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="mt-2"
              required
            />
          </div>

          {/* Title (optional) */}
          <div>
            <Label>Title (optional)</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="A meaningful day..."
              className="mt-2"
            />
          </div>

          {/* Prompt Used (if any) */}
          {formData.prompt_used && (
            <div className="bg-[#D8B46B]/10 p-4 rounded border-l-4 border-[#D8B46B]">
              <p className="text-sm text-[#2B2725]/70 mb-1">Responding to:</p>
              <p className="text-[#1E3A32] italic">"{formData.prompt_used}"</p>
            </div>
          )}

          {/* Content */}
          <div>
            <Label>Your Reflection *</Label>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="What's on your mind today?"
              rows={10}
              className="mt-2"
              required
            />
          </div>

          {/* Mood Selection */}
          <div>
            <Label>How are you feeling? *</Label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-2">
              {MOODS.map((mood) => (
                <button
                  key={mood.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, mood: mood.value })}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.mood === mood.value
                      ? "border-[#1E3A32] bg-[#1E3A32]/5"
                      : "border-[#E4D9C4] hover:border-[#D8B46B]"
                  }`}
                  style={{
                    borderColor:
                      formData.mood === mood.value ? mood.color : undefined,
                  }}
                >
                  <span className="text-sm">{mood.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Energy Level */}
          <div>
            <Label>Energy Level: {formData.energy_level}/10</Label>
            <input
              type="range"
              min="1"
              max="10"
              value={formData.energy_level}
              onChange={(e) =>
                setFormData({ ...formData, energy_level: parseInt(e.target.value) })
              }
              className="w-full mt-2"
            />
          </div>

          {/* Tags */}
          <div>
            <Label>Tags</Label>
            <div className="flex gap-2 mt-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add tag..."
              />
              <Button type="button" onClick={handleAddTag} variant="outline">
                Add
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-[#D8B46B]/20 text-[#1E3A32] text-sm rounded-full flex items-center gap-2"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-red-600"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#1E3A32] hover:bg-[#2B2725]">
              <Save size={16} className="mr-2" />
              Save Entry
            </Button>
          </div>
        </div>
      </form>
    </motion.div>
  );
}