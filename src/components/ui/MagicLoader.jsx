import React from "react";
import { motion } from "framer-motion";

export function MagicLoader({ size = "md", text = "Loading..." }) {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative" style={{ width: "48px", height: "48px" }}>
        {/* Outer ring */}
        <motion.div
          className="absolute inset-0 border-4 border-[#D8B46B]/30 rounded-full"
          animate={{ rotate: 360 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        
        {/* Inner ring */}
        <motion.div
          className="absolute inset-0 border-4 border-t-[#D8B46B] border-r-transparent border-b-transparent border-l-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        
        {/* Center dot */}
        <motion.div
          className="absolute top-1/2 left-1/2 w-2 h-2 bg-[#1E3A32] rounded-full"
          style={{ x: "-50%", y: "-50%" }}
          animate={{ scale: [1, 1.5, 1] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>
      
      {text && (
        <motion.p
          className="text-sm text-[#2B2725]/70 tracking-wide"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
}