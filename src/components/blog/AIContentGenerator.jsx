import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, Copy, ArrowRight, Mic, ListOrdered } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { trackUsage } from "@/components/utils/trackUsage";
import CreditGateBanner from "@/components/credits/CreditGateBanner";

const LENGTH_OPTIONS = [
  { value: "short", label: "Short (800–1,200 words)", words: "800-1200" },
  { value: "medium", label: "Medium (1,500–2,000 words)", words: "1500-2000" },
  { value: "long", label: "Long (2,500–3,500 words) — SEO", words: "2500-3500" },
];

export default function AIContentGenerator({ onInsert }) {
  const [prompt, setPrompt] = useState("");
  const [outline, setOutline] = useState("");
  const [showOutline, setShowOutline] = useState(false);
  const [contentType, setContentType] = useState("paragraph");
  const [length, setLength] = useState("long");
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");

  const { data: voiceProfiles = [] } = useQuery({
    queryKey: ['voiceProfiles'],
    queryFn: () => base44.entities.VoiceProfile.filter({ active: true })
  });

  const defaultVoice = voiceProfiles.find(p => p.is_default);

  const contentTypes = [
    { value: "full", label: "Full Blog Post", prompt: "Write a complete, engaging blog post about: ", fullPost: true },
    { value: "outline", label: "Blog Outline", prompt: "Create a detailed outline for a blog post about: " },
    { value: "title", label: "Title Ideas", prompt: "Generate 5 compelling blog post titles about: " },
    { value: "paragraph", label: "Paragraph", prompt: "Write a compelling blog paragraph about: " },
    { value: "intro", label: "Opening Hook", prompt: "Write an engaging opening paragraph that hooks the reader for a blog post about: " },
    { value: "conclusion", label: "Conclusion", prompt: "Write a powerful conclusion for a blog post about: " },
    { value: "section", label: "Section", prompt: "Write a detailed section for a blog post about: " },
    { value: "list", label: "Bullet List", prompt: "Create a bullet list of key points about: " },
    { value: "story", label: "Story/Example", prompt: "Write a relatable story or example about: " },
    { value: "quote", label: "Pull Quote", prompt: "Create a memorable, quotable statement about: " },
  ];

  const isFullPost = contentType === "full";

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setGenerating(true);
    try {
      const selectedType = contentTypes.find(t => t.value === contentType);
      const selectedLength = LENGTH_OPTIONS.find(l => l.value === length);

      let styleInstructions = "Style: Mind Styling voice - calm, intelligent, introspective, identity-focused. Write for emotional intelligence and personal transformation. Keep it grounded, not fluffy.";

      if (defaultVoice) {
        styleInstructions = `Style Guidelines:
${defaultVoice.writing_rules}

Tone: ${defaultVoice.tone_descriptors?.join(", ")}
Formality: ${defaultVoice.formality_level}
Perspective: ${defaultVoice.perspective}
Sentence Structure: ${defaultVoice.sentence_structure}
${defaultVoice.use_contractions ? "Use contractions (I'm, you're, etc.)" : "Avoid contractions"}
${defaultVoice.vocabulary_preferences ? `\nVocabulary: ${defaultVoice.vocabulary_preferences}` : ""}
${defaultVoice.example_text ? `\n\nExample of the desired writing style:\n${defaultVoice.example_text.substring(0, 500)}` : ""}`;
      }

      let fullPrompt = `${selectedType.prompt}${prompt}
${outline.trim() ? `\n\nFollow this outline provided by the author:\n${outline.trim()}\n` : ""}
${styleInstructions}

CRITICAL: Output HTML formatted content using these tags:
- Use <h2> for main headings (NOT h1)
- Use <h3> for subheadings
- Use <p> for paragraphs
- Use <ul> and <li> for bullet lists
- Use <strong> for emphasis
- Use <em> for italics

Apply these inline styles:
- h2: style="font-family: 'Playfair Display', serif; font-size: 2rem; color: #1E3A32; margin-top: 2rem; margin-bottom: 1rem; font-weight: 600;"
- h3: style="font-family: 'Playfair Display', serif; font-size: 1.5rem; color: #1E3A32; margin-top: 1.5rem; margin-bottom: 0.75rem; font-weight: 600;"
- p: style="color: rgba(43, 39, 37, 0.8); font-size: 1.125rem; line-height: 1.75; margin-bottom: 1.5rem;"
- ul: style="margin-left: 1.5rem; margin-bottom: 1.5rem;"
- li: style="color: rgba(43, 39, 37, 0.8); font-size: 1.125rem; line-height: 1.75; margin-bottom: 0.5rem;"`;

      if (selectedType.fullPost) {
        fullPrompt += `

Include:
- Engaging opening hook
- Clear sections with subheadings (at least 5-6 sections for long posts)
- Practical insights, examples, and actionable advice
- Strong conclusion with a clear call to action
- Target word count: ${selectedLength.words} words — aim for the higher end
- SEO: naturally weave the topic keywords throughout`;
      }

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: fullPrompt,
      });

      // Strip markdown code fences if the LLM wraps content in ```html ... ```
      const cleaned = response.replace(/^```html\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
      setGeneratedContent(cleaned);
      trackUsage({ feature: "blog_content_generator", integration_type: "InvokeLLM", details: `${contentType}: ${prompt.substring(0, 80)}` });
    } catch (error) {
      console.error("Error generating content:", error);
    } finally {
      setGenerating(false);
    }
  };

  const handleInsert = () => {
    if (generatedContent) {
      onInsert(generatedContent);
      setGeneratedContent("");
      setPrompt("");
      setOutline("");
    }
  };

  return (
    <div className="space-y-4">
      {defaultVoice && (
        <div className="bg-[#FFF9F0] border border-[#D8B46B]/30 p-3 rounded flex items-center gap-2">
          <Mic size={16} className="text-[#D8B46B]" />
          <span className="text-sm text-[#2B2725]/80">
            Using voice: <strong>{defaultVoice.profile_name}</strong>
          </span>
        </div>
      )}

      <div>
        <Label className="mb-2 block">What do you want to write about?</Label>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="E.g., How imposter syndrome affects decision-making..."
          rows={3}
        />
      </div>

      <div>
        <Label className="mb-2 block">Content Type</Label>
        <Select value={contentType} onValueChange={setContentType}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {contentTypes.map(type => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isFullPost && (
        <div>
          <Label className="mb-2 block">Post Length</Label>
          <Select value={length} onValueChange={setLength}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LENGTH_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Outline Section */}
      <div>
        <button
          type="button"
          onClick={() => setShowOutline(!showOutline)}
          className="flex items-center gap-2 text-sm text-[#6E4F7D] hover:text-[#5A3F67] font-medium"
        >
          <ListOrdered size={16} />
          {showOutline ? "Hide outline" : "Provide an outline (optional)"}
        </button>
        {showOutline && (
          <div className="mt-2">
            <Textarea
              value={outline}
              onChange={(e) => setOutline(e.target.value)}
              placeholder={`Paste your outline here. E.g.:\n1. Introduction — hook about self-doubt\n2. What is imposter syndrome?\n3. The 5 hidden ways it shows up\n4. Mind Styling technique: Identity Anchoring\n5. Conclusion`}
              rows={7}
              className="font-mono text-sm"
            />
            <p className="text-xs text-[#2B2725]/50 mt-1">The AI will follow this structure when generating the post.</p>
          </div>
        )}
      </div>

      <CreditGateBanner feature="blog_content_generator">
        <Button
          onClick={handleGenerate}
          disabled={!prompt.trim() || generating}
          className="w-full bg-[#6E4F7D] hover:bg-[#5A3F67]"
        >
          {generating ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              Generating... (longer posts may take a moment)
            </>
          ) : (
            <>
              <Sparkles size={16} className="mr-2" />
              Generate Content
            </>
          )}
        </Button>
      </CreditGateBanner>

      {generatedContent && (
        <div className="border border-[#D8B46B]/30 rounded-lg p-4 bg-[#F9F5EF]">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm text-[#2B2725]/60">Generated Content</Label>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigator.clipboard.writeText(generatedContent)}
            >
              <Copy size={14} className="mr-1" />
              Copy
            </Button>
          </div>
          <div
            className="prose prose-sm max-w-none mb-4 text-[#2B2725] bg-white p-4 rounded border border-[#E4D9C4] max-h-96 overflow-y-auto"
            dangerouslySetInnerHTML={{ __html: generatedContent }}
          />
          <Button onClick={handleInsert} className="w-full bg-[#1E3A32]">
            <ArrowRight size={16} className="mr-2" />
            Insert into Editor
          </Button>
        </div>
      )}
    </div>
  );
}