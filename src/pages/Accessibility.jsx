import React from "react";
import SEO from "../components/SEO";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { motion } from "framer-motion";
import { Eye } from "lucide-react";
import CmsText from "../components/cms/CmsText";

export default function Accessibility() {
  return (
    <div className="bg-[#F9F5EF]">
      <SEO
        title="Accessibility | Your Mind Stylist"
        description="Your Mind Stylist is committed to making our website accessible and usable for as many people as possible."
        canonical="/accessibility"
      />

      {/* Hero */}
      <section className="pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <Eye size={32} className="text-[#D8B46B]" />
              <span className="text-[#D8B46B] text-xs tracking-[0.3em] uppercase">
                Accessibility
              </span>
            </div>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-[#1E3A32] leading-tight mb-6">
              <CmsText 
                contentKey="accessibility.hero.title"
                page="Accessibility"
                blockTitle="Hero Title"
                fallback="Accessibility at Your Mind Stylist"
                contentType="short_text"
              />
            </h1>
            <p className="text-[#2B2725]/80 text-lg leading-relaxed">
              <CmsText 
                contentKey="accessibility.hero.description"
                page="Accessibility"
                blockTitle="Hero Description"
                fallback="Your Mind Stylist is committed to making our website and digital experiences accessible and usable for as many people as possible."
                contentType="rich_text"
              />
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-12"
          >
            <p className="text-[#2B2725]/80 text-lg leading-relaxed">
              <CmsText 
                contentKey="accessibility.intro"
                page="Accessibility"
                blockTitle="Intro"
                fallback="We aim to align our public website with the principles of the Web Content Accessibility Guidelines (WCAG) 2.1, Level AA, over time. This is an ongoing effort as we continue to improve our content, design, and technology."
                contentType="rich_text"
              />
            </p>

            {/* Our Approach */}
            <div>
              <h2 className="font-serif text-3xl text-[#1E3A32] mb-6">
                <CmsText 
                  contentKey="accessibility.approach.title"
                  page="Accessibility"
                  blockTitle="Approach Title"
                  fallback="Our Approach"
                  contentType="short_text"
                />
              </h2>
              <CmsText 
                contentKey="accessibility.approach.content"
                page="Accessibility"
                blockTitle="Approach Content"
                fallback="<p class='text-[#2B2725]/80 text-lg mb-4'>We:</p><ul class='space-y-3 text-[#2B2725]/80 text-lg'><li class='flex items-start gap-3'><span class='text-[#D8B46B] mt-1'>•</span>Use clear, readable typography</li><li class='flex items-start gap-3'><span class='text-[#D8B46B] mt-1'>•</span>Aim for sufficient color contrast</li><li class='flex items-start gap-3'><span class='text-[#D8B46B] mt-1'>•</span>Structure content with headings and landmarks</li><li class='flex items-start gap-3'><span class='text-[#D8B46B] mt-1'>•</span>Provide descriptive link text where possible</li><li class='flex items-start gap-3'><span class='text-[#D8B46B] mt-1'>•</span>Test pages with keyboard navigation when we make major changes</li></ul>"
                contentType="rich_text"
              />
            </div>

            {/* Accessibility Widget */}
            <div>
              <h2 className="font-serif text-3xl text-[#1E3A32] mb-6">
                <CmsText 
                  contentKey="accessibility.widget.title"
                  page="Accessibility"
                  blockTitle="Widget Title"
                  fallback="Accessibility Widget"
                  contentType="short_text"
                />
              </h2>
              <CmsText 
                contentKey="accessibility.widget.content"
                page="Accessibility"
                blockTitle="Widget Content"
                fallback="<p class='text-[#2B2725]/80 text-lg mb-4'>You'll find an <strong>Accessibility</strong> button at the bottom of our pages.</p><p class='text-[#2B2725]/80 text-lg mb-4'>This widget lets you:</p><ul class='space-y-3 text-[#2B2725]/80 text-lg'><li class='flex items-start gap-3'><span class='text-[#D8B46B] mt-1'>•</span>Adjust text size</li><li class='flex items-start gap-3'><span class='text-[#D8B46B] mt-1'>•</span>Increase contrast</li><li class='flex items-start gap-3'><span class='text-[#D8B46B] mt-1'>•</span>Enable a dyslexia-friendly font</li><li class='flex items-start gap-3'><span class='text-[#D8B46B] mt-1'>•</span>Increase line spacing</li><li class='flex items-start gap-3'><span class='text-[#D8B46B] mt-1'>•</span>Highlight links</li><li class='flex items-start gap-3'><span class='text-[#D8B46B] mt-1'>•</span>Reduce motion and animation</li></ul><p class='text-[#2B2725]/80 text-lg mt-4'>These settings affect only your experience on this site and can be changed or reset at any time.</p>"
                contentType="rich_text"
              />
            </div>

            {/* Known Limitations */}
            <div>
              <h2 className="font-serif text-3xl text-[#1E3A32] mb-6">
                <CmsText 
                  contentKey="accessibility.limitations.title"
                  page="Accessibility"
                  blockTitle="Limitations Title"
                  fallback="Known Limitations"
                  contentType="short_text"
                />
              </h2>
              <CmsText 
                contentKey="accessibility.limitations.content"
                page="Accessibility"
                blockTitle="Limitations Content"
                fallback="<p class='text-[#2B2725]/80 text-lg mb-4'>While we strive for accessibility, you may still encounter parts of the site that are not fully optimized—for example, older blog posts or media that were created before our current standards were in place.</p><p class='text-[#2B2725]/80 text-lg'>We are actively working to review and improve these areas.</p>"
                contentType="rich_text"
              />
            </div>

            {/* Feedback & Contact */}
            <div className="bg-[#F9F5EF] p-8 rounded-lg">
              <h2 className="font-serif text-3xl text-[#1E3A32] mb-6">
                <CmsText 
                  contentKey="accessibility.feedback.title"
                  page="Accessibility"
                  blockTitle="Feedback Title"
                  fallback="Feedback & Contact"
                  contentType="short_text"
                />
              </h2>
              <CmsText 
                contentKey="accessibility.feedback.content"
                page="Accessibility"
                blockTitle="Feedback Content"
                fallback="<p class='text-[#2B2725]/80 text-lg mb-4'>If you experience any difficulty accessing information on this site, or if you have suggestions on how we can improve accessibility, please contact us:</p><div class='flex items-start gap-3 mb-4'><svg class='lucide lucide-mail' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='#D8B46B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' style='margin-top: 4px;'><rect width='20' height='16' x='2' y='4' rx='2'/><path d='m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7'/></svg><div><p class='text-[#1E3A32] font-medium mb-1'>Email:</p><a href='mailto:info@themindstylist.com' class='text-[#D8B46B] hover:text-[#1E3A32] transition-colors'>info@themindstylist.com</a></div></div><p class='text-[#2B2725]/80 text-sm mt-6'><strong>Please include:</strong> the page URL, a description of the issue, and the assistive technology or browser you're using if applicable.</p><p class='text-[#2B2725]/80 text-lg mt-4'>We value your feedback and will do our best to respond and address your concerns.</p>"
                contentType="rich_text"
              />
            </div>

            {/* Third-Party Content */}
            <div>
              <h2 className="font-serif text-3xl text-[#1E3A32] mb-6">
                <CmsText 
                  contentKey="accessibility.thirdparty.title"
                  page="Accessibility"
                  blockTitle="Third Party Title"
                  fallback="Third-Party Content"
                  contentType="short_text"
                />
              </h2>
              <p className="text-[#2B2725]/80 text-lg">
                <CmsText 
                  contentKey="accessibility.thirdparty.content"
                  page="Accessibility"
                  blockTitle="Third Party Content"
                  fallback="Some content or features on our site are provided by third parties (such as embedded videos, social media widgets, or payment processors like Stripe). While we cannot control the accessibility of third-party tools, we choose partners who are actively working toward accessible experiences."
                  contentType="rich_text"
                />
              </p>
            </div>

            {/* Ongoing Improvement */}
            <div>
              <h2 className="font-serif text-3xl text-[#1E3A32] mb-6">
                <CmsText 
                  contentKey="accessibility.improvement.title"
                  page="Accessibility"
                  blockTitle="Improvement Title"
                  fallback="Ongoing Improvement"
                  contentType="short_text"
                />
              </h2>
              <p className="text-[#2B2725]/80 text-lg">
                <CmsText 
                  contentKey="accessibility.improvement.content"
                  page="Accessibility"
                  blockTitle="Improvement Content"
                  fallback="Accessibility is not a one-time project for us—it's an ongoing commitment. As our site evolves, we will continue reviewing our content and features with accessibility in mind."
                  contentType="rich_text"
                />
              </p>
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
                contentKey="accessibility.cta.title"
                page="Accessibility"
                blockTitle="CTA Title"
                fallback="Questions or Suggestions?"
                contentType="short_text"
              />
            </h2>
            <p className="text-[#F9F5EF]/80 text-lg mb-8">
              <CmsText 
                contentKey="accessibility.cta.description"
                page="Accessibility"
                blockTitle="CTA Description"
                fallback="We're here to help and always looking to improve."
                contentType="rich_text"
              />
            </p>
            <Link
              to={createPageUrl("Contact")}
              className="inline-flex items-center gap-3 px-8 py-4 bg-[#D8B46B] text-[#1E3A32] text-sm tracking-wide hover:bg-[#F9F5EF] transition-all duration-300"
            >
              Get in Touch
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}