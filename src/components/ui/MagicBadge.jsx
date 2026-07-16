import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function MagicBadge({ 
  children, 
  variant = "default",
  animate = true,
  className,
  ...props 
}) {
  const variants = {
    default: "bg-[#E4D9C4] text-[#2B2725]",
    gold: "bg-[#D8B46B] text-white",
    forest: "bg-[#1E3A32] text-white",
    plum: "bg-[#6E4F7D] text-white",
    sage: "bg-[#A6B7A3] text-white",
  };

  const Component = animate ? motion.span : "span";
  const animationProps = animate ? {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { type: "spring", stiffness: 400, damping: 20 }
  } : {};

  return (
    <Component
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium tracking-wide",
        variants[variant],
        className
      )}
      {...animationProps}
      {...props}
    >
      {children}
    </Component>
  );
}