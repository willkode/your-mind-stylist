import React from "react";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import CmsText from "../cms/CmsText";

export default function Testimonials() {
  const testimonials = [
    {
      quote:
        "Roberta teaches her audience how to use the hidden capabilities of their minds to enhance work and home life… Highly recommend Roberta!",
      name: "Lisa Boysen",
      role: "Blue Cross Blue Shield MN",
    },
    {
      quote:
        "The Mind Styling process changed how I think and how I help my clients problem-solve. I can't recommend this program enough.",
      name: "Karen Black",
      role: "Leadership Consultant",
    },
    {
      quote:
        "I remain calm under pressure and navigate challenges with more resilience. Working with Roberta is transformative.",
      name: "Lauren Davis",
      role: "Hospitality Professional",
    },
    {
      quote:
        "Life-changing. I feel more productive and purposeful after taking the class.",
      name: "Jackie LaLonde",
      role: "Loan Depot",
    },
  ];

  return (
    <section className="py-24 md:py-32 bg-[#F9F5EF]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-[#D8B46B] text-xs tracking-[0.3em] uppercase mb-4 block">
            <CmsText
              contentKey="home.testimonials.label"
              page="Home"
              blockTitle="Testimonials Label"
              defaultContent="Past Clients, Companies I've Worked With"
              contentType="short_text"
            />
          </span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-[#1E3A32]">
            <CmsText
              contentKey="home.testimonials.title"
              page="Home"
              blockTitle="Testimonials Title"
              defaultContent="What Clients Are Saying"
              contentType="short_text"
            />
          </h2>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white p-8 md:p-10 relative group hover:shadow-lg transition-shadow duration-500"
            >
              {/* Gold Corner */}
              <div className="absolute top-0 left-0 w-12 h-12 border-l-2 border-t-2 border-[#D8B46B] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Quote Icon */}
              <Quote
                size={32}
                className="text-[#D8B46B]/30 mb-6"
              />

              {/* Quote Text */}
              <CmsText
                contentKey={`home.testimonials.${index}.quote`}
                page="Home"
                blockTitle={`Testimonial ${index + 1} - Quote`}
                fallback={`"${testimonial.quote}"`}
                contentType="rich_text"
                className="font-serif text-xl text-[#2B2725] leading-relaxed mb-8 italic"
                as="p"
              />

              {/* Attribution */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#A6B7A3]/30 flex items-center justify-center">
                  <span className="font-serif text-[#1E3A32] text-lg">
                    {testimonial.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <CmsText
                    contentKey={`home.testimonials.${index}.name`}
                    page="Home"
                    blockTitle={`Testimonial ${index + 1} - Name`}
                    fallback={testimonial.name}
                    contentType="short_text"
                    className="font-medium text-[#1E3A32]"
                    as="p"
                  />
                  <CmsText
                    contentKey={`home.testimonials.${index}.role`}
                    page="Home"
                    blockTitle={`Testimonial ${index + 1} - Role`}
                    fallback={testimonial.role}
                    contentType="short_text"
                    className="text-sm text-[#2B2725]/60"
                    as="p"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}