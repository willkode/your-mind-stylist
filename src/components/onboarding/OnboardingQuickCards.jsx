import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, User, Calendar, X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";

export default function OnboardingQuickCards({ user }) {
  const [isVisible, setIsVisible] = useState(true);
  const [expandedCard, setExpandedCard] = useState(null);
  const [completedSteps, setCompletedSteps] = useState([]);

  useEffect(() => {
    const dismissed = localStorage.getItem("onboarding_cards_dismissed");
    if (dismissed) {
      setIsVisible(false);
    }

    const completed = JSON.parse(localStorage.getItem("onboarding_cards_completed") || "[]");
    setCompletedSteps(completed);
  }, []);

  const cards = [
    {
      id: "profile",
      title: "Complete Your Profile",
      description: "Add your preferences and interests",
      icon: User,
      link: "StudioSettings",
      color: "from-blue-500/10 to-blue-600/10",
      borderColor: "border-blue-200",
      autoCheck: !!user?.full_name
    },
    {
      id: "session",
      title: "Schedule a Session with Roberta",
      description: "Book a consultation or coaching session",
      icon: Calendar,
      external: "https://koalendar.com/u/roberta",
      color: "from-rose-500/10 to-rose-600/10",
      borderColor: "border-rose-200",
      autoCheck: false
    },
    {
      id: "programs",
      title: "View All Tools & Programs",
      description: "Discover the full range of transformational offerings — from introductory tools to deep transformation coaching.",
      icon: Sparkles,
      link: "Programs",
      solid: true,
      autoCheck: false
    }
  ];

  const handleMarkComplete = (cardId) => {
    if (!completedSteps.includes(cardId)) {
      const updated = [...completedSteps, cardId];
      setCompletedSteps(updated);
      localStorage.setItem("onboarding_cards_completed", JSON.stringify(updated));
    }
  };

  const handleDismiss = () => {
    localStorage.setItem("onboarding_cards_dismissed", "true");
    setIsVisible(false);
  };

  const isCardComplete = (card) => {
    return card.autoCheck || completedSteps.includes(card.id);
  };

  if (!isVisible) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="font-serif text-2xl text-[#1E3A32]">Get Started</h2>
        <button
          onClick={handleDismiss}
          className="text-[#2B2725]/40 hover:text-[#2B2725] transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((card) => {
          const CardIcon = card.icon;
          const isExpanded = expandedCard === card.id;
          const isComplete = isCardComplete(card);

          return (
            <motion.div
              key={card.id}
              layout
            >
              <Card
                className={`${card.solid ? "bg-[#A6B7A3] border-2 border-[#A6B7A3]" : `bg-gradient-to-br ${card.color} border-2 ${card.borderColor}`} cursor-pointer transition-all ${
                  isComplete ? "opacity-60" : "hover:shadow-md"
                }`}
                onClick={() => setExpandedCard(isExpanded ? null : card.id)}
              >
                <div className="p-5">
                  <div className="flex items-start gap-3 mb-3 justify-between w-full">
                    <div className="flex items-start gap-3 flex-1">
                      <CardIcon size={24} className={`${card.solid ? "text-white" : "text-[#1E3A32]"} flex-shrink-0`} />
                      <h4 className={`font-medium ${card.solid ? "text-white" : "text-[#1E3A32]"} ${isComplete ? "line-through opacity-60" : ""}`}>
                        {card.title}
                      </h4>
                    </div>
                    <ChevronDown
                      size={18}
                      className={`${card.solid ? "text-white/70" : "text-[#2B2725]/60"} flex-shrink-0 transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pt-3 border-t border-[#2B2725]/10"
                      >
                        <p className={`text-sm ${card.solid ? "text-white/90" : "text-[#2B2725]/70"} mb-4`}>{card.description}</p>
                        {card.external ? (
                          <a href={card.external} target="_blank" rel="noopener noreferrer">
                            <Button
                              className="w-full text-sm bg-[#1E3A32] hover:bg-[#2B2725]"
                              onClick={() => setExpandedCard(null)}
                            >
                              Go to {card.title}
                            </Button>
                          </a>
                        ) : (
                          <Link to={createPageUrl(card.link)}>
                            <Button
                              className="w-full text-sm bg-[#1E3A32] hover:bg-[#2B2725]"
                              onClick={() => setExpandedCard(null)}
                            >
                              Go to {card.title}
                            </Button>
                          </Link>
                        )}
                        {!isComplete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full mt-2 text-xs text-[#2B2725]/60"
                            onClick={(e) => {
                              e.preventDefault();
                              handleMarkComplete(card.id);
                            }}
                          >
                            Mark as Done
                          </Button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}