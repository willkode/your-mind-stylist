import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import SEO from "../components/SEO";
import { CheckCircle } from "lucide-react";
import CmsText from "../components/cms/CmsText";
import VideoEmbed from "../components/cms/VideoEmbed";

export default function LENS() {
  return (
    <div className="bg-[#F9F5EF]">
      <SEO
        title="LENS™ - A Mind Styling Framework | Your Mind Stylist"
        description="LENS™ - A Mind Styling Framework for Perspective, Awareness & Ability. Transform how you see, think, and solve problems."
        canonical="/LENS"
      />

      {/* Hero Section - Matching Home Page Style */}
      <section className="relative min-h-[80vh] flex items-center pt-32 pb-20 overflow-hidden bg-[#F9F5EF]">
        {/* Subtle Background Pattern - Same as Home */}
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
            {/* Left - Content */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              {/* Title */}
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-[#1E3A32] leading-tight mb-6">
                <CmsText 
                  contentKey="lens.hero.title" 
                  page="LENS"
                  blockTitle="Hero Title"
                  fallback="LENS™" 
                  contentType="short_text"
                />
              </h1>

              {/* Subtitle */}
              <p className="font-serif text-2xl md:text-3xl text-[#6E4F7D] italic leading-snug mb-8">
                <CmsText 
                  contentKey="lens.hero.subtitle" 
                  page="LENS"
                  blockTitle="Hero Subtitle"
                  fallback="A Mind Styling Framework for Perspective, Awareness & Ability" 
                  contentType="short_text"
                />
              </p>

              {/* Description */}
              <div className="text-[#2B2725]/80 text-lg leading-relaxed space-y-4 mb-10">
                <CmsText 
                  contentKey="lens.hero.description" 
                  page="LENS"
                  blockTitle="Hero Description"
                  fallback="<p><strong>LENS doesn't give you answers - it gives you a new lens to see things differently and expand into new solutions.</strong></p><p>As Albert Einstein observed: <em>'The problems we have cannot be solved by the same level of thinking that created them.'</em> LENS is built on this principle. Results are determined by where you place your focus.</p>" 
                  contentType="rich_text"
                />
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to={createPageUrl("ProductPage?slug=lens")}>
                  <Button className="bg-[#D8B46B] text-[#1E3A32] hover:bg-[#C5A35B] px-8 py-6 text-lg font-semibold">
                    Buy Online LENS™
                  </Button>
                </Link>
                <Link to={createPageUrl("Bookings")}>
                  <Button className="bg-[#1E3A32] text-[#F9F5EF] hover:bg-[#2B2725] px-8 py-6 text-lg">
                    Book Your Consultation
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Right - Video Space */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
              className="relative"
            >
              <div className="relative">
                {/* Gold Corner Accents */}
                <div className="absolute -top-4 -left-4 w-20 h-20 border-l-2 border-t-2 border-[#D8B46B]" />
                <div className="absolute -bottom-4 -right-4 w-20 h-20 border-r-2 border-b-2 border-[#D8B46B]" />

                {/* Video Container */}
                <div className="relative aspect-video bg-[#E4D9C4] overflow-hidden">
                  <VideoEmbed
                    contentKey="lens.hero.video_embed"
                    page="LENS"
                    blockTitle="Hero Video (Paste Vimeo or YouTube URL)"
                    fallback="https://player.vimeo.com/video/1153705585?h=934d469d3f&badge=0&autopause=0&player_id=0&app_id=58479"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Core Principle Section */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="text-[#2B2725]/80 text-lg leading-relaxed max-w-4xl mx-auto space-y-6">
              <CmsText 
                contentKey="lens.principle.content" 
                page="LENS"
                blockTitle="Core Principle Content"
                fallback="<p>Artists, scientists, inventors, and leaders consistently cite their shift in perception—seeing, thinking, and processing differently from the masses—as the catalyst for their success. <strong class='text-[#6E4F7D]'>LENS makes this capacity teachable and repeatable.</strong></p><p>LENS embodies over twenty years of refinement through thousands of individual sessions, group trainings, and more than four decades of professional and life experience.</p><p>The process integrates emotional intelligence, conscious awareness, and perspective-based thinking. LENS provides more than 40 tenets and practical tools to help you see any situation differently, enabling you to achieve results that fit your needs. You choose the method that's right for you: on your own, in small groups, or one-on-one.</p>" 
                contentType="rich_text"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Personal & Professional Development Section */}
      <section className="py-20 bg-[#F9F5EF]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-serif text-3xl md:text-4xl text-[#1E3A32] text-center mb-4">
              <CmsText 
                contentKey="lens.development.title" 
                page="LENS"
                blockTitle="Development Title"
                fallback="LENS is both Personal and Professional Development" 
                contentType="short_text"
              />
            </h2>

            {/* Two Column Benefits */}
            <div className="grid md:grid-cols-2 gap-8 mt-12">
              {/* For Individuals */}
              <div className="bg-white p-8 md:p-12 border-t-4 border-[#6E4F7D]">
                <h3 className="font-serif text-2xl text-[#6E4F7D] mb-8 text-center">
                  <CmsText 
                    contentKey="lens.development.individuals.title" 
                    page="LENS"
                    blockTitle="For Individuals Title"
                    fallback="For Individuals" 
                    contentType="short_text"
                  />
                </h3>
                <div className="space-y-4">
                  {[
                    "Transformational sense of 'Self'",
                    "Unwavering resilience and confidence",
                    "Emotional regulation",
                    "Stronger relationships",
                    "Objectivity in handling conflict",
                    "Enhanced communication skills"
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <CheckCircle size={20} className="text-[#6E4F7D] flex-shrink-0 mt-1" />
                      <p className="text-[#2B2725]">
                        <CmsText 
                          contentKey={`lens.development.individuals.${idx}`}
                          page="LENS"
                          blockTitle={`Individual Benefit ${idx + 1}`}
                          fallback={item}
                          contentType="short_text"
                        />
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* For Organizations */}
              <div className="bg-white p-8 md:p-12 border-t-4 border-[#1E3A32]">
                <h3 className="font-serif text-2xl text-[#1E3A32] mb-8 text-center">
                  <CmsText 
                    contentKey="lens.development.organizations.title" 
                    page="LENS"
                    blockTitle="For Organizations Title"
                    fallback="For Organizations" 
                    contentType="short_text"
                  />
                </h3>
                <div className="space-y-4">
                  {[
                    "Innovative thinkers and leaders",
                    "Adaptive problem-solvers",
                    "High-functioning teams",
                    "Clear decision-makers",
                    "Increased workplace satisfaction",
                    "Distinct competitive edge"
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <CheckCircle size={20} className="text-[#1E3A32] flex-shrink-0 mt-1" />
                      <p className="text-[#2B2725]">
                        <CmsText 
                          contentKey={`lens.development.organizations.${idx}`}
                          page="LENS"
                          blockTitle={`Organization Benefit ${idx + 1}`}
                          fallback={item}
                          contentType="short_text"
                        />
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-[#1E3A32]">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <p className="text-[#F9F5EF] text-xl md:text-2xl leading-relaxed mb-8 font-serif italic">
              <CmsText 
                contentKey="lens.cta.question" 
                page="LENS"
                blockTitle="CTA Question"
                fallback="You've spent a lifetime observing in the old ways. Isn't it time to separate yourself from the rest and use the power of LENS to develop your true potential?" 
                contentType="rich_text"
              />
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={createPageUrl("Bookings")}>
                <Button className="bg-[#D8B46B] text-[#1E3A32] hover:bg-white px-8 py-6 text-lg">
                  Book Your Consultation
                </Button>
              </Link>
              <Link to={createPageUrl("Programs")}>
                <Button variant="outline" className="border-[#D8B46B] text-[#D8B46B] hover:bg-[#D8B46B]/10 px-8 py-6 text-lg">
                  Explore Programs
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}