import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Download, Loader2, FileText, CheckSquare, BookOpen, Lightbulb } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { jsPDF } from "jspdf";

export default function LeadMagnetGenerator({ blogContent }) {
  const [magnetType, setMagnetType] = useState(null);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [customTitle, setCustomTitle] = useState("");

  const magnetTypes = [
    {
      id: "guide",
      name: "PDF Guide",
      icon: FileText,
      description: "Comprehensive guide on this topic",
      prompt: `Transform this blog post into a detailed, actionable PDF guide. Structure it with:
- An engaging introduction
- 5-7 key sections with clear headings
- Actionable steps and practical examples
- A "What to Do Next" conclusion
Make it feel like a premium resource someone would pay for.`
    },
    {
      id: "worksheet",
      name: "Reflection Worksheet",
      icon: CheckSquare,
      description: "Interactive exercises and prompts",
      prompt: `Create a powerful reflection worksheet based on this content. Include:
- 8-10 thought-provoking questions
- Journaling prompts for deeper exploration
- Space for personal insights (indicate with "[Your response:]")
- Action steps to implement the concepts
Make it transformational and introspective.`
    },
    {
      id: "checklist",
      name: "Action Checklist",
      icon: Lightbulb,
      description: "Step-by-step implementation guide",
      prompt: `Create a practical action checklist from this blog post. Format as:
- Quick summary (2-3 sentences)
- 10-15 specific, actionable checkbox items
- Each item should be clear and implementable
- Group related items under subheadings if needed
Make it immediately useful and actionable.`
    },
    {
      id: "course",
      name: "Mini-Course Outline",
      icon: BookOpen,
      description: "Multi-day learning experience",
      prompt: `Design a 5-day mini-course outline based on this content. Structure:
Day 1: [Core Concept Introduction]
Day 2: [Deeper Dive]
Day 3: [Practical Application]
Day 4: [Common Challenges & Solutions]
Day 5: [Integration & Next Steps]

For each day, provide:
- Lesson title
- Key teaching points (3-4 bullets)
- Reflection question
Make it feel like a transformative journey.`
    }
  ];

  const generateLeadMagnet = async (type) => {
    setLoading(true);
    setMagnetType(type);
    setGeneratedContent(null);

    const magnetConfig = magnetTypes.find(m => m.id === type);

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${magnetConfig.prompt}

Blog Title: ${blogContent.title}
Blog Category: ${blogContent.category}
Blog Content: ${blogContent.content.replace(/<[^>]*>/g, '')}

Create this lead magnet in Roberta's voice: warm, expert, transformational, thoughtful. Make it valuable enough that people would gladly exchange their email for it.`,
      });

      setGeneratedContent(response);
      setCustomTitle(blogContent.title + " - " + magnetConfig.name);
    } catch (error) {
      console.error("Error generating lead magnet:", error);
      setGeneratedContent("error");
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - (margin * 2);
    let yPosition = margin;

    // Brand colors
    const forestGreen = [30, 58, 50];
    const softGold = [216, 180, 107];
    const cream = [249, 245, 239];

    // Header with brand colors
    doc.setFillColor(...cream);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setFillColor(...forestGreen);
    doc.rect(0, 35, pageWidth, 5, 'F');

    // Title
    doc.setFontSize(20);
    doc.setTextColor(...forestGreen);
    doc.text(customTitle || "Lead Magnet", margin, 25);

    // Subtitle
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text("by Roberta Fernandez, The Mind Stylist", margin, 32);

    yPosition = 55;

    // Content
    doc.setFontSize(11);
    doc.setTextColor(43, 39, 37);
    
    const lines = doc.splitTextToSize(generatedContent, maxWidth);
    
    lines.forEach((line) => {
      if (yPosition > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(line, margin, yPosition);
      yPosition += 7;
    });

    // Footer on last page
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text("© The Mind Stylist | www.themindstylist.com", margin, pageHeight - 10);

    // Save
    const fileName = `${blogContent.slug || 'lead-magnet'}-${magnetType}.pdf`;
    doc.save(fileName);
  };

  if (!blogContent.title || !blogContent.content) {
    return (
      <div className="text-center py-12">
        <p className="text-[#2B2725]/60 text-sm mb-2">No blog content yet</p>
        <p className="text-[#2B2725]/40 text-xs">Add a title and content to generate lead magnets</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium text-[#1E3A32] mb-3">Choose Lead Magnet Type</h3>
        <div className="space-y-3">
          {magnetTypes.map((m) => (
            <button
              key={m.id}
              onClick={() => generateLeadMagnet(m.id)}
              disabled={loading}
              className={`w-full p-4 border rounded-lg text-left transition-all hover:shadow-md ${
                magnetType === m.id ? 'border-[#D8B46B] bg-[#D8B46B]/5' : 'border-[#E4D9C4]'
              }`}
            >
              <div className="flex items-start gap-3">
                <m.icon size={20} className="text-[#D8B46B] mt-1" />
                <div>
                  <div className="font-medium text-sm text-[#1E3A32] mb-1">{m.name}</div>
                  <div className="text-xs text-[#2B2725]/60">{m.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="bg-[#F9F5EF] p-6 rounded-lg text-center">
          <Loader2 size={32} className="text-[#D8B46B] animate-spin mx-auto mb-3" />
          <p className="text-[#2B2725]/60 text-sm">
            Crafting your {magnetTypes.find(m => m.id === magnetType)?.name}...
          </p>
          <p className="text-[#2B2725]/40 text-xs mt-2">This takes 10-15 seconds</p>
        </div>
      )}

      {generatedContent && generatedContent !== "error" && !loading && (
        <div className="space-y-4">
          <div>
            <label className="text-xs text-[#2B2725]/60 mb-1 block">Customize Title</label>
            <Input
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className="border-[#E4D9C4]"
              placeholder="Lead Magnet Title"
            />
          </div>

          <div>
            <h3 className="font-medium text-[#1E3A32] mb-2">Preview</h3>
            <div className="bg-[#F9F5EF] p-6 rounded-lg max-h-[400px] overflow-y-auto">
              <div className="whitespace-pre-wrap text-[#2B2725]/80 text-sm leading-relaxed">
                {generatedContent}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={downloadPDF}
              className="flex-1 bg-[#1E3A32] hover:bg-[#2B2725]"
            >
              <Download size={16} className="mr-2" />
              Download PDF
            </Button>
            <Button
              onClick={() => generateLeadMagnet(magnetType)}
              variant="outline"
              className="flex-1"
            >
              <Sparkles size={16} className="mr-2" />
              Regenerate
            </Button>
          </div>

          <div className="bg-[#A6B7A3]/10 p-4 rounded-lg">
            <p className="text-xs text-[#2B2725]/70 leading-relaxed">
              💡 <strong>Pro tip:</strong> Use this as an email opt-in incentive, a bonus for course students, or share it on social to drive traffic to your site.
            </p>
          </div>
        </div>
      )}

      {generatedContent === "error" && !loading && (
        <div className="bg-red-50 p-6 rounded-lg text-center">
          <p className="text-red-600 text-sm mb-3">Error generating lead magnet</p>
          <Button
            onClick={() => generateLeadMagnet(magnetType)}
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