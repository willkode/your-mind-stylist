import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Copy, CheckCircle, TrendingUp, Target, FileText, Loader2, Zap } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function SEOEnchanter({ blogContent, onApplySEO }) {
  const [seoData, setSeoData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [readabilityScore, setReadabilityScore] = useState(null);

  useEffect(() => {
    if (blogContent.content) {
      calculateReadability();
    }
  }, [blogContent.content]);

  const calculateReadability = () => {
    const text = blogContent.content.replace(/<[^>]*>/g, '');
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const words = text.split(/\s+/).filter(w => w.length > 0).length;
    const syllables = countSyllables(text);
    
    // Flesch Reading Ease
    const score = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
    
    let grade = "Very Difficult";
    let color = "#DC2626";
    
    if (score >= 90) { grade = "Very Easy"; color = "#16A34A"; }
    else if (score >= 80) { grade = "Easy"; color = "#22C55E"; }
    else if (score >= 70) { grade = "Fairly Easy"; color = "#84CC16"; }
    else if (score >= 60) { grade = "Standard"; color = "#EAB308"; }
    else if (score >= 50) { grade = "Fairly Difficult"; color = "#F97316"; }
    else if (score >= 30) { grade = "Difficult"; color = "#EF4444"; }
    
    setReadabilityScore({ score: Math.round(score), grade, color, words, sentences });
  };

  const countSyllables = (text) => {
    const words = text.toLowerCase().match(/[a-z]+/g) || [];
    return words.reduce((count, word) => {
      const syllables = word.match(/[aeiouy]{1,2}/g);
      return count + (syllables ? syllables.length : 1);
    }, 0);
  };

  const generateSEO = async () => {
    setLoading(true);
    setSeoData(null);

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this blog post and provide comprehensive SEO optimization:

Blog Title: ${blogContent.title}
Category: ${blogContent.category}
Content: ${blogContent.content.replace(/<[^>]*>/g, '').substring(0, 2000)}

Generate:
1. An optimized meta title (55-60 characters) that's compelling and includes the primary keyword
2. A meta description (150-160 characters) that entices clicks and includes keywords
3. 5-7 primary keywords or keyphrases for this content
4. 3-5 secondary/related keywords
5. Alt-text suggestions for potential images in this post (3-4 suggestions)

Make it natural, compelling, and aligned with Roberta's voice: thoughtful, expert, warm, transformational.`,
        response_json_schema: {
          type: "object",
          properties: {
            meta_title: { type: "string" },
            meta_description: { type: "string" },
            primary_keywords: { type: "array", items: { type: "string" } },
            secondary_keywords: { type: "array", items: { type: "string" } },
            alt_text_suggestions: { type: "array", items: { type: "string" } }
          }
        }
      });

      setSeoData(response);
    } catch (error) {
      console.error("Error generating SEO:", error);
      setSeoData("error");
    } finally {
      setLoading(false);
    }
  };

  const applySEO = () => {
    if (onApplySEO && seoData) {
      onApplySEO({
        meta_title: seoData.meta_title,
        meta_description: seoData.meta_description
      });
    }
  };

  if (!blogContent.title || !blogContent.content) {
    return (
      <div className="text-center py-12">
        <p className="text-[#2B2725]/60 text-sm mb-2">No blog content yet</p>
        <p className="text-[#2B2725]/40 text-xs">Add a title and content to optimize SEO</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Readability Score */}
      {readabilityScore && (
        <div className="bg-[#F9F5EF] p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-[#1E3A32] flex items-center gap-2">
              <FileText size={18} />
              Readability Score
            </h3>
            <div 
              className="px-3 py-1 rounded-full text-sm font-medium"
              style={{ backgroundColor: readabilityScore.color + '20', color: readabilityScore.color }}
            >
              {readabilityScore.score}/100
            </div>
          </div>
          <div className="space-y-2 text-sm text-[#2B2725]/70">
            <p><strong>Grade:</strong> {readabilityScore.grade}</p>
            <p><strong>Word Count:</strong> {readabilityScore.words}</p>
            <p><strong>Sentences:</strong> {readabilityScore.sentences}</p>
            <p className="text-xs mt-3 text-[#2B2725]/60">
              💡 Aim for 60+ for easy reading. Break up long sentences and use simple language.
            </p>
          </div>
        </div>
      )}

      {/* Generate SEO Button */}
      <Button 
        onClick={generateSEO}
        disabled={loading}
        className="w-full bg-[#1E3A32] hover:bg-[#2B2725]"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="mr-2 animate-spin" />
            Analyzing & Optimizing...
          </>
        ) : (
          <>
            <Sparkles size={16} className="mr-2" />
            Generate SEO Magic
          </>
        )}
      </Button>

      {/* SEO Results */}
      {seoData && seoData !== "error" && !loading && (
        <div className="space-y-6">
          {/* Meta Title */}
          <div className="bg-white p-4 rounded-lg border border-[#E4D9C4]">
            <div className="flex items-center gap-2 mb-2">
              <Target size={16} className="text-[#D8B46B]" />
              <h4 className="font-medium text-sm text-[#1E3A32]">Meta Title</h4>
              <span className="text-xs text-[#2B2725]/50 ml-auto">{seoData.meta_title.length} chars</span>
            </div>
            <Input 
              value={seoData.meta_title}
              onChange={(e) => setSeoData({...seoData, meta_title: e.target.value})}
              className="border-[#E4D9C4]"
            />
          </div>

          {/* Meta Description */}
          <div className="bg-white p-4 rounded-lg border border-[#E4D9C4]">
            <div className="flex items-center gap-2 mb-2">
              <FileText size={16} className="text-[#D8B46B]" />
              <h4 className="font-medium text-sm text-[#1E3A32]">Meta Description</h4>
              <span className="text-xs text-[#2B2725]/50 ml-auto">{seoData.meta_description.length} chars</span>
            </div>
            <Textarea 
              value={seoData.meta_description}
              onChange={(e) => setSeoData({...seoData, meta_description: e.target.value})}
              className="border-[#E4D9C4] min-h-[80px]"
            />
          </div>

          {/* Keywords */}
          <div className="bg-white p-4 rounded-lg border border-[#E4D9C4]">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={16} className="text-[#D8B46B]" />
              <h4 className="font-medium text-sm text-[#1E3A32]">Primary Keywords</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {seoData.primary_keywords.map((kw, i) => (
                <span 
                  key={i}
                  className="px-3 py-1 bg-[#1E3A32]/10 text-[#1E3A32] text-xs rounded-full"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-[#E4D9C4]">
            <div className="flex items-center gap-2 mb-3">
              <Target size={16} className="text-[#A6B7A3]" />
              <h4 className="font-medium text-sm text-[#1E3A32]">Secondary Keywords</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {seoData.secondary_keywords.map((kw, i) => (
                <span 
                  key={i}
                  className="px-3 py-1 bg-[#A6B7A3]/10 text-[#1E3A32] text-xs rounded-full"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>

          {/* Alt Text Suggestions */}
          <div className="bg-white p-4 rounded-lg border border-[#E4D9C4]">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={16} className="text-[#D8B46B]" />
              <h4 className="font-medium text-sm text-[#1E3A32]">Alt-Text Suggestions</h4>
            </div>
            <div className="space-y-2">
              {seoData.alt_text_suggestions.map((alt, i) => (
                <div 
                  key={i}
                  className="p-2 bg-[#F9F5EF] rounded text-xs text-[#2B2725]/80 flex items-start gap-2"
                >
                  <span className="text-[#D8B46B] mt-0.5">•</span>
                  <span className="flex-1">{alt}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(alt);
                    }}
                    className="text-[#1E3A32] hover:text-[#D8B46B]"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Apply Button */}
          <div className="flex gap-2">
            <Button
              onClick={applySEO}
              className="flex-1 bg-[#1E3A32] hover:bg-[#2B2725]"
            >
              <Zap size={16} className="mr-2" />
              Apply to Blog Post
            </Button>
            <Button
              onClick={generateSEO}
              variant="outline"
              className="flex-1"
            >
              <Sparkles size={16} className="mr-2" />
              Regenerate
            </Button>
          </div>

          <div className="bg-[#A6B7A3]/10 p-4 rounded-lg">
            <p className="text-xs text-[#2B2725]/70 leading-relaxed">
              💡 <strong>Pro tip:</strong> Use your primary keywords naturally in the first 100 words of your post. Include them in headings (H2, H3) and image alt-text for maximum SEO impact.
            </p>
          </div>
        </div>
      )}

      {seoData === "error" && !loading && (
        <div className="bg-red-50 p-6 rounded-lg text-center">
          <p className="text-red-600 text-sm mb-3">Error generating SEO optimization</p>
          <Button
            onClick={generateSEO}
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