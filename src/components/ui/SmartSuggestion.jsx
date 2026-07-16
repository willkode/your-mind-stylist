import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";

export function SmartSuggestion({ 
  trigger,
  title,
  description,
  actionLabel,
  actionLink,
  onDismiss,
  icon: Icon = Sparkles,
  delay = 3000,
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  React.useEffect(() => {
    if (trigger && !isDismissed) {
      const timer = setTimeout(() => setIsVisible(true), delay);
      return () => clearTimeout(timer);
    }
  }, [trigger, isDismissed, delay]);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    onDismiss?.();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed z-50 max-w-sm hidden lg:block bottom-6 right-6"
        >
          <div className="bg-gradient-to-br from-[#D8B46B] to-[#C9A55B] p-[2px] rounded-lg shadow-2xl">
            <div className="bg-white rounded-lg p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D8B46B] to-[#C9A55B] flex items-center justify-center flex-shrink-0">
                  <Icon size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-serif text-lg text-[#1E3A32] mb-1">{title}</h4>
                  <p className="text-sm text-[#2B2725]/70">{description}</p>
                </div>
                <button
                  onClick={handleDismiss}
                  className="text-[#2B2725]/40 hover:text-[#2B2725] transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              
              {actionLink && (
                <Link
                  to={createPageUrl(actionLink)}
                  className="flex items-center justify-between gap-2 mt-4 px-4 py-2 bg-[#1E3A32] text-white rounded-lg hover:bg-[#2B4A40] transition-colors text-sm font-medium"
                  onClick={handleDismiss}
                >
                  <span>{actionLabel}</span>
                  <ArrowRight size={16} />
                </Link>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}