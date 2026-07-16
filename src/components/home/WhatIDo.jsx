import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import CmsText from "../cms/CmsText";
import BookingLink from "../cms/BookingLink";

export default function WhatIDo() {
  return (
    <section className="py-24 md:py-32 bg-[#F9F5EF]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left - Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-[#6E4F7D] text-base md:text-lg font-bold tracking-[0.2em] uppercase mb-4 block">
              The Approach
            </span>
            <CmsText
              contentKey="home.intro.title"
              page="home"
              blockTitle="Homepage Intro Title"
              contentType="short_text"
              maxLength={120}
              fallback="Helping You Think From Where You Want to Be"
              as="h2"
              className="font-serif text-3xl md:text-4xl lg:text-5xl text-[#1E3A32] leading-tight mb-8"
            />

            <CmsText
              contentKey="home.intro.body"
              page="home"
              blockTitle="Homepage Intro Body"
              contentType="rich_text"
              maxLength={1000}
              fallback="<p>Hi, I'm <strong>Roberta Fernandez — Your Mind Stylist.</strong></p><p>I'm an Integrative Emotional Intelligence Specialist, Master Practitioner of NLP, and Board-certified Hypnotherapist with decades of experience helping individuals and teams transform the way they think, communicate, and lead.</p><p>My work blends neuroscience, emotional intelligence, inner pattern work, and guided mental rehearsal to create meaningful, sustainable change.</p>"
              as="div"
              className="text-[#2B2725]/80 text-lg leading-relaxed mb-10"
            />

            {/* Micro Links */}
            <div className="flex flex-col sm:flex-row gap-4">
              <BookingLink
                className="group inline-flex items-center gap-2 text-[#1E3A32] font-medium hover:text-[#D8B46B] transition-colors"
              >
                Work With Me
                <ArrowUpRight
                  size={18}
                  className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                />
              </BookingLink>
              <Link
                to={createPageUrl("FreeMasterclass")}
                className="group inline-flex items-center gap-2 text-[#1E3A32] font-medium hover:text-[#D8B46B] transition-colors"
              >
                Watch the Free Webinar
                <ArrowUpRight
                  size={18}
                  className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                />
              </Link>
            </div>
          </motion.div>

          {/* Right - Visual Element */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative">
              {/* Decorative Elements */}
              <div className="absolute -top-8 -right-8 w-32 h-32 border border-[#D8B46B]/30 rounded-full" />
              <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-[#A6B7A3]/20 rounded-full" />

              {/* Main Card */}
              <div className="relative bg-white p-10 md:p-14 shadow-lg">
                <div className="space-y-8">
                  {/* Credential Items */}
                  {[
                    { number: "30+", label: "Years of Experience" },
                    { number: "NLP", label: "Master Practitioner" },
                    { number: "EI", label: "Emotional Intelligence Specialist" },
                    { number: "BCH", label: "Board Certified Hypnotist" },
                  ].map((item, index) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="flex items-start gap-6 pb-8 border-b border-[#E4D9C4] last:border-0 last:pb-0"
                    >
                      {item.number && (
                        <span className="font-serif text-3xl md:text-4xl text-[#D8B46B]">
                          {item.number}
                        </span>
                      )}
                      <span className="text-[#2B2725]/70 text-sm tracking-wide pt-3">
                        {item.label}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}