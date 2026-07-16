import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, RefreshCw, TrendingUp, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

const CARD_COLORS = [
  "bg-[#1E3A32]/5 border-[#1E3A32]/20",
  "bg-[#D8B46B]/10 border-[#D8B46B]/30",
  "bg-[#6E4F7D]/5 border-[#6E4F7D]/20",
  "bg-[#A6B7A3]/20 border-[#A6B7A3]/40",
];

export default function PatternInsights({ checkIns }) {
  const [generating, setGenerating] = useState(false);
  const [insightsKey, setInsightsKey] = useState("initial");

  const { data: insights, isLoading, error, refetch } = useQuery({
    queryKey: ["style-pattern-insights", checkIns.length, insightsKey],
    queryFn: async () => {
      const summary = checkIns.slice(0, 60).map(ci => ({
        date: format(new Date(ci.created_date), "EEE MMM d"),
        identity: ci.identity_name || "Unknown",
        state: ci.state_value,
        voice_tone: ci.inner_voice_tone,
        notes: ci.notes || "",
      }));

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an emotional intelligence coach trained in the LENS™ methodology by Roberta Fernandez (Your Mind Stylist). 
        
Analyze this user's Daily Style Check™ check-in history and identify meaningful patterns. The "identities" are mental/emotional "outfits" users wear — like "The Grounded One", "The Performer", "The Old Pattern" etc.

Check-in data (most recent first):
${JSON.stringify(summary, null, 2)}

Generate exactly 3-4 short, warm, insightful pattern observations. Each should:
- Be 1-2 sentences, conversational and encouraging
- Reference specific patterns in the data (days, identities, states)
- Sound like a supportive coach, not clinical
- Use phrases like "You tend to...", "Your data shows...", "It looks like..."

Return as JSON with this structure:
{
  "patterns": [
    { "title": "Short title (3-5 words)", "insight": "The full observation sentence(s).", "type": "trend|cycle|strength|opportunity" }
  ],
  "summary": "One encouraging sentence summarizing their overall style journey so far."
}`,
        response_json_schema: {
          type: "object",
          properties: {
            patterns: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  insight: { type: "string" },
                  type: { type: "string" }
                }
              }
            },
            summary: { type: "string" }
          }
        }
      });

      return result;
    },
    enabled: checkIns.length >= 3,
    staleTime: 1000 * 60 * 60, // 1 hour
    retry: 1,
  });

  const handleRegenerate = async () => {
    setGenerating(true);
    setInsightsKey(Date.now().toString());
    await refetch();
    setGenerating(false);
  };

  if (checkIns.length < 3) {
    return (
      <div className="py-12 text-center">
        <div className="w-14 h-14 rounded-full bg-[#E4D9C4] flex items-center justify-center mx-auto mb-4">
          <TrendingUp size={22} className="text-[#1E3A32]/40" />
        </div>
        <p className="text-sm text-[#2B2725]/60 mb-1">Almost there</p>
        <p className="text-xs text-[#2B2725]/40">Complete {3 - checkIns.length} more check-in{3 - checkIns.length !== 1 ? "s" : ""} to unlock your pattern insights.</p>
      </div>
    );
  }

  if (isLoading || generating) {
    return (
      <div className="py-12 text-center">
        <div className="w-10 h-10 border-4 border-[#E4D9C4] border-t-[#1E3A32] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-[#2B2725]/60">Reading your patterns...</p>
      </div>
    );
  }

  if (error || !insights) {
    return (
      <div className="py-8 text-center">
        <AlertCircle size={20} className="text-red-400 mx-auto mb-2" />
        <p className="text-sm text-[#2B2725]/60">Couldn't generate insights. Try again.</p>
        <Button size="sm" variant="outline" className="mt-3" onClick={handleRegenerate}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary banner */}
      {insights.summary && (
        <div className="p-4 bg-[#1E3A32] rounded-xl text-[#F9F5EF]">
          <div className="flex items-start gap-3">
            <Sparkles size={16} className="text-[#D8B46B] mt-0.5 flex-shrink-0" />
            <p className="text-sm leading-relaxed">{insights.summary}</p>
          </div>
        </div>
      )}

      {/* Pattern cards */}
      <div className="grid gap-3">
        {insights.patterns?.map((pattern, i) => (
          <div key={i} className={`p-4 rounded-xl border ${CARD_COLORS[i % CARD_COLORS.length]}`}>
            <p className="text-xs font-semibold text-[#1E3A32]/60 uppercase tracking-wider mb-1">{pattern.title}</p>
            <p className="text-sm text-[#2B2725] leading-relaxed">{pattern.insight}</p>
          </div>
        ))}
      </div>

      <div className="text-right">
        <button
          onClick={handleRegenerate}
          className="flex items-center gap-1.5 text-xs text-[#2B2725]/40 hover:text-[#1E3A32] transition-colors ml-auto"
        >
          <RefreshCw size={12} /> Refresh insights
        </button>
      </div>
    </div>
  );
}