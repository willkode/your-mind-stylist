import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { trackUsage } from "@/components/utils/trackUsage";
import CreditGateBanner from "@/components/credits/CreditGateBanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";

export default function PocketScriptGenerator() {
  const [theme, setTheme] = useState("");
  const [category, setCategory] = useState("calm");
  const [duration, setDuration] = useState("10");
  const [loading, setLoading] = useState(false);
  const [script, setScript] = useState(null);

  const handleGenerate = async () => {
    if (!theme.trim()) {
      alert("Please enter a theme");
      return;
    }

    setLoading(true);
    try {
      const categoryDescriptions = {
        calm: "calming the nervous system and creating inner peace",
        confidence: "building confidence and strengthening identity",
        clarity: "gaining clarity and making decisions",
        release: "emotional release and letting go",
        performance: "performance preparation and peak state",
        recovery: "rest, recovery, and restoration"
      };

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Write a ${duration}-minute Pocket Visualization™ audio script on the theme: "${theme}"

Category: ${category} - ${categoryDescriptions[category]}

Requirements:
- Approximately ${duration} minutes when read aloud at a calm pace
- Opening: Brief welcome and settling in (30 seconds)
- Main body: Guided visualization using mind styling language (${duration - 2} minutes)
- Closing: Integration and return to awareness (1 minute)

Language style:
- Second person ("you")
- Present tense and sensory
- Hypnotic, flowing, rhythmic
- Inclusive of mind styling principles
- Gentle, warm, authoritative
- Pause markers: [pause 3 seconds]

Create a script that guides someone through a transformative inner experience focused on ${theme}.`,
        add_context_from_internet: false
      });

      setScript(response);
      trackUsage({ feature: "pocket_script_generator", integration_type: "InvokeLLM", details: `${category}: ${theme.substring(0, 60)}` });
    } catch (error) {
      alert("Failed to generate script: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 shadow-md">
      <h2 className="font-serif text-2xl text-[#1E3A32] mb-6">Pocket Visualization™ Script Generator</h2>
      
      <div className="space-y-6">
        <div>
          <Label>Theme/Focus</Label>
          <Input
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="e.g., Releasing Self-Doubt, Confident Leadership, Deep Rest"
            className="mt-2"
          />
        </div>

        <div>
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="calm">Calm & Nervous System Resets</SelectItem>
              <SelectItem value="confidence">Confidence & Identity</SelectItem>
              <SelectItem value="clarity">Clarity & Decisions</SelectItem>
              <SelectItem value="release">Emotional Release</SelectItem>
              <SelectItem value="performance">Performance Prep</SelectItem>
              <SelectItem value="recovery">Rest & Recovery</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Duration (minutes)</Label>
          <Input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            min="5"
            max="30"
            className="mt-2"
          />
        </div>

        <CreditGateBanner feature="pocket_script_generator">
          <Button onClick={handleGenerate} disabled={loading} className="w-full">
            {loading ? "Generating Script..." : "Generate Pocket Script"}
          </Button>
        </CreditGateBanner>

        {script && (
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-[#1E3A32]">Your Pocket Visualization™ Script</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigator.clipboard.writeText(script)}
                >
                  Copy Script
                </Button>
              </div>
              <div className="bg-[#F9F5EF] p-6 rounded whitespace-pre-wrap max-h-96 overflow-y-auto font-serif leading-relaxed">
                {script}
              </div>
              <p className="text-sm text-[#2B2725]/60">
                Record this script with your voice, add calming background music, and upload as a new Pocket Visualization™ track.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}