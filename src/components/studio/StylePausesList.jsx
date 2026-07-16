import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Play, Filter } from "lucide-react";
import { motion } from "framer-motion";

export default function StylePausesList({ onSelectPause, sourceContext = "browse" }) {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: pauses = [], isLoading } = useQuery({
    queryKey: ["style-pauses"],
    queryFn: () => base44.entities.StylePause.filter({ is_published: true }, "sort_order")
  });

  const categories = [
    { value: "all", label: "All", color: "bg-[#2B2725]/10" },
    { value: "reset", label: "Reset", color: "bg-blue-100 text-blue-800" },
    { value: "restyle", label: "Restyle", color: "bg-purple-100 text-purple-800" },
    { value: "interrupt", label: "Interrupt", color: "bg-amber-100 text-amber-800" },
    { value: "anchor", label: "Anchor", color: "bg-green-100 text-green-800" }
  ];

  const filteredPauses = selectedCategory === "all" 
    ? pauses 
    : pauses.filter(p => p.category === selectedCategory);

  const getCategoryColor = (category) => {
    return categories.find(c => c.value === category)?.color || "bg-gray-100";
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  if (isLoading) {
    return (
      <div className="text-center py-12 text-[#2B2725]/60">
        Loading pauses...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-serif text-3xl text-[#1E3A32] mb-2">Style Pauses™</h2>
        <p className="text-[#2B2725]/70">
          Short, guided pauses to reset your state and restyle your response.
        </p>
      </div>

      {/* Category Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={16} className="text-[#2B2725]/40" />
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            className={`px-3 py-1.5 rounded-full text-sm transition-all ${
              selectedCategory === cat.value
                ? "bg-[#D8B46B] text-white"
                : "bg-[#F9F5EF] text-[#2B2725]/70 hover:bg-[#E4D9C4]"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Pauses List */}
      {filteredPauses.length === 0 ? (
        <div className="text-center py-12 bg-[#F9F5EF] rounded-lg">
          <p className="text-[#2B2725]/60">
            No pauses here yet. Your Studio is getting stocked.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filteredPauses.map((pause, idx) => (
            <motion.div
              key={pause.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white border border-[#E4D9C4] rounded-lg p-6 hover:shadow-md transition-all group cursor-pointer"
              onClick={() => onSelectPause(pause, sourceContext)}
            >
              <div className="flex items-start justify-between mb-4">
                <Badge className={getCategoryColor(pause.category)}>
                  {pause.category}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-[#2B2725]/60">
                  <Clock size={14} />
                  {formatDuration(pause.duration_seconds)}
                </div>
              </div>

              <h3 className="font-medium text-[#1E3A32] mb-2 group-hover:text-[#D8B46B] transition-colors">
                {pause.title}
              </h3>

              <div className="flex items-center gap-2 text-sm text-[#D8B46B]">
                <Play size={14} />
                <span>Start Pause</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}