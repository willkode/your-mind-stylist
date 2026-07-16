import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, Wand2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";

export default function AICourseGenerator({ onGenerate, onClose }) {
  const [prompt, setPrompt] = useState("");
  const [courseType, setCourseType] = useState("Toolkit Module");
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setGenerating(true);
    try {
      const schema = {
        type: "object",
        properties: {
          title: { type: "string" },
          subtitle: { type: "string" },
          short_description: { type: "string" },
          long_description: { type: "string" },
          learning_outcomes: {
            type: "array",
            items: { type: "string" },
            minItems: 3,
            maxItems: 7
          },
          duration: { type: "string" },
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
                      type: { type: "string", enum: ["video", "audio", "text", "hybrid"] },
                      content: { type: "string" },
                      duration: { type: "string" },
                      key_takeaways: {
                        type: "array",
                        items: { type: "string" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };

      const fullPrompt = `You are an expert course designer specializing in emotional intelligence and personal development.

Create a comprehensive ${courseType} course with the following specifications:
- Topic/Theme: ${prompt}
- Difficulty Level: ${difficulty}
- Course Type: ${courseType}

Generate a complete course structure including:
1. Compelling title and subtitle
2. Short description (2-3 sentences for course listings)
3. Detailed long description (2-3 paragraphs explaining the course value)
4. 3-7 specific learning outcomes
5. Estimated duration (e.g., "2 hours", "4 weeks")
6. 3-5 modules, each with:
   - Module title and description
   - 3-5 lessons per module with:
     - Lesson title
     - Lesson type (video, audio, text, or hybrid)
     - Rich lesson content (detailed explanations, examples, actionable steps)
     - Estimated duration
     - 3-5 key takeaways per lesson

Make it practical, actionable, and aligned with Mind Styling principles: emotional intelligence, pattern recognition, identity-level change, and sustainable transformation.

Use engaging, human language. Avoid corporate jargon. Make it feel personal and transformative.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: fullPrompt,
        response_json_schema: schema
      });

      // Transform AI response into course data
      const courseData = {
        ...response,
        type: courseType,
        difficulty: difficulty,
        status: "draft",
        visibility: "public",
        modules: response.modules.map((mod, modIdx) => ({
          id: `temp-${Date.now()}-mod-${modIdx}`,
          title: mod.title,
          description: mod.description,
          order: modIdx + 1,
          lessons: mod.lessons.map((lesson, lessonIdx) => ({
            id: `temp-${Date.now()}-lesson-${modIdx}-${lessonIdx}`,
            title: lesson.title,
            type: lesson.type,
            content: lesson.content,
            duration: lesson.duration,
            key_takeaways: lesson.key_takeaways || [],
            order: lessonIdx + 1
          }))
        }))
      };

      onGenerate(courseData);
      onClose();
    } catch (error) {
      console.error("AI generation failed:", error);
      alert("Failed to generate course. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const examplePrompts = [
    "A course on overcoming imposter syndrome for high-achieving professionals",
    "Building emotional resilience and stress management for leaders",
    "Mastering difficult conversations with confidence and empathy",
    "Identity transformation: From who you were to who you're becoming"
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen p-6 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-lg max-w-3xl w-full p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#6E4F7D] to-[#D8B46B] flex items-center justify-center">
              <Sparkles className="text-white" size={24} />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-[#1E3A32]">AI Course Generator</h2>
              <p className="text-sm text-[#2B2725]/60">Let AI create your entire course structure</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Course Type & Difficulty */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Course Type</Label>
                <Select value={courseType} onValueChange={setCourseType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Toolkit Module">Toolkit Module</SelectItem>
                    <SelectItem value="Webinar">Webinar</SelectItem>
                    <SelectItem value="Audio-Based Program">Audio-Based Program</SelectItem>
                    <SelectItem value="Training Program">Training Program</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Difficulty Level</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Intro">Intro</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Deep Work">Deep Work</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Prompt */}
            <div>
              <Label htmlFor="prompt">What course do you want to create?</Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your course topic, goals, and target audience..."
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Example Prompts */}
            <div>
              <p className="text-xs text-[#2B2725]/60 mb-2">Example prompts:</p>
              <div className="space-y-2">
                {examplePrompts.map((example, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPrompt(example)}
                    className="block w-full text-left px-3 py-2 text-sm bg-[#F9F5EF] hover:bg-[#E4D9C4] rounded transition-colors text-[#2B2725]/80"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-gradient-to-r from-[#6E4F7D]/10 to-[#D8B46B]/10 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <Wand2 size={20} className="text-[#6E4F7D] mt-0.5 flex-shrink-0" />
                <div className="text-sm text-[#2B2725]/80">
                  <p className="font-medium mb-1">AI will generate:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Course title, descriptions, and learning outcomes</li>
                    <li>• 3-5 modules with detailed descriptions</li>
                    <li>• 3-5 lessons per module with full content</li>
                    <li>• Key takeaways for each lesson</li>
                  </ul>
                  <p className="mt-2 text-xs italic">You can edit everything afterward!</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
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
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} className="mr-2" />
                    Generate Course
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}