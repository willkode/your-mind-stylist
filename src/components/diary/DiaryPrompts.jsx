import React from "react";
import { Button } from "@/components/ui/button";
import { Lightbulb } from "lucide-react";

const PROMPTS = [
  "What am I grateful for today?",
  "What challenged me today, and what did I learn?",
  "Describe a moment that made me smile",
  "What would I tell my younger self about today?",
  "What emotion showed up most today?",
  "What am I letting go of today?",
  "What intention do I want to set for tomorrow?",
  "What surprised me about myself today?",
];

export default function DiaryPrompts({ onUsePrompt }) {
  const todayPrompt = PROMPTS[new Date().getDate() % PROMPTS.length];

  return (
    <div className="bg-white p-6 rounded-lg">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb size={20} className="text-[#D8B46B]" />
        <h3 className="font-serif text-xl text-[#1E3A32]">Today's Prompt</h3>
      </div>
      <p className="text-[#2B2725]/80 italic mb-4">"{todayPrompt}"</p>
      <Button
        onClick={() => onUsePrompt(todayPrompt)}
        variant="outline"
        className="w-full"
      >
        Use This Prompt
      </Button>

      <div className="mt-6 pt-6 border-t">
        <p className="text-sm text-[#2B2725]/60 mb-3">Or choose another:</p>
        <div className="space-y-2">
          {PROMPTS.filter((p) => p !== todayPrompt)
            .slice(0, 3)
            .map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => onUsePrompt(prompt)}
                className="text-left text-sm text-[#2B2725]/70 hover:text-[#1E3A32] transition-colors w-full"
              >
                • {prompt}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}