import React from "react";
import { motion } from "framer-motion";
import { 
  Sparkles, TrendingUp, Heart, Target, Lightbulb, Award, Eye, ThumbsUp, ThumbsDown 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const INSIGHT_ICONS = {
  pattern: TrendingUp,
  trend: TrendingUp,
  celebration: Award,
  recommendation: Target,
  observation: Eye,
  prediction: Lightbulb
};

const CATEGORY_COLORS = {
  emotional: "#D8B46B",
  learning: "#6E4F7D",
  consistency: "#1E3A32",
  growth: "#A6B7A3",
  connection: "#D8B46B",
  breakthrough: "#D8B46B"
};

export default function InsightsPanel({ insights = [], onRefresh }) {
  const queryClient = useQueryClient();

  const markViewedMutation = useMutation({
    mutationFn: (insightId) => 
      base44.entities.GrowthInsight.update(insightId, {
        viewed: true,
        viewed_date: new Date().toISOString()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["insights"] });
    }
  });

  const markHelpfulMutation = useMutation({
    mutationFn: ({ insightId, helpful }) =>
      base44.entities.GrowthInsight.update(insightId, { helpful }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["insights"] });
    }
  });

  const handleInsightClick = (insight) => {
    if (!insight.viewed) {
      markViewedMutation.mutate(insight.id);
    }
  };

  if (insights.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 shadow-md text-center">
        <Sparkles size={48} className="mx-auto text-[#D8B46B] mb-4" />
        <h3 className="font-serif text-xl text-[#1E3A32] mb-2">
          No Insights Yet
        </h3>
        <p className="text-[#2B2725]/70 mb-6">
          Keep reflecting, learning, and checking in. Insights will appear as patterns emerge.
        </p>
        {onRefresh && (
          <Button
            onClick={onRefresh}
            className="bg-[#1E3A32] hover:bg-[#2B2725]"
          >
            Generate Insights
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {insights.map((insight, index) => {
        const IconComponent = INSIGHT_ICONS[insight.insight_type] || Sparkles;
        const color = CATEGORY_COLORS[insight.insight_category] || "#D8B46B";

        return (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => handleInsightClick(insight)}
            className={`bg-white rounded-xl p-6 shadow-md border-l-4 cursor-pointer hover:shadow-lg transition-all ${
              insight.viewed ? 'opacity-75' : ''
            }`}
            style={{ borderColor: color }}
          >
            <div className="flex items-start gap-4">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${color}20` }}
              >
                <IconComponent size={24} style={{ color }} />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span 
                    className="text-xs px-2 py-1 rounded uppercase tracking-wide font-medium"
                    style={{ 
                      backgroundColor: `${color}20`,
                      color: color
                    }}
                  >
                    {insight.insight_category}
                  </span>
                  {!insight.viewed && (
                    <span className="text-xs px-2 py-1 rounded bg-[#D8B46B]/20 text-[#D8B46B]">
                      New
                    </span>
                  )}
                  {insight.priority === 'high' && (
                    <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-700">
                      Important
                    </span>
                  )}
                </div>
                
                <p className="text-[#1E3A32] text-lg mb-2 leading-relaxed">
                  {insight.insight_text}
                </p>
                
                {insight.insight_detail && (
                  <p className="text-[#2B2725]/70 text-sm mb-4">
                    {insight.insight_detail}
                  </p>
                )}
                
                {insight.confidence_score && (
                  <p className="text-xs text-[#2B2725]/50 mb-3">
                    Confidence: {insight.confidence_score}%
                  </p>
                )}
                
                {insight.viewed && insight.helpful === undefined && (
                  <div className="flex items-center gap-2 pt-3 border-t border-[#E4D9C4]">
                    <span className="text-xs text-[#2B2725]/60 mr-2">Was this helpful?</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        markHelpfulMutation.mutate({ insightId: insight.id, helpful: true });
                      }}
                      className="h-8 px-3"
                    >
                      <ThumbsUp size={14} className="mr-1" />
                      Yes
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        markHelpfulMutation.mutate({ insightId: insight.id, helpful: false });
                      }}
                      className="h-8 px-3"
                    >
                      <ThumbsDown size={14} className="mr-1" />
                      No
                    </Button>
                  </div>
                )}
                
                {insight.helpful !== undefined && (
                  <p className="text-xs text-[#2B2725]/50 pt-3 border-t border-[#E4D9C4]">
                    {insight.helpful ? "✓ Marked as helpful" : "Feedback received"}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}