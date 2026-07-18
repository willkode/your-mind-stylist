import React, { useState, useEffect } from "react";
import SEO from "../components/SEO";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Send, Mail, CheckCircle, ArrowRight } from "lucide-react";
import CmsText from "../components/cms/CmsText";
import { base44 } from "@/api/base44Client";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });

  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const urlParams = new URLSearchParams(window.location.search);
    const interest = urlParams.get("interest");
    if (interest === "private-sessions") {
      setFormData(prev => ({
        ...prev,
        interests: ["Private Mind Styling (1:1)"]
      }));
    }
  }, []);

  const interestOptions = [
    "The Mind Styling Certification™",
    "Private Mind Styling (1:1)",
    "The Inner Rehearsal Sessions™",
    "Organizational Mind Styling (Speaking / Training)",
    "The Free Masterclass",
    "Something else / I'm not sure",
  ];

  const handleInterestToggle = (interest) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Submit via backend function (works for logged-out visitors too)
      await base44.functions.invoke('submitContactForm', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        message: formData.message,
      });

      setSubmitted(true);
      
      // Reset form after a delay
      setTimeout(() => {
        setFormData({
          name: "",
          email: "",
          phone: "",
          message: ""
        });
        setSubmitted(false);
      }, 5000);
    } catch (error) {
      console.error("Error sending email:", error);
      alert("There was an error sending your message. Please try again or email roberta@yourmindstylist.com directly.");
    }
  };

  return (
    <div className="bg-[#F9F5EF]">
      <SEO
        title="Contact | Your Mind Stylist"
        description="Contact Your Mind Stylist, Roberta Fernandez, to explore private work, organizational trainings, or questions about programs and Inner Rehearsal Sessions™."
        canonical="/contact"
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
                contentKey="contact.hero.subtitle" 
                page="Contact"
                blockTitle="Hero Subtitle"
                fallback="Contact" 
                contentType="short_text"
              />
            </span>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-[#1E3A32] leading-tight mb-6">
              <CmsText 
                contentKey="contact.hero.title" 
                page="Contact"
                blockTitle="Hero Title"
                fallback="Let's Start the Conversation" 
                contentType="short_text"
              />
            </h1>
            <p className="text-[#2B2725] font-serif text-2xl md:text-3xl italic mb-8">
              <CmsText 
                contentKey="contact.hero.subtitle2" 
                page="Contact"
                blockTitle="Hero Subtitle 2"
                fallback="Whether you're exploring personal work, organizational support, or have a question about one of my programs, I'd love to hear from you." 
                contentType="rich_text"
              />
            </p>

            <p className="text-[#2B2725]/80 text-lg leading-relaxed max-w-3xl mx-auto">
              <CmsText 
                contentKey="contact.hero.description" 
                page="Contact"
                blockTitle="Hero Description"
                fallback="Sometimes the first step toward change is simply saying, &quot;Here's where I am, and here's what I'd like to be different.&quot; This page is your space to do exactly that." 
                contentType="rich_text"
              />
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-serif text-3xl md:text-4xl text-[#1E3A32] mb-6">
              <CmsText 
                contentKey="contact.form.title" 
                page="Contact"
                blockTitle="Form Section Title"
                fallback="Get in Touch" 
                contentType="short_text"
              />
            </h2>
            <p className="text-[#2B2725]/80 text-lg mb-10">
              <CmsText 
                contentKey="contact.form.description" 
                page="Contact"
                blockTitle="Form Description"
                fallback="Share a bit about what you're looking for, and I'll respond as soon as I can with next steps or a suggested path forward." 
                contentType="rich_text"
              />
            </p>

            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#A6B7A3]/20 p-10 text-center"
              >
                <CheckCircle size={48} className="text-[#A6B7A3] mx-auto mb-4" />
                <p className="text-[#1E3A32] text-lg font-medium mb-2">
                  Your message has been received.
                </p>
                <p className="text-[#2B2725]/70">
                  I'll review what you've shared and be in touch soon.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Name */}
                <div>
                  <Label htmlFor="name" className="text-[#2B2725] mb-2 block">
                    Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="border-[#E4D9C4] focus:border-[#D8B46B] focus:ring-[#D8B46B]"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="email" className="text-[#2B2725] mb-2 block">
                    Email *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="border-[#E4D9C4] focus:border-[#D8B46B] focus:ring-[#D8B46B]"
                    required
                  />
                </div>

                {/* Phone */}
                <div>
                  <Label htmlFor="phone" className="text-[#2B2725] mb-2 block">
                    Phone *
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="border-[#E4D9C4] focus:border-[#D8B46B] focus:ring-[#D8B46B]"
                    required
                  />
                </div>



                {/* Message */}
                <div>
                  <Label htmlFor="message" className="text-[#2B2725] mb-2 block">
                    Message *
                  </Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="border-[#E4D9C4] focus:border-[#D8B46B] focus:ring-[#D8B46B] min-h-[150px]"
                    placeholder="Share anything you'd like me to know about your situation, goals, or questions."
                    required
                  />
                </div>



                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-[#1E3A32] hover:bg-[#2B2725] text-[#F9F5EF] py-6"
                >
                  <Send size={16} className="mr-2" />
                  Send Message
                </Button>
              </form>
            )}
          </motion.div>
        </div>
      </section>

      {/* Other Ways to Connect */}
      <section className="py-20 bg-[#F9F5EF]">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-serif text-3xl md:text-4xl text-[#1E3A32] mb-8">
              <CmsText 
                contentKey="contact.other.title" 
                page="Contact"
                blockTitle="Other Ways Title"
                fallback="Other Ways to Connect" 
                contentType="short_text"
              />
            </h2>
            <p className="text-[#2B2725]/80 text-lg mb-6">
              <CmsText 
                contentKey="contact.other.description" 
                page="Contact"
                blockTitle="Other Ways Description"
                fallback="If you prefer, you can also reach out here:" 
                contentType="rich_text"
              />
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-4">
                <Mail size={20} className="text-[#D8B46B] mt-1" />
                <div>
                  <p className="font-medium text-[#1E3A32]">General inquiries:</p>
                  <p className="text-[#2B2725]/70">roberta@yourmindstylist.com</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Mail size={20} className="text-[#D8B46B] mt-1" />
                <div>
                  <p className="font-medium text-[#1E3A32]">Speaking & training:</p>
                  <p className="text-[#2B2725]/70">612-839-2295</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-[#E4D9C4]">
              <p className="text-[#2B2725]/80 mb-4">
                Ready to learn more about working together?
              </p>
              <Link
                to={createPageUrl("Consultations")}
                className="inline-flex items-center gap-2 text-[#D8B46B] hover:text-[#1E3A32] transition-colors font-medium"
              >
                <ArrowRight size={16} />
                Learn About Initial Consultations
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Common Next Steps */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-serif text-3xl md:text-4xl text-[#1E3A32] mb-8">
              <CmsText 
                contentKey="contact.nextsteps.title" 
                page="Contact"
                blockTitle="Next Steps Title"
                fallback="Not Sure Where to Start?" 
                contentType="short_text"
              />
            </h2>

            <p className="text-[#2B2725]/80 text-lg leading-relaxed max-w-3xl mx-auto">
              <CmsText 
                contentKey="contact.nextsteps.intro" 
                page="Contact"
                blockTitle="Next Steps Intro"
                fallback="If you're unsure which path is right for you, that's completely okay. You can use this page simply to say: &quot;Here's what I'm struggling with right now&quot; or &quot;Here's what I'd like to feel or experience instead.&quot;" 
                contentType="rich_text"
              />
            </p>
          </motion.div>
        </div>
      </section>

      {/* Closing */}
      <section className="py-24 bg-[#1E3A32]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-[#F9F5EF] leading-tight mb-6">
              <CmsText 
                contentKey="contact.cta.title" 
                page="Contact"
                blockTitle="CTA Title"
                fallback="You Don't Have to Figure It All Out Alone" 
                contentType="short_text"
              />
            </h2>

            <p className="text-[#F9F5EF]/80 text-lg leading-relaxed mb-10 max-w-2xl mx-auto">
              <CmsText 
                contentKey="contact.cta.description" 
                page="Contact"
                blockTitle="CTA Description"
                fallback="Rewriting your patterns and shifting your internal world can feel big — but you don't have to do it by yourself. This is an invitation to begin." 
                contentType="rich_text"
              />
            </p>

            <Link
              to={createPageUrl("Bookings")}
              className="group inline-flex items-center gap-3 px-8 py-4 bg-[#D8B46B] text-[#1E3A32] text-sm tracking-wide hover:bg-[#F9F5EF] transition-all duration-300"
            >
              Schedule Your Complimentary Consultation
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}