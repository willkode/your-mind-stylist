import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";

export default function Error401() {
  return (
    <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full text-center"
      >
        <div className="w-20 h-20 rounded-full bg-[#D8B46B]/20 flex items-center justify-center mx-auto mb-8">
          <Lock size={32} className="text-[#D8B46B]" />
        </div>

        <h1 className="font-serif text-6xl text-[#1E3A32] mb-2">401</h1>
        <h2 className="font-serif text-3xl md:text-4xl text-[#1E3A32] mb-6">
          You're not signed in.
        </h2>

        <p className="text-[#2B2725]/80 text-lg leading-relaxed mb-10 max-w-xl mx-auto">
          To access this page, you need to be logged into your account.
          <br />
          Please sign in or create an account to continue.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link
            to="/app/login"
            className="px-8 py-4 bg-[#1E3A32] text-[#F9F5EF] text-sm tracking-wide hover:bg-[#2B2725] transition-all"
          >
            Log In
          </Link>
          <Link
            to="/app/signup"
            className="px-8 py-4 border border-[#D8B46B] text-[#1E3A32] text-sm tracking-wide hover:bg-[#D8B46B]/10 transition-all"
          >
            Create Account
          </Link>
        </div>

        <div className="space-y-3 mb-12">
          <p className="text-[#2B2725]/60 text-sm uppercase tracking-wide">Quick Links</p>
          <div className="flex flex-col gap-2">
            <Link to={createPageUrl("Home")} className="text-[#1E3A32] hover:text-[#D8B46B] transition-colors">
              Return Home
            </Link>
          </div>
        </div>

        <div className="border-t border-[#E4D9C4] pt-8">
          <p className="font-serif text-xl text-[#2B2725]/70 italic">
            "Sometimes the door is locked because you're meant to pause and choose your next step."
          </p>
        </div>
      </motion.div>
    </div>
  );
}