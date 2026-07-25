import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import CmsText from "../cms/CmsText";
import BookingLink from "../cms/BookingLink";
import VideoModal from "./VideoModal";

export default function HeroSection() {
  const [showVideoModal, setShowVideoModal] = useState(false);

  return (
    <section className="relative min-h-screen flex items-center pt-32 pb-20 overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231E3A32' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Gold Accent Line */}
      <div className="absolute left-0 top-1/4 w-24 md:w-48 h-[1px] bg-gradient-to-r from-[#D8B46B] to-transparent" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Brand Lockup */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="mb-10"
            >
              <p className="text-[#2B2725]/60 text-xs tracking-[0.3em] uppercase mb-2">
                Roberta Fernandez
              </p>
              <div className="flex items-center gap-6">
                <div className="w-12 h-[2px] bg-[#D8B46B]" />
                <h2 className="font-serif font-black text-4xl md:text-5xl lg:text-6xl text-[#1E3A32] tracking-wide">
                  YOUR MIND STYLIST
                </h2>
                <div className="w-12 h-[2px] bg-[#D8B46B]" />
              </div>
            </motion.div>

            {/* Headline */}
            <CmsText
              contentKey="home.hero.title"
              page="home"
              blockTitle="Homepage Hero Title"
              contentType="short_text"
              fallback="Rewrite Your Mind. Restyle Your Life."
              as="h1"
              className="font-serif text-3xl md:text-4xl lg:text-5xl xl:text-6xl text-[#1E3A32] leading-[1.1] mb-8"
            />

            {/* Subheadline */}
            <CmsText
              contentKey="home.hero.subtitle"
              page="home"
              blockTitle="Homepage Hero Subtitle"
              contentType="rich_text"
              fallback="Your thinking shapes everything—your choices, confidence, relationships, and leadership. When your thoughts evolve, so does your entire life. I help you identify the patterns that no longer fit, release the ones holding you back, and redesign your mindset so you can move forward with clarity, confidence, and emotional intelligence."
              as="p"
              className="text-[#2B2725]/80 text-lg md:text-xl leading-relaxed mb-10 max-w-xl"
            />

          </motion.div>

          {/* Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="relative"
          >
            {/* Frame */}
            <div className="relative">
              {/* Gold Corner Accents */}
              <div className="absolute -top-4 -left-4 w-20 h-20 border-l-2 border-t-2 border-[#D8B46B]" />
              <div className="absolute -bottom-4 -right-4 w-20 h-20 border-r-2 border-b-2 border-[#D8B46B]" />

              {/* Image Container */}
              <div className="relative aspect-[4/5] overflow-hidden bg-[#E4D9C4] group cursor-pointer" onClick={() => setShowVideoModal(true)}>
                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693a98b3e154ab3b36c88ebb/9bff2cefb_Roberta-Fernandez-The-Mind-Stylist.jpg"
                  alt="Roberta Fernandez - Your Mind Stylist"
                  className="w-full h-full object-cover object-center hover:scale-105 transition-all duration-700"
                />
                {/* Video Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#1E3A32]/40 via-transparent to-[#1E3A32]/20 group-hover:from-[#1E3A32]/50 transition-all duration-300" />
                
                {/* Video Indicator */}
                <div className="absolute top-4 right-4 px-3 py-1 bg-[#1E3A32]/80 backdrop-blur-sm rounded-full flex items-center gap-2">
                  <Play size={12} className="text-[#D8B46B]" fill="currentColor" />
                  <span className="text-[#F9F5EF] text-xs font-medium">Watch Video</span>
                </div>

                {/* Play Button */}
                <button
                  onClick={() => setShowVideoModal(true)}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-[#D8B46B] flex items-center justify-center hover:scale-110 hover:bg-[#F9F5EF] transition-all duration-300 shadow-2xl"
                  aria-label="Play welcome video"
                >
                  <Play size={32} className="text-[#1E3A32] ml-1" fill="currentColor" />
                </button>
              </div>

              {/* Floating Quote */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="absolute -bottom-8 -left-8 md:left-auto md:-right-8 bg-white p-6 shadow-xl max-w-xs"
              >
                <p className="font-serif text-[#1E3A32] italic text-lg leading-relaxed">
                  "When you change your thinking, everything changes."
                </p>
              </motion.div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-4 mt-20">
              <BookingLink
                className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#D8B46B] text-[#1E3A32] text-sm font-semibold tracking-wide hover:bg-[#C5A35B] transition-all duration-300 shadow-lg"
              >
                <CmsText
                  contentKey="home.hero.cta_experience"
                  page="home"
                  blockTitle="Homepage Hero Experience CTA"
                  contentType="short_text"
                  fallback="Experience Hypnosis with Roberta"
                  as="span"
                />
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </BookingLink>
              <BookingLink
                className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#1E3A32] text-[#F9F5EF] text-sm tracking-wide hover:bg-[#2B2725] transition-all duration-300"
              >
                <CmsText
                  contentKey="home.hero.cta_primary"
                  page="home"
                  blockTitle="Homepage Hero Primary CTA"
                  contentType="short_text"
                  fallback="Book Your Complimentary Consultation"
                  as="span"
                />
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </BookingLink>
              <Link
                to={createPageUrl("FreeMasterclass")}
                className="group inline-flex items-center justify-center gap-3 px-8 py-4 border border-[#D8B46B] text-[#1E3A32] text-sm tracking-wide hover:bg-[#D8B46B]/10 transition-all duration-300"
              >
                <Play size={16} className="text-[#D8B46B]" />
                <CmsText
                  contentKey="home.hero.cta_secondary"
                  page="home"
                  blockTitle="Homepage Hero Secondary CTA"
                  contentType="short_text"
                  fallback="Watch the Free Webinar"
                  as="span"
                />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      <VideoModal isOpen={showVideoModal} onClose={() => setShowVideoModal(false)} />
    </section>
  );
}