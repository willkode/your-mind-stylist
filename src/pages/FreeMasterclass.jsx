import React from "react";
import SEO from "../components/SEO";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { motion } from "framer-motion";
import { ArrowRight, Play, CheckCircle, Lightbulb, Shield, Brain, Users, Star } from "lucide-react";
import CmsText from "../components/cms/CmsText";
import { base44 } from "@/api/base44Client";

export default function FreeMasterclass() {
  const learnings = [
    "What imposter syndrome really is — and what it isn't",
    "The emotional and cognitive patterns behind \"I'm not enough\"",
    "Why high performers and leaders are especially vulnerable to it",
    "How your mind creates stories about worth, competence, and belonging",
    "Practical ways to interrupt the imposter loop when it shows up",
    "How to begin trusting your own abilities — without needing constant external validation",
  ];

  const forYouIf = [
    "You're successful on paper but still feel like you're winging it",
    "You downplay your achievements or feel uncomfortable owning them",
    "You worry others will \"find out\" you're not as capable as they think",
    "You compare yourself constantly and come up short",
    "You feel pressure to perform perfectly to feel safe or worthy",
    "You lead others, but privately question your legitimacy",
  ];

  const approaches = [
    {
      title: "The stories",
      description: "Your mind is running about your place in the world",
    },
    {
      title: "The emotional patterns",
      description: "That got wired in over time",
    },
    {
      title: "The expectations",
      description: "You've internalized about success and worth",
    },
    {
      title: "The pressure",
      description: "Of always needing to prove yourself",
    },
  ];

  const steps = [
    {
      number: "1",
      title: "Create your free account",
      description: "Sign up once to access your private Mind Stylist Portal.",
    },
    {
      number: "2",
      title: "Access the masterclass",
      description: "You'll find the video inside your portal under \"Imposter Syndrome & Other Myths to Ditch.\"",
    },
    {
      number: "3",
      title: "Watch on your own time",
      description: "Pause, reflect, take notes. Rewatch any time you like.",
    },
    {
      number: "4",
      title: "Take your next step",
      description: "When you're ready, you can explore the Mind Styling Certification™, Private Mind Styling, or The Inner Rehearsal Sessions™ from within your dashboard.",
    },
  ];

  const offerings = [
    {
      icon: Brain,
      title: "The Mind Styling Certification™",
      description: "For identity-level change and emotional intelligence.",
      link: "LearnHypnosis",
    },
    {
      icon: Users,
      title: "LENS™",
      description: "For personalized support in shifting long-held patterns.",
      link: "CleaningOutYourCloset",
    },
    {
      icon: Star,
      title: "The Inner Rehearsal Sessions™",
      description: "For ongoing internal resets and future-self rehearsal.",
      link: "InnerRehearsal",
    },
  ];

  return (
    <div className="bg-[#F9F5EF]">
      <SEO
        title="Free Masterclass | Imposter Syndrome & Other Myths to Ditch"
        description="An on-demand masterclass with Your Mind Stylist on imposter syndrome and other myths to let go of so you can finally trust your own abilities."
        canonical="/free-masterclass"
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
                contentKey="freemasterclass.hero.label" 
                page="FreeMasterclass"
                blockTitle="Hero Label"
                fallback="Free On-Demand Masterclass" 
                contentType="short_text"
              />
            </span>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-[#1E3A32] leading-tight mb-6 text-center">
              <CmsText 
                contentKey="freemasterclass.hero.title" 
                page="FreeMasterclass"
                blockTitle="Hero Title"
                fallback="Imposter Syndrome<br /><span class='italic text-[#D8B46B]'>& Other Myths to Ditch</span>" 
                contentType="rich_text"
              />
            </h1>
            <p className="text-[#2B2725] font-serif text-2xl md:text-3xl italic mb-8 text-center">
              <CmsText 
                contentKey="freemasterclass.hero.tagline" 
                page="FreeMasterclass"
                blockTitle="Hero Tagline"
                fallback="A practical, psychologically grounded class to help you stop feeling like you're faking it — and start trusting your abilities." 
                contentType="short_text"
              />
            </p>

            <p className="text-[#2B2725]/80 text-lg leading-relaxed mb-10 max-w-3xl mx-auto text-center">
              <CmsText 
                contentKey="freemasterclass.hero.paragraph1" 
                page="FreeMasterclass"
                blockTitle="Hero Paragraph 1"
                fallback="If you've ever felt like you don't belong in the room, that you're not &quot;qualified enough,&quot; or that people will eventually find out you're not as capable as they think — this class is for you." 
                contentType="rich_text"
              />
            </p>

            <p className="text-[#2B2725]/80 text-lg leading-relaxed mb-10 max-w-3xl mx-auto text-center">
              <CmsText 
                contentKey="freemasterclass.hero.paragraph2" 
                page="FreeMasterclass"
                blockTitle="Hero Paragraph 2"
                fallback="In this on-demand masterclass, you'll learn what's really happening beneath imposter syndrome and how to shift the way you see yourself, your work, and your abilities." 
                contentType="rich_text"
              />
            </p>

            {/* Email Capture Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="max-w-md mx-auto"
            >
              <div className="bg-white p-8 rounded-lg shadow-lg">
                <h3 className="font-serif text-2xl text-[#1E3A32] mb-4 text-center">
                  <CmsText 
                    contentKey="freemasterclass.hero.form_title" 
                    page="FreeMasterclass"
                    blockTitle="Email Form Title"
                    fallback="Get Instant Access" 
                    contentType="short_text"
                  />
                </h3>
                <p className="text-[#2B2725]/70 text-sm mb-6 text-center">
                  <CmsText 
                    contentKey="freemasterclass.hero.form_description" 
                    page="FreeMasterclass"
                    blockTitle="Email Form Description"
                    fallback="Enter your email to watch the masterclass now" 
                    contentType="short_text"
                  />
                </p>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const email = formData.get('email');
                    const name = formData.get('name');
                    
                    try {
                      await base44.functions.invoke('sendMasterclassConfirmation', {
                        email,
                        full_name: name,
                      });
                      window.location.href = createPageUrl("Masterclass");
                    } catch (error) {
                      alert('Error: ' + error.message);
                    }
                  }}
                  className="space-y-4"
                >
                  <div>
                    <input
                      type="text"
                      name="name"
                      placeholder="Your Name"
                      required
                      className="w-full px-4 py-3 border border-[#E4D9C4] rounded focus:border-[#D8B46B] focus:outline-none text-[#1E3A32]"
                    />
                  </div>
                  <div>
                    <input
                      type="email"
                      name="email"
                      placeholder="Your Email"
                      required
                      className="w-full px-4 py-3 border border-[#E4D9C4] rounded focus:border-[#D8B46B] focus:outline-none text-[#1E3A32]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full px-8 py-4 bg-[#1E3A32] text-[#F9F5EF] text-sm tracking-wide hover:bg-[#2B2725] transition-all duration-300 rounded"
                  >
                    Watch Free Masterclass Now
                  </button>
                </form>
                <p className="text-xs text-[#2B2725]/50 mt-4 text-center">
                  We respect your privacy. Unsubscribe anytime.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* What You'll Learn */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-[#1E3A32] mb-8">
              <CmsText 
                contentKey="freemasterclass.learn.title" 
                page="FreeMasterclass"
                blockTitle="What You'll Learn - Title"
                fallback="What You'll Learn in This Class" 
                contentType="short_text"
              />
            </h2>

            <p className="text-[#2B2725]/80 text-lg leading-relaxed mb-8">
              <CmsText 
                contentKey="freemasterclass.learn.intro" 
                page="FreeMasterclass"
                blockTitle="What You'll Learn - Intro"
                fallback="In this masterclass, you'll explore:" 
                contentType="rich_text"
              />
            </p>

            <div className="space-y-4 mb-10">
              {learnings.map((learning, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-4 bg-[#F9F5EF] p-6"
                >
                  <CheckCircle size={24} className="text-[#D8B46B] flex-shrink-0 mt-0.5" />
                  <span className="text-[#2B2725]/80 text-lg">
                    <CmsText 
                      contentKey={`freemasterclass.learn.item${index + 1}`}
                      page="FreeMasterclass"
                      blockTitle={`What You'll Learn - Item ${index + 1}`}
                      fallback={learning}
                      contentType="short_text"
                      as="span"
                    />
                  </span>
                </motion.div>
              ))}
            </div>

            <div className="border-l-4 border-[#D8B46B] pl-6 mb-8">
              <p className="font-serif text-xl text-[#1E3A32] mb-2">
                <CmsText 
                  contentKey="freemasterclass.learn.callout1" 
                  page="FreeMasterclass"
                  blockTitle="What You'll Learn - Callout Line 1"
                  fallback="This class isn't about &quot;fake it till you make it.&quot;" 
                  contentType="rich_text"
                />
              </p>
              <p className="text-[#2B2725]/80 text-lg">
                <CmsText 
                  contentKey="freemasterclass.learn.callout2" 
                  page="FreeMasterclass"
                  blockTitle="What You'll Learn - Callout Line 2"
                  fallback="It's about understanding your mind so you can stop fighting yourself." 
                  contentType="rich_text"
                />
              </p>
            </div>

            <div className="text-center">
              <a
                href="https://yourmindstylist.com/login"
                className="group inline-flex items-center gap-3 px-8 py-4 bg-[#1E3A32] text-[#F9F5EF] text-sm tracking-wide hover:bg-[#2B2725] transition-all duration-300"
              >
                Access the Free Masterclass
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Who This Is For */}
      <section className="py-24 bg-[#F9F5EF]">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-[#1E3A32] mb-8">
              <CmsText 
                contentKey="freemasterclass.foryou.title" 
                page="FreeMasterclass"
                blockTitle="For You If - Title"
                fallback="This Class Is for You If…" 
                contentType="short_text"
              />
            </h2>

            <div className="space-y-4">
              {forYouIf.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-2 h-2 rounded-full bg-[#6E4F7D] mt-2.5 flex-shrink-0" />
                  <span className="text-[#2B2725]/80 text-lg">
                    <CmsText 
                      contentKey={`freemasterclass.foryou.item${index + 1}`}
                      page="FreeMasterclass"
                      blockTitle={`For You If - Item ${index + 1}`}
                      fallback={item}
                      contentType="short_text"
                      as="span"
                    />
                  </span>
                </motion.div>
              ))}
            </div>

            <p className="mt-10 font-serif text-xl text-[#1E3A32] italic">
              <CmsText 
                contentKey="freemasterclass.foryou.closing" 
                page="FreeMasterclass"
                blockTitle="For You If - Closing"
                fallback="If you're tired of the internal battle between what you've achieved and what you believe about yourself, this is your starting point." 
                contentType="rich_text"
              />
            </p>
          </motion.div>
        </div>
      </section>

      {/* Why This Approach Is Different */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-[#1E3A32] mb-8">
              <CmsText 
                contentKey="freemasterclass.different.title" 
                page="FreeMasterclass"
                blockTitle="Different Approach - Title"
                fallback="A Different Way to Look at Imposter Syndrome" 
                contentType="short_text"
              />
            </h2>

            <p className="text-[#2B2725]/80 text-lg leading-relaxed mb-6">
              <CmsText 
                contentKey="freemasterclass.different.intro" 
                page="FreeMasterclass"
                blockTitle="Different Approach - Intro"
                fallback="Most advice about imposter syndrome focuses on:" 
                contentType="rich_text"
              />
            </p>

            <div className="bg-[#F9F5EF] p-8 mb-10">
              <div className="space-y-3">
                <p className="text-[#2B2725]/70">
                  <CmsText 
                    contentKey="freemasterclass.different.typical1" 
                    page="FreeMasterclass"
                    blockTitle="Different Approach - Typical Advice 1"
                    fallback="• More affirmations" 
                    contentType="short_text"
                  />
                </p>
                <p className="text-[#2B2725]/70">
                  <CmsText 
                    contentKey="freemasterclass.different.typical2" 
                    page="FreeMasterclass"
                    blockTitle="Different Approach - Typical Advice 2"
                    fallback="• More confidence hacks" 
                    contentType="short_text"
                  />
                </p>
                <p className="text-[#2B2725]/70">
                  <CmsText 
                    contentKey="freemasterclass.different.typical3" 
                    page="FreeMasterclass"
                    blockTitle="Different Approach - Typical Advice 3"
                    fallback="• More &quot;just believe in yourself&quot;" 
                    contentType="short_text"
                  />
                </p>
              </div>
            </div>

            <p className="font-serif text-2xl text-[#1E3A32] mb-8">
              <CmsText 
                contentKey="freemasterclass.different.subhead" 
                page="FreeMasterclass"
                blockTitle="Different Approach - Subheading"
                fallback="Your Mind Stylist approach is different." 
                contentType="short_text"
              />
            </p>

            <p className="text-[#2B2725]/80 text-lg leading-relaxed mb-8">
              <CmsText 
                contentKey="freemasterclass.different.intro2" 
                page="FreeMasterclass"
                blockTitle="Different Approach - Intro 2"
                fallback="Instead of forcing confidence, we explore:" 
                contentType="rich_text"
              />
            </p>

            <div className="grid md:grid-cols-2 gap-6 mb-10">
              {approaches.map((approach, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="border-l-2 border-[#D8B46B] pl-6"
                >
                  <p className="font-medium text-[#1E3A32] mb-2">
                    <CmsText 
                      contentKey={`freemasterclass.different.approach${index + 1}.title`}
                      page="FreeMasterclass"
                      blockTitle={`Different Approach - Point ${index + 1} Title`}
                      fallback={approach.title}
                      contentType="short_text"
                      as="span"
                    />
                  </p>
                  <p className="text-[#2B2725]/70">
                    <CmsText 
                      contentKey={`freemasterclass.different.approach${index + 1}.description`}
                      page="FreeMasterclass"
                      blockTitle={`Different Approach - Point ${index + 1} Description`}
                      fallback={approach.description}
                      contentType="short_text"
                      as="span"
                    />
                  </p>
                </motion.div>
              ))}
            </div>

            <div className="bg-[#6E4F7D] p-8 text-center">
              <p className="text-[#F9F5EF] text-lg mb-4">
                <CmsText 
                  contentKey="freemasterclass.different.callout1" 
                  page="FreeMasterclass"
                  blockTitle="Different Approach - Callout Line 1"
                  fallback="From there, we work with awareness, emotional intelligence, and gentle pattern shifts." 
                  contentType="rich_text"
                />
              </p>
              <p className="font-serif text-xl text-[#F9F5EF] italic">
                <CmsText 
                  contentKey="freemasterclass.different.callout2" 
                  page="FreeMasterclass"
                  blockTitle="Different Approach - Callout Line 2"
                  fallback="This isn't about pretending — it's about understanding." 
                  contentType="rich_text"
                />
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-[#F9F5EF]">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-[#1E3A32] mb-4">
              <CmsText 
                contentKey="freemasterclass.howto.title" 
                page="FreeMasterclass"
                blockTitle="How to Watch - Title"
                fallback="How to Watch the Masterclass" 
                contentType="short_text"
              />
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-8 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-[#D8B46B]/20 flex items-center justify-center mx-auto mb-6">
                  <span className="font-serif text-3xl text-[#1E3A32]">{step.number}</span>
                </div>
                <h3 className="font-serif text-lg text-[#1E3A32] mb-3 flex items-start justify-center gap-2">
                  <span className="text-[#D8B46B]">✦</span>
                  <CmsText 
                    contentKey={`freemasterclass.howto.step${index + 1}.title`}
                    page="FreeMasterclass"
                    blockTitle={`How to Watch - Step ${index + 1} Title`}
                    fallback={step.title}
                    contentType="short_text"
                    as="span"
                  />
                </h3>
                <p className="text-[#2B2725]/70 text-sm leading-relaxed">
                  <CmsText 
                    contentKey={`freemasterclass.howto.step${index + 1}.description`}
                    page="FreeMasterclass"
                    blockTitle={`How to Watch - Step ${index + 1} Description`}
                    fallback={step.description}
                    contentType="rich_text"
                  />
                </p>
              </motion.div>
            ))}
          </div>

          <div className="text-center">
            <a
              href="https://yourmindstylist.com/login"
              className="group inline-flex items-center gap-3 px-8 py-4 bg-[#1E3A32] text-[#F9F5EF] text-sm tracking-wide hover:bg-[#2B2725] transition-all duration-300"
            >
              Watch the Free Masterclass
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </a>
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
                contentKey="freemasterclass.final.title" 
                page="FreeMasterclass"
                blockTitle="Final CTA - Title"
                fallback="Ready to Stop Feeling<br /><span class='italic text-[#D8B46B]'>Like You're Faking It?</span>" 
                contentType="rich_text"
              />
            </h2>

            <p className="text-[#F9F5EF]/80 text-lg leading-relaxed mb-10 max-w-2xl mx-auto">
              <CmsText 
                contentKey="freemasterclass.final.description" 
                page="FreeMasterclass"
                blockTitle="Final CTA - Description"
                fallback="You've already done the work. This is about finally allowing yourself to own it." 
                contentType="rich_text"
              />
            </p>

            <Link
              to={createPageUrl("Bookings")}
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#D8B46B] text-[#1E3A32] text-sm tracking-wide hover:bg-[#F9F5EF] transition-all duration-300"
            >
              <CmsText 
                contentKey="freemasterclass.final.button" 
                page="FreeMasterclass"
                blockTitle="Final CTA - Button Text"
                fallback="Schedule Your Consultation" 
                contentType="short_text"
                as="span"
              />
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