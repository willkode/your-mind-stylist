import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Calendar, User, Video, X, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";

export default function OnboardingChecklist({ user }) {
  const [isVisible, setIsVisible] = useState(true);
  const [completedSteps, setCompletedSteps] = useState([]);

  useEffect(() => {
    const dismissed = localStorage.getItem("onboarding_checklist_dismissed");
    if (dismissed) {
      setIsVisible(false);
    }

    const completed = JSON.parse(localStorage.getItem("onboarding_checklist_completed") || "[]");
    setCompletedSteps(completed);
  }, []);

  const steps = [
    {
      id: "profile",
      title: "Complete Your Profile",
      description: "Add your preferences and interests",
      icon: User,
      link: "StudioSettings",
      autoCheck: !!user?.full_name
    },
    {
      id: "masterclass",
      title: "Watch the Free Masterclass",
      description: "Learn the Mind Styling fundamentals",
      icon: Video,
      link: "FreeMasterclass",
      autoCheck: false
    },
    {
      id: "session",
      title: "Schedule Your First Session",
      description: "Book a consultation or coaching session",
      icon: Calendar,
      link: "Bookings",
      autoCheck: false
    }
  ];

  const handleMarkComplete = (stepId) => {
    const updated = [...completedSteps, stepId];
    setCompletedSteps(updated);
    localStorage.setItem("onboarding_checklist_completed", JSON.stringify(updated));
  };

  const handleDismiss = () => {
    localStorage.setItem("onboarding_checklist_dismissed", "true");
    setIsVisible(false);
  };

  const isStepComplete = (step) => {
    return step.autoCheck || completedSteps.includes(step.id);
  };

  const allComplete = steps.every(isStepComplete);
  const completedCount = steps.filter(isStepComplete).length;

  if (!isVisible || allComplete) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mb-8"
      >
        <Card className="bg-gradient-to-r from-[#D8B46B]/10 to-[#A6B7A3]/10 border-2 border-[#D8B46B]/30 p-6 relative">
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-[#2B2725]/40 hover:text-[#2B2725] transition-colors"
          >
            <X size={20} />
          </button>

          <div className="mb-4">
            <h2 className="font-serif text-2xl text-[#1E3A32] mb-2">Welcome to Your Journey</h2>
            <p className="text-[#2B2725]/70">Complete these steps to get the most from your experience</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm text-[#2B2725]/60 mb-2">
              <span>{completedCount} of {steps.length} completed</span>
              <span>{Math.round((completedCount / steps.length) * 100)}%</span>
            </div>
            <div className="h-2 bg-[#E4D9C4] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(completedCount / steps.length) * 100}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-[#D8B46B]"
              />
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            {steps.map((step) => {
              const completed = isStepComplete(step);
              const StepIcon = step.icon;

              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                    completed 
                      ? "bg-white/50" 
                      : "bg-white hover:shadow-md"
                  }`}
                >
                  <div className="flex-shrink-0">
                    {completed ? (
                      <CheckCircle2 size={24} className="text-[#A6B7A3]" />
                    ) : (
                      <Circle size={24} className="text-[#2B2725]/30" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start gap-2">
                      <StepIcon size={18} className="text-[#D8B46B] mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className={`font-medium ${completed ? "text-[#2B2725]/60 line-through" : "text-[#1E3A32]"}`}>
                          {step.title}
                        </h3>
                        <p className="text-sm text-[#2B2725]/60">{step.description}</p>
                      </div>
                    </div>
                  </div>

                  {!completed && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-[#1E3A32] hover:text-[#D8B46B]"
                      onClick={() => window.location.href = createPageUrl(step.link)}
                    >
                      <ChevronRight size={16} />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}