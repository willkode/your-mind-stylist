import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function MagicCard({ 
  children, 
  onClick, 
  className,
  hoverScale = true,
  hoverLift = true,
  ...props 
}) {
  return (
    <motion.div
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ 
        scale: hoverScale ? 1.02 : 1,
        y: hoverLift ? -4 : 0,
        transition: { type: "spring", stiffness: 300, damping: 20 }
      }}
      className={cn(
        "bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}