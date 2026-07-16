import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { trackUsage } from "@/components/utils/trackUsage";
import CreditGateBanner from "@/components/credits/CreditGateBanner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";

export default function ScriptWriter() {
  const [topic, setTopic] = useState("");
  const [scriptType, setScriptType] = useState("blog");
  const [duration, setDuration] = useState("5");
  const [keyPoints, setKeyPoints] = useState("");
  const [loading, setLoading] = useState(false);
  const [script, setScript] = useState(null);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      alert("Please enter a topic");
      return;
    }

    setLoading(true);
    try {
      const prompts = {
        blog: `Write a compelling blog post about "${topic}". Include an engaging introduction, well-structured main content with subheadings, and a strong conclusion with call-to-action.`,
        lesson: `Create a detailed lesson script for teaching "${topic}". Include learning objectives, main teaching points, examples, exercises, and key takeaways.`,
        webinar: `Write a ${duration}-minute webinar script about "${topic}". Include opening hook, main content sections with transitions, audience engagement moments, and closing with next steps.`,
        video: `Create a ${duration}-minute video script about "${topic}". Include visual cues, speaking points, b-roll suggestions, and engagement hooks.`,
        podcast: `Write a ${duration}-minute podcast script about "${topic}". Include intro, main talking points, storytelling moments, and outro.`
      };

      let fullPrompt = prompts[scriptType];
      if (keyPoints.trim()) {
        fullPrompt += `\n\nKey points to cover:\n${keyPoints}`;
      }

      fullPrompt += `\n\nWrite in a warm, professional, and engaging tone that aligns with emotional intelligence and personal transformation. Make it conversational yet authoritative.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: fullPrompt,
        add_context_from_internet: false
      });

      setScript(response);
      trackUsage({ feature: "script_writer", integration_type: "InvokeLLM", details: `${scriptType}: ${topic.substring(0, 60)}` });
    } catch (error) {
      alert("Failed to generate script: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 shadow-md">
      <h2 className="font-serif text-2xl text-[#1E3A32] mb-6">Script Writer</h2>
      
      <div className="space-y-6">
        <div>
          <Label>Topic</Label>
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Overcoming Self-Doubt Through Mind Styling"
            className="mt-2"
          />
        </div>

        <div>
          <Label>Script Type</Label>
          <Select value={scriptType} onValueChange={setScriptType}>
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="blog">Blog Post</SelectItem>
              <SelectItem value="lesson">Course Lesson</SelectItem>
              <SelectItem value="webinar">Webinar</SelectItem>
              <SelectItem value="video">Video Script</SelectItem>
              <SelectItem value="podcast">Podcast Episode</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {["webinar", "video", "podcast"].includes(scriptType) && (
          <div>
            <Label>Duration (minutes)</Label>
            <Input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="mt-2"
            />
          </div>
        )}

        <div>
          <Label>Key Points to Cover (Optional)</Label>
          <Textarea
            value={keyPoints}
            onChange={(e) => setKeyPoints(e.target.value)}
            placeholder="Enter specific points, stories, or concepts you want included..."
            rows={4}
            className="mt-2"
          />
        </div>

        <CreditGateBanner feature="script_writer">
          <Button onClick={handleGenerate} disabled={loading} className="w-full">
            {loading ? "Writing Script..." : "Generate Script"}
          </Button>
        </CreditGateBanner>

        {script && (
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-[#1E3A32]">Your Script</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigator.clipboard.writeText(script)}
                >
                  Copy Script
                </Button>
              </div>
              <div className="bg-[#F9F5EF] p-6 rounded whitespace-pre-wrap max-h-96 overflow-y-auto">
                {script}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}