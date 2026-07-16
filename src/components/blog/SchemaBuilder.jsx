import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Download, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function SchemaBuilder({ blogContent }) {
  const [schemaType, setSchemaType] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const schemaTypes = [
    {
      id: "process",
      name: "Process Flow",
      icon: "🔄",
      description: "Step-by-step transformation journey"
    },
    {
      id: "framework",
      name: "Concept Framework",
      icon: "🎯",
      description: "Visual model of key concepts"
    },
    {
      id: "decision",
      name: "Decision Tree",
      icon: "🌳",
      description: "Choice pathways and outcomes"
    },
    {
      id: "relationship",
      name: "Relationship Map",
      icon: "🔗",
      description: "How elements connect and interact"
    }
  ];

  const generateSchema = async (type) => {
    setLoading(true);
    setSchemaType(type);
    setGeneratedImage(null);

    const schemaPrompts = {
      process: `Create a clean, professional process flow diagram showing the transformation journey described in this blog post. Use arrows, boxes, and clear labels. Minimal text, maximum visual clarity. Style: modern infographic, professional coaching aesthetic, using soft colors (forest green, gold, cream, sage).`,
      framework: `Create a visual concept framework diagram that maps out the key ideas and their relationships from this blog post. Use circles, connecting lines, and hierarchical arrangement. Style: thought leadership diagram, clean and elegant, using muted professional colors.`,
      decision: `Create a decision tree diagram showing the pathways, choices, and outcomes discussed in this blog post. Use branching structure with clear decision points and outcomes. Style: clear coaching diagram, professional and approachable, soft color palette.`,
      relationship: `Create a relationship map showing how different concepts, emotions, or elements connect and influence each other based on this blog post. Use nodes and connecting lines with labels. Style: systems thinking diagram, elegant and professional.`
    };

    try {
      const contentText = blogContent.content.replace(/<[^>]*>/g, '').substring(0, 1500);
      
      const { url } = await base44.integrations.Core.GenerateImage({
        prompt: `${schemaPrompts[type]}

Blog Title: ${blogContent.title}
Category: ${blogContent.category}
Key Content: ${contentText}

Create a professional diagram that visualizes these concepts. Use clear labels, clean lines, and a professional aesthetic that matches a premium coaching brand. The diagram should be easy to understand at a glance. Avoid clutter. Use a cream or white background with forest green, gold, and sage accent colors.`
      });

      setGeneratedImage(url);
    } catch (error) {
      console.error("Error generating schema:", error);
      setGeneratedImage("error");
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = () => {
    if (!generatedImage || generatedImage === "error") return;
    
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `${blogContent.slug || 'schema'}-${schemaType}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyImageUrl = () => {
    if (generatedImage && generatedImage !== "error") {
      navigator.clipboard.writeText(generatedImage);
    }
  };

  if (!blogContent.title || !blogContent.content) {
    return (
      <div className="text-center py-12">
        <p className="text-[#2B2725]/60 text-sm mb-2">No blog content yet</p>
        <p className="text-[#2B2725]/40 text-xs">Add a title and content to create visual frameworks</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium text-[#1E3A32] mb-3">Choose Framework Type</h3>
        <div className="grid grid-cols-2 gap-3">
          {schemaTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => generateSchema(type.id)}
              disabled={loading}
              className={`p-4 border rounded-lg text-left transition-all hover:shadow-md ${
                schemaType === type.id ? 'border-[#D8B46B] bg-[#D8B46B]/5' : 'border-[#E4D9C4]'
              }`}
            >
              <div className="text-2xl mb-2">{type.icon}</div>
              <div className="font-medium text-sm text-[#1E3A32] mb-1">{type.name}</div>
              <div className="text-xs text-[#2B2725]/60">{type.description}</div>
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="bg-[#F9F5EF] p-8 rounded-lg text-center">
          <Loader2 size={40} className="text-[#D8B46B] animate-spin mx-auto mb-4" />
          <p className="text-[#2B2725]/70 text-sm mb-2">Crafting your visual framework...</p>
          <p className="text-[#2B2725]/50 text-xs">This takes about 10-15 seconds</p>
        </div>
      )}

      {generatedImage && generatedImage !== "error" && !loading && (
        <div className="space-y-4">
          <div className="relative">
            <img 
              src={generatedImage} 
              alt={`${schemaType} schema`}
              className="w-full rounded-lg border border-[#E4D9C4]"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={downloadImage}
              variant="outline"
              className="flex-1"
            >
              <Download size={16} className="mr-2" />
              Download
            </Button>
            <Button
              onClick={copyImageUrl}
              variant="outline"
              className="flex-1"
            >
              Copy URL
            </Button>
          </div>

          <Button
            onClick={() => generateSchema(schemaType)}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <RefreshCw size={16} className="mr-2" />
            Regenerate
          </Button>

          <div className="bg-[#A6B7A3]/10 p-4 rounded-lg">
            <p className="text-xs text-[#2B2725]/70 leading-relaxed">
              💡 <strong>Pro tip:</strong> Use these visual frameworks in your blog posts, social media, presentations, or course materials. They help readers grasp complex concepts at a glance.
            </p>
          </div>
        </div>
      )}

      {generatedImage === "error" && !loading && (
        <div className="bg-red-50 p-6 rounded-lg text-center">
          <p className="text-red-600 text-sm mb-3">Error generating visual framework</p>
          <Button
            onClick={() => generateSchema(schemaType)}
            variant="outline"
            size="sm"
          >
            <Sparkles size={16} className="mr-2" />
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}