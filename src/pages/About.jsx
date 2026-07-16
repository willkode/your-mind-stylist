import React from "react";
import SEO from "../components/SEO";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { motion } from "framer-motion";
import { ArrowRight, Check, Award, Users, Sparkles, Layers } from "lucide-react";
import CmsText from "../components/cms/CmsText";
import BeliefsSection from "../components/about/BeliefsSection";

export default function About() {
  const beliefs = [
    {
      icon: "✦",
      title: "You are not broken.",
      description: "You are simply patterned by experiences and beliefs that no longer fit who you're becoming.",
    },
    {
      icon: "✦",
      title: "Emotional intelligence is a superpower.",
      description: "It's not about being emotional — it's about understanding the meaning behind your reactions.",
    },
    {
      icon: "✦",
      title: "Your mind is designed to protect you, not punish you.",
      description: "Once you understand its mechanics, everything changes.",
    },
    {
      icon: "✦",
      title: "Change doesn't require force.",
      description: "It requires awareness, safety, and alignment.",
    },
    {
      icon: "✦",
      title: "When you edit your internal story, your entire life restyles itself.",
      description: "Relationships shift. Work changes. Confidence expands. Decisions become clearer.",
    },
  ];

  const credentials = [
    "Board-certified Hypnotherapist",
    "Master Practitioner of NLP",
    "Certified Integrative Emotional Intelligence Specialist",
    "Decades of executive, team, and leadership coaching",
    "Corporate consulting with Fortune-level and mid-size organizations",
    "Creator of The Mind Styling Evolution™",
    "Creator of The Pocket Visualization™ Sessions",
    "Host of Activated Dialogue — a podcast on emotional intelligence and conscious change",
  ];

  const approaches = [
    "Emotional Intelligence",
    "Neuroscience principles",
    "NLP & language patterns",
    "Hypnosis-informed mindset work",
    "Narrative reframing",
    "Cognitive-emotional integration",
    "Inner state regulation",
    "Identity rehearsal",
  ];

  const offerings = [
    {
      icon: Layers,
      title: "Cleaning Out Your Closet",
      description: "One-on-one hypnosis work to release old patterns and step into your future self.",
      link: "CleaningOutYourCloset",
    },
    {
      icon: Users,
      title: "LENS™",
      description: "Deep, customized one-on-one work to shift long-held internal patterns.",
      link: "LENS",
    },
    {
      icon: Award,
      title: "Organizational Mind Styling",
      description: "Workshops and trainings for communication, leadership, and team performance.",
      link: "SpeakingTraining",
    },
    {
      icon: Sparkles,
      title: "The Pocket Mindset™ Sessions",
      description: "Short, powerful guided experiences to shift your emotional state in minutes.",
      link: "PocketMindset",
    },
  ];

  return (
    <div className="bg-[#F9F5EF]">
      <SEO
        title="About Roberta | Your Mind Stylist"
        description="Meet Your Mind Stylist, Roberta Fernandez. Learn how decades of emotional intelligence, mindset work, and leadership coaching shaped her unique Mind Styling method."
        canonical="/about"
      />
      {/* Hero Section */}
      <section className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left - Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-[#D8B46B] text-xs tracking-[0.3em] uppercase mb-4 block">
                <CmsText 
                  contentKey="about.hero.subtitle" 
                  page="About"
                  blockTitle="Hero Subtitle"
                  fallback="Roberta Fernandez" 
                  contentType="short_text"
                />
              </span>
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-[#1E3A32] leading-tight mb-6">
                <CmsText 
                  contentKey="about.hero.title" 
                  page="About"
                  blockTitle="Hero Title"
                  fallback="Meet Your Mind Stylist" 
                  contentType="short_text"
                />
              </h1>
              <p className="text-[#2B2725]/80 text-xl leading-relaxed mb-10">
                <CmsText 
                  contentKey="about.hero.description" 
                  page="About"
                  blockTitle="Hero Description"
                  fallback="Helping you rewrite old patterns, reclaim your emotional intelligence, and restyle your life from the inside out." 
                  contentType="rich_text"
                />
              </p>
              <Link
                to={createPageUrl("Contact")}
                className="group inline-flex items-center gap-3 px-8 py-4 bg-[#1E3A32] text-[#F9F5EF] text-sm tracking-wide hover:bg-[#2B2725] transition-all duration-300"
              >
                Get Started
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </Link>
            </motion.div>

            {/* Right - Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative">
                <div className="absolute -top-6 -left-6 w-24 h-24 border-l-2 border-t-2 border-[#D8B46B]" />
                <div className="absolute -bottom-6 -right-6 w-24 h-24 border-r-2 border-b-2 border-[#D8B46B]" />
                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693a98b3e154ab3b36c88ebb/8a50d24ca_Roberta-Fernandez-IG-shoot90.png"
                  alt="Roberta Fernandez"
                  className="relative w-full aspect-[4/5] object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-[#D8B46B] text-xs tracking-[0.3em] uppercase mb-4 block">
              <CmsText 
                contentKey="about.story.subtitle" 
                page="About"
                blockTitle="Story Subtitle"
                fallback="The Mind Behind The Method" 
                contentType="short_text"
              />
            </span>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-[#1E3A32] mb-8">
              <CmsText 
                contentKey="about.story.title" 
                page="About"
                blockTitle="Story Title"
                fallback="A lifetime of helping people<br /><span class='italic'>think differently.</span>" 
                contentType="rich_text"
              />
            </h2>

            <div className="space-y-6 text-[#2B2725]/80 text-lg leading-relaxed">
              <CmsText 
                contentKey="about.story.paragraph1" 
                page="About"
                blockTitle="Story Paragraph 1"
                fallback="I've spent more than forty years studying how people think, feel, communicate, and change. My career has taken me into boardrooms, classrooms, small businesses, government agencies, and deeply personal one-on-one conversations. Across all of these environments, one truth emerged:" 
                contentType="rich_text"
              />

              <p className="font-serif text-2xl text-[#1E3A32] italic py-6">
                <CmsText 
                  contentKey="about.story.quote" 
                  page="About"
                  blockTitle="Story Quote"
                  fallback="Your thinking determines your experience of everything else." 
                  contentType="short_text"
                />
              </p>

              <CmsText 
                contentKey="about.story.paragraph2" 
                page="About"
                blockTitle="Story Paragraph 2"
                fallback="When people understand their internal patterns, everything becomes easier — communication, decision-making, leadership, relationships, confidence, and self-worth. When they don't, life feels heavier than it needs to." 
                contentType="rich_text"
              />

              <CmsText 
                contentKey="about.story.paragraph3" 
                page="About"
                blockTitle="Story Paragraph 3"
                fallback="This understanding became the foundation of my work — and the origin of Your Mind Stylist." 
                contentType="rich_text"
              />

              <CmsText 
                contentKey="about.story.paragraph4" 
                page="About"
                blockTitle="Story Paragraph 4"
                fallback="I help you see what you've been too close to recognize, let go of patterns you've outgrown, and redesign your thinking so your life can finally match your intention." 
                contentType="rich_text"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-24 bg-[#F9F5EF]">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-[#D8B46B] text-xs tracking-[0.3em] uppercase mb-4 block">
              <CmsText 
                contentKey="about.philosophy.subtitle" 
                page="About"
                blockTitle="Philosophy Subtitle"
                fallback="Your Mind Stylist Philosophy" 
                contentType="short_text"
              />
            </span>
            <h2 className="font-serif text-4xl md:text-5xl text-[#1E3A32] mb-8">
              <CmsText 
                contentKey="about.philosophy.title" 
                page="About"
                blockTitle="Philosophy Title"
                fallback="Think From Where You Want to Be." 
                contentType="short_text"
              />
            </h2>

            <div className="space-y-6 text-[#2B2725]/80 text-lg leading-relaxed mb-10">
              <CmsText 
                contentKey="about.philosophy.intro" 
                page="About"
                blockTitle="Philosophy Intro"
                fallback="<p>Most people try to change their lives by changing what they do.</p><p>But lasting transformation happens when you change <strong>how you think</strong> — the meaning you assign, the stories you carry, the emotional patterns you repeat, and the identity you operate from.</p>" 
                contentType="rich_text"
              />
            </div>

            <div className="bg-white p-8 md:p-10 mb-10">
              <p className="text-[#2B2725]/70 mb-6">
                <CmsText 
                  contentKey="about.philosophy.blend_intro" 
                  page="About"
                  blockTitle="Philosophy Blend Intro"
                  fallback="Your Mind Stylist approach blends:" 
                  contentType="short_text"
                />
              </p>
              <div className="grid md:grid-cols-2 gap-3">
                {approaches.map((approach, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#D8B46B] flex-shrink-0" />
                    <span className="text-[#2B2725]/80">
                      <CmsText 
                        contentKey={`about.philosophy.approach${index + 1}`}
                        page="About"
                        blockTitle={`Approach ${index + 1}`}
                        fallback={approach}
                        contentType="short_text"
                        as="span"
                      />
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 text-[#2B2725]/80 text-lg leading-relaxed">
              <CmsText 
                contentKey="about.philosophy.closing" 
                page="About"
                blockTitle="Philosophy Closing"
                fallback="<p>The work is profound, but it's not complicated.</p><p>It's simple, elegant, and deeply human.</p><p class='font-serif italic text-xl text-[#1E3A32]'>Just like great styling, it isn't about becoming someone else — it's about uncovering the version of yourself that has always been there.</p>" 
                contentType="rich_text"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Beliefs Section */}
      <section className="py-24 bg-[#1E3A32]">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-[#D8B46B] text-xs tracking-[0.3em] uppercase mb-4 block">
              <CmsText 
                contentKey="about.beliefs.subtitle" 
                page="About"
                blockTitle="Beliefs Subtitle"
                fallback="Core Principles" 
                contentType="short_text"
              />
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-[#F9F5EF]">
              <CmsText 
                contentKey="about.beliefs.title" 
                page="About"
                blockTitle="Beliefs Title"
                fallback="What I Believe" 
                contentType="short_text"
              />
            </h2>
          </motion.div>

          <BeliefsSection />

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <p className="font-serif text-2xl text-[#D8B46B] italic">
              <CmsText 
                contentKey="about.beliefs.closing" 
                page="About"
                blockTitle="Beliefs Closing"
                fallback="This is Mind Styling." 
                contentType="short_text"
              />
            </p>
          </motion.div>
        </div>
      </section>

      {/* Credentials Section */}
      <section className="py-24 bg-[#F9F5EF]">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-[#D8B46B] text-xs tracking-[0.3em] uppercase mb-4 block">
              <CmsText 
                contentKey="about.credentials.subtitle" 
                page="About"
                blockTitle="Credentials Subtitle"
                fallback="Credentials & Experience" 
                contentType="short_text"
              />
            </span>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-[#1E3A32] mb-8">
              <CmsText 
                contentKey="about.credentials.title" 
                page="About"
                blockTitle="Credentials Title"
                fallback="My Experience" 
                contentType="short_text"
              />
            </h2>

            <p className="text-[#2B2725]/80 text-lg leading-relaxed mb-10">
              <CmsText 
                contentKey="about.credentials.intro" 
                page="About"
                blockTitle="Credentials Intro"
                fallback="I've helped thousands of individuals and teams transform how they think and communicate. My background includes:" 
                contentType="rich_text"
              />
            </p>

            <div className="bg-white p-8 md:p-10 mb-10">
              <div className="space-y-4">
                {credentials.map((credential, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <Check size={20} className="text-[#D8B46B] flex-shrink-0 mt-1" />
                    <span className="text-[#2B2725]/80 text-lg">
                      <CmsText 
                        contentKey={`about.credentials.item${index + 1}`}
                        page="About"
                        blockTitle={`Credential ${index + 1}`}
                        fallback={credential}
                        contentType="short_text"
                        as="span"
                      />
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <p className="font-serif text-xl text-[#1E3A32] italic">
              <CmsText 
                contentKey="about.credentials.closing" 
                page="About"
                blockTitle="Credentials Closing"
                fallback="From high-performing executives to individuals in transition, the real work is the same: Help people recognize their patterns and step into the version of themselves they've been waiting for." 
                contentType="rich_text"
              />
            </p>
          </motion.div>
        </div>
      </section>

      {/* Origin Section */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-[#D8B46B] text-xs tracking-[0.3em] uppercase mb-4 block">
              <CmsText 
                contentKey="about.origin.subtitle" 
                page="About"
                blockTitle="Origin Subtitle"
                fallback="The Origin" 
                contentType="short_text"
              />
            </span>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-[#1E3A32] mb-8">
              <CmsText 
                contentKey="about.origin.title" 
                page="About"
                blockTitle="Origin Title"
                fallback="Why &quot;Your Mind Stylist&quot;?" 
                contentType="short_text"
              />
            </h2>

            <div className="space-y-6 text-[#2B2725]/80 text-lg leading-relaxed">
              <CmsText 
                contentKey="about.origin.content" 
                page="About"
                blockTitle="Origin Content"
                fallback="<p>Because transformation isn't about starting over — it's about refining, tailoring, and redesigning the mindset you already have.</p><p>Just like personal style, your mental patterns can be:</p><ul class='list-none space-y-2 pl-6'><li class='flex items-center gap-3'><span class='w-2 h-2 rounded-full bg-[#D8B46B]'></span>outdated</li><li class='flex items-center gap-3'><span class='w-2 h-2 rounded-full bg-[#D8B46B]'></span>ill-fitting</li><li class='flex items-center gap-3'><span class='w-2 h-2 rounded-full bg-[#D8B46B]'></span>inherited</li><li class='flex items-center gap-3'><span class='w-2 h-2 rounded-full bg-[#D8B46B]'></span>misunderstood</li><li class='flex items-center gap-3'><span class='w-2 h-2 rounded-full bg-[#D8B46B]'></span>or simply never chosen intentionally</li></ul><p>Mind Styling allows you to build a mental wardrobe that fits the life you want to live.</p><p class='font-serif text-xl text-[#1E3A32] italic'>It's elegant, intuitive, and profoundly effective.</p>" 
                contentType="rich_text"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Work With Me Section */}
      <section className="py-24 bg-[#E4D9C4]/30">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-[#D8B46B] text-xs tracking-[0.3em] uppercase mb-4 block">
              <CmsText 
                contentKey="about.work.subtitle" 
                page="About"
                blockTitle="Work With Me Subtitle"
                fallback="How We Can Work Together" 
                contentType="short_text"
              />
            </span>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-[#1E3A32] mb-6">
              <CmsText 
                contentKey="about.work.title" 
                page="About"
                blockTitle="Work With Me Title"
                fallback="Work With Me" 
                contentType="short_text"
              />
            </h2>
            <p className="text-[#2B2725]/80 text-lg max-w-2xl mx-auto">
              <CmsText 
                contentKey="about.work.description" 
                page="About"
                blockTitle="Work With Me Description"
                fallback="Whether you're an individual ready for personal reinvention or a leader looking to elevate your team's emotional intelligence, there is a Mind Styling path for you." 
                contentType="rich_text"
              />
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {offerings.map((offering, index) => (
              <Link
                key={index}
                to={createPageUrl(offering.link)}
                className="block bg-white p-8 h-full group hover:shadow-lg transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-full bg-[#D8B46B]/20 flex items-center justify-center mb-6">
                  <offering.icon size={24} className="text-[#D8B46B]" />
                </div>
                <h3 className="font-serif text-2xl text-[#1E3A32] mb-3">
                  <CmsText 
                    contentKey={`about.work.offering${index + 1}.title`}
                    page="About"
                    blockTitle={`Offering ${index + 1} Title`}
                    fallback={offering.title}
                    contentType="short_text"
                    as="span"
                  />
                </h3>
                <p className="text-[#2B2725]/70 mb-6">
                  <CmsText 
                    contentKey={`about.work.offering${index + 1}.description`}
                    page="About"
                    blockTitle={`Offering ${index + 1} Description`}
                    fallback={offering.description}
                    contentType="rich_text"
                  />
                </p>
                <span className="text-[#1E3A32] font-medium group-hover:text-[#D8B46B] transition-colors inline-flex items-center gap-2">
                  <CmsText 
                    contentKey={`about.work.offering${index + 1}.cta`}
                    page="About"
                    blockTitle={`Offering ${index + 1} CTA Text`}
                    fallback="Learn More"
                    contentType="short_text"
                    as="span"
                  />
                  <ArrowRight size={16} />
                </span>
              </Link>
            ))}
          </div>
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
                contentKey="about.cta.title" 
                page="About"
                blockTitle="CTA Title"
                fallback="If You're Ready,<br /><span class='italic text-[#D8B46B]'>I'm Ready.</span>" 
                contentType="rich_text"
              />
            </h2>

            <p className="text-[#F9F5EF]/80 text-lg leading-relaxed mb-10 max-w-2xl mx-auto">
              <CmsText 
                contentKey="about.cta.description" 
                page="About"
                blockTitle="CTA Description"
                fallback="Changing your life starts with changing how you think. If you're ready to step into clarity, calm, and confidence, let's begin." 
                contentType="rich_text"
              />
            </p>

            <Link
              to={createPageUrl("Bookings")}
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#D8B46B] text-[#1E3A32] text-sm tracking-wide hover:bg-[#F9F5EF] transition-all duration-300"
            >
              Schedule Your Complimentary Consultation
              <ArrowRight
                size={16}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}