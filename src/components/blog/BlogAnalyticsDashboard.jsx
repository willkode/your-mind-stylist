import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Eye, Heart, Share2, MessageCircle, TrendingUp, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function BlogAnalyticsDashboard({ blogPostId }) {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["blogAnalytics", blogPostId],
    queryFn: async () => {
      if (!blogPostId) return null;
      const results = await base44.entities.BlogAnalytics.filter({ blog_post_id: blogPostId });
      return results[0] || {
        views: 0,
        unique_views: 0,
        likes: 0,
        shares: 0,
        comments: 0,
        avg_time_on_page: 0,
        conversion_count: 0,
      };
    },
    enabled: !!blogPostId,
  });

  if (isLoading || !analytics) {
    return <div className="text-[#2B2725]/60 text-sm">Loading analytics...</div>;
  }

  const metrics = [
    { label: "Views", value: analytics.views, icon: Eye, color: "#1E3A32" },
    { label: "Unique", value: analytics.unique_views, icon: TrendingUp, color: "#A6B7A3" },
    { label: "Likes", value: analytics.likes, icon: Heart, color: "#D8B46B" },
    { label: "Shares", value: analytics.shares, icon: Share2, color: "#6E4F7D" },
    { label: "Comments", value: analytics.comments, icon: MessageCircle, color: "#1E3A32" },
  ];

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="bg-white p-4 rounded border border-[#E4D9C4]">
            <div className="flex items-center gap-2 mb-2">
              <metric.icon size={16} style={{ color: metric.color }} />
              <span className="text-xs text-[#2B2725]/60">{metric.label}</span>
            </div>
            <p className="text-2xl font-semibold text-[#1E3A32]">{metric.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <div className="flex-1 bg-white p-4 rounded border border-[#E4D9C4]">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-[#A6B7A3]" />
            <span className="text-xs text-[#2B2725]/60">Avg Time on Page</span>
          </div>
          <p className="text-xl font-semibold text-[#1E3A32]">
            {formatTime(analytics.avg_time_on_page)}
          </p>
        </div>

        <div className="flex-1 bg-white p-4 rounded border border-[#E4D9C4]">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-[#D8B46B]" />
            <span className="text-xs text-[#2B2725]/60">Conversions</span>
          </div>
          <p className="text-xl font-semibold text-[#1E3A32]">{analytics.conversion_count}</p>
        </div>
      </div>
    </div>
  );
}