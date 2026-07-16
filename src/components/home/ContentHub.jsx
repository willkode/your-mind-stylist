import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { motion } from "framer-motion";
import { ArrowUpRight, Calendar, BookOpen, Headphones } from "lucide-react";
import CmsText from "../cms/CmsText";

export default function ContentHub() {
  const content = [
    {
      icon: Calendar,
      title: "Monday Mentions",
      description: "Short weekly insights to begin your week with intention.",
      cta: "Watch the Latest",
      link: "Blog",
      color: "#1E3A32",
    },
    {
      icon: BookOpen,
      title: "Thursday Thoughts",
      description: "Reflective ideas to carry into the weekend.",
      cta: "Read the Latest",
      link: "Blog",
      color: "#6E4F7D",
    },
    {
      icon: Headphones,
      title: "Activated Dialogue",
      description: "Deeper conversations about emotional intelligence, change, and conscious living.",
      cta: "Listen Now",
      link: "Podcast",
      color: "#D8B46B",
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
          className="text-center mb-16"
        >
          <span className="text-[#D8B46B] text-xs tracking-[0.3em] uppercase mb-4 block">
            <CmsText
              contentKey="home.content_hub.label"
              page="Home"
              blockTitle="Content Hub Label"
              defaultContent="Blogs, Podcasts & More"
              contentType="short_text"
            />
          </span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-[#1E3A32]">
            <CmsText
              contentKey="home.content_hub.title"
              page="Home"
              blockTitle="Content Hub Title"
              defaultContent="Stay Connected"
              contentType="short_text"
            />
          </h2>
        </motion.div>

        {/* Content Grid */}
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {content.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                to={createPageUrl(item.link)}
                className="block bg-white p-8 md:p-10 h-full group hover:shadow-xl transition-all duration-500 relative overflow-hidden"
              >
                {/* Hover Background */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500"
                  style={{ backgroundColor: item.color }}
                />

                {/* Icon */}
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mb-8 transition-transform group-hover:scale-110 duration-300"
                  style={{ backgroundColor: `${item.color}15` }}
                >
                  <item.icon size={24} style={{ color: item.color }} />
                </div>

                {/* Content */}
                <CmsText
                  contentKey={`home.content_hub.${index}.title`}
                  page="Home"
                  blockTitle={`${item.title} - Title`}
                  fallback={item.title}
                  contentType="short_text"
                  className="font-serif text-2xl text-[#1E3A32] mb-3"
                  as="h3"
                />
                <CmsText
                  contentKey={`home.content_hub.${index}.description`}
                  page="Home"
                  blockTitle={`${item.title} - Description`}
                  fallback={item.description}
                  contentType="short_text"
                  className="text-[#2B2725]/70 leading-relaxed mb-8"
                  as="p"
                />

                {/* CTA */}
                <div className="flex items-center gap-2 text-[#1E3A32] font-medium group-hover:text-[#D8B46B] transition-colors">
                  <CmsText
                    contentKey={`home.content_hub.${index}.cta`}
                    page="Home"
                    blockTitle={`${item.title} - CTA`}
                    fallback={item.cta}
                    contentType="short_text"
                    as="span"
                  />
                  <ArrowUpRight
                    size={18}
                    className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                  />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}