import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, Copy, FileText } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { trackUsage } from "@/components/utils/trackUsage";
import CreditGateBanner from "@/components/credits/CreditGateBanner";

export default function BlogSummarizer({ onApplySummary }) {
  const [inputText, setInputText] = useState("");
  const [summaryType, setSummaryType] = useState("excerpt");
  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary] = useState("");

  const summaryTypes = [
    { value: "excerpt", label: "Excerpt (150 chars)", maxChars: 150 },
    { value: "twitter", label: "Twitter Post (280 chars)", maxChars: 280 },
    { value: "linkedin", label: "LinkedIn Post (600 chars)", maxChars: 600 },
    { value: "instagram", label: "Instagram Caption (500 chars)", maxChars: 500 },
    { value: "newsletter", label: "Newsletter Blurb (300 chars)", maxChars: 300 },
  ];

  const handleSummarize = async () => {
    if (!inputText.trim()) return;

    setSummarizing(true);
    try {
      const selectedType = summaryTypes.find(t => t.value === summaryType);
      const plainText = inputText.replace(/<[^>]*>/g, '');

      const prompt = `Summarize this blog post for ${selectedType.label}:

${plainText.substring(0, 3000)}

Requirements:
- Maximum ${selectedType.maxChars} characters
- Compelling and engaging
- Mind Styling voice - calm, intelligent, introspective
- Include a hook to make readers want to read more
${summaryType === 'excerpt' ? '- Suitable for blog listing pages' : ''}
${summaryType === 'twitter' ? '- Twitter-optimized with relevant hashtags' : ''}
${summaryType === 'linkedin' ? '- Professional tone, include call-to-action' : ''}
${summaryType === 'instagram' ? '- Include line breaks for readability, 3-5 hashtags at the end' : ''}

Output ONLY the summary text, nothing else.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
      });

      setSummary(response);
      trackUsage({ feature: "blog_summarizer", integration_type: "InvokeLLM", details: `${summaryType} summary` });
    } catch (error) {
      console.error("Error summarizing:", error);
    } finally {
      setSummarizing(false);
    }
  };

  const handleApply = () => {
    if (summary && onApplySummary) {
      onApplySummary(summary);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="mb-2 block">Blog Content</Label>
        <Textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Paste your blog post content here..."
          rows={6}
        />
      </div>

      <div>
        <Label className="mb-2 block">Summary Type</Label>
        <Select value={summaryType} onValueChange={setSummaryType}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {summaryTypes.map(type => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <CreditGateBanner feature="blog_summarizer">
        <Button
          onClick={handleSummarize}
          disabled={!inputText.trim() || summarizing}
          className="w-full bg-[#6E4F7D] hover:bg-[#5A3F67]"
        >
          {summarizing ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              Summarizing...
            </>
          ) : (
            <>
              <Sparkles size={16} className="mr-2" />
              Generate Summary
            </>
          )}
        </Button>
      </CreditGateBanner>

      {summary && (
        <div className="border border-[#D8B46B]/30 rounded-lg p-4 bg-[#F9F5EF]">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm text-[#2B2725]/60">Generated Summary</Label>
            <div className="flex gap-2">
              <span className="text-xs text-[#2B2725]/60">{summary.length} chars</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigator.clipboard.writeText(summary)}
              >
                <Copy size={14} className="mr-1" />
                Copy
              </Button>
            </div>
          </div>
          <div className="bg-white p-4 rounded mb-4">
            <p className="text-[#2B2725] whitespace-pre-wrap">{summary}</p>
          </div>
          {onApplySummary && (
            <Button onClick={handleApply} className="w-full bg-[#1E3A32]">
              <FileText size={16} className="mr-2" />
              Apply as Excerpt
            </Button>
          )}
        </div>
      )}
    </div>
  );
}