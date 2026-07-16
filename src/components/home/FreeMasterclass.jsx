import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { motion } from "framer-motion";
import { Play, Sparkles } from "lucide-react";
import CmsText from "../cms/CmsText";

export default function FreeMasterclass() {
  return (
    <section className="py-24 md:py-32 bg-[#1E3A32] relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#D8B46B]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#A6B7A3]/10 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left - Visual */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <Link
              to={createPageUrl("FreeMasterclass")}
              className="relative aspect-video bg-[#2B2725] overflow-hidden group cursor-pointer block"
            >
              <img
                src="https://media.base44.com/images/public/693a98b3e154ab3b36c88ebb/a9538f497_generated_image.png"
                alt="Free Masterclass"
                className="w-full h-full object-cover opacity-60 group-hover:opacity-70 group-hover:scale-105 transition-all duration-700"
              />

              {/* Play Button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-[#D8B46B] flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-2xl">
                  <Play size={32} className="text-[#1E3A32] ml-1" fill="currentColor" />
                </div>
              </div>

              {/* Duration Badge */}
              <div className="absolute bottom-4 right-4 px-4 py-2 bg-black/50 backdrop-blur-sm">
                <span className="text-white text-sm">On-Demand • Free</span>
              </div>
            </Link>

            {/* Floating Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="absolute -bottom-6 -left-6 md:left-auto md:-right-6 bg-[#D8B46B] p-4 flex items-center gap-3"
            >
              <Sparkles size={20} className="text-[#1E3A32]" />
              <span className="text-[#1E3A32] text-sm font-medium">Most Popular Resource</span>
            </motion.div>
          </motion.div>

          {/* Right - Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-[#D8B46B] text-xs tracking-[0.3em] uppercase mb-4 block">
              <CmsText
                contentKey="home.masterclass.label"
                page="Home"
                blockTitle="Masterclass Label"
                fallback="Free Masterclass"
                contentType="short_text"
              />
            </span>

            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-[#F9F5EF] leading-tight mb-6">
              <CmsText
                contentKey="home.masterclass.title"
                page="Home"
                blockTitle="Masterclass Title"
                fallback="Imposter Syndrome & Other Myths to Ditch"
                contentType="short_text"
              />
            </h2>

            <div className="text-[#F9F5EF]/80 text-lg leading-relaxed mb-8">
              <CmsText
                contentKey="home.masterclass.description"
                page="Home"
                blockTitle="Masterclass Description"
                fallback="An on-demand webinar for anyone who feels like they're 'faking it.' Learn what imposter syndrome really is through Roberta's personal story and discover the myths you need to ditch about yourself."
                contentType="rich_text"
              />
            </div>

            <Link
              to={createPageUrl("FreeMasterclass")}
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#D8B46B] text-[#1E3A32] text-sm tracking-wide font-medium hover:bg-[#F9F5EF] transition-all duration-300"
            >
              <Play size={16} />
              Watch the Free Webinar
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}