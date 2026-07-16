import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { trackUsage } from "@/components/utils/trackUsage";
import CreditGateBanner from "@/components/credits/CreditGateBanner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search, TrendingUp } from "lucide-react";

export default function SEOOptimizer() {
  const [content, setContent] = useState("");
  const [targetKeyword, setTargetKeyword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleOptimize = async () => {
    if (!content.trim()) return;

    setIsLoading(true);
    try {
      const prompt = `You are an expert SEO strategist. Analyze this content and optimize it for search engines.

TARGET KEYWORD: ${targetKeyword || "not specified - suggest one"}

ORIGINAL CONTENT:
${content}

INSTRUCTIONS:
1. Analyze current SEO strength (score 0-100)
2. Identify keyword opportunities
3. Suggest meta title (60 chars max, compelling + keyword-rich)
4. Suggest meta description (155 chars max, action-oriented)
5. Recommend heading structure (H1, H2s)
6. Suggest internal linking opportunities
7. Identify semantic keywords to include
8. Provide optimized version of the content (naturally incorporating keywords without stuffing)

Return as JSON:
{
  "seo_score": number,
  "primary_keyword": "string",
  "secondary_keywords": ["array"],
  "meta_title": "string",
  "meta_description": "string",
  "heading_structure": {
    "h1": "string",
    "h2s": ["array"]
  },
  "semantic_keywords": ["array"],
  "internal_links": ["suggested topics to link to"],
  "optimized_content": "full optimized version with better keyword placement and flow",
  "improvements": ["what changed and why"]
}`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            seo_score: { type: "number" },
            primary_keyword: { type: "string" },
            secondary_keywords: { type: "array", items: { type: "string" } },
            meta_title: { type: "string" },
            meta_description: { type: "string" },
            heading_structure: {
              type: "object",
              properties: {
                h1: { type: "string" },
                h2s: { type: "array", items: { type: "string" } }
              }
            },
            semantic_keywords: { type: "array", items: { type: "string" } },
            internal_links: { type: "array", items: { type: "string" } },
            optimized_content: { type: "string" },
            improvements: { type: "array", items: { type: "string" } }
          }
        }
      });

      setResult(response);
      trackUsage({ feature: "seo_optimizer", integration_type: "InvokeLLM", details: `SEO optimize: ${targetKeyword || "auto"}` });
    } catch (error) {
      console.error(error);
      alert("Failed to optimize content");
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="font-serif text-2xl text-[#1E3A32] mb-4">SEO Optimizer</h2>
        <p className="text-[#2B2725]/70 mb-6">
          Analyze and optimize your content for search engines with keyword recommendations and meta tags
        </p>

        <div className="space-y-4">
          <div>
            <Label>Target Keyword (optional)</Label>
            <Input
              placeholder="e.g., emotional intelligence coaching"
              value={targetKeyword}
              onChange={(e) => setTargetKeyword(e.target.value)}
            />
          </div>

          <div>
            <Label>Your Content</Label>
            <Textarea
              placeholder="Paste your blog post, article, or web page content here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
            />
          </div>

          <CreditGateBanner feature="seo_optimizer">
            <Button
              onClick={handleOptimize}
              disabled={isLoading || !content.trim()}
              className="w-full bg-[#1E3A32]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Optimizing...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Optimize for SEO
                </>
              )}
            </Button>
          </CreditGateBanner>
        </div>
      </div>

      {result && (
        <div className="space-y-4">
          {/* SEO Score */}
          <div className="bg-gradient-to-br from-[#1E3A32] to-[#2B4A40] p-6 rounded-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80 mb-1">SEO Score</p>
                <p className="text-5xl font-bold">{result.seo_score}</p>
              </div>
              <TrendingUp size={48} className="opacity-50" />
            </div>
          </div>

          {/* Meta Tags */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="font-medium text-[#1E3A32] mb-4">Optimized Meta Tags</h3>
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-[#2B2725]/60">Meta Title ({result.meta_title?.length}/60)</Label>
                <div className="p-3 bg-[#F9F5EF] rounded border border-[#E4D9C4] font-mono text-sm">
                  {result.meta_title}
                </div>
              </div>
              <div>
                <Label className="text-xs text-[#2B2725]/60">Meta Description ({result.meta_description?.length}/155)</Label>
                <div className="p-3 bg-[#F9F5EF] rounded border border-[#E4D9C4] font-mono text-sm">
                  {result.meta_description}
                </div>
              </div>
            </div>
          </div>

          {/* Keywords */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="font-medium text-[#1E3A32] mb-4">Keyword Strategy</h3>
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-[#2B2725]/60">Primary Keyword</Label>
                <div className="p-2 bg-[#D8B46B]/20 rounded inline-block font-medium text-[#1E3A32]">
                  {result.primary_keyword}
                </div>
              </div>
              <div>
                <Label className="text-xs text-[#2B2725]/60">Secondary Keywords</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {result.secondary_keywords?.map((kw, idx) => (
                    <span key={idx} className="px-3 py-1 bg-[#A6B7A3]/20 rounded text-sm">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs text-[#2B2725]/60">Semantic Keywords</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {result.semantic_keywords?.map((kw, idx) => (
                    <span key={idx} className="px-3 py-1 bg-[#6E4F7D]/20 rounded text-sm">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Heading Structure */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="font-medium text-[#1E3A32] mb-4">Recommended Heading Structure</h3>
            <div className="space-y-2">
              <div className="pl-4 border-l-4 border-[#D8B46B]">
                <span className="text-xs text-[#2B2725]/60">H1</span>
                <p className="text-lg font-medium text-[#1E3A32]">{result.heading_structure?.h1}</p>
              </div>
              {result.heading_structure?.h2s?.map((h2, idx) => (
                <div key={idx} className="pl-4 border-l-4 border-[#A6B7A3] ml-4">
                  <span className="text-xs text-[#2B2725]/60">H2</span>
                  <p className="text-[#1E3A32]">{h2}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Optimized Content */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="font-medium text-[#1E3A32] mb-4">Optimized Content</h3>
            <div className="p-4 bg-[#F9F5EF] rounded border border-[#E4D9C4] whitespace-pre-wrap text-sm leading-relaxed">
              {result.optimized_content}
            </div>
            <Button
              onClick={() => navigator.clipboard.writeText(result.optimized_content)}
              variant="outline"
              className="mt-4"
            >
              Copy Optimized Content
            </Button>
          </div>

          {/* Improvements */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="font-medium text-[#1E3A32] mb-4">What Changed</h3>
            <ul className="space-y-2">
              {result.improvements?.map((imp, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-[#D8B46B] mt-1">✓</span>
                  <span className="text-[#2B2725]/80">{imp}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Internal Links */}
          {result.internal_links?.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-medium text-[#1E3A32] mb-4">Suggested Internal Links</h3>
              <ul className="space-y-2">
                {result.internal_links.map((link, idx) => (
                  <li key={idx} className="text-[#2B2725]/80">• {link}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}