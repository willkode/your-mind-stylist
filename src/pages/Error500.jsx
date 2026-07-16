import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

export default function Error500() {
  return (
    <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full text-center"
      >
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-8">
          <AlertTriangle size={32} className="text-red-600" />
        </div>

        <h1 className="font-serif text-6xl text-[#1E3A32] mb-2">500</h1>
        <h2 className="font-serif text-3xl md:text-4xl text-[#1E3A32] mb-6">
          Something went wrong on our end.
        </h2>

        <p className="text-[#2B2725]/80 text-lg leading-relaxed mb-6 max-w-xl mx-auto">
          The system hit an unexpected issue.
        </p>

        <p className="text-[#2B2725]/80 text-lg leading-relaxed mb-10 max-w-xl mx-auto">
          This isn't your fault — we've logged it and will fix it soon.
        </p>

        <div className="mb-8">
          <p className="text-[#2B2725]/60 text-sm uppercase tracking-wide mb-4">You can try:</p>
          <div className="flex flex-col gap-2 text-[#2B2725]/70">
            <p>• Refreshing the page</p>
            <p>• Returning to your dashboard</p>
          </div>
        </div>

        <div className="space-y-3 mb-12">
          <p className="text-[#2B2725]/60 text-sm uppercase tracking-wide">Quick Links</p>
          <div className="flex flex-col gap-2">
            <Link to={createPageUrl("Dashboard")} className="text-[#1E3A32] hover:text-[#D8B46B] transition-colors">
              Go to Dashboard
            </Link>
            <Link to={createPageUrl("Home")} className="text-[#1E3A32] hover:text-[#D8B46B] transition-colors">
              Return Home
            </Link>
          </div>
        </div>

        <div className="border-t border-[#E4D9C4] pt-8">
          <p className="font-serif text-xl text-[#2B2725]/70 italic">
            "Even the strongest systems lose their footing sometimes. Let's help you get back on steady ground."
          </p>
        </div>
      </motion.div>
    </div>
  );
}