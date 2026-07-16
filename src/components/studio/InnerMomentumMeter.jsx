import React, { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Info, CheckCircle2, Circle } from "lucide-react";

export default function InnerMomentumMeter({ weeklyPoints = 0, className = "" }) {
  const [showInfo, setShowInfo] = useState(false);

  // Activity point values
  const activities = [
    { name: "Daily Style Check", points: 2, icon: "✓" },
    { name: "Notes/Reflections", points: 1, icon: "✎" },
    { name: "Lessons Completed", points: 5, icon: "▶" },
    { name: "Style Pauses", points: 1, icon: "⏸" }
  ];

  const getMomentumLevel = () => {
    if (weeklyPoints >= 41) return { 
      name: "Deepening Practice", 
      message: "Presence compounds. You're doing beautifully.",
      color: "#D8B46B" 
    };
    if (weeklyPoints >= 26) return { 
      name: "Strong Presence", 
      message: "You've arrived for yourself this week.",
      color: "#A6B7A3" 
    };
    if (weeklyPoints >= 11) return { 
      name: "Growing Momentum", 
      message: "You're building gentle momentum.",
      color: "#6E4F7D" 
    };
    return { 
      name: "Getting Started", 
      message: "Every moment of presence matters. You're building a foundation.",
      color: "#E4D9C4" 
    };
  };

  const level = getMomentumLevel();
  const maxPoints = 70;
  const progress = Math.min((weeklyPoints / maxPoints) * 100, 100);
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className={`bg-white p-6 rounded-lg ${className}`}
    >
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp size={20} className="text-[#A6B7A3]" />
        <p className="text-xs text-[#2B2725]/60 uppercase tracking-wider">
          Inner Momentum
        </p>
      </div>

      {/* Progress Section */}
      <div className="flex items-center gap-6 mb-8 pb-6 border-b border-[#E4D9C4]">
        {/* Circular progress */}
        <div className="relative flex-shrink-0">
          <svg width="120" height="120" className="transform -rotate-90">
            <circle
              cx="60"
              cy="60"
              r="45"
              stroke="#E4D9C4"
              strokeWidth="8"
              fill="none"
            />
            <motion.circle
              cx="60"
              cy="60"
              r="45"
              stroke={level.color}
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, ease: "easeOut" }}
              style={{
                strokeDasharray: circumference,
              }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="font-serif text-2xl text-[#1E3A32]">{weeklyPoints}</p>
              <p className="text-xs text-[#2B2725]/60">this week</p>
            </div>
          </div>
        </div>

        {/* Status Text */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-serif text-xl text-[#1E3A32]">
              {level.name}
            </h3>
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="text-[#D8B46B] hover:text-[#C9A55A] transition-colors flex-shrink-0"
              title="How momentum works"
            >
              <Info size={16} />
            </button>
          </div>
          <p className="text-sm text-[#2B2725]/70 leading-relaxed italic">
            {level.message}
          </p>
        </div>
      </div>

      {/* How It Works */}
      {showInfo && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-6 pb-6 border-b border-[#E4D9C4]"
        >
          <p className="text-xs font-medium text-[#1E3A32] uppercase tracking-wider mb-4">
            How to Build Momentum
          </p>
          <div className="space-y-2">
            {activities.map((activity) => (
              <div key={activity.name} className="flex items-center justify-between text-sm">
                <span className="text-[#2B2725]/70">{activity.name}</span>
                <span className="font-medium text-[#D8B46B]">+{activity.points} pts</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Today's Opportunities */}
      <div>
        <p className="text-xs font-medium text-[#1E3A32] uppercase tracking-wider mb-4">
          Complete Today To Earn Points
        </p>
        <div className="space-y-3">
          {activities.map((activity) => (
            <div 
              key={activity.name} 
              className="flex items-center gap-3 p-3 rounded-lg bg-[#F9F5EF] hover:bg-[#E4D9C4]/30 transition-colors cursor-pointer group"
            >
              <div className="text-[#D8B46B] group-hover:text-[#C9A55A] transition-colors flex-shrink-0">
                <Circle size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#2B2725] font-medium">
                  {activity.name}
                </p>
                <p className="text-xs text-[#2B2725]/60">
                  +{activity.points} point{activity.points > 1 ? 's' : ''}
                </p>
              </div>
              <span className="text-xs font-medium text-[#D8B46B] flex-shrink-0">
                {activity.points}pt
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}