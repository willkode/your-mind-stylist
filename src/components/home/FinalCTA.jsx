import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { motion } from "framer-motion";
import { ArrowRight, Mail } from "lucide-react";
import CmsText from "../cms/CmsText";
import BookingLink from "../cms/BookingLink";

export default function FinalCTA() {
  return (
    <section className="py-24 md:py-32 bg-[#F9F5EF] relative overflow-hidden">
      {/* Decorative Line */}
      <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#D8B46B]/30 to-transparent" />

      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Decorative Quote Marks */}
          <div className="flex justify-center mb-8">
            <div className="w-16 h-[2px] bg-[#D8B46B]" />
          </div>

          <CmsText
            contentKey="home.closing.title"
            page="home"
            blockTitle="Homepage Closing Title"
            contentType="short_text"
            fallback="When You Change Your Thinking, Everything Changes."
            as="h2"
            className="font-serif text-3xl md:text-4xl lg:text-5xl text-[#1E3A32] leading-tight mb-8"
          />

          <CmsText
            contentKey="home.closing.body"
            page="home"
            blockTitle="Homepage Closing Body"
            contentType="rich_text"
            fallback="If you're ready to release old patterns, elevate your emotional intelligence, and build a life that feels aligned, grounded, and emotionally clear—I'd love to support you."
            as="p"
            className="text-[#2B2725]/80 text-lg md:text-xl leading-relaxed mb-12 max-w-2xl mx-auto"
          />

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <BookingLink
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#1E3A32] text-[#F9F5EF] text-sm tracking-wide hover:bg-[#2B2725] transition-all duration-300"
            >
              <CmsText
                contentKey="home.closing.cta1"
                page="Home"
                blockTitle="Closing CTA 1"
                fallback="Schedule Your Complimentary Consultation"
                contentType="short_text"
                as="span"
              />
              <ArrowRight
                size={16}
                className="group-hover:translate-x-1 transition-transform"
              />
            </BookingLink>
            <Link
              to={createPageUrl("Contact")}
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 border border-[#D8B46B] text-[#1E3A32] text-sm tracking-wide hover:bg-[#D8B46B]/10 transition-all duration-300"
            >
              <Mail size={16} className="text-[#D8B46B]" />
              <CmsText
                contentKey="home.closing.cta2"
                page="Home"
                blockTitle="Closing CTA 2"
                fallback="Contact Roberta"
                contentType="short_text"
                as="span"
              />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}