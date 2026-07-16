import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";

export default function Error403() {
  return (
    <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full text-center"
      >
        <div className="w-20 h-20 rounded-full bg-[#A6B7A3]/20 flex items-center justify-center mx-auto mb-8">
          <Shield size={32} className="text-[#A6B7A3]" />
        </div>

        <h1 className="font-serif text-6xl text-[#1E3A32] mb-2">403</h1>
        <h2 className="font-serif text-3xl md:text-4xl text-[#1E3A32] mb-6">
          This area isn't accessible to you.
        </h2>

        <p className="text-[#2B2725]/80 text-lg leading-relaxed mb-10 max-w-xl mx-auto">
          This page is reserved for a different role or access level.
          <br />
          <br />
          If this seems wrong, reach out to support.
        </p>

        <div className="space-y-3 mb-12">
          <p className="text-[#2B2725]/60 text-sm uppercase tracking-wide">Quick Links</p>
          <div className="flex flex-col gap-2">
            <Link to={createPageUrl("Dashboard")} className="text-[#1E3A32] hover:text-[#D8B46B] transition-colors">
              Return to Your Dashboard
            </Link>
            <Link to={createPageUrl("Contact")} className="text-[#1E3A32] hover:text-[#D8B46B] transition-colors">
              Contact Support
            </Link>
            <Link to={createPageUrl("Home")} className="text-[#1E3A32] hover:text-[#D8B46B] transition-colors">
              Go Home
            </Link>
          </div>
        </div>

        <div className="border-t border-[#E4D9C4] pt-8">
          <p className="font-serif text-xl text-[#2B2725]/70 italic">
            "This room isn't yours to enter — but there's another one that is."
          </p>
        </div>
      </motion.div>
    </div>
  );
}