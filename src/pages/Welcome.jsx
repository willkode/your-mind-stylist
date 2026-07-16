import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";

export default function Welcome() {
  return (
    <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full text-center"
      >
        <div className="w-20 h-20 rounded-full bg-[#A6B7A3]/20 flex items-center justify-center mx-auto mb-8">
          <CheckCircle size={32} className="text-[#A6B7A3]" />
        </div>

        <h1 className="font-serif text-3xl md:text-4xl text-[#1E3A32] mb-6">
          Welcome to The Mind Stylist Portal
        </h1>

        <p className="text-[#2B2725]/80 text-lg leading-relaxed mb-10 max-w-xl mx-auto">
          Your account has been created successfully.
          <br />
          <br />
          You can now access your dashboard and begin exploring your programs.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link
            to={createPageUrl("Dashboard")}
            className="px-8 py-4 bg-[#1E3A32] text-[#F9F5EF] text-sm tracking-wide hover:bg-[#2B2725] transition-all"
          >
            Go to Dashboard
          </Link>
        </div>

        <div className="space-y-3 mb-12">
          <p className="text-[#2B2725]/60 text-sm uppercase tracking-wide">Quick Links</p>
          <div className="flex flex-col gap-2">
            <Link to={createPageUrl("Dashboard")} className="text-[#1E3A32] hover:text-[#D8B46B] transition-colors">
              Go to Dashboard
            </Link>
            <Link to="/app/library" className="text-[#1E3A32] hover:text-[#D8B46B] transition-colors">
              Explore Your Library
            </Link>
            <Link to={createPageUrl("Blog")} className="text-[#1E3A32] hover:text-[#D8B46B] transition-colors">
              Visit the Blog
            </Link>
          </div>
        </div>

        <div className="border-t border-[#E4D9C4] pt-8">
          <p className="font-serif text-xl text-[#2B2725]/70 italic">
            "Every journey begins with a single step — you've already taken yours."
          </p>
        </div>
      </motion.div>
    </div>
  );
}