import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../../utils";

export default function MasterclassEmailCapture({ isOpen, onClose, onSuccess }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !fullName) {
      setError("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create or update the masterclass signup
      await base44.entities.MasterclassSignup.create({
        email: email.trim(),
        full_name: fullName.trim(),
        signup_source: "home_page",
        signup_date: new Date().toISOString(),
      });

      // Create or update Lead via centralized function (handles duplicates, source tracking)
      try {
        await base44.functions.invoke('createOrUpdateLead', {
          email: email.trim(),
          full_name: fullName.trim(),
          source: 'free_masterclass',
          email_consent: true,
          consent_given_at: new Date().toISOString(),
        });
      } catch (leadErr) {
        console.error("Lead creation/update failed (non-blocking):", leadErr);
      }

      // Close the modal and navigate to the masterclass
      onClose();
      navigate(createPageUrl("FreeMasterclass"));
    } catch (err) {
      console.error("Error submitting email:", err);
      setError("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
        >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white max-w-md w-full p-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#2B2725]/40 hover:text-[#2B2725] transition-colors"
        >
          <X size={24} />
        </button>

        <div className="mb-6">
          <h3 className="font-serif text-2xl md:text-3xl text-[#1E3A32] mb-3">
            Watch the Free Masterclass
          </h3>
          <p className="text-[#2B2725]/70 leading-relaxed">
            Enter your details to access "Imposter Syndrome & Other Myths to Ditch"
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-sm text-[#2B2725]/70 mb-2">
              Full Name *
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 border border-[#E4D9C4] focus:border-[#D8B46B] focus:outline-none transition-colors"
              placeholder="Your name"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm text-[#2B2725]/70 mb-2">
              Email Address *
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-[#E4D9C4] focus:border-[#D8B46B] focus:outline-none transition-colors"
              placeholder="your@email.com"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-6 py-4 bg-[#1E3A32] text-[#F9F5EF] text-sm tracking-wide hover:bg-[#2B2725] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Submitting...
              </>
            ) : (
              "Watch Now"
            )}
          </button>
        </form>

        <p className="text-xs text-[#2B2725]/50 text-center mt-4">
          We respect your privacy. Unsubscribe at any time.
        </p>
      </motion.div>
      </motion.div>
      )}
      </AnimatePresence>
      );
      }