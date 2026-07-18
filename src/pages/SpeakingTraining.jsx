import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { motion } from "framer-motion";
import { ArrowRight, Users, Presentation, Lightbulb, TrendingUp, MessageSquare, Brain, Shield, Target, Check, Quote } from "lucide-react";
import CmsText from "../components/cms/CmsText";
import VideoEmbed from "../components/cms/VideoEmbed";
import SEO from "../components/SEO";

export default function SpeakingTraining() {
  const teamBenefits = [
    "Communicate with precision and calm",
    "Reduce friction and misunderstanding",
    "Navigate change without fear or resistance",
    "Build healthy leadership habits",
    "Strengthen emotional intelligence",
    "Think more creatively and collaboratively",
    "Regulate stress during high-pressure moments",
  ];

  const formats = [
    {
      icon: Presentation,
      title: "Keynotes",
      description: "Engaging, high-impact presentations that introduce emotional intelligence concepts and internal pattern awareness.",
    },
    {
      icon: Users,
      title: "Team Workshops",
      description: "Interactive sessions focused on communication, mindset, leadership, or culture.",
    },
    {
      icon: Target,
      title: "Leadership Intensives",
      description: "Deep-dive training for managers, executives, and emerging leaders.",
    },
    {
      icon: Lightbulb,
      title: "Custom Programs",
      description: "Curriculum developed for organizations undergoing growth, transition, restructuring, or culture shifts.",
    },
  ];

  const topics = [
    {
      icon: Brain,
      title: "Emotional Intelligence",
      description: "Understanding emotional patterns and creating internal clarity.",
    },
    {
      icon: MessageSquare,
      title: "Communication & Collaboration",
      description: "Speaking so others can hear you. Listening so you can understand.",
    },
    {
      icon: TrendingUp,
      title: "Leadership Mindset",
      description: "Helping leaders think from where they want to lead, not where they're comfortable.",
    },
    {
      icon: Shield,
      title: "Navigating Change",
      description: "Clearing emotional resistance and creating psychological safety during transitions.",
    },
    {
      icon: Target,
      title: "Identity & Performance",
      description: "Understanding how self-concept affects work behavior and decision-making.",
    },
    {
      icon: Brain,
      title: "Stress, Overload & Nervous System Reset",
      description: "Tools for thinking clearly under pressure.",
    },
    {
      icon: Users,
      title: "Culture by Design",
      description: "Helping organizations build cultures where clarity, accountability, and compassion coexist.",
    },
  ];

  const audiences = [
    "Corporate teams",
    "Leadership groups",
    "Small and mid-sized businesses",
    "Healthcare organizations",
    "Academic institutions",
    "Government agencies",
    "Non-profits",
  ];

  const outcomes = [
    "Improved emotional intelligence",
    "Stronger communication skills",
    "Better collaboration and trust",
    "Tools for navigating conflict",
    "Higher resilience and adaptability",
    "Clearer thinking under pressure",
    "A shared language for emotional awareness",
    "A healthier, more grounded work culture",
  ];

  const testimonials = [
    {
      quote: "Roberta teaches her audience how to use the hidden capabilities of their minds to enhance work and home life. Her workshops are engaging, relevant, and deeply impactful.",
      author: "Lisa Boysen",
      role: "Blue Cross Blue Shield MN",
    },
    {
      quote: "Our leadership team communicates better, listens better, and navigates stress with ease thanks to Roberta's training. This is the missing link in organizational development.",
      author: "Corporate Client",
      role: "",
    },
    {
      quote: "The emotional intelligence tools Roberta teaches have changed how our team works together. Productivity is up, friction is down, and people feel more connected.",
      author: "Leadership Team",
      role: "Mid-Size Organization",
    },
  ];

  return (
    <div className="bg-[#F9F5EF]">
      <SEO
        title="Speaking & Training | Your Mind Stylist"
        description="Bring emotional intelligence, clarity, and communication into your organization with keynotes, workshops, and leadership trainings by Roberta Fernandez."
        canonical="/SpeakingTraining"
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
                contentKey="speaking.hero.subtitle"
                page="SpeakingTraining"
                blockTitle="Hero Subtitle"
                fallback="For Teams & Leaders"
                contentType="short_text"
                as="span"
              />
            </span>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-[#1E3A32] leading-tight mb-6 text-center">
              <CmsText 
                contentKey="speaking.hero.title"
                page="SpeakingTraining"
                blockTitle="Hero Title"
                fallback="Organizational Mind Styling"
                contentType="short_text"
              />
            </h1>
            <p className="text-[#1E3A32] font-serif text-2xl md:text-3xl italic mb-8 text-center">
              <CmsText 
                contentKey="speaking.hero.tagline"
                page="SpeakingTraining"
                blockTitle="Hero Tagline"
                fallback="Emotional intelligence, clarity, and communication — brought into your organization with intention and impact."
                contentType="rich_text"
              />
            </p>

            <p className="text-[#2B2725]/80 text-lg leading-relaxed mb-10 max-w-3xl mx-auto text-center">
              <CmsText 
                contentKey="speaking.hero.description"
                page="SpeakingTraining"
                blockTitle="Hero Description"
                fallback="Healthy teams think clearly, communicate openly, and navigate change with resilience. Through keynotes, workshops, and leadership trainings, I teach teams how to understand their internal patterns, dissolve resistance, and create cultures that support both performance and well-being."
                contentType="rich_text"
              />
            </p>

            <div className="text-center">
              <Link
                to={createPageUrl("Contact")}
                className="group inline-flex items-center gap-3 px-8 py-4 bg-[#1E3A32] text-[#F9F5EF] text-sm tracking-wide hover:bg-[#2B2725] transition-all duration-300"
              >
                Inquire About Speaking & Training
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Video Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="relative w-full aspect-video">
            <VideoEmbed
              contentKey="speaking.hero.video_embed"
              page="SpeakingTraining"
              blockTitle="Hero Video (Paste Vimeo or YouTube URL)"
              fallback="https://player.vimeo.com/video/1153706531?h=b90f971f48"
            />
          </div>
        </div>
      </section>

      {/* Why Organizational Mind Styling */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-[#1E3A32] mb-8">
              <CmsText 
                contentKey="speaking.why.title"
                page="SpeakingTraining"
                blockTitle="Why Section Title"
                fallback="Better Thinking Creates Better Teams"
                contentType="short_text"
              />
            </h2>

            <div className="space-y-6 text-[#2B2725]/80 text-lg leading-relaxed mb-10">
              <p>
                <CmsText 
                  contentKey="speaking.why.paragraph1"
                  page="SpeakingTraining"
                  blockTitle="Why Paragraph 1"
                  fallback="Organizations often focus on systems, processes, and goals — but the real work begins inside the human mind. When people understand their emotional patterns and communication tendencies, they collaborate more effectively and make better decisions."
                  contentType="rich_text"
                />
              </p>
              <p>
                <CmsText 
                  contentKey="speaking.why.paragraph2"
                  page="SpeakingTraining"
                  blockTitle="Why Paragraph 2"
                  fallback="Mind Styling brings emotional intelligence, self-awareness, and internal clarity into professional environments, where they make the biggest difference."
                  contentType="rich_text"
                />
              </p>
            </div>

            <div className="bg-[#F9F5EF] p-8 mb-8">
              <p className="text-[#2B2725]/60 text-sm uppercase tracking-wide mb-6">
                Teams learn to:
              </p>
              <CmsText 
                contentKey="speaking.why.benefits"
                page="SpeakingTraining"
                blockTitle="Team Benefits List"
                fallback={`<div class='space-y-3'>${teamBenefits.map(benefit => `<div class='flex items-start gap-3'><div class='w-1.5 h-1.5 rounded-full bg-[#1E3A32] mt-2.5 flex-shrink-0'></div><span class='text-[#2B2725]/80 text-lg'>${benefit}</span></div>`).join('')}</div>`}
                contentType="rich_text"
              />
            </div>

            <p className="font-serif text-2xl text-[#1E3A32] italic text-center">
              <CmsText 
                contentKey="speaking.why.closing"
                page="SpeakingTraining"
                blockTitle="Why Closing"
                fallback="Healthy culture begins with healthy thinking."
                contentType="rich_text"
              />
            </p>
          </motion.div>
        </div>
      </section>

      {/* Formats */}
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
                contentKey="speaking.formats.title"
                page="SpeakingTraining"
                blockTitle="Formats Title"
                fallback="Trainings, Workshops, and Keynotes"
                contentType="short_text"
              />
            </h2>
            <p className="text-[#2B2725]/70 text-lg">
              <CmsText 
                contentKey="speaking.formats.description"
                page="SpeakingTraining"
                blockTitle="Formats Description"
                fallback="I offer several formats to support your team depending on your needs, group size, and goals."
                contentType="rich_text"
              />
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 mb-10">
            {formats.map((format, index) => (
              <motion.div
                key={format.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-8"
              >
                <div className="w-14 h-14 rounded-full bg-[#1E3A32]/10 flex items-center justify-center mb-6">
                  <format.icon size={24} className="text-[#1E3A32]" />
                </div>
                <h3 className="font-serif text-xl md:text-2xl text-[#1E3A32] mb-3 flex items-start gap-2">
                  <span className="text-[#D8B46B] mt-1">✦</span>
                  <CmsText 
                    contentKey={`speaking.format${index + 1}.title`}
                    page="SpeakingTraining"
                    blockTitle={`Format ${index + 1} Title`}
                    fallback={format.title}
                    contentType="short_text"
                    as="span"
                  />
                </h3>
                <p className="text-[#2B2725]/70 leading-relaxed">
                  <CmsText 
                    contentKey={`speaking.format${index + 1}.description`}
                    page="SpeakingTraining"
                    blockTitle={`Format ${index + 1} Description`}
                    fallback={format.description}
                    contentType="rich_text"
                  />
                </p>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-[#2B2725]/70 text-lg italic">
            Each experience is tailored to the unique dynamics and challenges of your team.
          </p>
        </div>
      </section>

      {/* Core Topics */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-[#1E3A32] mb-4">
              <CmsText 
                contentKey="speaking.topics.title"
                page="SpeakingTraining"
                blockTitle="Topics Title"
                fallback="Topics I Teach"
                contentType="short_text"
              />
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {topics.map((topic, index) => (
              <motion.div
                key={topic.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-[#F9F5EF] p-6"
              >
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mb-4">
                  <topic.icon size={20} className="text-[#1E3A32]" />
                </div>
                <h3 className="font-serif text-lg text-[#1E3A32] mb-2 flex items-start gap-2">
                  <span className="text-[#D8B46B]">✦</span>
                  <CmsText 
                    contentKey={`speaking.topic${index + 1}.title`}
                    page="SpeakingTraining"
                    blockTitle={`Topic ${index + 1} Title`}
                    fallback={topic.title}
                    contentType="short_text"
                    as="span"
                  />
                </h3>
                <CmsText 
                  contentKey={`speaking.topic${index + 1}.description`}
                  page="SpeakingTraining"
                  blockTitle={`Topic ${index + 1} Description`}
                  fallback={topic.description}
                  contentType="rich_text"
                  className="text-[#2B2725]/70 text-sm leading-relaxed"
                />
              </motion.div>
            ))}
          </div>

          <p className="text-center text-[#2B2725]/70 text-lg italic">
            Programs can be adapted to your organization's goals, culture, and current challenges.
          </p>
        </div>
      </section>

      {/* Audience */}
      <section className="py-24 bg-[#F9F5EF]">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-[#1E3A32] mb-8">
              <CmsText
                contentKey="speaking.audience.title"
                page="SpeakingTraining"
                blockTitle="Audience Title"
                fallback="Who I Work With"
                contentType="short_text"
              />
            </h2>

            <p className="text-[#2B2725]/80 text-lg mb-6">I partner with:</p>

            <CmsText
              contentKey="speaking.audience.list"
              page="SpeakingTraining"
              blockTitle="Audience List"
              fallback={`<div class='grid md:grid-cols-2 gap-4 mb-10'>${audiences.map(a => `<div class='flex items-center gap-3'><div class='w-2 h-2 rounded-full bg-[#1E3A32]'></div><span class='text-[#2B2725]/80 text-lg'>${a}</span></div>`).join('')}</div>`}
              contentType="rich_text"
            />

            <CmsText
              contentKey="speaking.audience.closing"
              page="SpeakingTraining"
              blockTitle="Audience Closing"
              fallback="Whether your team is navigating growth, conflict, burnout, or change, Mind Styling supports clear thinking and healthy communication."
              contentType="rich_text"
              className="text-[#2B2725]/80 text-lg leading-relaxed"
            />
          </motion.div>
        </div>
      </section>

      {/* Outcomes */}
      <section className="py-24 bg-[#1E3A32]">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-[#F9F5EF] mb-10">
              <CmsText 
                contentKey="speaking.outcomes.title"
                page="SpeakingTraining"
                blockTitle="Outcomes Title"
                fallback="What Your Team Will Walk Away With"
                contentType="short_text"
              />
            </h2>

            <CmsText 
              contentKey="speaking.outcomes.list"
              page="SpeakingTraining"
              blockTitle="Outcomes List"
              fallback={`<div class='grid md:grid-cols-2 gap-4 mb-10'>${outcomes.map(outcome => `<div class='flex items-start gap-3'><svg class='lucide lucide-check' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='#D8B46B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' style='margin-top: 4px; flex-shrink: 0;'><path d='M20 6 9 17l-5-5'/></svg><span class='text-[#F9F5EF]/90 text-lg'>${outcome}</span></div>`).join('')}</div>`}
              contentType="rich_text"
            />

            <p className="font-serif text-xl text-[#D8B46B] italic text-center">
              <CmsText 
                contentKey="speaking.outcomes.closing"
                page="SpeakingTraining"
                blockTitle="Outcomes Closing"
                fallback="Mind Styling creates the conditions for people to do their best work — and enjoy doing it."
                contentType="rich_text"
              />
            </p>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-[#1E3A32] mb-4">
              <CmsText
                contentKey="speaking.testimonials.title"
                page="SpeakingTraining"
                blockTitle="Testimonials Title"
                fallback="What Organizations Are Saying"
                contentType="short_text"
              />
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-[#F9F5EF] p-8"
              >
                <Quote size={32} className="text-[#D8B46B] mb-4" />
                <CmsText
                  contentKey={`speaking.testimonial${index + 1}.quote`}
                  page="SpeakingTraining"
                  blockTitle={`Testimonial ${index + 1} Quote`}
                  fallback={`"${testimonial.quote}"`}
                  contentType="rich_text"
                  className="text-[#2B2725]/80 text-lg leading-relaxed mb-6 italic"
                />
                <div className="border-t border-[#D8B46B]/30 pt-4">
                  <CmsText
                    contentKey={`speaking.testimonial${index + 1}.author`}
                    page="SpeakingTraining"
                    blockTitle={`Testimonial ${index + 1} Author`}
                    fallback={testimonial.author}
                    contentType="short_text"
                    className="text-[#1E3A32] font-medium"
                  />
                  {testimonial.role && (
                    <CmsText
                      contentKey={`speaking.testimonial${index + 1}.role`}
                      page="SpeakingTraining"
                      blockTitle={`Testimonial ${index + 1} Role`}
                      fallback={testimonial.role}
                      contentType="short_text"
                      className="text-[#2B2725]/60 text-sm"
                    />
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Next Steps / Final CTA */}
      <section className="py-24 bg-[#1E3A32]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-[#F9F5EF] leading-tight mb-6">
              <CmsText 
                contentKey="speaking.cta.title"
                page="SpeakingTraining"
                blockTitle="CTA Title"
                fallback="Bring Mind Styling Into<br /><span class='italic text-[#D8B46B]'>Your Organization</span>"
                contentType="rich_text"
              />
            </h2>

            <p className="text-[#F9F5EF]/80 text-lg leading-relaxed mb-10 max-w-2xl mx-auto">
              <CmsText 
                contentKey="speaking.cta.description"
                page="SpeakingTraining"
                blockTitle="CTA Description"
                fallback="If you're ready to support your team with clarity, emotional intelligence, and sustainable performance, let's design the right experience for your organization."
                contentType="rich_text"
              />
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to={createPageUrl("Contact")}
                className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#D8B46B] text-[#1E3A32] text-sm tracking-wide hover:bg-[#F9F5EF] transition-all duration-300"
              >
                Inquire About Speaking & Training
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