import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, User, Layers, Users, Brain } from "lucide-react";
import CmsText from "../cms/CmsText";

export default function MindStylingSuite() {
  const services = [
    {
      icon: Layers,
      title: "Cleaning Out Your Closet",
      tagline: "One-on-one hypnosis work to help you release old patterns and step into your future self.",
      description:
        "This is where deep transformation happens. Working privately with Roberta, you'll identify the patterns that no longer serve you, release outdated beliefs, and redesign your mindset from the inside out.",
      phases: [
        {
          name: "Part I — Edit",
          text: "See the patterns. Name the truth. Understand what's been driving your choices.",
        },
        {
          name: "Part II — Tailor",
          text: "Remove what no longer fits. Let go of beliefs and emotional loops you've outgrown.",
        },
        {
          name: "Part III — Design",
          text: "Rehearse your future self. Build identity-level change that lasts.",
        },
      ],
      cta: "Explore Cleaning Out Your Closet",
      link: "CleaningOutYourCloset",
      accent: "#1E3A32",
      bg: "bg-white",
    },
    {
      icon: User,
      title: "Expanding Your Mind Style",
      tagline: "Transform how you think, communicate, and lead.",
      description:
        "This is for individuals ready to expand their emotional intelligence, strengthen their identity, and step into their next level of personal and professional growth.",
      rightBox: {
        title: "",
        bullets: [
          "Different Thinkers.",
          "Innovative Problem Solvers.",
          "Better Human Beings."
        ]
      },
      cta: "Learn About LENS™",
      link: "LENS",
      accent: "#6E4F7D",
      bg: "bg-[#F9F5EF]",
    },
    {
      icon: Sparkles,
      title: "Pocket Mindset™ Sessions",
      tagline: "Reset your mind. Rehearse your future self in minutes.",
      description:
        "Short, powerful guided experiences that help you regulate your nervous system, dissolve stress, and embody the identity you're growing into.",
      bullets: [
        "Calm overwhelm",
        "Reduce emotional reactivity",
        "Build confidence",
        "Enhance clarity & decision-making",
        "Prepare for performance",
        "Balanced well-being",
        "Deep rest & inner regulation",
      ],
      bottomNote:
        "Not meditation. Not napping. This is inner rehearsal—a fast, elegant way to shift your state and reset your mind.",
      cta: "Explore Pocket Mindset",
      link: "PocketMindset",
      accent: "#A6B7A3",
      bg: "bg-[#A6B7A3]/10",
    },
    {
      icon: Users,
      title: "Organizational Mind Styling",
      tagline: "Transform how your team communicates, thinks, and leads.",
      description:
        "Workshops, trainings, and keynotes for teams and organizations who want to build cultures of emotional intelligence, clarity, and effective communication.",
      bullets: [
        "Navigate change",
        "Resolve conflict",
        "Improve communication",
        "Elevate performance",
        "Reduce burnout",
        "Strengthen leadership identity",
      ],
      cta: "Book Roberta to Speak",
      link: "SpeakingTraining",
      accent: "#1E3A32",
      bg: "bg-white",
    },
    {
      icon: Brain,
      title: "Learn Hypnosis",
      tagline: "Train your mind to guide others into calm, clarity, and transformation.",
      description:
        "Become a confident, ethical, emotionally intelligent hypnotist using Roberta's signature Mind Styling™ approach to subconscious change. Perfect for beginners, coaches, therapists, and anyone ready to help others reshape their inner world.",
      bullets: [
        "Understanding the subconscious mind",
        "Safe, ethical trance induction",
        "Emotional state design",
        "Custom session frameworks",
        "Work with anxiety, performance, confidence",
        "Live demos & practice sessions",
      ],
      bottomNote:
        "No prior experience required. This is hypnosis for people who want to facilitate transformation, not memorize scripts.",
      cta: "Explore Hypnosis Training",
      link: "LearnHypnosis",
      accent: "#6E4F7D",
      bg: "bg-white",
    },
  ];

  return (
    <section className="py-24 md:py-32 bg-[#E4D9C4]/30">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <span className="text-[#D8B46B] text-sm md:text-base tracking-[0.3em] uppercase mb-4 block font-bold">
            <CmsText
              contentKey="home.mind_styling_suite.label"
              page="Home"
              blockTitle="Mind Styling Suite Label"
              fallback="How We Work Together"
              contentType="short_text"
            />
          </span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-[#1E3A32]">
            <CmsText
              contentKey="home.mind_styling_suite.title"
              page="Home"
              blockTitle="Mind Styling Suite Title"
              fallback="Signature Services"
              contentType="short_text"
            />
          </h2>
        </motion.div>

        {/* Services Grid */}
        <div className="space-y-8">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`${service.bg} p-8 md:p-12 lg:p-16 relative overflow-hidden group`}
            >
              {/* Decorative Corner */}
              <div
                className="absolute top-0 right-0 w-32 h-32 opacity-10"
                style={{ backgroundColor: service.accent }}
              />

              <div className="relative z-10">
                {/* Icon */}
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mb-8"
                  style={{ backgroundColor: `${service.accent}15` }}
                >
                  <service.icon size={24} style={{ color: service.accent }} />
                </div>

                <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
                  {/* Left Content */}
                  <div>
                    <h3 className="font-serif text-2xl md:text-3xl text-[#1E3A32] mb-4">
                      <CmsText
                        contentKey={`home.suite.${index}.title`}
                        page="Home"
                        blockTitle={`${service.title} - Title`}
                        fallback={service.title}
                        contentType="short_text"
                        as="span"
                      />
                    </h3>
                    <p
                      className="font-serif italic text-lg md:text-xl mb-6"
                      style={{ color: service.accent }}
                    >
                      <CmsText
                        contentKey={`home.suite.${index}.tagline`}
                        page="Home"
                        blockTitle={`${service.title} - Tagline`}
                        fallback={service.tagline}
                        contentType="short_text"
                        as="span"
                      />
                    </p>
                    <CmsText
                      contentKey={`home.suite.${index}.description`}
                      page="Home"
                      blockTitle={`${service.title} - Description`}
                      fallback={service.description}
                      contentType="rich_text"
                      className="text-[#2B2725]/80 leading-relaxed"
                    />
                  </div>

                  {/* Right Content */}
                  <div>
                    {/* Phases for Certification */}
                    {service.phases && (
                      <div className="space-y-6 mb-8">
                        {service.phases.map((phase, phaseIndex) => (
                          <div key={phase.name} className="border-l-2 border-[#D8B46B] pl-6">
                            <h4 className="font-serif text-lg text-[#1E3A32] mb-1">
                              <CmsText
                                contentKey={`home.suite.${index}.phase${phaseIndex}.name`}
                                page="Home"
                                blockTitle={`${service.title} - ${phase.name}`}
                                fallback={phase.name}
                                contentType="short_text"
                                as="span"
                              />
                            </h4>
                            <CmsText
                              contentKey={`home.suite.${index}.phase${phaseIndex}.text`}
                              page="Home"
                              blockTitle={`${service.title} - ${phase.name} Text`}
                              fallback={phase.text}
                              contentType="short_text"
                              className="text-[#2B2725]/70 text-sm"
                              as="p"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Right Box for Expanding Your Mind Style */}
                    {service.rightBox && (
                      <div className="bg-white p-8 border-2 border-[#D8B46B] mb-8">
                        <div className="space-y-3">
                          {service.rightBox.bullets.map((bullet, idx) => (
                            <p key={idx} className="text-[#1E3A32] font-medium text-lg">
                              {bullet}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bullets */}
                    {service.bullets && (
                      <div className="mb-6">
                        <div className="grid grid-cols-2 gap-2">
                          {service.bullets.map((bullet) => (
                            <div key={bullet} className="flex items-center gap-2">
                              <div
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: service.accent }}
                              />
                              <span className="text-[#2B2725]/80 text-sm">{bullet}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bottom Note */}
                    {service.bottomNote && (
                      <CmsText
                        contentKey={`home.suite.${index}.bottomNote`}
                        page="Home"
                        blockTitle={`${service.title} - Bottom Note`}
                        fallback={service.bottomNote}
                        contentType="short_text"
                        className="text-[#2B2725]/80 text-sm italic mb-8"
                        as="p"
                      />
                    )}

                    {/* CTA */}
                    <Link
                      to={createPageUrl(service.link)}
                      className="group/link inline-flex items-center gap-3 text-[#1E3A32] font-medium hover:gap-4 transition-all"
                    >
                      <CmsText
                        contentKey={`home.suite.${index}.cta`}
                        page="Home"
                        blockTitle={`${service.title} - CTA`}
                        fallback={service.cta}
                        contentType="short_text"
                        as="span"
                      />
                      <ArrowRight
                        size={18}
                        className="group-hover/link:translate-x-1 transition-transform"
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
  );
}