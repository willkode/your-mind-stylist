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

export default function LeadMagnetGenerator() {
  const [topic, setTopic] = useState("");
  const [type, setType] = useState("checklist");
  const [audience, setAudience] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleGenerate = async () => {
    if (!topic.trim() || !audience.trim()) {
      alert("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const prompts = {
        checklist: `Create a comprehensive checklist for "${topic}" targeted at ${audience}. Include 10-15 actionable items with brief explanations.`,
        worksheet: `Create a detailed worksheet for "${topic}" for ${audience}. Include reflection questions, exercises, and space for notes.`,
        guide: `Create a step-by-step guide for "${topic}" for ${audience}. Include 5-7 major steps with detailed explanations and examples.`,
        template: `Create a practical template for "${topic}" for ${audience}. Include sections, prompts, and instructions for use.`
      };

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${prompts[type]}

Format this as a professional, branded lead magnet with:
- An engaging title
- Introduction explaining the value
- Well-organized main content
- Clear sections and headers
- Actionable, practical information
- Professional tone aligned with emotional intelligence and mind styling

The output should be ready to format as a PDF.`,
        add_context_from_internet: false
      });

      setResult(response);
      trackUsage({ feature: "lead_magnet_generator", integration_type: "InvokeLLM", details: `${type}: ${topic.substring(0, 60)}` });
    } catch (error) {
      alert("Failed to generate lead magnet: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 shadow-md">
      <h2 className="font-serif text-2xl text-[#1E3A32] mb-6">Lead Magnet Generator</h2>
      
      <div className="space-y-6">
        <div>
          <Label>Lead Magnet Topic</Label>
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., 5-Minute Daily Mind Styling Practice"
            className="mt-2"
          />
        </div>

        <div>
          <Label>Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="checklist">Checklist</SelectItem>
              <SelectItem value="worksheet">Worksheet</SelectItem>
              <SelectItem value="guide">Step-by-Step Guide</SelectItem>
              <SelectItem value="template">Template</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Target Audience</Label>
          <Input
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder="e.g., busy professionals, leaders, parents"
            className="mt-2"
          />
        </div>

        <CreditGateBanner feature="lead_magnet_generator">
          <Button onClick={handleGenerate} disabled={loading} className="w-full">
            {loading ? "Generating..." : "Generate Lead Magnet"}
          </Button>
        </CreditGateBanner>

        {result && (
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-[#1E3A32]">Your Lead Magnet</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigator.clipboard.writeText(result)}
                >
                  Copy Content
                </Button>
              </div>
              <div className="bg-[#F9F5EF] p-6 rounded whitespace-pre-wrap max-h-96 overflow-y-auto">
                {result}
              </div>
              <p className="text-sm text-[#2B2725]/60">
                Copy this content and format it in Canva, Google Docs, or your preferred design tool to create your PDF lead magnet.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}