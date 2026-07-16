import React from "react";
import { motion } from "framer-motion";
import CmsText from "../cms/CmsText";

export default function SocialProofStrip() {
  const logos = [
    "Kemps",
    "Sam's Club",
    "Target",
    "Optum",
    "Pentair",
    "Academic Institutions",
    "Government Agencies",
    "Private Businesses",
  ];

  return (
    <section className="py-16 md:py-20 bg-[#1E3A32]">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-[#D8B46B] text-sm md:text-base tracking-[0.3em] uppercase mb-10 font-medium"
        >
          <CmsText
            contentKey="home.social_proof.title"
            page="Home"
            blockTitle="Social Proof Title"
            fallback="Companies I've Worked With"
            contentType="short_text"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-wrap justify-center items-center gap-x-8 md:gap-x-16 gap-y-6"
        >
          {logos.map((logo, index) => (
            <motion.span
              key={logo}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-[#F9F5EF]/60 text-sm md:text-base font-light tracking-wide hover:text-[#F9F5EF] transition-colors cursor-default"
            >
              {logo}
            </motion.span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}