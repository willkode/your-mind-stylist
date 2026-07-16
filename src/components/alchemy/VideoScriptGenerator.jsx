import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { trackUsage } from "@/components/utils/trackUsage";
import CreditGateBanner from "@/components/credits/CreditGateBanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Video } from "lucide-react";

export default function VideoScriptGenerator() {
  const [topic, setTopic] = useState("");
  const [keyPoints, setKeyPoints] = useState("");
  const [duration, setDuration] = useState("5");
  const [tone, setTone] = useState("professional");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleGenerate = async () => {
    if (!topic.trim()) return;

    setIsLoading(true);
    try {
      const prompt = `You are a professional video script writer. Create a detailed video script based on these parameters:

TOPIC: ${topic}
DURATION: ${duration} minutes
TONE: ${tone}
KEY POINTS TO COVER: ${keyPoints || "None specified - use your expertise"}

Create a complete video script with:
1. Hook (first 10 seconds - must grab attention)
2. Introduction (establish credibility, preview value)
3. Main content sections (break into clear segments with timing)
4. Visual suggestions for each section
5. B-roll suggestions
6. Call to action
7. Outro

Include timing markers (e.g., [0:00-0:10]) and on-screen text suggestions.
Make it conversational and natural for speaking.

Return as JSON:
{
  "title": "compelling video title",
  "hook": "first 10 seconds script",
  "intro": "introduction script",
  "sections": [
    {
      "section_title": "string",
      "timing": "0:30-2:00",
      "script": "what to say",
      "visuals": "what to show",
      "b_roll": "b-roll suggestions"
    }
  ],
  "call_to_action": "CTA script",
  "outro": "outro script",
  "total_word_count": number,
  "estimated_time": "X:XX"
}`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            hook: { type: "string" },
            intro: { type: "string" },
            sections: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  section_title: { type: "string" },
                  timing: { type: "string" },
                  script: { type: "string" },
                  visuals: { type: "string" },
                  b_roll: { type: "string" }
                }
              }
            },
            call_to_action: { type: "string" },
            outro: { type: "string" },
            total_word_count: { type: "number" },
            estimated_time: { type: "string" }
          }
        }
      });

      setResult(response);
      trackUsage({ feature: "video_script_generator", integration_type: "InvokeLLM", details: `${tone}: ${topic.substring(0, 60)}` });
    } catch (error) {
      console.error(error);
      alert("Failed to generate video script");
    }
    setIsLoading(false);
  };

  const fullScript = result ? `
${result.hook}

${result.intro}

${result.sections?.map(s => `${s.script}`).join('\n\n')}

${result.call_to_action}

${result.outro}
  `.trim() : '';

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="font-serif text-2xl text-[#1E3A32] mb-4">Video Script Generator</h2>
        <p className="text-[#2B2725]/70 mb-6">
          Generate professional video scripts with timing, visuals, and b-roll suggestions
        </p>

        <div className="space-y-4">
          <div>
            <Label>Video Topic</Label>
            <Input
              placeholder="e.g., How to Use Visualization for Emotional Regulation"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>

          <div>
            <Label>Key Points to Cover (optional)</Label>
            <Textarea
              placeholder="List the main points you want to include..."
              value={keyPoints}
              onChange={(e) => setKeyPoints(e.target.value)}
              rows={4}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Target Duration (minutes)</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 minute</SelectItem>
                  <SelectItem value="3">3 minutes</SelectItem>
                  <SelectItem value="5">5 minutes</SelectItem>
                  <SelectItem value="10">10 minutes</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="20">20 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="conversational">Conversational</SelectItem>
                  <SelectItem value="energetic">Energetic</SelectItem>
                  <SelectItem value="calm">Calm & Soothing</SelectItem>
                  <SelectItem value="educational">Educational</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <CreditGateBanner feature="video_script_generator">
            <Button
              onClick={handleGenerate}
              disabled={isLoading || !topic.trim()}
              className="w-full bg-[#1E3A32]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Script...
                </>
              ) : (
                <>
                  <Video className="mr-2 h-4 w-4" />
                  Generate Video Script
                </>
              )}
            </Button>
          </CreditGateBanner>
        </div>
      </div>

      {result && (
        <div className="space-y-4">
          {/* Meta Info */}
          <div className="bg-gradient-to-br from-[#6E4F7D] to-[#8B659B] p-6 rounded-lg text-white">
            <h3 className="font-serif text-2xl mb-4">{result.title}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm opacity-80">Estimated Time</p>
                <p className="text-xl font-bold">{result.estimated_time}</p>
              </div>
              <div>
                <p className="text-sm opacity-80">Word Count</p>
                <p className="text-xl font-bold">{result.total_word_count}</p>
              </div>
            </div>
          </div>

          {/* Hook */}
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-[#D8B46B]">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-medium text-[#D8B46B]">[0:00-0:10]</span>
              <h3 className="font-medium text-[#1E3A32]">Hook</h3>
            </div>
            <p className="text-[#2B2725]/80 whitespace-pre-wrap">{result.hook}</p>
          </div>

          {/* Intro */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="font-medium text-[#1E3A32] mb-3">Introduction</h3>
            <p className="text-[#2B2725]/80 whitespace-pre-wrap">{result.intro}</p>
          </div>

          {/* Sections */}
          {result.sections?.map((section, idx) => (
            <div key={idx} className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-medium text-[#6E4F7D]">{section.timing}</span>
                <h3 className="font-medium text-[#1E3A32]">{section.section_title}</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-[#2B2725]/60">Script</Label>
                  <p className="text-[#2B2725]/80 whitespace-pre-wrap mt-1">{section.script}</p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-[#2B2725]/60">Visuals</Label>
                    <p className="text-sm text-[#2B2725]/70 mt-1">{section.visuals}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-[#2B2725]/60">B-Roll</Label>
                    <p className="text-sm text-[#2B2725]/70 mt-1">{section.b_roll}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* CTA */}
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-[#A6B7A3]">
            <h3 className="font-medium text-[#1E3A32] mb-3">Call to Action</h3>
            <p className="text-[#2B2725]/80 whitespace-pre-wrap">{result.call_to_action}</p>
          </div>

          {/* Outro */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="font-medium text-[#1E3A32] mb-3">Outro</h3>
            <p className="text-[#2B2725]/80 whitespace-pre-wrap">{result.outro}</p>
          </div>

          {/* Export */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="font-medium text-[#1E3A32] mb-3">Full Script</h3>
            <div className="p-4 bg-[#F9F5EF] rounded border border-[#E4D9C4] max-h-96 overflow-y-auto whitespace-pre-wrap text-sm">
              {fullScript}
            </div>
            <Button
              onClick={() => navigator.clipboard.writeText(fullScript)}
              variant="outline"
              className="mt-4"
            >
              Copy Full Script
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}