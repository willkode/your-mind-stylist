import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { motion } from "framer-motion";
import { Home, BookOpen, Briefcase, LayoutDashboard } from "lucide-react";

export default function NotFound() {
  const links = [
    { icon: Home, label: "Return to the Home Page", path: "Home" },
    { icon: BookOpen, label: "Visit The Mind Styling Journal", path: "Blog" },
    { icon: Briefcase, label: "Explore Ways to Work With Me", path: "WorkWithMe" },
    { icon: LayoutDashboard, label: "Access Your Dashboard", path: "Dashboard" },
  ];

  return (
    <div className="bg-[#F9F5EF]">
      {/* Hero Section */}
      <section className="pt-32 pb-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-[#D8B46B] text-xs tracking-[0.3em] uppercase mb-4 block">
              404
            </span>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-[#1E3A32] leading-tight mb-6">
              This Page Doesn't Exist.
            </h1>
            <p className="text-[#1E3A32] font-serif text-2xl md:text-3xl italic mb-8">
              But that doesn't mean you're lost.
            </p>

            <p className="text-[#2B2725]/80 text-lg leading-relaxed max-w-2xl mx-auto">
              Sometimes we take a wrong turn — online and in life.
              <br />
              This page doesn't exist anymore (or maybe it never did), but you still have plenty
              of options.
            </p>
          </motion.div>
        </div>
      </section>

      {/* What You Can Do Next */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-[#1E3A32] mb-12 text-center">
              Let's Get You Back to Clarity
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {links.map((link, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    to={createPageUrl(link.path)}
                    className="group block bg-[#F9F5EF] p-8 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center group-hover:bg-[#D8B46B] transition-colors">
                        <link.icon
                          size={24}
                          className="text-[#1E3A32] group-hover:text-white transition-colors"
                        />
                      </div>
                      <p className="text-[#1E3A32] text-lg group-hover:text-[#D8B46B] transition-colors">
                        {link.label}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Light Touch Line */}
      <section className="py-24 bg-[#1E3A32]">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <blockquote className="font-serif text-2xl md:text-3xl text-[#F9F5EF] italic leading-relaxed">
              "Every misstep is data. Now you know this isn't the path — let's find one that is."
            </blockquote>
          </motion.div>
        </div>
      </section>
    </div>
  );
}