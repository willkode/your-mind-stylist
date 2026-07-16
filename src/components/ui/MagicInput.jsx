import React, { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function MagicInput({ 
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  className,
  error,
  ...props 
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasContent, setHasContent] = useState(false);

  const handleChange = (e) => {
    setHasContent(e.target.value.length > 0);
    onChange?.(e);
  };

  return (
    <div className="relative">
      {label && (
        <motion.label
          initial={false}
          animate={{
            y: isFocused || hasContent ? -24 : 0,
            scale: isFocused || hasContent ? 0.85 : 1,
            color: isFocused ? "#D8B46B" : "#2B2725",
          }}
          className="absolute left-3 top-3 text-[#2B2725]/70 pointer-events-none origin-left transition-colors"
        >
          {label}
        </motion.label>
      )}
      
      <motion.input
        type={type}
        value={value}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={isFocused ? placeholder : ""}
        animate={{
          borderColor: error ? "#DC2626" : isFocused ? "#D8B46B" : "#E4D9C4",
        }}
        transition={{ duration: 0.2 }}
        className={cn(
          "w-full px-3 py-3 border-2 rounded-lg bg-white transition-all duration-200",
          "focus:outline-none focus:ring-0",
          label && "pt-6 pb-2",
          error && "border-red-500",
          className
        )}
        {...props}
      />
      
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-600 mt-1"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}