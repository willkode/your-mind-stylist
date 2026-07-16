import React from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";

export default function StylePauseReflection({ onComplete }) {
  const handleResponse = (response) => {
    onComplete(response);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8"
      >
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-[#D8B46B]/20 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle size={32} className="text-[#D8B46B]" />
          </div>

          <div>
            <h3 className="font-serif text-2xl text-[#1E3A32] mb-2">Quick check</h3>
            <p className="text-[#2B2725]/70">Did anything shift?</p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => handleResponse("yes")}
              className="w-full bg-[#1E3A32] hover:bg-[#2B2725]"
            >
              Yes
            </Button>
            <Button
              onClick={() => handleResponse("a_little")}
              variant="outline"
              className="w-full"
            >
              A little
            </Button>
            <Button
              onClick={() => handleResponse("not_yet")}
              variant="outline"
              className="w-full"
            >
              Not yet
            </Button>
          </div>

          <button
            onClick={() => onComplete(null)}
            className="text-sm text-[#2B2725]/60 hover:text-[#2B2725] transition-colors"
          >
            Skip
          </button>

          <p className="text-xs text-[#2B2725]/50 pt-4">
            Noted. You're training awareness.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}