import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Gift, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";

export default function ExitIntentPopup({ signup, onCaptured }) {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState(signup?.email || "");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Don't show if already captured or converted
    if (signup?.exit_intent_captured || signup?.converted_to) {
      return;
    }

    // Don't show if already shown in this session
    if (sessionStorage.getItem('exit_intent_shown')) {
      return;
    }

    let timeout;
    const handleMouseLeave = (e) => {
      // Only trigger if mouse is leaving from the top
      if (e.clientY < 50 && !show) {
        timeout = setTimeout(() => {
          setShow(true);
          sessionStorage.setItem('exit_intent_shown', 'true');
          
          // Track that popup was shown
          if (signup) {
            base44.entities.MasterclassSignup.update(signup.id, {
              exit_intent_shown: true
            });
          }
        }, 100);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      clearTimeout(timeout);
    };
  }, [signup, show]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Track capture
      if (signup) {
        await base44.entities.MasterclassSignup.update(signup.id, {
          exit_intent_captured: true
        });
      }

      if (onCaptured) {
        onCaptured(email);
      }

      setShow(false);
    } catch (error) {
      console.error('Exit intent capture failed:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50"
            onClick={handleClose}
          />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
          >
            <div className="bg-white p-8 shadow-2xl relative">
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-[#2B2725]/40 hover:text-[#2B2725] transition-colors"
              >
                <X size={24} />
              </button>

              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-[#D8B46B]/20 flex items-center justify-center mx-auto mb-4">
                  <Gift size={32} className="text-[#D8B46B]" />
                </div>
                <h2 className="font-serif text-2xl md:text-3xl text-[#1E3A32] mb-3">
                  Before You Go...
                </h2>
                <p className="text-[#2B2725]/80 leading-relaxed">
                  Get a free PDF guide: <span className="font-medium">"5 Quick Shifts to Interrupt the Imposter Loop"</span>
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-[#E4D9C4] focus:border-[#D8B46B]"
                />
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#1E3A32] hover:bg-[#2B2725]"
                >
                  {submitting ? 'Sending...' : 'Send Me the Guide'}
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              </form>

              <p className="text-xs text-[#2B2725]/60 text-center mt-4">
                You'll also stay on our list for occasional Mind Styling insights. Unsubscribe anytime.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}