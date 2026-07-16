import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Lock, CheckCircle } from "lucide-react";

const RING_NAMES = [
  { level: 1, name: "Awakening", color: "#E4D9C4", description: "First steps into awareness" },
  { level: 2, name: "Noticing", color: "#D8B46B", description: "Patterns emerge" },
  { level: 3, name: "Shifting", color: "#C5A052", description: "Choices replace reactions" },
  { level: 4, name: "Anchoring", color: "#A6B7A3", description: "New patterns take root" },
  { level: 5, name: "Deepening", color: "#8BA087", description: "Practice becomes natural" },
  { level: 6, name: "Integrating", color: "#6E4F7D", description: "Mind and body align" },
  { level: 7, name: "Embodying", color: "#5A3F66", description: "Living your transformation" },
  { level: 8, name: "Radiating", color: "#1E3A32", description: "Influence extends outward" },
  { level: 9, name: "Mastering", color: "#2B4A40", description: "Wisdom guides others" },
  { level: 10, name: "Illuminating", color: "#1A2E28", description: "Your light shows the way" }
];

export default function GrowthRingsVisualization({ depthMarker, showDetails = false }) {
  const currentLevel = depthMarker?.current_depth_level || 1;
  const totalPoints = depthMarker?.total_depth_points || 0;
  const pointsToNext = depthMarker?.points_to_next_level || 100;
  const progress = ((totalPoints % pointsToNext) / pointsToNext) * 100;

  return (
    <div className="relative">
      {/* Concentric Rings */}
      <div className="relative w-full aspect-square max-w-md mx-auto">
        {RING_NAMES.map((ring, idx) => {
          const isUnlocked = ring.level <= currentLevel;
          const isCurrent = ring.level === currentLevel;
          const size = 100 - (idx * 9);
          const opacity = isUnlocked ? 1 : 0.2;
          
          return (
            <motion.div
              key={ring.level}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: opacity,
                boxShadow: isCurrent ? `0 0 30px ${ring.color}80` : 'none'
              }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className="absolute top-1/2 left-1/2 rounded-full border-4 flex items-center justify-center"
              style={{
                width: `${size}%`,
                height: `${size}%`,
                transform: 'translate(-50%, -50%)',
                borderColor: ring.color,
                backgroundColor: isUnlocked ? `${ring.color}15` : 'transparent'
              }}
            >
              {isCurrent && (
                <div className="absolute inset-0 rounded-full border-2 border-dashed animate-spin-slow" 
                     style={{ borderColor: ring.color, animationDuration: '20s' }} />
              )}
            </motion.div>
          );
        })}

        {/* Center Content */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-full w-32 h-32 flex flex-col items-center justify-center shadow-xl"
          >
            <Sparkles size={32} className="text-[#D8B46B] mb-2" />
            <p className="text-3xl font-bold text-[#1E3A32]">{currentLevel}</p>
            <p className="text-xs text-[#2B2725]/60">Depth Level</p>
          </motion.div>
        </div>
      </div>

      {/* Current Ring Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mt-8 text-center"
      >
        <h3 className="font-serif text-2xl text-[#1E3A32] mb-2">
          {RING_NAMES[currentLevel - 1]?.name}
        </h3>
        <p className="text-[#2B2725]/70 mb-4">
          {RING_NAMES[currentLevel - 1]?.description}
        </p>

        {/* Progress to Next Ring */}
        {currentLevel < 10 && (
          <div className="max-w-md mx-auto">
            <div className="flex justify-between text-sm text-[#2B2725]/60 mb-2">
              <span>{totalPoints} points</span>
              <span>{pointsToNext} to next ring</span>
            </div>
            <div className="h-2 bg-[#E4D9C4] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ delay: 1, duration: 1 }}
                className="h-full bg-gradient-to-r from-[#D8B46B] to-[#A6B7A3]"
              />
            </div>
          </div>
        )}

        {currentLevel === 10 && (
          <div className="text-[#D8B46B] font-medium">
            🌟 Master Level Achieved
          </div>
        )}
      </motion.div>

      {/* All Rings Legend */}
      {showDetails && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-12 grid md:grid-cols-2 gap-4"
        >
          {RING_NAMES.map((ring) => {
            const isUnlocked = ring.level <= currentLevel;
            const isCurrent = ring.level === currentLevel;
            
            return (
              <div
                key={ring.level}
                className={`p-4 rounded-lg border-2 transition-all ${
                  isCurrent 
                    ? 'border-[#D8B46B] bg-[#D8B46B]/10' 
                    : isUnlocked
                    ? 'border-[#E4D9C4] bg-white'
                    : 'border-[#E4D9C4]/30 bg-[#F9F5EF]/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full border-4 flex items-center justify-center flex-shrink-0"
                    style={{ borderColor: ring.color }}
                  >
                    {isUnlocked ? (
                      <CheckCircle size={20} style={{ color: ring.color }} />
                    ) : (
                      <Lock size={16} className="text-[#2B2725]/30" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-medium ${isUnlocked ? 'text-[#1E3A32]' : 'text-[#2B2725]/40'}`}>
                      Ring {ring.level}: {ring.name}
                    </h4>
                    <p className={`text-sm ${isUnlocked ? 'text-[#2B2725]/70' : 'text-[#2B2725]/40'}`}>
                      {ring.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}