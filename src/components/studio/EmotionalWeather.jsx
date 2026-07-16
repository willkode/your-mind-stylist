import React from "react";
import { motion } from "framer-motion";
import { Cloud, Sun, CloudRain, Wind } from "lucide-react";

export default function EmotionalWeather({ sentiment, className = "" }) {
  const getWeather = () => {
    if (!sentiment) {
      return {
        icon: Sun,
        text: "A grounding mood might serve you today.",
        color: "text-[#D8B46B]",
      };
    }

    const weatherMap = {
      calm: {
        icon: Sun,
        text: "Feels like a grounding day.",
        color: "text-[#D8B46B]",
      },
      clarity: {
        icon: Sun,
        text: "Clarity is close.",
        color: "text-[#D8B46B]",
      },
      resistance: {
        icon: CloudRain,
        text: "A tender reset might serve you today.",
        color: "text-[#A6B7A3]",
      },
      overwhelm: {
        icon: Cloud,
        text: "A soft reset could be helpful right now.",
        color: "text-[#A6B7A3]",
      },
      confidence: {
        icon: Sun,
        text: "You're rising.",
        color: "text-[#D8B46B]",
      },
      curiosity: {
        icon: Wind,
        text: "Clarity feels just within reach.",
        color: "text-[#6E4F7D]",
      },
      tension: {
        icon: Cloud,
        text: "A moment of pause might ease this.",
        color: "text-[#A6B7A3]",
      },
      momentum: {
        icon: Sun,
        text: "You're building beautiful momentum.",
        color: "text-[#D8B46B]",
      },
    };

    return weatherMap[sentiment] || weatherMap.calm;
  };

  const weather = getWeather();
  const Icon = weather.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white p-6 rounded-lg ${className}`}
    >
      <div className="flex items-start gap-4">
        <div className={`${weather.color} opacity-70`}>
          <Icon size={32} />
        </div>
        <div className="flex-1">
          <p className="text-xs text-[#2B2725]/60 uppercase tracking-wider mb-2">
            Today's Emotional Weather
          </p>
          <p className="font-serif text-lg text-[#1E3A32] italic">
            {weather.text}
          </p>
        </div>
      </div>
    </motion.div>
  );
}