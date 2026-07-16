import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import SEO from "../components/SEO";
import { 
  Sparkles, 
  ArrowRight,
  BookOpen,
  Heart,
  CheckCircle,
  Loader2,
  GraduationCap,
  Pencil,
  X,
  Check
} from "lucide-react";
import CmsText from "../components/cms/CmsText";
import BookingLink from "../components/cms/BookingLink";
import LeadMagnetCTA from "../components/leadmagnet/LeadMagnetCTA";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useEditMode } from "../components/cms/EditModeProvider";
import { Package } from "lucide-react";

// Default band configs — editable via CMS or inline
const DEFAULT_BANDS = [
  {
    key: "signature_services",
    title: "Signature Services",
    subtitle: "One-on-one hypnosis, coaching & private sessions with Roberta",
    services: ["Cleaning Out Your Closet™", "LENS™", "Salon", "Couture", "Pocket Mindset™"],
    bg: "bg-[#6E4F7D]",
    textColor: "text-white",
    subtitleColor: "text-white/80",
    arrowColor: "text-white/60",
    tagColor: "bg-white/20 text-white",
    linkPage: "SignatureServices",
  },
  {
    key: "webinars",
    title: "Webinars & Live Events",
    subtitle: "Live sessions and workshops for real-time learning and transformation",
    services: ["Live Webinars", "Group Workshops", "Training Events"],
    bg: "bg-[#D8B46B]",
    textColor: "text-[#1E3A32]",
    subtitleColor: "text-[#1E3A32]/80",
    arrowColor: "text-[#1E3A32]/60",
    tagColor: "bg-[#1E3A32]/10 text-[#1E3A32]",
    linkPage: "ProgramsWebinars",
  },
  {
    key: "books",
    title: "Books & Resources",
    subtitle: "Deep dives and practical guides for your transformation journey",
    services: ["Published Books", "Workbooks", "Digital Downloads"],
    bg: "bg-[#1E3A32]",
    textColor: "text-white",
    subtitleColor: "text-white/80",
    arrowColor: "text-white/60",
    tagColor: "bg-white/20 text-white",
    linkPage: "ProgramsBooks",
  },
  {
    key: "hypnosis_training",
    title: "Hypnosis Training",
    subtitle: "Become a certified hypnotist — full professional training program",
    services: ["Hypnosis Certification Course", "Professional Training", "Online Modules"],
    bg: "bg-[#A6B7A3]",
    textColor: "text-[#1E3A32]",
    subtitleColor: "text-[#1E3A32]/80",
    arrowColor: "text-[#1E3A32]/60",
    tagColor: "bg-[#1E3A32]/10 text-[#1E3A32]",
    linkPage: "ProgramsCourses",
  },
  {
    key: "other",
    title: "Other Programs & Tools",
    subtitle: "Additional resources, tools, and offerings to support your journey",
    services: ["Audio Sessions", "Style Pauses", "Constellation Map"],
    bg: "bg-[#2B2725]",
    textColor: "text-white",
    subtitleColor: "text-white/80",
    arrowColor: "text-white/60",
    tagColor: "bg-white/20 text-white",
    linkPage: "ProgramsOther",
  },
];

function EditableBand({ band, isManager, onSave }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(band.title);
  const [subtitle, setSubtitle] = useState(band.subtitle);
  const [servicesText, setServicesText] = useState((band.services || []).join(", "));

  const handleSave = () => {
    const services = servicesText.split(",").map(s => s.trim()).filter(Boolean);
    onSave(band.key, { title, subtitle, services });
    setEditing(false);
  };

  const handleCancel = () => {
    setTitle(band.title);
    setSubtitle(band.subtitle);
    setServicesText((band.services || []).join(", "));
    setEditing(false);
  };

  return (
    <div className="mb-4 relative">
      <Link to={editing ? "#" : createPageUrl(band.linkPage)} onClick={editing ? (e) => e.preventDefault() : undefined}>
        <motion.div
          whileHover={!editing ? { scale: 1.01 } : {}}
          className={`${band.bg} p-8 cursor-pointer group transition-all`}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 pr-4">
              {editing ? (
                <div onClick={(e) => e.preventDefault()} className="space-y-3">
                  <input
                    className={`w-full bg-transparent border-b border-white/40 font-serif text-3xl ${band.textColor} focus:outline-none focus:border-white`}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Band title"
                  />
                  <input
                    className={`w-full bg-transparent border-b border-white/30 text-lg ${band.subtitleColor} focus:outline-none focus:border-white/60`}
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Subtitle"
                  />
                  <input
                    className={`w-full bg-transparent border-b border-white/30 text-sm ${band.subtitleColor} focus:outline-none focus:border-white/60`}
                    value={servicesText}
                    onChange={(e) => setServicesText(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Service tags (comma-separated, e.g. LENS™, Pocket Mindset™)"
                  />
                  <p className="text-white/40 text-xs">Separate service tags with commas</p>
                </div>
              ) : (
                <>
                  <h3 className={`font-serif text-3xl mb-2 ${band.textColor}`}>{band.title}</h3>
                  <p className={`text-lg ${band.subtitleColor}`}>{band.subtitle}</p>
                  {band.services?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {band.services.map((s, i) => (
                        <span key={i} className={`text-xs px-3 py-1 rounded-full font-medium ${band.tagColor || 'bg-white/20 text-white'}`}>{s}</span>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
            <ArrowRight size={32} className={`${band.arrowColor} group-hover:translate-x-2 transition-all flex-shrink-0`} />
          </div>
        </motion.div>
      </Link>

      {isManager && !editing && (
        <button
          onClick={() => setEditing(true)}
          className="absolute top-3 right-12 p-1.5 bg-white/20 hover:bg-white/40 rounded transition-all"
          title="Edit band text"
        >
          <Pencil size={14} className={band.textColor} />
        </button>
      )}
      {editing && (
        <div className="absolute top-3 right-12 flex gap-1">
          <button
            onClick={handleSave}
            className="p-1.5 bg-green-500 hover:bg-green-600 text-white rounded"
          >
            <Check size={14} />
          </button>
          <button
            onClick={handleCancel}
            className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function Programs() {
  const { isManager } = useEditMode();
  const [bands, setBands] = useState(DEFAULT_BANDS);

  const { data: bundles = [] } = useQuery({
    queryKey: ["published-bundles"],
    queryFn: () => base44.entities.Product.filter({ status: "published", is_bundle: true }),
  });

  const handleBandSave = (key, updates) => {
    setBands(prev => prev.map(b => b.key === key ? { ...b, ...updates } : b));
  };

  return (
    <div className="bg-[#F9F5EF]">
      <SEO
        title="Tools and Programs | Your Mind Stylist"
        description="Find your next step with Your Mind Stylist tools and programs — from introductory tools to deep transformation coaching."
        canonical="/programs"
      />

      {/* Hero Section */}
      <section className="pt-32 pb-20">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <span className="text-[#D8B46B] text-xs tracking-[0.3em] uppercase mb-4 block">
              <CmsText 
                contentKey="programs.hero.subtitle" 
                page="Programs"
                blockTitle="Hero Subtitle"
                fallback="Tools & Programs" 
                contentType="short_text"
              />
            </span>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-[#1E3A32] leading-tight mb-6">
              <CmsText 
                contentKey="programs.hero.title" 
                page="Programs"
                blockTitle="Hero Title"
                fallback="Your Mind Stylist Tools and Programs" 
                contentType="short_text"
              />
            </h1>
            <p className="text-[#2B2725]/80 text-xl md:text-2xl leading-relaxed max-w-3xl mx-auto mb-8">
              <CmsText 
                contentKey="programs.hero.description" 
                page="Programs"
                blockTitle="Hero Description"
                fallback="Find your next step, whether you're just beginning or ready for deep transformation." 
                contentType="rich_text"
              />
            </p>
            
            <BookingLink
              className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#D8B46B] text-[#1E3A32] text-sm font-semibold tracking-wide hover:bg-[#C5A35B] transition-all duration-300 shadow-lg"
            >
              <CmsText 
                contentKey="programs.hero.cta_experience" 
                page="Programs"
                blockTitle="Hero Experience CTA"
                fallback="Experience Hypnosis with Roberta" 
                contentType="short_text"
              />
              <ArrowRight size={16} />
            </BookingLink>
          </motion.div>
        </div>
      </section>

      {/* Intro Section */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <Sparkles size={40} className="text-[#D8B46B] mx-auto mb-6" />
            <div className="text-[#2B2725]/80 text-lg leading-relaxed max-w-3xl mx-auto">
              <CmsText 
                contentKey="programs.intro.content" 
                page="Programs"
                blockTitle="Intro Content"
                fallback="<p class='mb-6'><strong class='text-[#1E3A32]'>Your Mind Stylist offers transformational pathways for every phase of your inner journey.</strong></p><p class='mb-6'>From introductory tools that help you clear mental clutter to high-touch coaching that reshapes your emotional operating system — choose what aligns with you today.</p><p class='text-[#1E3A32] font-serif text-xl italic mt-8'>Every program below is designed to help you understand yourself better, shift patterns with awareness, and build emotional resilience that lasts.</p>" 
                contentType="rich_text"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* 5 Category Bands */}
      <section className="py-16 bg-[#F9F5EF]">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-serif text-3xl md:text-4xl text-[#1E3A32] text-center mb-12">
              <CmsText 
                contentKey="programs.path.title" 
                page="Programs"
                blockTitle="Path Section Title"
                fallback="Explore by Category" 
                contentType="short_text"
              />
            </h2>

            {bands.map((band) => (
              <EditableBand
                key={band.key}
                band={band}
                isManager={isManager}
                onSave={handleBandSave}
              />
            ))}
          </motion.div>
        </div>
      </section>

      {/* Bundles & Packages */}
      {bundles.length > 0 && (
        <section className="py-16 bg-[#1E3A32]">
          <div className="max-w-5xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-4 justify-center">
                <Package size={32} className="text-[#D8B46B]" />
                <h2 className="font-serif text-3xl md:text-4xl text-[#F9F5EF]">Bundles & Packages</h2>
              </div>
              <p className="text-[#F9F5EF]/70 text-center mb-12">Get more for less — curated combinations designed for deeper transformation</p>
              <div className="grid md:grid-cols-2 gap-6">
                {bundles.map((bundle) => {
                  const savings = bundle.bundled_product_ids?.length > 0 ? null : null;
                  return (
                    <div key={bundle.id} className="bg-white/10 backdrop-blur border border-[#D8B46B]/30 rounded-lg p-8 hover:border-[#D8B46B] transition-all">
                      {bundle.tagline && (
                        <p className="text-[#D8B46B] text-xs tracking-widest uppercase mb-3">{bundle.tagline}</p>
                      )}
                      <h3 className="font-serif text-2xl text-[#F9F5EF] mb-3">{bundle.name}</h3>
                      {bundle.short_description && (
                        <p className="text-[#F9F5EF]/70 text-sm mb-6">{bundle.short_description}</p>
                      )}
                      <div className="flex items-end gap-3 mb-6">
                        <span className="text-3xl font-bold text-[#D8B46B]">
                          ${((bundle.price || 0) / 100).toFixed(0)}
                        </span>
                        {bundle.billing_interval && bundle.billing_interval !== "one_time" && (
                          <span className="text-[#F9F5EF]/60 text-sm mb-1">/{bundle.billing_interval}</span>
                        )}
                      </div>
                      {bundle.features?.length > 0 && (
                        <ul className="space-y-2 mb-6">
                          {bundle.features.slice(0, 4).map((f, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-[#F9F5EF]/80">
                              <CheckCircle size={15} className="text-[#D8B46B] flex-shrink-0 mt-0.5" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      )}
                      <Link to={createPageUrl(`ProductPage?key=${bundle.key}`)}>
                        <Button className="w-full bg-[#D8B46B] text-[#1E3A32] hover:bg-[#C5A35B] font-semibold">
                          View Bundle
                          <ArrowRight size={16} className="ml-2" />
                        </Button>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* How to Choose */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Heart size={40} className="text-[#D8B46B] mx-auto mb-6" />
            <h2 className="font-serif text-3xl md:text-4xl text-[#1E3A32] text-center mb-12">
              <CmsText 
                contentKey="programs.choose.title" 
                page="Programs"
                blockTitle="How To Choose Title"
                fallback="How to Choose What's Right" 
                contentType="short_text"
              />
            </h2>

            <p className="text-[#2B2725]/80 text-lg text-center mb-10">
              <CmsText 
                contentKey="programs.choose.subtitle" 
                page="Programs"
                blockTitle="How To Choose Subtitle"
                fallback="Not sure what to start with?" 
                contentType="short_text"
              />
            </p>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div className="bg-[#F9F5EF] p-6 border-l-4 border-[#D8B46B]">
                <p className="text-[#2B2725]/80 mb-2">New to this world?</p>
                <p className="font-serif text-xl text-[#1E3A32]">Pocket Mindset™ is the perfect gentle entry.</p>
              </div>
              <div className="bg-[#F9F5EF] p-6 border-l-4 border-[#6E4F7D]">
                <p className="text-[#2B2725]/80 mb-2">Want structured learning with tangible skills?</p>
                <p className="font-serif text-xl text-[#1E3A32]">LENS™ is your foundation.</p>
              </div>
              <div className="bg-[#F9F5EF] p-6 border-l-4 border-[#A6B7A3]">
                <p className="text-[#2B2725]/80 mb-2">You want community + live support?</p>
                <p className="font-serif text-xl text-[#1E3A32]">Salon Group delivers that.</p>
              </div>
              <div className="bg-[#F9F5EF] p-6 border-l-4 border-[#1E3A32]">
                <p className="text-[#2B2725]/80 mb-2">You want the deepest transformation?</p>
                <p className="font-serif text-xl text-[#1E3A32]">Private one-to-one work is for you.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Lead Magnet Inline CTA */}
      <div className="max-w-5xl mx-auto px-6">
        <LeadMagnetCTA placement="programs" inline />
      </div>

      {/* Pricing Philosophy */}
      <section className="py-20 bg-[#F9F5EF]">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="font-serif text-3xl md:text-4xl text-[#1E3A32] mb-8">
              <CmsText 
                contentKey="programs.pricing.title" 
                page="Programs"
                blockTitle="Pricing Title"
                fallback="Pricing Philosophy & Support" 
                contentType="short_text"
              />
            </h2>

            <p className="text-[#2B2725]/80 text-lg leading-relaxed mb-8">
              <CmsText 
                contentKey="programs.pricing.intro" 
                page="Programs"
                blockTitle="Pricing Intro"
                fallback="At Your Mind Stylist, we price for:" 
                contentType="short_text"
              />
            </p>

            <div className="grid md:grid-cols-2 gap-4 mb-10 max-w-2xl mx-auto">
              {[
                "Ethical accessibility",
                "Transformational depth",
                "Clarity, not hidden fees",
                "Value that grows with you"
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-white p-4">
                  <CheckCircle size={18} className="text-[#A6B7A3] flex-shrink-0" />
                  <p className="text-[#2B2725]">{item}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3 max-w-2xl mx-auto">
              {[
                "Payment plan options where appropriate",
                "Email support to help you choose",
                "A clear refund policy (see Terms)"
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 bg-white p-4">
                  <CheckCircle size={18} className="text-[#D8B46B] flex-shrink-0 mt-1" />
                  <p className="text-[#2B2725]/80">{item}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#1E3A32]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-serif text-3xl md:text-4xl text-[#F9F5EF] mb-6">
              <CmsText 
                contentKey="programs.cta.title" 
                page="Programs"
                blockTitle="CTA Title"
                fallback="Ready to Begin?" 
                contentType="short_text"
              />
            </h2>
            <p className="text-[#F9F5EF]/70 mb-8">Not sure where to start? Let's talk.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <BookingLink>
                <Button className="bg-[#D8B46B] text-[#1E3A32] hover:bg-[#C5A35B] px-8 py-3 text-base">
                  Book a Consultation
                  <ArrowRight size={18} className="ml-2" />
                </Button>
              </BookingLink>
              <Link to={createPageUrl("Contact")}>
                <Button variant="outline" className="border-[#D8B46B] text-[#D8B46B] hover:bg-[#D8B46B] hover:text-[#1E3A32] px-8 py-3 text-base">
                  Contact Us
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}