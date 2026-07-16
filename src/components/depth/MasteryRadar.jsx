import React from "react";
import { motion } from "framer-motion";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";

export default function MasteryRadar({ depthMarker }) {
  const masteryAreas = depthMarker?.mastery_areas || {
    emotional_awareness: 0,
    consistent_practice: 0,
    breakthrough_capacity: 0,
    integration_depth: 0,
    reflective_wisdom: 0
  };

  const radarData = [
    { area: "Emotional Awareness", value: masteryAreas.emotional_awareness, fullMark: 100 },
    { area: "Consistent Practice", value: masteryAreas.consistent_practice, fullMark: 100 },
    { area: "Breakthrough Capacity", value: masteryAreas.breakthrough_capacity, fullMark: 100 },
    { area: "Integration Depth", value: masteryAreas.integration_depth, fullMark: 100 },
    { area: "Reflective Wisdom", value: masteryAreas.reflective_wisdom, fullMark: 100 }
  ];

  const averageMastery = Object.values(masteryAreas).reduce((a, b) => a + b, 0) / 5;

  return (
    <div className="bg-white rounded-xl p-8 shadow-md">
      <div className="text-center mb-8">
        <h3 className="font-serif text-2xl text-[#1E3A32] mb-2">Mastery Profile</h3>
        <p className="text-[#2B2725]/70">Your transformation signature across five dimensions</p>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <RadarChart data={radarData}>
          <PolarGrid stroke="#E4D9C4" />
          <PolarAngleAxis dataKey="area" tick={{ fill: '#2B2725', fontSize: 12 }} />
          <Radar
            name="Mastery"
            dataKey="value"
            stroke="#D8B46B"
            fill="#D8B46B"
            fillOpacity={0.6}
          />
        </RadarChart>
      </ResponsiveContainer>

      {/* Mastery Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8">
        {radarData.map((item, idx) => (
          <motion.div
            key={item.area}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="text-center"
          >
            <p className="text-3xl font-bold text-[#1E3A32] mb-1">{item.value}</p>
            <p className="text-xs text-[#2B2725]/70">{item.area.replace('_', ' ')}</p>
          </motion.div>
        ))}
      </div>

      {/* Overall Score */}
      <div className="mt-8 p-6 bg-[#F9F5EF] rounded-lg text-center">
        <p className="text-sm text-[#2B2725]/60 mb-2">Overall Mastery</p>
        <p className="text-4xl font-bold text-[#D8B46B]">{averageMastery.toFixed(0)}</p>
        <p className="text-sm text-[#2B2725]/70 mt-2">
          {averageMastery < 30 ? "Building foundation" :
           averageMastery < 60 ? "Growing steadily" :
           averageMastery < 80 ? "Deep integration" :
           "Master level"}
        </p>
      </div>
    </div>
  );
}