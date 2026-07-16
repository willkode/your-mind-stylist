import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { trackUsage } from "@/components/utils/trackUsage";
import CreditGateBanner from "@/components/credits/CreditGateBanner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Copy, RefreshCw, ArrowRight, Loader2, X } from "lucide-react";
import AIPromptLibrary from "./AIPromptLibrary";
import AIOutput from "./AIOutput";

export default function AIHelper({ mode, onInsert, context = {} }) {
  const [customPrompt, setCustomPrompt] = useState("");
  const [output, setOutput] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  const generateContent = async (prompt) => {
    setLoading(true);
    try {
      const systemPrompt = getSystemPrompt(mode);
      const fullPrompt = `${systemPrompt}\n\nUser Request: ${prompt}\n\nContext: ${JSON.stringify(context)}`;
      
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: fullPrompt,
        add_context_from_internet: false,
      });

      setOutput(response);
      trackUsage({ feature: "ai_helper", integration_type: "InvokeLLM", details: `${mode}: ${prompt.substring(0, 60)}` });
    } catch (error) {
      setOutput("Something didn't work as expected. Try again?");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPrompt = (promptTemplate) => {
    let finalPrompt = promptTemplate;
    Object.keys(context).forEach(key => {
      finalPrompt = finalPrompt.replace(`{{${key}}}`, context[key] || "");
    });
    generateContent(finalPrompt);
  };

  const handleCustomPrompt = () => {
    if (customPrompt.trim()) {
      generateContent(customPrompt);
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed right-4 bottom-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-[#6E4F7D] hover:bg-[#5a3f66] text-white rounded-full w-14 h-14 shadow-lg"
        >
          <Sparkles size={24} />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed right-0 top-0 h-screen w-96 bg-white border-l border-[#E4D9C4] shadow-2xl z-40 flex flex-col">
      {/* Header */}
      <div className="bg-[#6E4F7D] text-white p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles size={24} />
            <h3 className="font-serif text-xl">AI Assistant</h3>
          </div>
          <button onClick={() => setIsOpen(false)} className="hover:opacity-70">
            <X size={20} />
          </button>
        </div>
        <p className="text-white/80 text-sm">
          Use the AI Assistant to help you shape your ideas — you're always in control of the final words.
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Prompt Library */}
        <AIPromptLibrary mode={mode} onSelect={handleQuickPrompt} />

        {/* Custom Prompt */}
        <div>
          <label className="text-sm font-medium text-[#2B2725] mb-2 block">
            Custom Prompt
          </label>
          <Textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="What would you like help with?"
            rows={3}
            className="mb-2"
          />
          <CreditGateBanner feature="ai_helper">
            <Button
              onClick={handleCustomPrompt}
              disabled={loading || !customPrompt.trim()}
              className="w-full bg-[#1E3A32] hover:bg-[#2B2725] text-white"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  Create
                  <ArrowRight size={16} className="ml-2" />
                </>
              )}
            </Button>
          </CreditGateBanner>
        </div>

        {/* Output */}
        {output && (
          <AIOutput
            content={output}
            onInsert={() => onInsert(output)}
            onRefine={(refinedPrompt) => generateContent(refinedPrompt)}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
}

function getSystemPrompt(mode) {
  const prompts = {
    blog: `You are an AI writing assistant for The Mind Stylist. Your tone is warm, clear, grounded, and emotionally intelligent. You write about emotional intelligence, mindset, and personal development. Never give therapy, medical, or legal advice. Keep content actionable and relatable. Use short paragraphs, simple metaphors, and real-world examples.`,
    
    course: `You are creating course content for The Mind Stylist. Generate clear, actionable educational content about emotional intelligence and mindset work. Use the Mind Stylist voice: warm, professional, clear. No therapy claims. Focus on practical insights.`,
    
    lesson: `You are writing lesson scripts for The Mind Stylist courses. Create structured lessons with intro, teaching section, reflection questions, and summary. Keep language clear and supportive. 300-1200 words.`,
    
    audio: `You are writing scripts for guided Inner Rehearsal Sessions™. Use gentle, grounding language with slow pacing and sensory prompts. No hypnosis claims. Example style: "Take a moment to settle into your breath. Feel the weight of your body supported beneath you."`,
    
    legal: `You are helping structure legal documentation. Use precise, clear, non-emotional language. Do not provide legal advice or interpretation. Generate structure and plain language drafts only.`,
    
    devdoc: `You are creating technical documentation. Write clear, concise specs with no emotional language. Include requirements, user stories, and acceptance criteria when relevant.`,
  };
  
  return prompts[mode] || prompts.blog;
}

function getModeDescription(mode) {
  const descriptions = {
    blog: "Generate blog posts and articles in The Mind Stylist voice",
    course: "Create course outlines, modules, and educational content",
    lesson: "Draft lesson scripts and teaching materials",
    audio: "Write guided session scripts and descriptions",
    legal: "Structure legal documentation (admin only)",
    devdoc: "Create technical specs and documentation (admin only)",
  };
  
  return descriptions[mode] || "AI-powered content generation";
}