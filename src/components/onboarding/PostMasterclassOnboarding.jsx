import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Check, Brain, Calendar, BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";

export default function PostMasterclassOnboarding() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        // Show onboarding if user just signed up for masterclass
        const urlParams = new URLSearchParams(window.location.search);
        const fromMasterclass = urlParams.get('from_masterclass') === 'true';
        
        // Or check if they have the flag in their user data
        const needsOnboarding = currentUser.needs_masterclass_onboarding || fromMasterclass;
        
        if (needsOnboarding) {
          setIsVisible(true);
        }
      } catch (error) {
        console.error("Error checking onboarding:", error);
      }
    };
    checkOnboarding();
  }, []);

  const handleComplete = async () => {
    // Mark onboarding as complete
    try {
      await base44.auth.updateMe({ needs_masterclass_onboarding: false });
      setIsVisible(false);
    } catch (error) {
      console.error("Error completing onboarding:", error);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const steps = [
    {
      icon: Brain,
      title: "Welcome to Your Mind Stylist Portal",
      description: "You now have access to the Imposter Syndrome Masterclass and your personal transformation dashboard. Let's get you oriented.",
      actions: [
        {
          label: "Start Tour",
          primary: true,
          onClick: () => setCurrentStep(1),
        },
      ],
    },
    {
      icon: BookOpen,
      title: "Your Masterclass Is Ready",
      description: "Access the full Imposter Syndrome masterclass anytime from your Library. You can pause, rewatch, and take notes as you go.",
      actions: [
        {
          label: "Watch Masterclass Now",
          primary: true,
          link: "Library",
        },
        {
          label: "Next",
          primary: false,
          onClick: () => setCurrentStep(2),
        },
      ],
    },
    {
      icon: Sparkles,
      title: "Explore Your Transformation Tools",
      description: "Your dashboard includes the Mind Styling Studio™, Style Pauses™, notes journal, and progress tracking—all designed to help you shift patterns and build emotional intelligence.",
      actions: [
        {
          label: "Explore Studio",
          primary: true,
          link: "Dashboard",
        },
        {
          label: "Next",
          primary: false,
          onClick: () => setCurrentStep(3),
        },
      ],
    },
    {
      icon: Calendar,
      title: "Ready to Go Deeper?",
      description: "If the masterclass resonated, you can continue your work through private coaching, certification training, or group programs. No pressure—everything's here when you're ready.",
      actions: [
        {
          label: "Explore Programs",
          primary: true,
          link: "Programs",
        },
        {
          label: "Schedule a Call",
          primary: false,
          link: "Bookings",
        },
        {
          label: "Finish Tour",
          primary: false,
          onClick: handleComplete,
        },
      ],
    },
  ];

  const currentStepData = steps[currentStep];

  if (!isVisible || !currentStepData) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-white rounded-lg shadow-2xl max-w-2xl w-full relative overflow-hidden"
        >
          {/* Header */}
          <div className="absolute top-4 right-4">
            <button
              onClick={handleSkip}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="flex gap-2 px-8 pt-6">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full transition-all ${
                  index <= currentStep ? "bg-[#D8B46B]" : "bg-gray-200"
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <div className="p-8 pt-6">
            <div className="w-16 h-16 rounded-full bg-[#D8B46B]/10 flex items-center justify-center mb-6">
              <currentStepData.icon size={32} className="text-[#D8B46B]" />
            </div>

            <h2 className="font-serif text-3xl text-[#1E3A32] mb-4">
              {currentStepData.title}
            </h2>

            <p className="text-[#2B2725]/80 text-lg leading-relaxed mb-8">
              {currentStepData.description}
            </p>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              {currentStepData.actions.map((action, index) => {
                if (action.link) {
                  return (
                    <Link
                      key={index}
                      to={createPageUrl(action.link)}
                      onClick={handleComplete}
                      className={`inline-flex items-center gap-2 px-6 py-3 text-sm tracking-wide transition-all ${
                        action.primary
                          ? "bg-[#1E3A32] text-[#F9F5EF] hover:bg-[#2B2725]"
                          : "border border-[#E4D9C4] text-[#1E3A32] hover:bg-[#F9F5EF]"
                      }`}
                    >
                      {action.label}
                      <ArrowRight size={16} />
                    </Link>
                  );
                }

                return (
                  <button
                    key={index}
                    onClick={action.onClick}
                    className={`inline-flex items-center gap-2 px-6 py-3 text-sm tracking-wide transition-all ${
                      action.primary
                        ? "bg-[#1E3A32] text-[#F9F5EF] hover:bg-[#2B2725]"
                        : "border border-[#E4D9C4] text-[#1E3A32] hover:bg-[#F9F5EF]"
                    }`}
                  >
                    {action.label}
                    {action.primary && <ArrowRight size={16} />}
                  </button>
                );
              })}
            </div>

            {/* Skip link */}
            <div className="mt-4">
              <button
                onClick={handleSkip}
                className="text-sm text-[#2B2725]/60 hover:text-[#2B2725] transition-colors"
              >
                Skip tour, I'll explore on my own
              </button>
            </div>
          </div>

          {/* Step indicator */}
          <div className="px-8 pb-6">
            <p className="text-sm text-[#2B2725]/60 text-center">
              Step {currentStep + 1} of {steps.length}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}