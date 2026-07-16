import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Sparkles, TrendingUp, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEO from "../components/SEO";
import GrowthRingsVisualization from "../components/depth/GrowthRingsVisualization";
import MasteryRadar from "../components/depth/MasteryRadar";
import UnlockedContentPanel from "../components/depth/UnlockedContentPanel";

export default function DepthDashboard() {
  const [showAllRings, setShowAllRings] = useState(false);
  const queryClient = useQueryClient();

  const { data: depthMarker, isLoading } = useQuery({
    queryKey: ["depthMarker"],
    queryFn: async () => {
      const markers = await base44.entities.DepthMarker.list();
      return markers[0] || null;
    }
  });

  const calculatePointsMutation = useMutation({
    mutationFn: () => base44.functions.invoke('calculateDepthPoints', {}),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["depthMarker"] });
      if (response.data.leveled_up) {
        // Could trigger celebration modal here
        console.log("Level up!", response.data.new_ring);
      }
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center">
        <div className="text-center">
          <Sparkles size={48} className="text-[#D8B46B] animate-pulse mx-auto mb-4" />
          <p className="text-[#2B2725]/70">Loading your transformation depth...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Your Depth - Transformation Journey"
        description="Track your growth rings, mastery levels, and unlocked wisdom"
      />
      <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <Sparkles size={32} className="text-[#D8B46B]" />
              <h1 className="font-serif text-4xl md:text-5xl text-[#1E3A32]">
                Your Depth
              </h1>
            </div>
            <p className="text-lg text-[#2B2725]/70 max-w-2xl mx-auto mb-6">
              Like growth rings in a tree, each layer marks your deepening transformation.
              The work shows in the rings.
            </p>
            <Button
              onClick={() => calculatePointsMutation.mutate()}
              disabled={calculatePointsMutation.isPending}
              className="bg-[#1E3A32] hover:bg-[#2B4A40]"
            >
              <TrendingUp size={18} className="mr-2" />
              {calculatePointsMutation.isPending ? "Calculating..." : "Recalculate Depth"}
            </Button>
          </motion.div>

          {/* Growth Rings Visualization */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-12"
          >
            <GrowthRingsVisualization 
              depthMarker={depthMarker} 
              showDetails={showAllRings}
            />
            <div className="text-center mt-6">
              <Button
                variant="outline"
                onClick={() => setShowAllRings(!showAllRings)}
              >
                {showAllRings ? "Hide All Rings" : "Show All Rings"}
              </Button>
            </div>
          </motion.div>

          {/* Two Column Layout */}
          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            {/* Mastery Radar */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <MasteryRadar depthMarker={depthMarker} />
            </motion.div>

            {/* Unlocked Content */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <UnlockedContentPanel depthMarker={depthMarker} />
            </motion.div>
          </div>

          {/* Achievements */}
          {depthMarker?.achievements && depthMarker.achievements.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl p-8 shadow-md"
            >
              <div className="flex items-center gap-2 mb-6">
                <Award size={24} className="text-[#D8B46B]" />
                <h2 className="font-serif text-2xl text-[#1E3A32]">
                  Special Achievements
                </h2>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {depthMarker.achievements.map((achievement, idx) => (
                  <motion.div
                    key={achievement.achievement_key}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + idx * 0.1 }}
                    className="p-4 rounded-lg bg-gradient-to-br from-[#D8B46B]/10 to-[#A6B7A3]/10 border border-[#D8B46B]/30"
                  >
                    <p className="text-2xl mb-2">🏆</p>
                    <h3 className="font-medium text-[#1E3A32] mb-1">
                      {achievement.achievement_name}
                    </h3>
                    <p className="text-xs text-[#2B2725]/60">
                      Earned {new Date(achievement.earned_date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-[#D8B46B] mt-2 font-medium">
                      +{achievement.points_awarded} depth points
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 bg-gradient-to-br from-[#1E3A32] to-[#2B4A40] rounded-xl p-8 text-center"
          >
            <Sparkles size={32} className="text-[#D8B46B] mx-auto mb-4" />
            <h3 className="font-serif text-2xl text-[#F9F5EF] mb-3">
              Depth Over Speed
            </h3>
            <p className="text-[#F9F5EF]/80 max-w-2xl mx-auto leading-relaxed">
              These rings aren't about racing through content—they're about the integration that happens
              when you pause, reflect, and let the work sink in. Each reflection, each breakthrough, 
              each moment of awareness adds another layer. The depth is the point.
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );
}