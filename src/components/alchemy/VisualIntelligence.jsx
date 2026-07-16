import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Download } from "lucide-react";

export default function VisualIntelligence() {
  const [topic, setTopic] = useState("");
  const [style, setStyle] = useState("professional and elegant");
  const [brandColors, setBrandColors] = useState("forest green, soft gold, cream");
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      alert("Please enter a topic or theme");
      return;
    }

    setLoading(true);
    try {
      const prompt = `Create a ${style} branded image for: ${topic}. 
      
Brand aesthetic: Elegant, sophisticated, emotional intelligence themed
Color palette: ${brandColors}
Style: Professional, clean, modern with serif typography accents
Mood: Empowering, calm, transformative

The image should be suitable for social media, blog headers, or marketing materials.`;

      const response = await base44.integrations.Core.GenerateImage({
        prompt: prompt
      });

      setImageUrl(response.url);
    } catch (error) {
      alert("Failed to generate image: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 shadow-md">
      <h2 className="font-serif text-2xl text-[#1E3A32] mb-6">Visual Intelligence</h2>
      
      <div className="space-y-6">
        <div>
          <Label>Topic or Theme</Label>
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Mind Styling, Emotional Intelligence, Leadership"
            className="mt-2"
          />
        </div>

        <div>
          <Label>Visual Style</Label>
          <Input
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            placeholder="e.g., professional and elegant, modern minimalist"
            className="mt-2"
          />
        </div>

        <div>
          <Label>Brand Colors</Label>
          <Input
            value={brandColors}
            onChange={(e) => setBrandColors(e.target.value)}
            placeholder="e.g., forest green, soft gold, cream"
            className="mt-2"
          />
        </div>

        <Button onClick={handleGenerate} disabled={loading} className="w-full">
          {loading ? "Generating Image..." : "Generate Branded Image"}
        </Button>

        {imageUrl && (
          <Card className="p-6">
            <div className="space-y-4">
              <img src={imageUrl} alt="Generated" className="w-full rounded-lg shadow-md" />
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.open(imageUrl, '_blank')}
                >
                  <Download size={16} className="mr-2" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigator.clipboard.writeText(imageUrl)}
                >
                  Copy URL
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}