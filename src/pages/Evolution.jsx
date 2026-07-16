import React from "react";
import SEO from "../components/SEO";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { motion } from "framer-motion";
import { ArrowRight, Check, Edit3, Scissors, Sparkles } from "lucide-react";
import CmsText from "../components/cms/CmsText";

export default function Evolution() {
  const phases = [
    {
      number: "Part I",
      name: "Edit",
      icon: Edit3,
      tagline: "See the Patterns. Name the Truth.",
      description:
        "Before you can change anything, you must understand it. In this phase, you'll learn how your mind organizes experiences, forms stories, and maintains old beliefs — even when they no longer serve you.",
      learnings: [
        "Emotional intelligence fundamentals",
        "How patterns are created",
        "How identity attaches to old narratives",
        "How to observe your thoughts without judgment",
        "Distinguishing emotional truth from cognitive truth",
      ],
      outcome:
        "You'll see your patterns clearly — in real time — and begin the shift toward conscious choice.",
      color: "#1E3A32",
    },
    {
      number: "Part II",
      name: "Tailor",
      icon: Scissors,
      tagline: "Release What No Longer Fits.",
      description:
        "This is where reinvention begins. We refine, reshape, and release outdated patterns, beliefs, and emotional loops that have been directing your choices and reactions.",
      learnings: [
        "Pattern interruption techniques",
        "Identity release tools",
        "Emotional regulation & nervous system stability",
        "How to remove resistance from change",
        "How to build new cognitive-emotional links",
      ],
      outcome:
        "You stop reacting from old templates and begin thinking from clarity, calm, and intention.",
      color: "#D8B46B",
    },
    {
      number: "Part III",
      name: "Design",
      icon: Sparkles,
      tagline: "Become the Person You've Been Trying to Grow Into.",
      description:
        "Once the old patterns are cleared, you design the mindset that reflects your goals, identity, and next level.",
      learnings: [
        "Future-self rehearsal techniques",
        "Conscious communication",
        "Leadership-level emotional intelligence",
        "How to create environments for psychological clarity",
        "Habit and behavior design aligned with your new identity",
      ],
      outcome:
        "You become someone who responds instead of reacts — and creates rather than copes. Your thinking aligns with your future self.",
      color: "#6E4F7D",
    },
  ];

  const perfectFor = [
    "Leaders & professionals",
    "Individuals in transition",
    "High performers",
    "Entrepreneurs & creatives",
    "Anyone ready for clarity, confidence, and emotional intelligence",
  ];

  const included = [
    "Three structured phases (Edit → Tailor → Design)",
    "Video lessons + guided practice",
    "Inner pattern assessments",
    "Emotional intelligence tools",
    "Identity-realignment exercises",
    "Future-self rehearsal methods",
    "Workbooks & prompts",
    "Access to optional support from Roberta (group or 1:1 add-ons)",
    "Certificate upon completion",
  ];

  const outcomes = [
    "Understand your internal patterns",
    "Think with clarity instead of confusion",
    "Respond instead of react",
    "Dissolve old emotional triggers",
    "Strengthen your emotional intelligence",
    "Expand your self-concept",
    "Communicate with confidence and calm",
    "Step into your next-level identity",
    "Lead yourself — and others — with intention",
  ];

  const faqs = [
    {
      question: "How long does the Mind Styling Evolution take?",
      answer: "It's self-paced. Most people complete it in 6–12 weeks, depending on their schedule.",
    },
    {
      question: "Is this therapy?",
      answer:
        "No. This is a psychology-informed, future-focused, skill-building program designed to support self-awareness, emotional intelligence, and mental clarity.",
    },
    {
      question: "Can I do this alongside other personal development work?",
      answer:
        "Yes — it enhances everything else you're doing by giving you the internal tools to support change.",
    },
    {
      question: "What if I've done programs like this before?",
      answer:
        "Most clients say this is unlike anything they've experienced. Mind Styling focuses on identity-level transformation rather than surface habits.",
    },
    {
      question: "Will I get access to Roberta directly?",
      answer:
        "The core program is self-paced. Optional private sessions or group upgrades are available.",
    },
  ];

  return (
    <div className="bg-[#F9F5EF]">
      <SEO
        title="Mind Styling Evolution™ | Mindset & Emotional Intelligence Training"
        description="A three-part inner redesign for people ready for a new mental operating system. Build emotional intelligence, identity-level change, and clearer thinking."
        canonical="/evolution"
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
                contentKey="evolution.hero.subtitle" 
                page="Evolution"
                blockTitle="Hero Subtitle"
                fallback="Signature Program" 
                contentType="short_text"
              />
            </span>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-[#1E3A32] leading-tight mb-6">
              <CmsText 
                contentKey="evolution.hero.title" 
                page="Evolution"
                blockTitle="Hero Title"
                fallback="Cleaning Out Your Closet" 
                contentType="short_text"
              />
            </h1>
            <p className="text-[#1E3A32] font-serif text-2xl md:text-3xl italic mb-8">
              <CmsText 
                contentKey="evolution.hero.tagline" 
                page="Evolution"
                blockTitle="Hero Tagline"
                fallback="One-on-one hypnosis work to release old patterns and step into your future self." 
                contentType="short_text"
              />
            </p>

            <p className="text-[#2B2725]/80 text-lg leading-relaxed mb-10 max-w-3xl mx-auto">
              <CmsText 
                contentKey="evolution.hero.description" 
                page="Evolution"
                blockTitle="Hero Description"
                fallback="When your mindset shifts, everything else in your life begins to realign. This program is designed to help you understand how your mind actually works, release the patterns that no longer fit, and become the person you've been trying to step into." 
                contentType="rich_text"
              />
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to={createPageUrl("Bookings")}
                className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#1E3A32] text-[#F9F5EF] text-sm tracking-wide hover:bg-[#2B2725] transition-all duration-300"
              >
                Schedule Your Free Consultation
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </Link>
              <Link
                to={createPageUrl("Contact")}
                className="group inline-flex items-center justify-center gap-3 px-8 py-4 border border-[#D8B46B] text-[#1E3A32] text-sm tracking-wide hover:bg-[#D8B46B]/10 transition-all duration-300"
              >
                Have Questions?
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Who This Is For */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-[#1E3A32] mb-8">
              <CmsText 
                contentKey="evolution.for.title" 
                page="Evolution"
                blockTitle="Who This Is For Title"
                fallback="Who This Program Is Designed For" 
                contentType="short_text"
              />
            </h2>

            <p className="text-[#2B2725]/80 text-lg leading-relaxed mb-8">
              <CmsText 
                contentKey="evolution.for.intro" 
                page="Evolution"
                blockTitle="Who This Is For Intro"
                fallback="This program is for individuals who are ready for more than surface-level mindset work. It's for people who are done repeating the same stories, outgrowing old patterns, and feeling stuck between who they are and who they want to be." 
                contentType="rich_text"
              />
            </p>

            <div className="bg-[#F9F5EF] p-8 mb-8">
              <p className="text-[#2B2725]/60 text-sm uppercase tracking-wide mb-6">Perfect for:</p>
              <CmsText 
                contentKey="evolution.for.list"
                page="Evolution"
                blockTitle="Perfect For List"
                fallback={`<div class='space-y-3'>${perfectFor.map(item => `<div class='flex items-center gap-3'><svg class='lucide lucide-check' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='#D8B46B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M20 6 9 17l-5-5'/></svg><span class='text-[#2B2725]/80 text-lg'>${item}</span></div>`).join('')}</div>`}
                contentType="rich_text"
              />
            </div>

            <p className="font-serif text-xl text-[#1E3A32] italic">
              <CmsText 
                contentKey="evolution.for.closing" 
                page="Evolution"
                blockTitle="Who This Is For Closing"
                fallback="If you're ready to think from where you want to be — not where you've been — this is your path." 
                contentType="rich_text"
              />
            </p>
          </motion.div>
        </div>
      </section>

      {/* Program Overview */}
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
                contentKey="evolution.overview.title" 
                page="Evolution"
                blockTitle="Overview Title"
                fallback="How Mind Styling Evolution Works" 
                contentType="short_text"
              />
            </h2>
            <p className="text-[#2B2725]/70 text-lg">
              <CmsText 
                contentKey="evolution.overview.subtitle" 
                page="Evolution"
                blockTitle="Overview Subtitle"
                fallback="A three-part, editorial-style process based on the Mind Stylist method" 
                contentType="short_text"
              />
            </p>
          </motion.div>

          <div className="space-y-16">
            {phases.map((phase, index) => (
              <motion.div
                key={phase.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-10 md:p-14 relative overflow-hidden"
              >
                {/* Decorative Corner */}
                <div
                  className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-5"
                  style={{ backgroundColor: phase.color }}
                />

                <div className="relative z-10">
                {/* Header */}
                <div className="flex items-start gap-6 mb-8">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${phase.color}15` }}
                  >
                    <phase.icon size={32} style={{ color: phase.color }} />
                  </div>
                  <div>
                    <span
                      className="text-sm tracking-[0.2em] uppercase mb-2 block"
                      style={{ color: phase.color }}
                    >
                      <CmsText 
                        contentKey={`evolution.phase${index + 1}.number`}
                        page="Evolution"
                        blockTitle={`Phase ${index + 1} Number`}
                        fallback={phase.number}
                        contentType="short_text"
                        as="span"
                      />
                    </span>
                    <h3 className="font-serif text-4xl md:text-5xl text-[#1E3A32] mb-3">
                      <CmsText 
                        contentKey={`evolution.phase${index + 1}.name`}
                        page="Evolution"
                        blockTitle={`Phase ${index + 1} Name`}
                        fallback={phase.name}
                        contentType="short_text"
                        as="span"
                      />
                    </h3>
                    <p className="font-serif text-xl md:text-2xl text-[#2B2725]/70 italic">
                      <CmsText 
                        contentKey={`evolution.phase${index + 1}.tagline`}
                        page="Evolution"
                        blockTitle={`Phase ${index + 1} Tagline`}
                        fallback={phase.tagline}
                        contentType="short_text"
                      />
                    </p>
                  </div>
                </div>

                  {/* Content Grid */}
                  <div className="grid lg:grid-cols-2 gap-10">
                    {/* Left - Description & Learnings */}
                    <div>
                      <p className="text-[#2B2725]/80 text-lg leading-relaxed mb-8">
                        <CmsText 
                          contentKey={`evolution.phase${index + 1}.description`}
                          page="Evolution"
                          blockTitle={`Phase ${index + 1} Description`}
                          fallback={phase.description}
                          contentType="rich_text"
                        />
                      </p>

                      <div className="border-l-2 border-[#D8B46B] pl-6 mb-8">
                        <p className="text-[#2B2725]/60 text-sm uppercase tracking-wide mb-2">
                          You'll Learn To:
                        </p>
                        <CmsText 
                          contentKey={`evolution.phase${index + 1}.learnings`}
                          page="Evolution"
                          blockTitle={`Phase ${index + 1} Learnings`}
                          fallback={`<ul class='space-y-2'>${phase.learnings.map(learning => `<li class='text-[#2B2725]/80 flex items-start gap-2'><span class='text-[#D8B46B] mt-1'>•</span>${learning}</li>`).join('')}</ul>`}
                          contentType="rich_text"
                        />
                      </div>
                    </div>

                    {/* Right - Outcome & CTA */}
                    <div className="flex flex-col justify-between">
                      <div className="bg-[#F9F5EF] p-6 md:p-8 mb-8">
                        <p className="text-[#2B2725]/60 text-sm uppercase tracking-wide mb-3">
                          Outcome:
                        </p>
                        <p className="text-[#2B2725]/80 text-lg leading-relaxed italic">
                          <CmsText 
                            contentKey={`evolution.phase${index + 1}.outcome`}
                            page="Evolution"
                            blockTitle={`Phase ${index + 1} Outcome`}
                            fallback={phase.outcome}
                            contentType="rich_text"
                          />
                        </p>
                      </div>

                      <Link
                        to={createPageUrl("Bookings")}
                        className="group inline-flex items-center justify-center gap-3 px-6 py-3 bg-[#1E3A32] text-[#F9F5EF] text-sm tracking-wide hover:bg-[#2B2725] transition-all duration-300"
                      >
                        Schedule Your Free Consultation
                        <ArrowRight
                          size={16}
                          className="group-hover:translate-x-1 transition-transform"
                        />
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>



      {/* Benefits & Outcomes */}
      <section className="py-24 bg-[#1E3A32]">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-[#F9F5EF] mb-10">
              <CmsText 
                contentKey="evolution.outcomes.title" 
                page="Evolution"
                blockTitle="Outcomes Title"
                fallback="The Transformation You Can Expect" 
                contentType="short_text"
              />
            </h2>

            <p className="text-[#F9F5EF]/80 text-lg mb-10">
              <CmsText 
                contentKey="evolution.outcomes.intro" 
                page="Evolution"
                blockTitle="Outcomes Intro"
                fallback="By the end of this program, you will:" 
                contentType="short_text"
              />
            </p>

            <div className="grid md:grid-cols-2 gap-4 mb-10">
              {outcomes.map((outcome, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <Check size={20} className="text-[#D8B46B] mt-1 flex-shrink-0" />
                  <span className="text-[#F9F5EF]/90 text-lg">
                    <CmsText 
                      contentKey={`evolution.outcome${idx + 1}`}
                      page="Evolution"
                      blockTitle={`Outcome ${idx + 1}`}
                      fallback={outcome}
                      contentType="short_text"
                      as="span"
                    />
                  </span>
                </div>
              ))}
            </div>

            <p className="font-serif text-2xl text-[#D8B46B] italic text-center">
              <CmsText 
                contentKey="evolution.outcomes.closing" 
                page="Evolution"
                blockTitle="Outcomes Closing"
                fallback="This is a complete internal redesign." 
                contentType="short_text"
              />
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-[#F9F5EF]">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-[#1E3A32] mb-12 text-center">
              <CmsText 
                contentKey="evolution.faq.title" 
                page="Evolution"
                blockTitle="FAQ Title"
                fallback="Frequently Asked Questions" 
                contentType="short_text"
              />
            </h2>

            <div className="space-y-8">
              {faqs.map((faq, idx) => (
                <motion.div
                  key={faq.question}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white p-8"
                >
                  <h3 className="font-serif text-xl md:text-2xl text-[#1E3A32] mb-4">
                    <CmsText 
                      contentKey={`evolution.faq${idx + 1}.question`}
                      page="Evolution"
                      blockTitle={`FAQ ${idx + 1} Question`}
                      fallback={faq.question}
                      contentType="short_text"
                    />
                  </h3>
                  <p className="text-[#2B2725]/80 text-lg leading-relaxed">
                    <CmsText 
                      contentKey={`evolution.faq${idx + 1}.answer`}
                      page="Evolution"
                      blockTitle={`FAQ ${idx + 1} Answer`}
                      fallback={faq.answer}
                      contentType="rich_text"
                    />
                  </p>
                </motion.div>
              ))}
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
                contentKey="evolution.cta.title" 
                page="Evolution"
                blockTitle="CTA Title"
                fallback="Begin Your Mind Styling Evolution" 
                contentType="short_text"
              />
            </h2>

            <p className="text-[#F9F5EF]/80 text-lg leading-relaxed mb-10 max-w-2xl mx-auto">
              <CmsText 
                contentKey="evolution.cta.description" 
                page="Evolution"
                blockTitle="CTA Description"
                fallback="When you change your thinking, you change everything — your confidence, relationships, leadership, and sense of possibility." 
                contentType="rich_text"
              />
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to={createPageUrl("Bookings")}
                className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#D8B46B] text-[#1E3A32] text-sm tracking-wide hover:bg-[#F9F5EF] transition-all duration-300"
              >
                Schedule Your Free Consultation
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </Link>
              <Link
                to={createPageUrl("Contact")}
                className="group inline-flex items-center justify-center gap-3 px-8 py-4 border border-[#D8B46B] text-[#F9F5EF] text-sm tracking-wide hover:bg-[#D8B46B]/10 transition-all duration-300"
              >
                Have Questions?
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}