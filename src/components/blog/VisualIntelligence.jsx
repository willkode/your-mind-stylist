import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Copy, Loader2, Download } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function VisualIntelligence({ blogContent }) {
  const [visualType, setVisualType] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const visualTypes = [
    { 
      id: "cover", 
      name: "Cover Image", 
      icon: "🎨", 
      description: "Featured blog header image"
    },
    { 
      id: "quote", 
      name: "Quote Graphic", 
      icon: "💬", 
      description: "Shareable social quote"
    },
    { 
      id: "framework", 
      name: "Concept Framework", 
      icon: "🧠", 
      description: "Visual diagram of ideas"
    },
  ];

  const generateVisual = async (type) => {
    setLoading(true);
    setVisualType(type);
    setGeneratedImage(null);

    const visualPrompts = {
      cover: `Create a sophisticated, elegant cover image for a blog post titled "${blogContent.title}". 
Style: Minimalist, professional, calming. Use soft colors like cream (#F9F5EF), forest green (#1E3A32), soft gold (#D8B46B), dusty sage (#A6B7A3). 
Theme: Emotional intelligence, mindfulness, personal transformation, leadership.
Aesthetic: Clean, modern, thoughtful. No text, just imagery that evokes the feeling of the topic.`,
      
      quote: `Create a beautiful quote graphic in a minimalist style. 
Extract the most powerful, quotable sentence from this content and design it as a social media graphic.
Content: ${blogContent.content.replace(/<[^>]*>/g, '').substring(0, 500)}
Colors: Cream background (#F9F5EF), forest green text (#1E3A32), gold accent (#D8B46B).
Style: Elegant serif fonts, ample white space, sophisticated and calming. Include "- Roberta Fernandez, The Mind Stylist" attribution.`,
      
      framework: `Create a visual diagram or framework illustrating the key concepts from this blog post: "${blogContent.title}".
Content summary: ${blogContent.content.replace(/<[^>]*>/g, '').substring(0, 500)}
Style: Clean, professional diagram with arrows, circles, or connected boxes showing the relationship between ideas.
Colors: Use cream (#F9F5EF), forest green (#1E3A32), soft gold (#D8B46B), dusty sage (#A6B7A3).
Make it look like a psychology or emotional intelligence framework - thoughtful, clear, easy to understand.`,
    };

    try {
      const response = await base44.integrations.Core.GenerateImage({
        prompt: visualPrompts[type],
      });

      setGeneratedImage(response.url);
    } catch (error) {
      console.error("Error generating image:", error);
      setGeneratedImage("error");
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = () => {
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `${blogContent.slug || 'blog'}-${visualType}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!blogContent.title || !blogContent.content) {
    return (
      <div className="text-center py-12">
        <p className="text-[#2B2725]/60 text-sm mb-2">No blog content yet</p>
        <p className="text-[#2B2725]/40 text-xs">Add a title and content to start creating visuals</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium text-[#1E3A32] mb-3">Choose Visual Type</h3>
        <div className="space-y-3">
          {visualTypes.map((v) => (
            <button
              key={v.id}
              onClick={() => generateVisual(v.id)}
              disabled={loading}
              className={`w-full p-4 border rounded-lg text-left transition-all hover:shadow-md ${
                visualType === v.id ? 'border-[#D8B46B] bg-[#D8B46B]/5' : 'border-[#E4D9C4]'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">{v.icon}</div>
                <div>
                  <div className="font-medium text-sm text-[#1E3A32] mb-1">{v.name}</div>
                  <div className="text-xs text-[#2B2725]/60">{v.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="bg-[#F9F5EF] p-6 rounded-lg text-center">
          <Loader2 size={32} className="text-[#D8B46B] animate-spin mx-auto mb-3" />
          <p className="text-[#2B2725]/60 text-sm">Crafting your {visualTypes.find(v => v.id === visualType)?.name}...</p>
          <p className="text-[#2B2725]/40 text-xs mt-2">This may take 5-10 seconds</p>
        </div>
      )}

      {generatedImage && generatedImage !== "error" && !loading && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-[#1E3A32]">Your {visualTypes.find(v => v.id === visualType)?.name}</h3>
            <Button
              size="sm"
              variant="outline"
              onClick={downloadImage}
              className="gap-2"
            >
              <Download size={16} />
              Download
            </Button>
          </div>
          <div className="bg-[#F9F5EF] p-4 rounded-lg">
            <img 
              src={generatedImage} 
              alt="Generated visual" 
              className="w-full rounded-lg shadow-md"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => generateVisual(visualType)}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Sparkles size={16} className="mr-2" />
              Regenerate
            </Button>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(generatedImage);
              }}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Copy size={16} className="mr-2" />
              Copy URL
            </Button>
          </div>
        </div>
      )}

      {generatedImage === "error" && !loading && (
        <div className="bg-red-50 p-6 rounded-lg text-center">
          <p className="text-red-600 text-sm mb-3">Error generating image</p>
          <Button
            onClick={() => generateVisual(visualType)}
            variant="outline"
            size="sm"
          >
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}