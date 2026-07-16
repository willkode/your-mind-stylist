import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function MagicTooltip({ 
  children, 
  content,
  position = "top",
  delay = 0,
}) {
  const [isVisible, setIsVisible] = useState(false);

  const positions = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setTimeout(() => setIsVisible(true), delay)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute z-50 px-3 py-2 text-sm text-white bg-[#1E3A32] rounded-lg shadow-lg whitespace-nowrap pointer-events-none",
              positions[position]
            )}
          >
            {content}
            {/* Arrow */}
            <div 
              className={cn(
                "absolute w-2 h-2 bg-[#1E3A32] rotate-45",
                position === "top" && "bottom-[-4px] left-1/2 -translate-x-1/2",
                position === "bottom" && "top-[-4px] left-1/2 -translate-x-1/2",
                position === "left" && "right-[-4px] top-1/2 -translate-y-1/2",
                position === "right" && "left-[-4px] top-1/2 -translate-y-1/2"
              )}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}