import React from "react";
import { motion } from "framer-motion";

export function PersonalizedGreeting({ user, variant = "dashboard" }) {
  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "morning";
    if (hour < 17) return "afternoon";
    return "evening";
  };

  const getGreeting = () => {
    const timeOfDay = getTimeOfDay();
    const firstName = user?.full_name?.split(" ")[0] || "there";
    
    const greetings = {
      morning: [
        `Good morning, ${firstName}.`,
        `Morning, ${firstName}.`,
        `Welcome back, ${firstName}.`,
      ],
      afternoon: [
        `Good afternoon, ${firstName}.`,
        `Hello, ${firstName}.`,
        `Welcome back, ${firstName}.`,
      ],
      evening: [
        `Good evening, ${firstName}.`,
        `Evening, ${firstName}.`,
        `Welcome back, ${firstName}.`,
      ],
    };

    const options = greetings[timeOfDay];
    return options[Math.floor(Math.random() * options.length)];
  };

  const getContextMessage = () => {
    const timeOfDay = getTimeOfDay();
    const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    
    const messages = {
      morning: [
        `How are you starting your ${dayOfWeek}?`,
        `Ready to set the tone for your day?`,
        `What's on your mind this morning?`,
      ],
      afternoon: [
        `How's your ${dayOfWeek} unfolding?`,
        `Taking a moment to pause?`,
        `What's shifted for you today?`,
      ],
      evening: [
        `How did your ${dayOfWeek} go?`,
        `Ready to unwind?`,
        `Time to reflect on your day?`,
      ],
    };

    const options = messages[timeOfDay];
    return options[Math.floor(Math.random() * options.length)];
  };

  if (variant === "dashboard") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-12"
      >
        <h1 className="font-serif text-4xl md:text-5xl text-[#1E3A32] mb-3">
          {getGreeting()}
        </h1>
        <p className="text-[#2B2725]/70 text-lg italic">
          {getContextMessage()}
        </p>
      </motion.div>
    );
  }

  if (variant === "minimal") {
    return (
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-serif text-2xl text-[#1E3A32]"
      >
        {getGreeting()}
      </motion.h2>
    );
  }

  return null;
}