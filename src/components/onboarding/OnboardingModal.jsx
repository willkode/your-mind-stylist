import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, BookOpen, Layers, X } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";

export default function OnboardingModal({ role = "user", onComplete }) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem(`onboarding_${role}_complete`);
    if (!hasSeenOnboarding) {
      setIsOpen(true);
    }
  }, [role]);

  const handleComplete = () => {
    localStorage.setItem(`onboarding_${role}_complete`, 'true');
    setIsOpen(false);
    if (onComplete) onComplete();
  };

  const flows = {
    user: {
      title: "Welcome to The Mind Stylist Portal",
      steps: [
        {
          icon: Sparkles,
          title: "Welcome to Your Portal",
          description: "Everything you purchase will appear in your Library. You can access your programs, Inner Rehearsal Sessions™, and more from your dashboard.",
          actions: [
            { label: "Explore Programs", link: "WorkWithMe" },
            { label: "Watch Free Masterclass", link: "FreeMasterclass" },
            { label: "Visit Blog", link: "Blog" },
          ]
        },
      ]
    },
    manager: {
      title: "Welcome, Manager",
      steps: [
        {
          icon: Layers,
          title: "Your Manager Dashboard",
          description: "This is where you create content, manage users, and review inquiries. Let's walk through the main sections.",
          highlights: [
            "Blog Manager — Create and publish articles",
            "Course Manager — Build courses and lessons",
            "Audio Manager — Upload Inner Rehearsal Sessions™",
            "Messages — Review user inquiries",
            "Settings — Manage notifications"
          ]
        },
        {
          icon: Sparkles,
          title: "AI Assistant",
          description: "Use the AI Assistant to draft content, refine your ideas, and structure lessons. It appears in the right drawer when editing.",
          highlights: [
            "Quick prompts for common tasks",
            "Custom prompt input",
            "Tone and style controls",
            "Insert directly into editor"
          ]
        },
      ]
    },
    admin: {
      title: "Welcome to Studio Admin",
      steps: [
        {
          icon: Layers,
          title: "App-Level Control",
          description: "From here you control content, roadmap, roles, and legal pages. This is your high-level dashboard.",
          highlights: [
            "Studio Dashboard — Overview and stats",
            "Content Control — Manage all published content",
            "Roadmap — Track features and development",
            "Dev Docs — Technical documentation",
            "Roles & Access — User permissions",
            "Legal Pages — Terms, privacy, policies"
          ]
        },
      ]
    }
  };

  const flow = flows[role];
  const currentStep = flow.steps[step];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl">
        <button
          onClick={handleComplete}
          className="absolute right-4 top-4 text-[#2B2725]/60 hover:text-[#1E3A32]"
        >
          <X size={20} />
        </button>
        
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl text-[#1E3A32] mb-2">
            {flow.title}
          </DialogTitle>
        </DialogHeader>

        <div className="py-6">
          <div className="w-16 h-16 rounded-full bg-[#D8B46B]/20 flex items-center justify-center mb-6 mx-auto">
            <currentStep.icon size={32} className="text-[#D8B46B]" />
          </div>

          <h3 className="font-serif text-2xl text-[#1E3A32] mb-4 text-center">
            {currentStep.title}
          </h3>

          <p className="text-[#2B2725]/80 text-lg leading-relaxed mb-6 text-center">
            {currentStep.description}
          </p>

          {currentStep.highlights && (
            <div className="bg-[#F9F5EF] p-6 mb-6 space-y-2">
              {currentStep.highlights.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-[#D8B46B] mt-1">✦</span>
                  <span className="text-[#2B2725]/80">{item}</span>
                </div>
              ))}
            </div>
          )}

          {currentStep.actions && (
            <div className="flex flex-col gap-3 mb-6">
              {currentStep.actions.map((action, i) => (
                <Link
                  key={i}
                  to={action.link.startsWith('/') ? action.link : createPageUrl(action.link)}
                  onClick={handleComplete}
                  className="px-6 py-3 border border-[#D8B46B] text-[#1E3A32] text-center hover:bg-[#D8B46B]/10 transition-all"
                >
                  {action.label}
                </Link>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-[#2B2725]/60">
              Step {step + 1} of {flow.steps.length}
            </div>
            <div className="flex gap-2">
              {step < flow.steps.length - 1 ? (
                <Button onClick={() => setStep(step + 1)} className="bg-[#1E3A32]">
                  Next
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              ) : (
                <Button onClick={handleComplete} className="bg-[#1E3A32]">
                  Get Started
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}