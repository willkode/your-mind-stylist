import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";

export default function AILessonOutlineGenerator({ onGenerate, onClose }) {
  const [prompt, setPrompt] = useState("");
  const [numModules, setNumModules] = useState(3);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setGenerating(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert course designer. Based on the following course concept, create a comprehensive lesson outline.

Course Concept: ${prompt}

Create exactly ${numModules} modules with 3-5 lessons each. For each module and lesson, provide:
- A compelling title
- A brief description
- Suggested lesson type (video, audio, text, or hybrid)

Format the response as a curriculum structure that's practical and actionable.`,
        response_json_schema: {
          type: "object",
          properties: {
            modules: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  lessons: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        type: {
                          type: "string",
                          enum: ["video", "audio", "text", "hybrid"]
                        },
                        description: { type: "string" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      // Transform to match expected format
      const modulesWithIds = response.modules.map((module, idx) => ({
        id: `temp-${Date.now()}-${idx}`,
        title: module.title,
        description: module.description,
        order: idx + 1,
        lessons: (module.lessons || []).map((lesson, lessonIdx) => ({
          id: `temp-${Date.now()}-${idx}-${lessonIdx}`,
          title: lesson.title,
          type: lesson.type,
          content: lesson.description || "",
          order: lessonIdx + 1,
        }))
      }));

      onGenerate(modulesWithIds);
      onClose();
    } catch (error) {
      console.error("Error generating outline:", error);
      alert("Failed to generate outline. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-lg shadow-2xl max-w-2xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-[#6E4F7D] to-[#8B659B] rounded">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-[#1E3A32]">
                AI Lesson Outline Generator
              </h2>
              <p className="text-sm text-[#2B2725]/70">
                Describe your course and let AI create the structure
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <Label>Course Concept or Topic *</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., A comprehensive course on emotional intelligence for leaders, covering self-awareness, empathy, and relationship management..."
              rows={5}
              className="mt-2"
            />
            <p className="text-xs text-[#2B2725]/60 mt-2">
              Be as detailed as possible. Include target audience, learning goals, and key topics.
            </p>
          </div>

          <div>
            <Label>Number of Modules</Label>
            <Input
              type="number"
              min="2"
              max="10"
              value={numModules}
              onChange={(e) => setNumModules(parseInt(e.target.value))}
              className="mt-2"
            />
          </div>

          <div className="bg-[#D8B46B]/10 p-4 rounded border-l-4 border-[#D8B46B]">
            <p className="text-sm text-[#2B2725]">
              <strong>Tip:</strong> AI will create {numModules} modules with 3-5 lessons each. You
              can edit everything after generation.
            </p>
          </div>
        </div>

        <div className="p-6 border-t flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={generating}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={!prompt.trim() || generating}
            className="bg-gradient-to-r from-[#6E4F7D] to-[#8B659B] hover:from-[#5D3E6C] hover:to-[#7A5487] text-white"
          >
            {generating ? (
              <>
                <Loader size={16} className="mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={16} className="mr-2" />
                Generate Outline
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}