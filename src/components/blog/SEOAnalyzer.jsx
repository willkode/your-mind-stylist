import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, CheckCircle, AlertCircle, TrendingUp } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { trackUsage } from "@/components/utils/trackUsage";
import CreditGateBanner from "@/components/credits/CreditGateBanner";

export default function SEOAnalyzer({ title, content, excerpt, onApplySEO }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [seoData, setSeoData] = useState(null);

  const calculateReadability = (text) => {
    const plainText = text.replace(/<[^>]*>/g, '');
    const words = plainText.trim().split(/\s+/).length;
    const sentences = plainText.split(/[.!?]+/).length;
    const avgWordsPerSentence = words / sentences;
    
    if (avgWordsPerSentence < 15) return { score: 90, level: "Easy" };
    if (avgWordsPerSentence < 20) return { score: 75, level: "Medium" };
    return { score: 60, level: "Complex" };
  };

  const handleAnalyze = async () => {
    if (!content || !title) return;

    setAnalyzing(true);
    try {
      const plainContent = content.replace(/<[^>]*>/g, '');
      const readability = calculateReadability(content);
      
      const prompt = `Analyze this blog post for SEO optimization:

Title: ${title}
Content: ${plainContent.substring(0, 2000)}...

Provide:
1. 5-8 relevant SEO keywords
2. An optimized meta title (60 chars max)
3. An optimized meta description (155 chars max)
4. 3 specific SEO improvement suggestions

Format as JSON:
{
  "keywords": ["keyword1", "keyword2", ...],
  "meta_title": "Optimized title",
  "meta_description": "Optimized description",
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"]
}`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            keywords: { type: "array", items: { type: "string" } },
            meta_title: { type: "string" },
            meta_description: { type: "string" },
            suggestions: { type: "array", items: { type: "string" } }
          }
        }
      });

      setSeoData({
        ...response,
        readability
      });
      trackUsage({ feature: "seo_analyzer", integration_type: "InvokeLLM", details: `SEO analysis: ${title?.substring(0, 60)}` });
    } catch (error) {
      console.error("Error analyzing SEO:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApply = () => {
    if (seoData) {
      onApplySEO({
        meta_title: seoData.meta_title,
        meta_description: seoData.meta_description,
        seo_keywords: seoData.keywords
      });
    }
  };

  return (
    <div className="space-y-4">
      <CreditGateBanner feature="seo_analyzer">
        <Button
          onClick={handleAnalyze}
          disabled={!title || !content || analyzing}
          className="w-full bg-[#1E3A32]"
        >
          {analyzing ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <TrendingUp size={16} className="mr-2" />
              Analyze SEO
            </>
          )}
        </Button>
      </CreditGateBanner>

      {seoData && (
        <div className="space-y-4 border border-[#D8B46B]/30 rounded-lg p-4 bg-[#F9F5EF]">
          {/* Readability Score */}
          <div>
            <Label className="text-sm mb-2 block">Readability Score</Label>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-white rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#1E3A32] to-[#A6B7A3]"
                  style={{ width: `${seoData.readability.score}%` }}
                />
              </div>
              <Badge variant="outline">{seoData.readability.level}</Badge>
              <span className="text-sm font-medium">{seoData.readability.score}/100</span>
            </div>
          </div>

          {/* Keywords */}
          <div>
            <Label className="text-sm mb-2 block">Suggested Keywords</Label>
            <div className="flex flex-wrap gap-2">
              {seoData.keywords.map((keyword, idx) => (
                <Badge key={idx} className="bg-[#A6B7A3]/20 text-[#1E3A32]">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>

          {/* Meta Title */}
          <div>
            <Label className="text-sm mb-2 block flex items-center gap-2">
              <CheckCircle size={14} className="text-green-600" />
              Optimized Meta Title
            </Label>
            <p className="text-sm text-[#2B2725] bg-white p-3 rounded">
              {seoData.meta_title}
            </p>
            <p className="text-xs text-[#2B2725]/60 mt-1">
              {seoData.meta_title.length} characters
            </p>
          </div>

          {/* Meta Description */}
          <div>
            <Label className="text-sm mb-2 block flex items-center gap-2">
              <CheckCircle size={14} className="text-green-600" />
              Optimized Meta Description
            </Label>
            <p className="text-sm text-[#2B2725] bg-white p-3 rounded">
              {seoData.meta_description}
            </p>
            <p className="text-xs text-[#2B2725]/60 mt-1">
              {seoData.meta_description.length} characters
            </p>
          </div>

          {/* Suggestions */}
          <div>
            <Label className="text-sm mb-2 block">SEO Improvements</Label>
            <div className="space-y-2">
              {seoData.suggestions.map((suggestion, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm text-[#2B2725]">
                  <AlertCircle size={14} className="text-[#D8B46B] mt-0.5 flex-shrink-0" />
                  <span>{suggestion}</span>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={handleApply} className="w-full bg-[#1E3A32]">
            <Sparkles size={16} className="mr-2" />
            Apply SEO Recommendations
          </Button>
        </div>
      )}
    </div>
  );
}