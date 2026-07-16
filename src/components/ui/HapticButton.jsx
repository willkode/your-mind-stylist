import React from "react";
import { Button } from "@/components/ui/button";
import haptics from "../utils/haptics";

/**
 * Button component with built-in haptic feedback
 */
export default function HapticButton({ 
  children, 
  onClick, 
  hapticType = "light",
  className,
  ...props 
}) {
  const handleClick = (e) => {
    haptics[hapticType]?.();
    onClick?.(e);
  };

  return (
    <Button 
      onClick={handleClick}
      className={`touch-manipulation active:scale-95 transition-transform ${className || ''}`}
      {...props}
    >
      {children}
    </Button>
  );
}