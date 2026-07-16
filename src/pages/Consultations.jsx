import React from "react";
import SEO from "../components/SEO";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Phone, Calendar, FileText, Video, ExternalLink, AlertCircle, Download } from "lucide-react";
import CmsText from "../components/cms/CmsText";
import VideoEmbed from "../components/cms/VideoEmbed";
import BookingLink from "../components/cms/BookingLink";
import { useCmsText } from "../components/cms/useCmsText";

function DocLink({ contentKey, label }) {
  const { content: rawUrl } = useCmsText(contentKey, "");

  const extractUrl = (raw) => {
    if (!raw) return "";
    const hrefMatch = raw.match(/href=["']([^"']+)["']/);
    if (hrefMatch) return hrefMatch[1];
    return raw.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").trim();
  };

  const url = extractUrl(rawUrl);
  if (!url || !url.startsWith("http")) return null;

  const isDocx = url.toLowerCase().includes(".docx");
  const previewUrl = isDocx
    ? `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(url)}`
    : url;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <a
        href={previewUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2 border border-[#D8B46B] text-[#1E3A32] text-sm font-medium hover:bg-[#D8B46B]/10 transition-colors rounded"
      >
        <ExternalLink size={14} />
        <span>{label}</span>
      </a>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs text-[#2B2725]/50 hover:text-[#1E3A32] transition-colors"
      >
        <Download size={12} />
        Download
      </a>
    </div>
  );
}

export default function Consultations() {

  return (
    <div className="bg-[#F9F5EF]">
      <SEO
        title="Initial Consultation | Your Mind Stylist"
        description="Schedule your initial consultation to explore how Mind Styling can support your personal growth. Available online or in-person in Las Vegas."
        canonical="/consultations"
      />

      {/* Hero Section with Video */}
      <section className="pt-32 pb-20 bg-[#1E3A32] text-[#F9F5EF]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-[#D8B46B] text-xs tracking-[0.3em] uppercase mb-4 block">
                <CmsText 
                  contentKey="consultations.hero.subtitle" 
                  page="Consultations"
                  blockTitle="Hero Subtitle"
                  fallback="Get Started" 
                  contentType="short_text"
                />
              </span>
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-tight mb-6">
                <CmsText 
                  contentKey="consultations.hero.title" 
                  page="Consultations"
                  blockTitle="Hero Title"
                  fallback="Initial Consultation" 
                  contentType="short_text"
                />
              </h1>
              <div className="text-lg leading-relaxed mb-8 text-[#F9F5EF]/90">
                <CmsText 
                  contentKey="consultations.hero.description" 
                  page="Consultations"
                  blockTitle="Hero Description"
                  fallback="Your initial consultation is designed to help you understand my services and determine whether they're the right fit for your needs." 
                  contentType="rich_text"
                />
              </div>
              <BookingLink>
                <Button className="bg-[#D8B46B] hover:bg-[#F9F5EF] text-[#1E3A32] px-8 py-6 text-lg">
                  <CmsText 
                    contentKey="consultations.hero.cta" 
                    page="Consultations"
                    blockTitle="Hero CTA Button"
                    fallback="Schedule Your Consultation" 
                    contentType="short_text"
                  />
                </Button>
              </BookingLink>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="aspect-video rounded-lg overflow-hidden shadow-2xl">
                <VideoEmbed
                  contentKey="consultations.hero.video_url"
                  page="Consultations"
                  blockTitle="Hero Video URL (Initial Consultation Welcome)"
                  fallback="https://vimeo.com/1158905462"
                />
              </div>
              <p className="text-sm text-[#F9F5EF]/70 mt-4 text-center">
                <CmsText 
                  contentKey="consultations.hero.video_caption" 
                  page="Consultations"
                  blockTitle="Hero Video Caption"
                  fallback="Welcome to Your Initial Consultation - Watch this video for instructions" 
                  contentType="short_text"
                />
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* What You'll Learn */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-serif text-3xl md:text-4xl text-[#1E3A32] mb-8">
              <CmsText 
                contentKey="consultations.learn.title" 
                page="Consultations"
                blockTitle="What You'll Learn Title"
                fallback="During this session, you'll learn:" 
                contentType="short_text"
              />
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((num) => (
                <div key={num} className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-[#D8B46B] mt-1 flex-shrink-0" />
                  <p className="text-[#2B2725]/80">
                    <CmsText 
                      contentKey={`consultations.learn.item${num}`} 
                      page="Consultations"
                      blockTitle={`Learn Item ${num}`}
                      fallback={
                        num === 1 ? "How my work supports long-term personal growth" :
                        num === 2 ? "What kind of program would best serve your goals" :
                        num === 3 ? "What an appropriate investment looks like for you" :
                        "How to get started right away, if we're a good match"
                      }
                      contentType="rich_text"
                    />
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-8 p-6 bg-[#F9F5EF] rounded-lg">
              <p className="text-[#2B2725]/80">
                <CmsText 
                  contentKey="consultations.learn.availability" 
                  page="Consultations"
                  blockTitle="Availability Note"
                  fallback="You can meet with me <strong>online from anywhere</strong>, or <strong>in person in Las Vegas, NV</strong> by request." 
                  contentType="rich_text"
                />
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Before Your Consultation */}
      <section className="py-20 bg-[#F9F5EF]">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-serif text-3xl md:text-4xl text-[#1E3A32] mb-6">
              <CmsText 
                contentKey="consultations.before.title" 
                page="Consultations"
                blockTitle="Before Title"
                fallback="Before Your Consultation" 
                contentType="short_text"
              />
            </h2>
            <div className="prose prose-lg max-w-none mb-8">
              <CmsText 
                contentKey="consultations.before.description" 
                page="Consultations"
                blockTitle="Before Description"
                fallback="<p>Everything you need to do before our virtual meeting is on this page.</p><p>Please schedule your consultation <strong>at least two days in advance</strong>, so you have ample time to review and complete the required materials.</p>" 
                contentType="rich_text"
              />
            </div>
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-r-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-yellow-600 mt-1 flex-shrink-0" size={20} />
                <div>
                  <p className="font-medium text-[#1E3A32] mb-1">Important:</p>
                  <CmsText 
                    contentKey="consultations.before.important" 
                    page="Consultations"
                    blockTitle="Important Notice"
                    fallback="All documents must be submitted <strong>at least 24 hours before</strong> your consultation." 
                    contentType="rich_text"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Five Steps */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-serif text-3xl md:text-4xl text-[#1E3A32] mb-4">
              <CmsText 
                contentKey="consultations.steps.title" 
                page="Consultations"
                blockTitle="Steps Title"
                fallback="Five Easy Steps Toward Living Your Best Life" 
                contentType="short_text"
              />
            </h2>
          </motion.div>

          {/* Step 1 */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="bg-[#D8B46B] text-[#1E3A32] w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="font-serif text-2xl text-[#1E3A32] mb-4">
                    <CmsText 
                      contentKey="consultations.step1.title" 
                      page="Consultations"
                      blockTitle="Step 1 Title"
                      fallback="Review These Required Items" 
                      contentType="short_text"
                    />
                  </h3>
                  <p className="text-[#2B2725]/80 mb-6">
                    <CmsText 
                      contentKey="consultations.step1.intro" 
                      page="Consultations"
                      blockTitle="Step 1 Intro"
                      fallback="Please review all four items below before completing your questionnaire." 
                      contentType="rich_text"
                    />
                  </p>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <FileText size={16} className="text-[#D8B46B]" />
                        <h4 className="font-medium text-[#1E3A32]">
                          <CmsText 
                            contentKey="consultations.step1.doc1.title" 
                            page="Consultations"
                            blockTitle="Document 1 Title"
                            fallback="Welcome Letter" 
                            contentType="short_text"
                          />
                        </h4>
                      </div>
                      <div className="text-sm text-[#2B2725]/70 mb-3">
                        <CmsText 
                          contentKey="consultations.step1.doc1.description" 
                          page="Consultations"
                          blockTitle="Document 1 Description"
                          fallback="Start here to understand how I work and what to expect." 
                          contentType="rich_text"
                        />
                      </div>
                      <DocLink contentKey="consultations.step1.doc1.link_url" label="Open Welcome Letter" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <FileText size={16} className="text-[#D8B46B]" />
                        <h4 className="font-medium text-[#1E3A32]">
                          <CmsText 
                            contentKey="consultations.step1.doc2.title" 
                            page="Consultations"
                            blockTitle="Document 2 Title"
                            fallback="Online Instructions" 
                            contentType="short_text"
                          />
                        </h4>
                      </div>
                      <div className="text-sm text-[#2B2725]/70 mb-3">
                        <CmsText 
                          contentKey="consultations.step1.doc2.description" 
                          page="Consultations"
                          blockTitle="Document 2 Description"
                          fallback="Learn how to make the most of your virtual consultation." 
                          contentType="rich_text"
                        />
                      </div>
                      <DocLink contentKey="consultations.step1.doc2.link_url" label="Open Online Instructions" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <FileText size={16} className="text-[#D8B46B]" />
                        <h4 className="font-medium text-[#1E3A32]">
                          <CmsText 
                            contentKey="consultations.step1.doc3.title" 
                            page="Consultations"
                            blockTitle="Document 3 Title"
                            fallback="Your Rights" 
                            contentType="short_text"
                          />
                        </h4>
                      </div>
                      <div className="text-sm text-[#2B2725]/70 mb-3">
                        <CmsText 
                          contentKey="consultations.step1.doc3.description" 
                          page="Consultations"
                          blockTitle="Document 3 Description"
                          fallback="<p>Please read:</p><ul class='text-left ml-4 list-disc'><li>The <em>Bill of Rights for Adults</em> <strong>or</strong></li><li>The <em>Bill of Rights for Minors</em></li></ul>" 
                          contentType="rich_text"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <DocLink contentKey="consultations.step1.doc3.adult_url" label="Open Adult Bill of Rights" />
                        <DocLink contentKey="consultations.step1.doc3.minor_url" label="Open Minor Bill of Rights" />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Video size={16} className="text-[#D8B46B]" />
                        <h4 className="font-medium text-[#1E3A32]">
                          <CmsText 
                            contentKey="consultations.step1.doc4.title" 
                            page="Consultations"
                            blockTitle="Document 4 Title"
                            fallback="Learn About Hypnosis" 
                            contentType="short_text"
                          />
                        </h4>
                      </div>
                      <div className="text-sm text-[#2B2725]/70 mb-3">
                        <CmsText 
                          contentKey="consultations.step1.doc4.description" 
                          page="Consultations"
                          blockTitle="Document 4 Description"
                          fallback="Watch this video to understand what hypnosis is and how it can help you." 
                          contentType="rich_text"
                        />
                      </div>
                      <div className="aspect-video rounded-lg overflow-hidden border border-[#E4D9C4] mb-2">
                        <VideoEmbed
                          contentKey="consultations.step1.hypnosis_video_url"
                          page="Consultations"
                          blockTitle="Learn About Hypnosis Video URL"
                          fallback="https://vimeo.com/1164998743/021c3419cc"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 2 */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="bg-[#D8B46B] text-[#1E3A32] w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="font-serif text-2xl text-[#1E3A32] mb-4">
                    <CmsText 
                      contentKey="consultations.step2.title" 
                      page="Consultations"
                      blockTitle="Step 2 Title"
                      fallback="Complete the Questionnaire" 
                      contentType="short_text"
                    />
                  </h3>
                  <div className="mb-6">
                    <CmsText 
                      contentKey="consultations.step2.description" 
                      page="Consultations"
                      blockTitle="Step 2 Description"
                      fallback="<p>Set aside time to answer thoughtfully.</p><p>The questionnaire must be submitted <strong>at least 24 hours before</strong> your appointment.</p>" 
                      contentType="rich_text"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link to={createPageUrl("ConsultationQuestionnaire")}>
                      <Button variant="outline" className="border-[#D8B46B] text-[#1E3A32] hover:bg-[#D8B46B]/10">
                        <FileText size={16} className="mr-2" />
                        <CmsText 
                          contentKey="consultations.step2.button" 
                          page="Consultations"
                          blockTitle="Step 2 Button"
                          fallback="Complete Intake Form" 
                          contentType="short_text"
                        />
                      </Button>
                    </Link>
                    <Link to={createPageUrl("ConsultationFormEditor")}>
                      <Button variant="ghost" className="text-[#D8B46B] hover:bg-[#D8B46B]/10">
                        <CmsText 
                          contentKey="consultations.step2.edit_button" 
                          page="Consultations"
                          blockTitle="Step 2 Edit Button"
                          fallback="Edit Form Questions (Manager)" 
                          contentType="short_text"
                        />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* What Happens */}
      <section className="py-20 bg-[#F9F5EF]">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-serif text-3xl md:text-4xl text-[#1E3A32] mb-6">
              <CmsText 
                contentKey="consultations.what_happens.title" 
                page="Consultations"
                blockTitle="What Happens Title"
                fallback="What Happens in the Initial Consultation" 
                contentType="short_text"
              />
            </h2>
            <div className="prose prose-lg max-w-none">
              <CmsText 
                contentKey="consultations.what_happens.description" 
                page="Consultations"
                blockTitle="What Happens Description"
                fallback="<p>Your consultation is <strong>one full hour</strong> dedicated to you.</p><p>We will:</p><ul><li>Discuss your concerns and goals</li><li>Answer your questions</li><li>Determine whether my services are appropriate for your desired outcomes</li><li>Establish how many sessions may be helpful</li><li>Review estimated program fees</li></ul><p>Please note: I do <strong>not</strong> work hourly. All services are offered as customized programs designed around your specific needs.</p>" 
                contentType="rich_text"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Not Sure Yet */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-serif text-3xl md:text-4xl text-[#1E3A32] mb-4">
              <CmsText 
                contentKey="consultations.not_sure.title" 
                page="Consultations"
                blockTitle="Not Sure Title"
                fallback="Not Sure Yet?" 
                contentType="short_text"
              />
            </h2>
            <h3 className="text-xl text-[#2B2725] mb-6">
              <CmsText 
                contentKey="consultations.not_sure.subtitle" 
                page="Consultations"
                blockTitle="Not Sure Subtitle"
                fallback="Prefer a Quick Chat First?" 
                contentType="short_text"
              />
            </h3>
            <div className="max-w-2xl mx-auto mb-8">
              <CmsText 
                contentKey="consultations.not_sure.description" 
                page="Consultations"
                blockTitle="Not Sure Description"
                fallback="<p>If you only have a few questions, you may schedule a <strong>free 30-minute phone call</strong>.</p><p>This call is informational only. An in-depth initial consultation is required to determine program structure and cost.</p>" 
                contentType="rich_text"
              />
            </div>
            <Link to={createPageUrl("Contact")}>
              <Button className="bg-[#1E3A32] hover:bg-[#2B2725] text-[#F9F5EF]">
                <Phone size={16} className="mr-2" />
                <CmsText 
                  contentKey="consultations.not_sure.button" 
                  page="Consultations"
                  blockTitle="Not Sure Button"
                  fallback="Request a Phone Call" 
                  contentType="short_text"
                />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* How I Work */}
      <section className="py-20 bg-[#F9F5EF]">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-serif text-3xl md:text-4xl text-[#1E3A32] mb-12 text-center">
              <CmsText 
                contentKey="consultations.how_i_work.title" 
                page="Consultations"
                blockTitle="How I Work Title"
                fallback="How I Work" 
                contentType="short_text"
              />
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-medium text-[#1E3A32] mb-3">
                    <CmsText 
                      contentKey="consultations.how_i_work.item1.title" 
                      page="Consultations"
                      blockTitle="How I Work Item 1 Title"
                      fallback="Issues & Goals" 
                      contentType="short_text"
                    />
                  </h3>
                  <CmsText 
                    contentKey="consultations.how_i_work.item1.description" 
                    page="Consultations"
                    blockTitle="How I Work Item 1 Description"
                    fallback="We work together to set realistic goals and create a strategy tailored to you. Collaboration is key—working as a team gives you the best opportunity for success." 
                    contentType="rich_text"
                    className="text-[#2B2725]/80"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-medium text-[#1E3A32] mb-3">
                    <CmsText 
                      contentKey="consultations.how_i_work.item2.title" 
                      page="Consultations"
                      blockTitle="How I Work Item 2 Title"
                      fallback="Are My Programs the Right Fit?" 
                      contentType="short_text"
                    />
                  </h3>
                  <CmsText 
                    contentKey="consultations.how_i_work.item2.description" 
                    page="Consultations"
                    blockTitle="How I Work Item 2 Description"
                    fallback="I do not diagnose, treat, or cure any medical or mental health conditions. I do not work with certain diagnosed medical or mental conditions." 
                    contentType="rich_text"
                    className="text-[#2B2725]/80"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-medium text-[#1E3A32] mb-3">
                    <CmsText 
                      contentKey="consultations.how_i_work.item3.title" 
                      page="Consultations"
                      blockTitle="How I Work Item 3 Title"
                      fallback="How Many Visits Will I Need?" 
                      contentType="short_text"
                    />
                  </h3>
                  <CmsText 
                    contentKey="consultations.how_i_work.item3.description" 
                    page="Consultations"
                    blockTitle="How I Work Item 3 Description"
                    fallback="Programs are client-centered and designed specifically for you. We will determine what's appropriate during your consultation." 
                    contentType="rich_text"
                    className="text-[#2B2725]/80"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-medium text-[#1E3A32] mb-3">
                    <CmsText 
                      contentKey="consultations.how_i_work.item4.title" 
                      page="Consultations"
                      blockTitle="How I Work Item 4 Title"
                      fallback="How Much Does It Cost?" 
                      contentType="short_text"
                    />
                  </h3>
                  <CmsText 
                    contentKey="consultations.how_i_work.item4.description" 
                    page="Consultations"
                    blockTitle="How I Work Item 4 Description"
                    fallback="Every client's needs are different. During your consultation, you'll receive an estimated program cost based on your goals. Payment plans are available for your convenience." 
                    contentType="rich_text"
                    className="text-[#2B2725]/80"
                  />
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Schedule CTA */}
      <section className="py-24 bg-[#1E3A32] text-[#F9F5EF]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl mb-6">
              <CmsText 
                contentKey="consultations.schedule_cta.title" 
                page="Consultations"
                blockTitle="Schedule CTA Title"
                fallback="Schedule Your Consultation" 
                contentType="short_text"
              />
            </h2>
            <p className="text-lg text-[#F9F5EF]/80 mb-8">
              <CmsText 
                contentKey="consultations.schedule_cta.description" 
                page="Consultations"
                blockTitle="Schedule CTA Description"
                fallback="Take the first step toward living your best life." 
                contentType="rich_text"
              />
            </p>
            <BookingLink>
              <Button className="bg-[#D8B46B] hover:bg-[#F9F5EF] text-[#1E3A32] px-8 py-6 text-lg">
                <Calendar size={20} className="mr-2" />
                <CmsText 
                  contentKey="consultations.schedule_cta.button" 
                  page="Consultations"
                  blockTitle="Schedule CTA Button"
                  fallback="Book Now" 
                  contentType="short_text"
                />
              </Button>
            </BookingLink>
          </motion.div>
        </div>
      </section>

      {/* Policies */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-serif text-3xl md:text-4xl text-[#1E3A32] mb-12">
              <CmsText 
                contentKey="consultations.policies.title" 
                page="Consultations"
                blockTitle="Policies Title"
                fallback="Policies & Payment Information" 
                contentType="short_text"
              />
            </h2>

            <div className="space-y-8">
              <div>
                <h3 className="font-medium text-xl text-[#1E3A32] mb-4">
                  <CmsText 
                    contentKey="consultations.policies.appointment.title" 
                    page="Consultations"
                    blockTitle="Appointment Policy Title"
                    fallback="Appointment Policy" 
                    contentType="short_text"
                  />
                </h3>
                <div className="prose">
                  <CmsText 
                    contentKey="consultations.policies.appointment.content" 
                    page="Consultations"
                    blockTitle="Appointment Policy Content"
                    fallback="<ul><li>All paperwork <strong>must be submitted</strong> before your consultation</li><li>For online appointments, please log in <strong>10 minutes early</strong> to test your video and microphone</li><li>For in-person appointments, please allow time for traffic</li></ul>" 
                    contentType="rich_text"
                  />
                </div>
              </div>

              <div>
                <h3 className="font-medium text-xl text-[#1E3A32] mb-4">
                  <CmsText 
                    contentKey="consultations.policies.cancellation.title" 
                    page="Consultations"
                    blockTitle="Cancellation Policy Title"
                    fallback="Cancellation Policy" 
                    contentType="short_text"
                  />
                </h3>
                <div className="prose">
                  <CmsText 
                    contentKey="consultations.policies.cancellation.content" 
                    page="Consultations"
                    blockTitle="Cancellation Policy Content"
                    fallback="<p>A <strong>48-hour business-day notice</strong> is required for cancellations or rescheduling.</p><p>If proper notice is not given, you will be billed for the appointment. Example: For a Monday appointment, changes must be made by <strong>Thursday during office hours</strong>.</p><p>Please note that very few exceptions apply.</p>" 
                    contentType="rich_text"
                  />
                </div>
              </div>

              <div>
                <h3 className="font-medium text-xl text-[#1E3A32] mb-4">
                  <CmsText 
                    contentKey="consultations.policies.payment.title" 
                    page="Consultations"
                    blockTitle="Payment Policy Title"
                    fallback="Payment Options" 
                    contentType="short_text"
                  />
                </h3>
                <div className="prose">
                  <CmsText 
                    contentKey="consultations.policies.payment.content" 
                    page="Consultations"
                    blockTitle="Payment Policy Content"
                    fallback="<p>Accepted forms of payment:</p><ul><li>Check</li><li>Zelle</li><li>Venmo</li><li>Cash</li><li>Credit cards</li></ul><p>Payment plans are available for most services and are billed <strong>monthly to your credit card</strong>. Billing options will be reviewed during your consultation.</p>" 
                    contentType="rich_text"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-20 bg-[#F9F5EF]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-serif text-3xl text-[#1E3A32] mb-6">
              <CmsText 
                contentKey="consultations.contact.title" 
                page="Consultations"
                blockTitle="Contact Title"
                fallback="Contact" 
                contentType="short_text"
              />
            </h2>
            <a href="tel:612-839-2295" className="text-2xl font-medium text-[#D8B46B] hover:text-[#1E3A32] transition-colors flex items-center justify-center gap-2">
              <Phone size={24} />
              <CmsText 
                contentKey="consultations.contact.phone" 
                page="Consultations"
                blockTitle="Contact Phone"
                fallback="612-839-2295" 
                contentType="short_text"
              />
            </a>
          </motion.div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-12 bg-[#2B2725] text-[#F9F5EF]/70">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h3 className="text-sm font-medium text-[#F9F5EF] mb-3 tracking-wider">
              <CmsText 
                contentKey="consultations.disclaimer.title" 
                page="Consultations"
                blockTitle="Disclaimer Title"
                fallback="Disclaimer" 
                contentType="short_text"
              />
            </h3>
            <div className="text-xs leading-relaxed max-w-3xl mx-auto">
              <CmsText 
                contentKey="consultations.disclaimer.content" 
                page="Consultations"
                blockTitle="Disclaimer Content"
                fallback="Services are offered as non-therapeutic motivational and meditative consulting, intended to inspire positive thinking and support your ability to self-manage your mind and body. These services are <strong>not health care or psychotherapy</strong>, and no health benefit claims are made. My work is supportive and educational in nature, designed to enhance productivity, effectiveness, and personal and professional growth." 
                contentType="rich_text"
              />
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}