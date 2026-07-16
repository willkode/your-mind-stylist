import React from "react";
import SEO from "../components/SEO";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { motion } from "framer-motion";
import { ArrowRight, Brain, Heart, Zap, Shield, Sparkles, Moon, Target, RefreshCw } from "lucide-react";
import CmsText from "../components/cms/CmsText";
import VideoEmbed from "../components/cms/VideoEmbed";

export default function PocketMindset() {
  const whatItCombines = [
    "Guided visualization",
    "Hypnotic language",
    "Emotional intelligence",
    "Future-self embodiment",
    "Nervous system regulation",
    "Identity rehearsal",
    "Pattern interruption",
    "Calm-state anchoring",
  ];

  const benefits = [
    {
      icon: RefreshCw,
      title: "Regulate your nervous system",
      description: "Lower emotional activation so you can think clearly.",
    },
    {
      icon: Zap,
      title: "Shift your internal state",
      description: "Move out of overwhelm, fear, or stress.",
    },
    {
      icon: Target,
      title: "Interrupt old patterns",
      description: "Gently disrupt the loops that keep you stuck.",
    },
    {
      icon: Heart,
      title: "Strengthen emotional intelligence",
      description: "Rewrite the meaning your mind assigns to experiences.",
    },
    {
      icon: Sparkles,
      title: "Rehearse your future self",
      description: "Practice confidence, clarity, and calm until they feel natural.",
    },
    {
      icon: Brain,
      title: "Build new identity pathways",
      description: "Create alignment between who you want to be and how you show up.",
    },
  ];

  const useCases = {
    feelings: [
      "Calmer",
      "Clearer",
      "More confident",
      "More grounded",
      "More emotionally regulated",
      "Better prepared",
      "Less overwhelmed",
      "More connected to yourself",
    ],
    moments: [
      "Before meetings or difficult conversations",
      "After emotional activation",
      "During stress, anxiety, or cognitive overload",
      "When you're stuck in overthinking",
      "When you need clarity for decisions",
      "Before sleep",
      "Before stepping into leadership moments",
      "During transition, doubt, or uncertainty",
    ],
  };

  const libraryCategories = [
    {
      icon: RefreshCw,
      title: "Calm & Nervous System Resets",
      description: "For instant grounding and emotional cooling.",
    },
    {
      icon: Sparkles,
      title: "Confidence & Identity Expansion",
      description: "For stepping into a stronger, clearer version of yourself.",
    },
    {
      icon: Brain,
      title: "Clarity & Decision Pathways",
      description: "For mental organization and cognitive calm.",
    },
    {
      icon: Heart,
      title: "Emotional Release Sessions",
      description: "For dissolving internal pressure and overwhelm.",
    },
    {
      icon: Target,
      title: "Performance Preparation",
      description: "For presentations, conversations, interviews, leadership moments.",
    },
    {
      icon: Moon,
      title: "Rest & Recovery",
      description: "For deep rest, nervous system repair, and nighttime decompression.",
    },
  ];

  const howItWorks = [
    {
      step: "Create your account",
      description: "Sign up directly through the portal.",
    },
    {
      step: "Choose your sessions",
      description: "Access the full library immediately.",
    },
    {
      step: "Listen anytime",
      description: "Use them before meetings, during transitions, or before sleep.",
    },
    {
      step: "Track your favorites",
      description: "Your dashboard saves recent and favorite sessions.",
    },
  ];

  return (
    <div className="bg-[#F9F5EF]">
      <SEO
        title="Pocket Mindset™ | Calm, Clarity & Identity Shifts"
        description="Short, powerful guided Pocket Mindset™ sessions to reset your mind, regulate your nervous system, and rehearse your future self in minutes."
        canonical="/pocket-mindset"
      />
      {/* Hero Section */}
      <section className="pt-32 pb-20">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-[#D8B46B] text-xs tracking-[0.3em] uppercase mb-4 block text-center">
              <CmsText 
                contentKey="pocket.hero.subtitle"
                page="PocketMindset"
                blockTitle="Hero Subtitle"
                fallback="Guided Experiences"
                contentType="short_text"
                as="span"
              />
            </span>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-[#1E3A32] leading-tight mb-6 text-center">
              <CmsText 
                contentKey="pocket.hero.title"
                page="PocketMindset"
                blockTitle="Hero Title"
                fallback="Pocket Mindset™"
                contentType="short_text"
              />
            </h1>
            <p className="text-[#1E3A32] font-serif text-2xl md:text-3xl font-medium italic mb-8 text-center">
              <CmsText 
                contentKey="pocket.hero.tagline"
                page="PocketMindset"
                blockTitle="Hero Tagline"
                fallback="Reset your mind, regulate your nervous system, and rehearse your future self — in minutes."
                contentType="rich_text"
              />
            </p>

            <p className="text-[#2B2725]/80 text-lg leading-relaxed mb-10 max-w-3xl mx-auto text-center">
              <CmsText 
                contentKey="pocket.hero.description"
                page="PocketMindset"
                blockTitle="Hero Description"
                fallback="These short, powerful audio-guided experiences help you shift your emotional state, calm your mind, dissolve overwhelm, and embody new patterns with ease. They're designed for real people with real lives — people who want to feel better, think clearly, and step into a more aligned version of themselves."
                contentType="rich_text"
              />
            </p>

            <div className="mb-10 max-w-3xl mx-auto">
              <div className="aspect-video rounded-lg overflow-hidden shadow-2xl">
                <VideoEmbed
                  contentKey="pocket.hero.video_embed"
                  page="PocketMindset"
                  blockTitle="Hero Video (Paste Vimeo or YouTube URL)"
                  fallback="https://vimeo.com/1158920818/3969eaaa17"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to={createPageUrl("PocketVisualizationPurchase")}
                className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#1E3A32] text-[#F9F5EF] text-sm tracking-wide hover:bg-[#2B2725] transition-all duration-300"
              >
                Buy Here
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* What Is Pocket Mindset */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-[#1E3A32] mb-8">
              <CmsText 
                contentKey="pocket.what.title"
                page="PocketMindset"
                blockTitle="What Section Title"
                fallback="What Is Pocket Mindset™?"
                contentType="short_text"
              />
            </h2>

            <p className="text-[#2B2725]/80 text-lg leading-relaxed mb-8">
              <CmsText 
                contentKey="pocket.what.intro"
                page="PocketMindset"
                blockTitle="What Section Intro"
                fallback="Unlike meditation, motivation, or passive relaxation, Pocket Mindset™ combines:"
                contentType="rich_text"
              />
            </p>

            <CmsText 
              contentKey="pocket.what.combines"
              page="PocketMindset"
              blockTitle="What It Combines List"
              fallback={`<div class='grid md:grid-cols-2 gap-3 mb-10'>${whatItCombines.map(item => `<div class='flex items-center gap-3 bg-[#F9F5EF] p-4'><div class='w-1.5 h-1.5 rounded-full bg-[#A6B7A3]'></div><span class='text-[#2B2725]/80'>${item}</span></div>`).join('')}</div>`}
              contentType="rich_text"
            />

            <div className="space-y-6 text-[#2B2725]/80 text-lg leading-relaxed">
              <p className="font-serif text-xl text-[#1E3A32] italic">
                <CmsText 
                  contentKey="pocket.what.quote"
                  page="PocketMindset"
                  blockTitle="What Section Quote"
                  fallback="This isn't about escaping life — it's about preparing your mind and body to engage with it more clearly."
                  contentType="rich_text"
                />
              </p>
              <p>
                <CmsText 
                  contentKey="pocket.what.explanation"
                  page="PocketMindset"
                  blockTitle="What Section Explanation"
                  fallback="Each session guides you into a quiet, receptive mental space where your subconscious becomes open to new ways of thinking, feeling, and responding."
                  contentType="rich_text"
                />
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why This Works */}
      <section className="py-24 bg-[#F9F5EF]">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-[#1E3A32] mb-6">
              <CmsText 
                contentKey="pocket.why.title"
                page="PocketMindset"
                blockTitle="Why Section Title"
                fallback="Why Pocket Mindset™ Works"
                contentType="short_text"
              />
            </h2>
            <p className="text-[#2B2725]/80 text-lg leading-relaxed max-w-3xl mx-auto">
              <CmsText 
                contentKey="pocket.why.description"
                page="PocketMindset"
                blockTitle="Why Section Description"
                fallback="Your subconscious mind doesn't distinguish vividly imagined experience from lived experience. This is why elite performers, executives, athletes, and creators use mental rehearsal to achieve peak clarity."
                contentType="rich_text"
              />
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-8"
              >
                <div className="w-14 h-14 rounded-full bg-[#A6B7A3]/20 flex items-center justify-center mb-6">
                  <benefit.icon size={24} className="text-[#A6B7A3]" />
                </div>
                <h3 className="font-serif text-xl text-[#1E3A32] mb-3 flex items-start gap-2">
                  <span className="text-[#D8B46B] mt-1">✦</span>
                  <CmsText 
                    contentKey={`pocket.benefit${index + 1}.title`}
                    page="PocketMindset"
                    blockTitle={`Benefit ${index + 1} Title`}
                    fallback={benefit.title}
                    contentType="short_text"
                    as="span"
                  />
                </h3>
                <p className="text-[#2B2725]/70 leading-relaxed">
                  <CmsText 
                    contentKey={`pocket.benefit${index + 1}.description`}
                    page="PocketMindset"
                    blockTitle={`Benefit ${index + 1} Description`}
                    fallback={benefit.description}
                    contentType="rich_text"
                  />
                </p>
              </motion.div>
            ))}
          </div>

          <p className="text-center font-serif text-xl text-[#1E3A32] italic">
            <CmsText 
              contentKey="pocket.why.closing"
              page="PocketMindset"
              blockTitle="Why Section Closing"
              fallback="This is transformation through repetition, safety, and inner alignment."
              contentType="rich_text"
            />
          </p>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-[#1E3A32] mb-10">
              <CmsText 
                contentKey="pocket.when.title"
                page="PocketMindset"
                blockTitle="When Section Title"
                fallback="When to Use Pocket Mindset™"
                contentType="short_text"
              />
            </h2>

            <div className="bg-[#F9F5EF] p-10 mb-10">
              <p className="text-[#2B2725]/80 text-lg mb-6">
                <CmsText 
                  contentKey="pocket.when.intro"
                  page="PocketMindset"
                  blockTitle="When Section Intro"
                  fallback="You can use these sessions any time you want to feel:"
                  contentType="rich_text"
                />
              </p>
              <CmsText 
                contentKey="pocket.when.feelings"
                page="PocketMindset"
                blockTitle="When Section Feelings"
                fallback={`<div class='grid md:grid-cols-2 gap-4'>${useCases.feelings.map(feeling => `<div class='flex items-center gap-3'><div class='w-2 h-2 rounded-full bg-[#A6B7A3]'></div><span class='text-[#2B2725]/80 text-lg'>${feeling}</span></div>`).join('')}</div>`}
                contentType="rich_text"
              />
            </div>

            <div className="mb-10">
              <p className="text-[#2B2725]/80 text-lg mb-6 font-medium">
                <CmsText 
                  contentKey="pocket.when.perfect"
                  page="PocketMindset"
                  blockTitle="When Perfect For Intro"
                  fallback="They're perfect for:"
                  contentType="rich_text"
                />
              </p>
              <CmsText 
                contentKey="pocket.when.moments"
                page="PocketMindset"
                blockTitle="When Perfect Moments"
                fallback={`<div class='grid md:grid-cols-2 gap-4'>${useCases.moments.map(moment => `<div class='flex items-start gap-3'><div class='w-1.5 h-1.5 rounded-full bg-[#D8B46B] mt-2.5 flex-shrink-0'></div><span class='text-[#2B2725]/80'>${moment}</span></div>`).join('')}</div>`}
                contentType="rich_text"
              />
            </div>

            <p className="font-serif text-2xl text-[#1E3A32] italic text-center">
              <CmsText 
                contentKey="pocket.when.closing"
                page="PocketMindset"
                blockTitle="When Section Closing"
                fallback="A few minutes can shift your entire day."
                contentType="rich_text"
              />
            </p>
          </motion.div>
        </div>
      </section>

      {/* What's Inside the Library */}
      <section className="py-24 bg-[#F9F5EF]">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-[#1E3A32] mb-4">
              <CmsText 
                contentKey="pocket.library.title"
                page="PocketMindset"
                blockTitle="Library Section Title"
                fallback="What You'll Find Inside"
                contentType="short_text"
              />
            </h2>
            <p className="text-[#2B2725]/70 text-lg">
              <CmsText 
                contentKey="pocket.library.description"
                page="PocketMindset"
                blockTitle="Library Section Description"
                fallback="The Pocket Mindset™ library includes categories like:"
                contentType="rich_text"
              />
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {libraryCategories.map((category, index) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-8"
              >
                <div className="w-14 h-14 rounded-full bg-[#A6B7A3]/20 flex items-center justify-center mb-6">
                  <category.icon size={24} className="text-[#A6B7A3]" />
                </div>
                <h3 className="font-serif text-xl text-[#1E3A32] mb-3 flex items-start gap-2">
                  <span className="text-[#D8B46B] mt-1">✦</span>
                  <CmsText 
                    contentKey={`pocket.category${index + 1}.title`}
                    page="PocketMindset"
                    blockTitle={`Category ${index + 1} Title`}
                    fallback={category.title}
                    contentType="short_text"
                    as="span"
                  />
                </h3>
                <p className="text-[#2B2725]/70 leading-relaxed">
                  <CmsText 
                    contentKey={`pocket.category${index + 1}.description`}
                    page="PocketMindset"
                    blockTitle={`Category ${index + 1} Description`}
                    fallback={category.description}
                    contentType="rich_text"
                  />
                </p>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-[#2B2725]/70 text-lg italic">
            <CmsText 
              contentKey="pocket.library.note"
              page="PocketMindset"
              blockTitle="Library Note"
              fallback="New sessions are added regularly."
              contentType="rich_text"
            />
          </p>
        </div>
      </section>

      {/* How to Access */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-[#1E3A32] mb-12">
              <CmsText 
                contentKey="pocket.how.title"
                page="PocketMindset"
                blockTitle="How Section Title"
                fallback="How It Works"
                contentType="short_text"
              />
            </h2>

            <div className="space-y-8 mb-10">
              {howItWorks.map((step, index) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-6"
                >
                  <div className="w-12 h-12 rounded-full bg-[#A6B7A3]/20 flex items-center justify-center flex-shrink-0 text-[#1E3A32] font-serif text-xl">
                    {index + 1}
                  </div>
                  <div className="pt-2">
                    <h3 className="font-serif text-xl text-[#1E3A32] mb-2 flex items-start gap-2">
                      <span className="text-[#D8B46B]">✦</span>
                      <CmsText 
                        contentKey={`pocket.how.step${index + 1}.title`}
                        page="PocketMindset"
                        blockTitle={`Step ${index + 1} Title`}
                        fallback={step.step}
                        contentType="short_text"
                        as="span"
                      />
                    </h3>
                    <p className="text-[#2B2725]/80 text-lg">
                      <CmsText 
                        contentKey={`pocket.how.step${index + 1}.description`}
                        page="PocketMindset"
                        blockTitle={`Step ${index + 1} Description`}
                        fallback={step.description}
                        contentType="rich_text"
                      />
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="bg-[#F9F5EF] p-8 mb-10">
              <p className="text-[#2B2725]/80 text-lg text-center">
                <CmsText 
                  contentKey="pocket.how.note"
                  page="PocketMindset"
                  blockTitle="How Section Note"
                  fallback="Access Pocket Mindset™ through your private portal after purchase."
                  contentType="rich_text"
                />
              </p>
            </div>

            <div className="text-center">
              <Link
                to={createPageUrl("PocketVisualizationPurchase")}
                className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#1E3A32] text-[#F9F5EF] text-sm tracking-wide hover:bg-[#2B2725] transition-all duration-300"
              >
                Buy Here
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* A Message From Roberta */}
      <section className="py-24 bg-[#A6B7A3]">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-serif text-3xl md:text-4xl text-[#F9F5EF] mb-8">
              <CmsText 
                contentKey="pocket.note.title"
                page="PocketMindset"
                blockTitle="Personal Note Title"
                fallback="A Personal Note"
                contentType="short_text"
              />
            </h2>

            <div className="space-y-6 text-[#F9F5EF]/95 text-lg leading-relaxed">
              <p>
                <CmsText 
                  contentKey="pocket.note.paragraph1"
                  page="PocketMindset"
                  blockTitle="Personal Note Paragraph 1"
                  fallback="Pocket Mindset™ sessions are the tools I wish more people had access to — simple, calming, and deeply effective. You don't need an hour of meditation or a week-long retreat to shift your internal state. You just need a few quiet minutes and a gentle guide."
                  contentType="rich_text"
                />
              </p>
              <p>
                <CmsText 
                  contentKey="pocket.note.paragraph2"
                  page="PocketMindset"
                  blockTitle="Personal Note Paragraph 2"
                  fallback="This work changes people because it helps them change how they feel — and when that changes, everything else follows."
                  contentType="rich_text"
                />
              </p>
              <p className="font-serif text-xl italic pt-4">
                <CmsText 
                  contentKey="pocket.note.signature"
                  page="PocketMindset"
                  blockTitle="Personal Note Signature"
                  fallback="— Roberta Fernandez, Your Mind Stylist"
                  contentType="rich_text"
                />
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-[#1E3A32]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-[#F9F5EF] leading-tight mb-6">
              <CmsText 
                contentKey="pocket.cta.title"
                page="PocketMindset"
                blockTitle="CTA Title"
                fallback="Ready to Reset?"
                contentType="short_text"
              />
            </h2>

            <p className="text-[#F9F5EF]/80 text-lg leading-relaxed mb-10 max-w-2xl mx-auto">
              <CmsText 
                contentKey="pocket.cta.description"
                page="PocketMindset"
                blockTitle="CTA Description"
                fallback="Experience what it feels like to shift your state quickly, calmly, and intentionally."
                contentType="rich_text"
              />
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to={createPageUrl("PocketVisualizationPurchase")}
                className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#D8B46B] text-[#1E3A32] text-sm tracking-wide hover:bg-[#F9F5EF] transition-all duration-300"
              >
                Buy Here
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}