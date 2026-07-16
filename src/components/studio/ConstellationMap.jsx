import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function ConstellationMap({ totalPoints = 0, className = "" }) {
  const getConstellationLevel = () => {
    if (totalPoints >= 50) return { name: "Radiant", stars: 50, color: "#D8B46B" };
    if (totalPoints >= 26) return { name: "Formed", stars: 26, color: "#A6B7A3" };
    if (totalPoints >= 11) return { name: "Emerging", stars: 11, color: "#6E4F7D" };
    return { name: "Seed", stars: 0, color: "#E4D9C4" };
  };

  const level = getConstellationLevel();
  const progress = Math.min((totalPoints / 50) * 100, 100);

  // Generate star positions
  const generateStars = () => {
    const stars = [];
    const maxStars = Math.min(totalPoints, 50);
    
    for (let i = 0; i < maxStars; i++) {
      stars.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        delay: i * 0.05,
      });
    }
    return stars;
  };

  const stars = generateStars();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className={`bg-gradient-to-br from-[#1E3A32] to-[#2B2725] p-6 rounded-lg relative overflow-hidden ${className}`}
    >
      {/* Star field */}
      <div className="absolute inset-0">
        {stars.map((star) => (
          <motion.div
            key={star.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.8, scale: 1 }}
            transition={{ delay: star.delay, duration: 0.5 }}
            className="absolute rounded-full bg-[#D8B46B]"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={20} className="text-[#D8B46B]" />
          <p className="text-xs text-[#F9F5EF]/60 uppercase tracking-wider">
            Your Inner Constellation
          </p>
        </div>

        <div className="mb-4">
          <h3 className="font-serif text-3xl text-[#F9F5EF] mb-1">
            {level.name}
          </h3>
          <p className="text-[#F9F5EF]/70 text-sm">
            {totalPoints} {totalPoints === 1 ? "star" : "stars"} illuminated
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 bg-[#F9F5EF]/20 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-[#D8B46B]"
          />
        </div>
      </div>
    </motion.div>
  );
}