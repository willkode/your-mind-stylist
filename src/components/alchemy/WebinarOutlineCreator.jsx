import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { trackUsage } from "@/components/utils/trackUsage";
import CreditGateBanner from "@/components/credits/CreditGateBanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Presentation } from "lucide-react";

export default function WebinarOutlineCreator() {
  const [title, setTitle] = useState("");
  const [audience, setAudience] = useState("");
  const [goal, setGoal] = useState("");
  const [duration, setDuration] = useState("60");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleGenerate = async () => {
    if (!title.trim() || !audience.trim()) return;

    setIsLoading(true);
    try {
      const prompt = `You are an expert webinar strategist. Create a detailed, conversion-focused webinar outline.

WEBINAR TITLE: ${title}
TARGET AUDIENCE: ${audience}
PRIMARY GOAL: ${goal || "educate and inspire"}
DURATION: ${duration} minutes

Create a complete webinar structure with:
1. Pre-webinar setup (tech check, slide preparation)
2. Hook (first 2 minutes - why they should stay)
3. Introduction (establish credibility, set expectations)
4. Content sections with timing (teach valuable content)
5. Engagement moments (polls, Q&A breaks, exercises)
6. Offer/CTA section (if applicable)
7. Q&A strategy
8. Closing and next steps
9. Slide suggestions for each section
10. Key talking points

Make it audience-focused and value-packed.

Return as JSON:
{
  "webinar_title": "string",
  "tagline": "compelling one-liner",
  "pre_webinar": {
    "tech_checklist": ["array"],
    "slides_needed": number,
    "prep_notes": "string"
  },
  "sections": [
    {
      "section_name": "string",
      "timing": "0:00-5:00",
      "objectives": ["what you'll achieve"],
      "talking_points": ["key points to cover"],
      "slides": ["slide descriptions"],
      "engagement": "how to engage audience",
      "transitions": "how to transition to next section"
    }
  ],
  "engagement_strategy": {
    "polls": ["poll ideas"],
    "exercises": ["interactive moments"],
    "q_and_a_timing": "when to do Q&A"
  },
  "offer_section": {
    "timing": "string",
    "positioning": "how to present offer naturally",
    "cta": "specific call to action"
  },
  "closing": "how to end strong",
  "follow_up": ["post-webinar actions"]
}`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            webinar_title: { type: "string" },
            tagline: { type: "string" },
            pre_webinar: {
              type: "object",
              properties: {
                tech_checklist: { type: "array", items: { type: "string" } },
                slides_needed: { type: "number" },
                prep_notes: { type: "string" }
              }
            },
            sections: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  section_name: { type: "string" },
                  timing: { type: "string" },
                  objectives: { type: "array", items: { type: "string" } },
                  talking_points: { type: "array", items: { type: "string" } },
                  slides: { type: "array", items: { type: "string" } },
                  engagement: { type: "string" },
                  transitions: { type: "string" }
                }
              }
            },
            engagement_strategy: {
              type: "object",
              properties: {
                polls: { type: "array", items: { type: "string" } },
                exercises: { type: "array", items: { type: "string" } },
                q_and_a_timing: { type: "string" }
              }
            },
            offer_section: {
              type: "object",
              properties: {
                timing: { type: "string" },
                positioning: { type: "string" },
                cta: { type: "string" }
              }
            },
            closing: { type: "string" },
            follow_up: { type: "array", items: { type: "string" } }
          }
        }
      });

      setResult(response);
      trackUsage({ feature: "webinar_outline_creator", integration_type: "InvokeLLM", details: `${duration}min: ${title.substring(0, 60)}` });
    } catch (error) {
      console.error(error);
      alert("Failed to generate webinar outline");
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="font-serif text-2xl text-[#1E3A32] mb-4">Webinar Outline Creator</h2>
        <p className="text-[#2B2725]/70 mb-6">
          Design a conversion-focused webinar with timing, engagement strategies, and slide suggestions
        </p>

        <div className="space-y-4">
          <div>
            <Label>Webinar Title/Topic</Label>
            <Input
              placeholder="e.g., The Mind Styling Method: Transform Your Emotional Patterns"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <Label>Target Audience</Label>
            <Input
              placeholder="e.g., Leaders struggling with emotional overwhelm"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
            />
          </div>

          <div>
            <Label>Primary Goal</Label>
            <Textarea
              placeholder="What do you want attendees to learn, feel, or do?"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <Label>Duration (minutes)</Label>
            <Input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              min="30"
              max="120"
            />
          </div>

          <CreditGateBanner feature="webinar_outline_creator">
            <Button
              onClick={handleGenerate}
              disabled={isLoading || !title.trim() || !audience.trim()}
              className="w-full bg-[#1E3A32]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Outline...
                </>
              ) : (
                <>
                  <Presentation className="mr-2 h-4 w-4" />
                  Generate Webinar Outline
                </>
              )}
            </Button>
          </CreditGateBanner>
        </div>
      </div>

      {result && (
        <div className="space-y-4">
          {/* Title Card */}
          <div className="bg-gradient-to-br from-[#1E3A32] to-[#2B4A40] p-8 rounded-lg text-white">
            <h3 className="font-serif text-3xl mb-2">{result.webinar_title}</h3>
            <p className="text-lg opacity-90">{result.tagline}</p>
          </div>

          {/* Pre-Webinar Prep */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="font-medium text-[#1E3A32] mb-4">Pre-Webinar Preparation</h3>
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-[#2B2725]/60">Slides Needed</Label>
                <p className="text-2xl font-bold text-[#D8B46B]">{result.pre_webinar?.slides_needed}</p>
              </div>
              <div>
                <Label className="text-xs text-[#2B2725]/60 mb-2 block">Tech Checklist</Label>
                <ul className="space-y-2">
                  {result.pre_webinar?.tech_checklist?.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[#D8B46B]">□</span>
                      <span className="text-[#2B2725]/80">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <Label className="text-xs text-[#2B2725]/60">Prep Notes</Label>
                <p className="text-[#2B2725]/80 mt-1">{result.pre_webinar?.prep_notes}</p>
              </div>
            </div>
          </div>

          {/* Sections */}
          {result.sections?.map((section, idx) => (
            <div key={idx} className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-sm font-medium text-[#6E4F7D] bg-[#6E4F7D]/10 px-3 py-1 rounded">
                  {section.timing}
                </span>
                <h3 className="font-medium text-[#1E3A32] text-lg">{section.section_name}</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-[#2B2725]/60 mb-2 block">Objectives</Label>
                  <ul className="space-y-1">
                    {section.objectives?.map((obj, i) => (
                      <li key={i} className="text-sm text-[#2B2725]/80">✓ {obj}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <Label className="text-xs text-[#2B2725]/60 mb-2 block">Talking Points</Label>
                  <ul className="space-y-1">
                    {section.talking_points?.map((point, i) => (
                      <li key={i} className="text-sm text-[#2B2725]/80">• {point}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <Label className="text-xs text-[#2B2725]/60 mb-2 block">Slides</Label>
                  <div className="space-y-2">
                    {section.slides?.map((slide, i) => (
                      <div key={i} className="p-3 bg-[#F9F5EF] rounded border border-[#E4D9C4] text-sm">
                        Slide {i + 1}: {slide}
                      </div>
                    ))}
                  </div>
                </div>

                {section.engagement && (
                  <div className="p-4 bg-[#D8B46B]/10 rounded">
                    <Label className="text-xs text-[#2B2725]/60 block mb-1">Engagement Moment</Label>
                    <p className="text-sm text-[#2B2725]/80">{section.engagement}</p>
                  </div>
                )}

                {section.transitions && (
                  <div className="text-xs text-[#2B2725]/60 italic">
                    Transition: {section.transitions}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Engagement Strategy */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="font-medium text-[#1E3A32] mb-4">Engagement Strategy</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label className="text-xs text-[#2B2725]/60 mb-2 block">Polls</Label>
                <ul className="space-y-2">
                  {result.engagement_strategy?.polls?.map((poll, idx) => (
                    <li key={idx} className="text-sm text-[#2B2725]/80">📊 {poll}</li>
                  ))}
                </ul>
              </div>
              <div>
                <Label className="text-xs text-[#2B2725]/60 mb-2 block">Interactive Exercises</Label>
                <ul className="space-y-2">
                  {result.engagement_strategy?.exercises?.map((ex, idx) => (
                    <li key={idx} className="text-sm text-[#2B2725]/80">✏️ {ex}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-4 p-3 bg-[#F9F5EF] rounded">
              <Label className="text-xs text-[#2B2725]/60">Q&A Timing</Label>
              <p className="text-sm text-[#2B2725]/80 mt-1">{result.engagement_strategy?.q_and_a_timing}</p>
            </div>
          </div>

          {/* Offer Section */}
          <div className="bg-gradient-to-br from-[#D8B46B]/20 to-[#A6B7A3]/20 p-6 rounded-lg border-2 border-[#D8B46B]">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm font-medium text-[#D8B46B]">{result.offer_section?.timing}</span>
              <h3 className="font-medium text-[#1E3A32]">Offer / Call to Action</h3>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-[#2B2725]/60">Positioning</Label>
                <p className="text-[#2B2725]/80 mt-1">{result.offer_section?.positioning}</p>
              </div>
              <div>
                <Label className="text-xs text-[#2B2725]/60">Call to Action</Label>
                <p className="text-[#1E3A32] font-medium mt-1">{result.offer_section?.cta}</p>
              </div>
            </div>
          </div>

          {/* Closing */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="font-medium text-[#1E3A32] mb-3">Closing</h3>
            <p className="text-[#2B2725]/80 whitespace-pre-wrap">{result.closing}</p>
          </div>

          {/* Follow-up */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="font-medium text-[#1E3A32] mb-3">Post-Webinar Follow-up</h3>
            <ul className="space-y-2">
              {result.follow_up?.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-[#D8B46B]">→</span>
                  <span className="text-[#2B2725]/80">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}