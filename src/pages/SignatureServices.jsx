import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle, Heart, Sparkles, Users, Star } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import SEO from "../components/SEO";
import { Button } from "@/components/ui/button";

const SERVICES = [
  {
    key: "closet",
    nameMatch: "Cleaning Out Your Closet",
    name: "Cleaning Out Your Closet™",
    tagline: "One-on-one hypnosis work tailored to suit your needs",
    description: "Spend 10-12 hours with Roberta to clear your emotional closet of things that no longer fit. This transformational process edits outdated beliefs and unresolved emotions that keep you stuck, so you can Restyle your future.",
    details: ["10–12 hours of private sessions", "Fully customized to your needs", "Addresses beliefs, emotions & patterns", "Free consultation to see if it's the right fit"],
    color: "border-[#6E4F7D]",
    accentColor: "text-[#6E4F7D]",
    linkPage: "CleaningOutYourCloset",
  },
  {
    key: "lens",
    nameMatch: "LENS",
    name: "LENS™",
    tagline: "Roberta's flagship Mind Styling framework",
    description: "The LENS™ framework guides you through Language, Emotions, Nervous System, and Style — a structured approach to understanding and reshaping how you think, feel, and respond.",
    details: ["Structured learning path", "Language & emotion re-patterning", "Nervous system regulation tools", "Builds lasting emotional resilience"],
    color: "border-[#1E3A32]",
    accentColor: "text-[#1E3A32]",
    linkPage: "LENS",
  },
  {
    key: "salon",
    nameMatch: "Salon",
    name: "Salon",
    tagline: "Small-group coaching with Roberta",
    description: "An intimate group experience where Roberta works with a small cohort to guide deep personal and professional transformation. You get personalized attention within a community of like-minded individuals.",
    details: ["Small group format", "Personalized attention", "Community support & connection", "Guided by Roberta directly"],
    color: "border-[#D8B46B]",
    accentColor: "text-[#D8B46B]",
    linkPage: "LENS",
  },
  {
    key: "couture",
    nameMatch: "Couture",
    name: "Couture",
    tagline: "The most bespoke, high-touch offering",
    description: "Roberta's most exclusive service — a fully customized, ongoing private coaching relationship built entirely around you. For those who want the deepest, most personalized transformation experience available.",
    details: ["Fully bespoke engagement", "Ongoing private access to Roberta", "Custom timeline & scope", "Application-based enrollment"],
    color: "border-[#A6B7A3]",
    accentColor: "text-[#1E3A32]",
    linkPage: "LENS",
  },
  {
    key: "pocket-mindset",
    nameMatch: "Pocket Mindset",
    name: "Pocket Mindset™",
    tagline: "Daily guided experiences for ongoing transformation",
    description: "A guided audio-based daily practice that keeps you in the Mind Styling mindset. Perfect for anyone who wants consistent, accessible support between sessions or as a standalone daily tool.",
    details: ["Audio-based daily practice", "Accessible anytime, anywhere", "Great entry point into Mind Styling", "Pairs well with deeper programs"],
    color: "border-[#D8B46B]",
    accentColor: "text-[#D8B46B]",
    linkPage: "PocketMindset",
  },
];

export default function SignatureServices() {
  const { data: products = [] } = useQuery({
    queryKey: ["signature-products"],
    queryFn: async () => {
      const res = await base44.functions.invoke('getPublishedProducts', {});
      return res.data?.products || [];
    },
  });

  // Merge DB product data (description, tagline) into each service config
  const servicesWithDbData = SERVICES.map((service) => {
    const match = products.find((p) =>
      p.name?.toLowerCase().includes(service.nameMatch.toLowerCase())
    );
    return {
      ...service,
      tagline: match?.tagline || service.tagline,
      description: match?.short_description || service.description,
    };
  });

  return (
    <div className="bg-[#F9F5EF] min-h-screen">
      <SEO
        title="Signature Services | Your Mind Stylist"
        description="One-on-one hypnosis, coaching, and private sessions with Roberta Fernandez — Your Mind Stylist."
        canonical="/signature-services"
      />

      {/* Back Button */}
      <div className="fixed top-20 left-6 z-40">
        <Link
          to={createPageUrl("Programs")}
          className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm border border-[#6E4F7D]/20 text-[#6E4F7D] text-sm font-medium hover:bg-white transition-colors shadow-sm"
        >
          <ArrowRight size={14} className="rotate-180" />
          Back to Services
        </Link>
      </div>

      {/* Hero */}
      <section className="pt-44 pb-20 bg-[#6E4F7D]">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="text-white/60 text-xs tracking-[0.3em] uppercase mb-4 block">
              Personal Work with Roberta
            </span>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-white leading-tight mb-6">
              Signature Services
            </h1>
            <p className="text-white/80 text-xl max-w-2xl mx-auto mb-10">
              High-touch, one-on-one hypnosis and coaching experiences — tailored entirely to you.
            </p>
            <Link to={createPageUrl("Consultations")}>
              <Button className="bg-[#D8B46B] text-[#1E3A32] hover:bg-[#C5A35B] px-8 py-4 text-base font-semibold">
                Book a Free Consultation
                <ArrowRight size={16} className="ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Intro */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Heart size={36} className="text-[#6E4F7D] mx-auto mb-6" />
          <p className="text-[#2B2725]/80 text-lg leading-relaxed">
            These services are Roberta's most personal offerings — designed for people who are ready to do real, deep work.
            Whether you're clearing long-held patterns, learning to regulate your emotions, or building a daily mindset practice,
            each service is crafted to meet you exactly where you are.
          </p>
        </div>
      </section>

      {/* Signature Services — Static */}
      <section className="py-16 bg-[#F9F5EF]">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="font-serif text-3xl text-[#1E3A32] text-center mb-12">Signature Services</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {servicesWithDbData.map((service, i) => (
              <motion.div
                key={service.key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`bg-white border-l-4 ${service.color} p-8 flex flex-col`}
              >
                <h3 className={`font-serif text-2xl mb-2 ${service.accentColor}`}>{service.name}</h3>
                <p className="text-[#2B2725]/60 text-sm italic mb-4">{service.tagline}</p>
                <p className="text-[#2B2725]/80 text-sm leading-relaxed mb-6 flex-1">{service.description}</p>
                <ul className="space-y-2 mb-6">
                  {service.details.map((d, di) => (
                    <li key={di} className="flex items-start gap-2 text-sm text-[#2B2725]/70">
                      <CheckCircle size={14} className="text-[#A6B7A3] flex-shrink-0 mt-0.5" />
                      {d}
                    </li>
                  ))}
                </ul>
                <Link
                  to={createPageUrl(service.linkPage)}
                  className={`inline-flex items-center gap-2 text-sm font-medium ${service.accentColor} hover:opacity-75 transition-opacity`}
                >
                  Learn More <ArrowRight size={14} />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Work With Roberta */}
      <section className="py-20 bg-[#1E3A32] text-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <Sparkles size={36} className="text-[#D8B46B] mx-auto mb-4" />
            <h2 className="font-serif text-3xl md:text-4xl mb-4">Why Work Directly With Roberta?</h2>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              Every signature service is personalized, evidence-informed, and delivered with care.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Star, title: "20+ Years of Experience", body: "Roberta brings deep expertise in hypnosis, emotional intelligence, and behavioral change." },
              { icon: Users, title: "Fully Personalized", body: "No templates. Every session is tailored specifically to your goals, history, and needs." },
              { icon: Heart, title: "Safe & Supportive", body: "A judgment-free space to do the inner work that creates lasting outer change." },
            ].map(({ icon: Icon, title, body }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/10 p-6 border border-white/10"
              >
                <Icon size={28} className="text-[#D8B46B] mb-4" />
                <h3 className="font-serif text-xl mb-2">{title}</h3>
                <p className="text-white/70 text-sm leading-relaxed">{body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#F9F5EF] text-center">
        <div className="max-w-xl mx-auto px-6">
          <h2 className="font-serif text-3xl text-[#1E3A32] mb-4">Ready to Begin?</h2>
          <p className="text-[#2B2725]/70 mb-8">
            Start with a free consultation — Roberta will help you find the right path for where you are right now.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={createPageUrl("Bookings")}>
              <Button className="bg-[#6E4F7D] text-white hover:bg-[#5a3f68] px-8 py-3 text-base">
                Book a Consultation
                <ArrowRight size={16} className="ml-2" />
              </Button>
            </Link>
            <Link to={createPageUrl("Contact")}>
              <Button variant="outline" className="border-[#6E4F7D] text-[#6E4F7D] hover:bg-[#6E4F7D] hover:text-white px-8 py-3 text-base">
                Ask a Question
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}