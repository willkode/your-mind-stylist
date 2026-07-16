import React from "react";
import { Users, Play, MousePointer, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";

export default function FunnelVisualization({ signups }) {
  const totalSignups = signups.length;
  const watchedCount = signups.filter(s => s.watched).length;
  const clickedCTACount = signups.filter(s => s.clicked_cta).length;
  const convertedCount = signups.filter(s => s.converted_to).length;

  const watchRate = totalSignups > 0 ? (watchedCount / totalSignups) * 100 : 0;
  const ctaClickRate = watchedCount > 0 ? (clickedCTACount / watchedCount) * 100 : 0;
  const conversionRate = clickedCTACount > 0 ? (convertedCount / clickedCTACount) * 100 : 0;

  const stages = [
    {
      icon: Users,
      label: "Signed Up",
      count: totalSignups,
      percentage: 100,
      color: "#6E4F7D"
    },
    {
      icon: Play,
      label: "Watched",
      count: watchedCount,
      percentage: watchRate,
      color: "#2D8CFF",
      dropoff: totalSignups - watchedCount
    },
    {
      icon: MousePointer,
      label: "Clicked CTA",
      count: clickedCTACount,
      percentage: ctaClickRate,
      color: "#D8B46B",
      dropoff: watchedCount - clickedCTACount
    },
    {
      icon: ShoppingCart,
      label: "Converted",
      count: convertedCount,
      percentage: conversionRate,
      color: "#A6B7A3",
      dropoff: clickedCTACount - convertedCount
    }
  ];

  return (
    <div className="bg-white p-6 shadow-md">
      <h3 className="font-serif text-xl text-[#1E3A32] mb-6">Funnel Visualization</h3>
      
      <div className="space-y-6">
        {stages.map((stage, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-center gap-4 mb-2">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${stage.color}20` }}
              >
                <stage.icon size={20} style={{ color: stage.color }} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-[#1E3A32]">{stage.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-serif text-[#1E3A32]">{stage.count}</span>
                    <span className="text-sm text-[#2B2725]/60">
                      ({stage.percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
                <div className="h-3 bg-[#F9F5EF] rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${stage.percentage}%`,
                      backgroundColor: stage.color
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Dropoff indicator */}
            {stage.dropoff > 0 && index < stages.length - 1 && (
              <div className="ml-14 mt-2 text-xs text-[#2B2725]/50">
                ↓ {stage.dropoff} dropped off
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-6 border-t border-[#E4D9C4] grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-2xl font-serif text-[#1E3A32] mb-1">
            {watchRate.toFixed(1)}%
          </div>
          <div className="text-xs text-[#2B2725]/60">Watch Rate</div>
        </div>
        <div>
          <div className="text-2xl font-serif text-[#1E3A32] mb-1">
            {ctaClickRate.toFixed(1)}%
          </div>
          <div className="text-xs text-[#2B2725]/60">CTA Click Rate</div>
        </div>
        <div>
          <div className="text-2xl font-serif text-[#1E3A32] mb-1">
            {conversionRate.toFixed(1)}%
          </div>
          <div className="text-xs text-[#2B2725]/60">Conversion Rate</div>
        </div>
      </div>
    </div>
  );
}