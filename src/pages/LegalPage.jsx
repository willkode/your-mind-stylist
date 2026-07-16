import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Scale } from "lucide-react";
import CmsText from "../components/cms/CmsText";

export default function LegalPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get("slug");

  const { data: page, isLoading } = useQuery({
    queryKey: ["legalPage", slug],
    queryFn: async () => {
      const pages = await base44.entities.LegalPage.filter({ slug });
      return pages[0];
    },
    enabled: !!slug,
  });

  if (!slug) {
    return (
      <div className="min-h-screen bg-[#F9F5EF] py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[#2B2725]/70">Legal page not found</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9F5EF] py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[#2B2725]/70">Loading...</p>
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen bg-[#F9F5EF] py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-serif text-3xl text-[#1E3A32] mb-4">Page Not Found</h1>
          <p className="text-[#2B2725]/70">This legal page does not exist yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F9F5EF]">
      <section className="pt-32 pb-12">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <Scale size={24} className="text-[#D8B46B]" />
              <span className="text-[#D8B46B] text-xs tracking-[0.3em] uppercase">
                Legal
              </span>
            </div>
            <h1 className="font-serif text-4xl md:text-5xl text-[#1E3A32] mb-8">
              <CmsText 
                contentKey={`legal.${slug}.title`}
                page="LegalPage"
                blockTitle={`${slug} Title`}
                fallback={page.title}
                contentType="short_text"
              />
            </h1>
            {page.last_reviewed && (
              <p className="text-[#2B2725]/60 text-sm">
                Last reviewed: {new Date(page.last_reviewed).toLocaleDateString()}
              </p>
            )}
          </motion.div>
        </div>
      </section>

      <section className="pb-24">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-8 md:p-12"
          >
            <div
              className="prose prose-lg max-w-none"
              style={{ color: "#2B2725", lineHeight: "1.8" }}
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
          </motion.div>
        </div>
      </section>
    </div>
  );
}