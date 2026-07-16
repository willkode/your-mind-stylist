import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function MagicButton({ 
  children, 
  onClick, 
  variant = "default",
  size = "default",
  className,
  disabled = false,
  ...props 
}) {
  const variants = {
    default: "bg-[#1E3A32] hover:bg-[#2B4A40] text-white",
    outline: "border-2 border-[#1E3A32] text-[#1E3A32] hover:bg-[#1E3A32] hover:text-white",
    ghost: "text-[#1E3A32] hover:bg-[#F9F5EF]",
    gold: "bg-[#D8B46B] hover:bg-[#C9A55B] text-[#1E3A32]",
  };

  const sizes = {
    default: "px-6 py-3",
    sm: "px-4 py-2 text-sm",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={cn(
        "relative overflow-hidden font-medium tracking-wide transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {/* Shine effect on hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        initial={{ x: "-100%" }}
        whileHover={{ x: "100%" }}
        transition={{ duration: 0.6 }}
      />
      
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </motion.button>
  );
}