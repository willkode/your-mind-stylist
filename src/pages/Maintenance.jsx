import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { motion } from "framer-motion";
import { Settings } from "lucide-react";

export default function Maintenance() {
  return (
    <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full text-center"
      >
        <div className="w-20 h-20 rounded-full bg-[#6E4F7D]/20 flex items-center justify-center mx-auto mb-8">
          <Settings size={32} className="text-[#6E4F7D] animate-spin" style={{ animationDuration: "3s" }} />
        </div>

        <h1 className="font-serif text-3xl md:text-4xl text-[#1E3A32] mb-6">
          Under Maintenance
        </h1>

        <p className="text-[#2B2725]/80 text-lg leading-relaxed mb-6 max-w-xl mx-auto">
          We're making updates to improve your experience.
        </p>

        <p className="text-[#2B2725]/80 text-lg leading-relaxed mb-10 max-w-xl mx-auto">
          The Mind Stylist Portal is temporarily unavailable while we finish enhancements behind the scenes.
          <br />
          <br />
          Please check back shortly.
        </p>

        <div className="space-y-3 mb-12">
          <p className="text-[#2B2725]/60 text-sm uppercase tracking-wide">While You Wait</p>
          <div className="flex flex-col gap-2">
            <Link to={createPageUrl("Home")} className="text-[#1E3A32] hover:text-[#D8B46B] transition-colors">
              Browse the main website
            </Link>
            <Link to={createPageUrl("Podcast")} className="text-[#1E3A32] hover:text-[#D8B46B] transition-colors">
              Listen to the podcast
            </Link>
            <Link to={createPageUrl("Blog")} className="text-[#1E3A32] hover:text-[#D8B46B] transition-colors">
              Explore the blog
            </Link>
          </div>
        </div>

        <div className="border-t border-[#E4D9C4] pt-8">
          <p className="font-serif text-xl text-[#2B2725]/70 italic">
            "A short pause for tuning the system — we'll be right back."
          </p>
        </div>
      </motion.div>
    </div>
  );
}