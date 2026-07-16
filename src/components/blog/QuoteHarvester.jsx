import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Sparkles, Loader2, Quote, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";
import html2canvas from "html2canvas";

export default function QuoteHarvester({ blogContent }) {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState("minimal");

  const templates = [
    {
      id: "minimal",
      name: "Minimal",
      bg: "linear-gradient(135deg, #1E3A32 0%, #2B4A40 100%)",
      textColor: "#F9F5EF",
      accentColor: "#D8B46B"
    },
    {
      id: "gold",
      name: "Gold Elegance",
      bg: "linear-gradient(135deg, #D8B46B 0%, #C9A15B 100%)",
      textColor: "#1E3A32",
      accentColor: "#F9F5EF"
    },
    {
      id: "cream",
      name: "Soft Cream",
      bg: "linear-gradient(135deg, #F9F5EF 0%, #E4D9C4 100%)",
      textColor: "#1E3A32",
      accentColor: "#D8B46B"
    },
    {
      id: "sage",
      name: "Dusty Sage",
      bg: "linear-gradient(135deg, #A6B7A3 0%, #8FA18C 100%)",
      textColor: "#1E3A32",
      accentColor: "#F9F5EF"
    }
  ];

  const extractQuotes = async () => {
    setLoading(true);
    setQuotes([]);
    setSelectedQuote(null);

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Extract 5-7 powerful, shareable quotes from this blog post. Choose quotes that:
- Are complete thoughts (20-80 words)
- Stand alone without context
- Are inspiring, thought-provoking, or transformational
- Capture Roberta's voice and wisdom
- Would make people pause and think
- Are perfect for social media sharing

Blog Title: ${blogContent.title}
Blog Content: ${blogContent.content.replace(/<[^>]*>/g, '')}

Return ONLY the quotes as an array of strings. No explanations, just the quotes.`,
        response_json_schema: {
          type: "object",
          properties: {
            quotes: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      setQuotes(response.quotes);
      if (response.quotes.length > 0) {
        setSelectedQuote(response.quotes[0]);
      }
    } catch (error) {
      console.error("Error extracting quotes:", error);
      setQuotes([]);
    } finally {
      setLoading(false);
    }
  };

  const downloadQuoteImage = async () => {
    const element = document.getElementById('quote-canvas');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: null,
        logging: false
      });

      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `quote-${Date.now()}.png`;
      link.href = url;
      link.click();
    } catch (error) {
      console.error("Error downloading image:", error);
    }
  };

  const currentTemplate = templates.find(t => t.id === selectedTemplate);

  if (!blogContent.title || !blogContent.content) {
    return (
      <div className="text-center py-12">
        <p className="text-[#2B2725]/60 text-sm mb-2">No blog content yet</p>
        <p className="text-[#2B2725]/40 text-xs">Add content to extract shareable quotes</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button 
        onClick={extractQuotes}
        disabled={loading}
        className="w-full bg-[#1E3A32] hover:bg-[#2B2725]"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="mr-2 animate-spin" />
            Harvesting Quotes...
          </>
        ) : (
          <>
            <Sparkles size={16} className="mr-2" />
            Extract Powerful Quotes
          </>
        )}
      </Button>

      {quotes.length > 0 && (
        <>
          {/* Quote Selection */}
          <div>
            <h3 className="font-medium text-[#1E3A32] mb-3 flex items-center gap-2">
              <Quote size={16} />
              Select Quote
            </h3>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {quotes.map((quote, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedQuote(quote)}
                  className={`w-full p-3 text-left text-sm rounded-lg border transition-all ${
                    selectedQuote === quote 
                      ? 'border-[#D8B46B] bg-[#D8B46B]/5' 
                      : 'border-[#E4D9C4] hover:border-[#D8B46B]/50'
                  }`}
                >
                  "{quote}"
                </button>
              ))}
            </div>
          </div>

          {/* Template Selection */}
          <div>
            <h3 className="font-medium text-[#1E3A32] mb-3">Choose Style</h3>
            <div className="grid grid-cols-2 gap-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`p-3 rounded-lg border transition-all ${
                    selectedTemplate === template.id
                      ? 'border-[#D8B46B] ring-2 ring-[#D8B46B]/20'
                      : 'border-[#E4D9C4] hover:border-[#D8B46B]/50'
                  }`}
                  style={{ background: template.bg }}
                >
                  <div className="text-xs font-medium" style={{ color: template.textColor }}>
                    {template.name}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          {selectedQuote && (
            <div>
              <h3 className="font-medium text-[#1E3A32] mb-3">Preview</h3>
              <div 
                id="quote-canvas"
                className="relative w-full aspect-square rounded-lg overflow-hidden shadow-lg flex items-center justify-center p-12"
                style={{ background: currentTemplate.bg }}
              >
                <div className="text-center space-y-8">
                  <div 
                    className="font-serif text-2xl leading-relaxed italic"
                    style={{ color: currentTemplate.textColor }}
                  >
                    "{selectedQuote}"
                  </div>
                  
                  <div className="space-y-2">
                    <div 
                      className="text-sm tracking-wide"
                      style={{ color: currentTemplate.accentColor }}
                    >
                      — Roberta Fernandez
                    </div>
                    <div 
                      className="text-xs tracking-[0.2em] uppercase"
                      style={{ color: currentTemplate.textColor, opacity: 0.7 }}
                    >
                      The Mind Stylist
                    </div>
                  </div>
                </div>

                {/* Decorative elements */}
                <div 
                  className="absolute top-8 left-8 text-6xl opacity-20"
                  style={{ color: currentTemplate.accentColor }}
                >
                  "
                </div>
                <div 
                  className="absolute bottom-8 right-8 text-6xl opacity-20 rotate-180"
                  style={{ color: currentTemplate.accentColor }}
                >
                  "
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={downloadQuoteImage}
              className="flex-1 bg-[#1E3A32] hover:bg-[#2B2725]"
            >
              <Download size={16} className="mr-2" />
              Download Image
            </Button>
            <Button
              onClick={extractQuotes}
              variant="outline"
              className="flex-1"
            >
              <RefreshCw size={16} className="mr-2" />
              New Quotes
            </Button>
          </div>

          <div className="bg-[#A6B7A3]/10 p-4 rounded-lg">
            <p className="text-xs text-[#2B2725]/70 leading-relaxed">
              💡 <strong>Pro tip:</strong> Share these on Instagram stories, LinkedIn posts, or Pinterest. Tag followers and ask them to share their own insights. Quote graphics drive 3x more engagement than text-only posts.
            </p>
          </div>
        </>
      )}
    </div>
  );
}