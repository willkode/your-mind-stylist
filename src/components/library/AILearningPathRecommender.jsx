import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, BookOpen, ArrowRight, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AILearningPathRecommender() {
  const [expanded, setExpanded] = useState(true);

  const { data, isLoading } = useQuery({
    queryKey: ['learning-path'],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateLearningPath', {});
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (isLoading) {
    return (
      <Card className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="text-purple-600 animate-pulse" size={24} />
          <h3 className="font-serif text-xl text-[#1E3A32]">AI Learning Path</h3>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-purple-200 rounded w-3/4"></div>
          <div className="h-4 bg-purple-200 rounded w-1/2"></div>
        </div>
      </Card>
    );
  }

  if (!data || !data.recommendations || data.recommendations.length === 0) {
    return null;
  }

  const { recommendations, insight, userStats } = data;

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 border-purple-200">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
              <Sparkles className="text-white" size={20} />
            </div>
            <div>
              <h3 className="font-serif text-2xl text-[#1E3A32]">Your AI Learning Path</h3>
              <p className="text-sm text-[#2B2725]/60">Personalized just for you</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="text-[#6E4F7D]"
          >
            {expanded ? 'Collapse' : 'Expand'}
          </Button>
        </div>

        {/* User Stats */}
        {expanded && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 text-center">
              <div className="text-2xl font-serif text-purple-600">{userStats.completedCourses}</div>
              <div className="text-xs text-[#2B2725]/60">Completed</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 text-center">
              <div className="text-2xl font-serif text-indigo-600">{userStats.currentDepthLevel}</div>
              <div className="text-xs text-[#2B2725]/60">Depth Level</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 text-center">
              <div className="text-2xl font-serif text-blue-600">{userStats.emotionalGrowthRate}%</div>
              <div className="text-xs text-[#2B2725]/60">Growth Rate</div>
            </div>
          </div>
        )}

        {/* AI Insight */}
        <div className="bg-white/90 backdrop-blur-sm border-l-4 border-purple-600 p-4 rounded-lg mb-6">
          <div className="flex items-start gap-3">
            <TrendingUp className="text-purple-600 flex-shrink-0 mt-1" size={18} />
            <p className="text-sm text-[#2B2725] leading-relaxed">{insight}</p>
          </div>
        </div>

        {/* Recommendations */}
        {expanded && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-[#2B2725]/70 flex items-center gap-2">
              <Zap size={16} className="text-yellow-600" />
              Recommended Programs
            </h4>
            
            <div className="space-y-3">
              {recommendations.slice(0, 3).map((rec, idx) => (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Link to={createPageUrl(`CoursePage?courseId=${rec.id}`)}>
                    <Card className="p-4 hover:shadow-lg transition-all duration-300 bg-white border-purple-100 hover:border-purple-300 group">
                      <div className="flex gap-4">
                        {/* Thumbnail */}
                        {rec.thumbnail && (
                          <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-purple-200 to-indigo-200">
                            <img 
                              src={rec.thumbnail} 
                              alt={rec.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          </div>
                        )}
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h5 className="font-medium text-[#1E3A32] group-hover:text-purple-700 transition-colors line-clamp-1">
                              {rec.title}
                            </h5>
                            <Badge className="bg-purple-100 text-purple-800 text-xs flex-shrink-0">
                              {rec.difficulty}
                            </Badge>
                          </div>
                          
                          {rec.subtitle && (
                            <p className="text-xs text-[#2B2725]/60 mb-2 line-clamp-1">{rec.subtitle}</p>
                          )}
                          
                          {/* Top reason */}
                          {rec.reasons && rec.reasons.length > 0 && (
                            <div className="flex items-center gap-2 text-xs text-purple-700 bg-purple-50 px-2 py-1 rounded inline-block">
                              <Sparkles size={12} />
                              <span>{rec.reasons[0]}</span>
                            </div>
                          )}
                        </div>

                        {/* Arrow */}
                        <div className="flex items-center">
                          <ArrowRight 
                            size={20} 
                            className="text-[#2B2725]/30 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" 
                          />
                        </div>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>

            {recommendations.length > 3 && (
              <Button
                variant="outline"
                className="w-full border-purple-200 hover:bg-purple-50 hover:border-purple-300 text-purple-700"
                onClick={() => {
                  // Could navigate to a full recommendations page
                  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                }}
              >
                <BookOpen size={16} className="mr-2" />
                View All {recommendations.length} Recommendations
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}