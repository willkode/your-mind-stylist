import React from "react";
import SEO from "../components/SEO";
import { motion } from "framer-motion";
import { Headphones, ExternalLink, Calendar } from "lucide-react";
import CmsText from "../components/cms/CmsText";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

export default function Podcast() {
  const { data: episodes = [] } = useQuery({
    queryKey: ["podcastEpisodes", "published"],
    queryFn: () => base44.entities.PodcastAppearance.filter({ status: "published" }, "-air_date"),
  });

  return (
    <div className="bg-[#F9F5EF] pt-32 pb-24">
      <SEO
        title="Activated Dialogue Podcast | Your Mind Stylist"
        description="Deeper conversations about emotional intelligence, change, and conscious living with Your Mind Stylist, Roberta Fernandez."
        canonical="/podcast"
      />
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <Headphones size={48} className="text-[#D8B46B] mx-auto mb-6" />
          <span className="text-[#D8B46B] text-xs tracking-[0.3em] uppercase mb-4 block">
            <CmsText contentKey="podcast.hero.subtitle" page="Podcast" blockTitle="Hero Subtitle" fallback="Podcast" contentType="short_text" />
          </span>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-[#1E3A32] leading-tight mb-6">
            <CmsText contentKey="podcast.hero.title" page="Podcast" blockTitle="Hero Title" fallback="Activated Dialogue" contentType="short_text" />
          </h1>
          <p className="text-[#2B2725]/80 text-lg max-w-2xl mx-auto">
            <CmsText contentKey="podcast.hero.description" page="Podcast" blockTitle="Hero Description" fallback="Deeper conversations about emotional intelligence, change, and conscious living." contentType="rich_text" />
          </p>
        </motion.div>

        {episodes.length === 0 ? (
          <div className="bg-white p-12 text-center">
            <p className="text-[#2B2725]/60">
              <CmsText contentKey="podcast.comingsoon" page="Podcast" blockTitle="Coming Soon Message" fallback="Podcast episodes coming soon. Subscribe to stay updated." contentType="rich_text" />
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {episodes.map((ep, i) => (
              <motion.div
                key={ep.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-white p-6 md:p-8"
              >
                <div className="flex flex-col md:flex-row gap-6">
                  {ep.thumbnail && (
                    <img src={ep.thumbnail} alt={ep.show_name} className="w-full md:w-28 h-28 object-cover rounded-lg flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="text-xs text-[#D8B46B] tracking-widest uppercase mb-1">{ep.show_name}</p>
                    <h2 className="font-serif text-xl text-[#1E3A32] mb-2">{ep.episode_title}</h2>
                    {ep.description && <p className="text-[#2B2725]/70 text-sm mb-3 leading-relaxed">{ep.description}</p>}
                    <div className="flex items-center gap-4">
                      {ep.air_date && (
                        <span className="flex items-center gap-1 text-xs text-[#2B2725]/50">
                          <Calendar size={12} />
                          {format(new Date(ep.air_date), "MMMM d, yyyy")}
                        </span>
                      )}
                      {ep.episode_url && (
                        <a href={ep.episode_url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-[#1E3A32] border border-[#1E3A32] px-4 py-2 hover:bg-[#1E3A32] hover:text-white transition-colors">
                          <ExternalLink size={14} /> Listen Now
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                {ep.embed_url && (
                  <div className="mt-4">
                    <iframe
                      src={ep.embed_url}
                      title={ep.episode_title}
                      className="w-full rounded"
                      height="152"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                    />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}