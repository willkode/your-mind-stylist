import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lightbulb, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardTooltips() {
  const [currentTip, setCurrentTip] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const tips = [
    {
      id: "emotional-weather",
      title: "Track Your Emotional Weather",
      description: "This widget analyzes your recent notes to show patterns in your emotional landscape. Use it to gain awareness of your inner climate.",
      targetSelector: "[data-tour='emotional-weather']",
      position: "bottom"
    },
    {
      id: "daily-prompt",
      title: "Daily Pocket Prompts",
      description: "Each day, you'll get a new reflective prompt. Take a moment to respond—it's a micro-practice that compounds over time.",
      targetSelector: "[data-tour='daily-prompt']",
      position: "bottom"
    },
    {
      id: "constellation",
      title: "Your Constellation Map",
      description: "Every engagement earns you points that light up your constellation. It's a visual reminder of your consistent practice.",
      targetSelector: "[data-tour='constellation']",
      position: "top"
    },
    {
      id: "momentum",
      title: "Inner Momentum Meter",
      description: "Track your weekly momentum. The more you engage, the higher your momentum—and the stronger your habit becomes.",
      targetSelector: "[data-tour='momentum']",
      position: "top"
    }
  ];

  useEffect(() => {
    const hasSeenTooltips = localStorage.getItem("dashboard_tooltips_seen");
    if (!hasSeenTooltips) {
      // Wait 2 seconds after page load to show first tooltip
      setTimeout(() => {
        setIsVisible(true);
      }, 2000);
    }
  }, []);

  const handleNext = () => {
    if (currentTip < tips.length - 1) {
      setCurrentTip(currentTip + 1);
    } else {
      handleDismiss();
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("dashboard_tooltips_seen", "true");
  };

  const tip = tips[currentTip];

  if (!isVisible) return null;

  // Don't show the tooltip tour on mobile — it overlays the entire screen
  if (typeof window !== "undefined" && window.innerWidth < 1024) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 pointer-events-none"
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40" onClick={handleDismiss} style={{ pointerEvents: "auto" }} />

        {/* Tooltip */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="absolute bg-white rounded-lg shadow-2xl p-6 max-w-sm pointer-events-auto"
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)"
          }}
        >
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-[#2B2725]/40 hover:text-[#2B2725]"
          >
            <X size={18} />
          </button>

          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#D8B46B]/20 flex items-center justify-center flex-shrink-0">
              <Lightbulb size={20} className="text-[#D8B46B]" />
            </div>
            <div>
              <h3 className="font-serif text-lg text-[#1E3A32] mb-1">{tip.title}</h3>
              <p className="text-sm text-[#2B2725]/70 leading-relaxed">{tip.description}</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#E4D9C4]">
            <div className="text-xs text-[#2B2725]/60">
              Tip {currentTip + 1} of {tips.length}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className="text-[#2B2725]/60"
              >
                Skip Tour
              </Button>
              <Button
                size="sm"
                onClick={handleNext}
                className="bg-[#1E3A32] hover:bg-[#2B2725]"
              >
                {currentTip < tips.length - 1 ? (
                  <>
                    Next
                    <ArrowRight size={14} className="ml-1" />
                  </>
                ) : (
                  "Got it!"
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}