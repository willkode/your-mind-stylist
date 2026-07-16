import React, { useState } from "react";
import SEO from "../components/SEO";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, Clock, Play, Mic, ExternalLink } from "lucide-react";
import CmsText from "../components/cms/CmsText";
import { usePullToRefresh } from "@/components/utils/usePullToRefresh";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";

function PodcastGrid() {
  const { data: podcasts = [] } = useQuery({
    queryKey: ["podcastAppearances-public"],
    queryFn: () => base44.entities.PodcastAppearance.filter({ status: "published" }, "-air_date"),
  });

  if (podcasts.length === 0) {
    return <p className="text-[#F9F5EF]/50 text-sm">Podcast appearances coming soon. Check back for links to episodes.</p>;
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6 text-left">
      {podcasts.map(p => (
        <div key={p.id} className="bg-white/10 border border-white/20 p-6 hover:bg-white/15 transition-colors">
          {p.thumbnail && <img src={p.thumbnail} alt={p.show_name} className="w-full h-32 object-cover mb-4 rounded" />}
          <p className="text-[#D8B46B] text-xs uppercase tracking-wide mb-1">{p.show_name}</p>
          <h3 className="font-serif text-lg text-[#F9F5EF] mb-2 leading-tight">{p.episode_title}</h3>
          {p.description && <p className="text-[#F9F5EF]/60 text-sm mb-3 line-clamp-2">{p.description}</p>}
          {p.air_date && <p className="text-[#F9F5EF]/40 text-xs mb-3">{new Date(p.air_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>}
          {p.episode_url && (
            <a href={p.episode_url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[#D8B46B] hover:text-white text-sm transition-colors">
              <ExternalLink size={14} /> Listen to Episode
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

const CATEGORIES = [
  "All",
  "Emotional Intelligence",
  "Culture",
  "Leadership & Teams",
  "Communication",
  "Identity & Confidence",
  "Stress & Regulation",
  "Relationships",
  "Inner Rehearsal",
  "Hypnosis & the Brain",
  "Personal & Professional Development",
];

function PostCard({ post, onClick }) {
  const isVideo = post.post_type === "video";
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-[#F9F5EF] hover:shadow-lg transition-shadow overflow-hidden flex flex-col"
    >
      {post.featured_image && (
        <div className="relative">
          <img src={post.featured_image} alt={post.title} className="w-full h-48 object-cover" />
          {isVideo && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                <Play size={18} className="text-[#1E3A32] ml-1" />
              </div>
            </div>
          )}
        </div>
      )}
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="px-2 py-1 bg-white text-[#2B2725] text-xs tracking-wide uppercase">
            {post.category}
          </span>
          {isVideo && (
            <span className="px-2 py-1 bg-[#6E4F7D]/10 text-[#6E4F7D] text-xs tracking-wide uppercase flex items-center gap-1">
              <Play size={10} /> Video
            </span>
          )}
        </div>
        <h3 className="font-serif text-xl text-[#1E3A32] mb-3 leading-tight flex-1">{post.title}</h3>
        {post.excerpt && <p className="text-[#2B2725]/70 leading-relaxed mb-4 text-sm">{post.excerpt}</p>}
        <div className="flex items-center gap-4 text-[#2B2725]/60 text-xs mb-4">
          {post.publish_date && (
            <div className="flex items-center gap-1">
              <Calendar size={12} />
              {new Date(post.publish_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          )}
          {post.read_time && !isVideo && (
            <div className="flex items-center gap-1">
              <Clock size={12} />
              {post.read_time} min
            </div>
          )}
        </div>
        <button
          onClick={() => onClick(post.slug)}
          className="group inline-flex items-center gap-2 text-[#1E3A32] font-medium text-sm hover:gap-3 transition-all"
        >
          {isVideo ? "Watch" : "Read"}
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
}

export default function Blog() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("All");

  const goToPost = (slug) => {
    window.scrollTo(0, 0);
    navigate(createPageUrl(`BlogPost?slug=${slug}`));
  };

  const { pullY, isRefreshing, handlers: pullToRefreshHandlers } = usePullToRefresh(async () => {
    queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
  });

  const { data: allPosts = [] } = useQuery({
    queryKey: ['blog-posts'],
    queryFn: async () => {
      const posts = await base44.entities.BlogPost.filter({ status: 'published' }, '-publish_date');
      const now = new Date();
      return posts.filter(p => !p.publish_date || new Date(p.publish_date) <= now);
    },
  });

  const featuredPost = allPosts.find(p => p.featured_image) || allPosts[0] || null;
  const latestPosts = allPosts.filter(p => p.id !== featuredPost?.id);

  const filteredPosts = selectedCategory === "All"
    ? latestPosts
    : latestPosts.filter(p => p.category === selectedCategory);

  return (
    <div className="bg-[#F9F5EF]" {...pullToRefreshHandlers}>
      <SEO
        title="Your Mind Styling Journal | Articles & Reflections"
        description="Articles, written reflections, video posts, and Mind-Styling Podcasts on mindset, emotional intelligence, and inner pattern shifts."
        canonical="/blog"
      />

      {pullY > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: pullY / 100 }}
          className="flex justify-center py-4 fixed top-20 left-0 right-0 z-40"
        >
          <div className={`text-[#D8B46B] ${isRefreshing ? 'animate-spin' : ''}`}>
            {isRefreshing ? '↻' : '↓'} {isRefreshing ? 'Refreshing...' : 'Pull to refresh'}
          </div>
        </motion.div>
      )}

      {/* Hero */}
      <section className="pt-32 pb-20">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
            <span className="text-[#D8B46B] text-xs tracking-[0.3em] uppercase mb-4 block">
              <CmsText contentKey="blog.hero.subtitle" page="Blog" blockTitle="Hero Subtitle" fallback="Your Mind Styling Journal" contentType="short_text" />
            </span>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-[#1E3A32] leading-tight mb-6">
              <CmsText contentKey="blog.hero.title" page="Blog" blockTitle="Hero Title" fallback='Articles, Thoughts & Tools<br /><span class="italic text-[#6E4F7D]">for a Calmer, Clearer Mind</span>' contentType="rich_text" />
            </h1>
            <p className="text-[#2B2725]/80 text-lg leading-relaxed mb-10 max-w-3xl mx-auto">
              <CmsText contentKey="blog.hero.description" page="Blog" blockTitle="Hero Description" fallback="Weekly reflections, tools, and perspectives to help you understand your patterns, soften your internal dialogue, and think from where you want to be." contentType="rich_text" />
            </p>
            <a href="#latest" className="group inline-flex items-center gap-3 px-8 py-4 bg-[#1E3A32] text-[#F9F5EF] text-sm tracking-wide hover:bg-[#2B2725] transition-all duration-300">
              Read the Latest
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* Category Filters */}
      <section className="py-10 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="font-serif text-2xl text-[#1E3A32] mb-6 text-center">
            <CmsText contentKey="blog.filters.title" page="Blog" blockTitle="Filter Section Title" fallback="Browse by Topic" contentType="short_text" />
          </h2>
          <div className="flex flex-wrap justify-center gap-2">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => { setSelectedCategory(category); document.getElementById('latest')?.scrollIntoView({ behavior: 'smooth' }); }}
                className={`px-4 py-2 text-xs tracking-wide transition-all duration-300 ${
                  selectedCategory === category
                    ? "bg-[#1E3A32] text-[#F9F5EF]"
                    : "bg-[#F9F5EF] text-[#2B2725] hover:bg-[#E4D9C4]"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 1. Featured */}
      {featuredPost && (
        <section id="featured" className="py-20 bg-[#F9F5EF]">
          <div className="max-w-5xl mx-auto px-6">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="font-serif text-3xl text-[#1E3A32] mb-10">
                <CmsText contentKey="blog.featured.title" page="Blog" blockTitle="Featured Section Title" fallback="Featured" contentType="short_text" />
              </h2>
              <div className="bg-white hover:shadow-lg transition-shadow overflow-hidden md:flex">
                {featuredPost.featured_image && (
                  <div className="md:w-2/5 flex-shrink-0 relative">
                    <img src={featuredPost.featured_image} alt={featuredPost.title} className="w-full h-64 md:h-full object-cover" />
                    {featuredPost.post_type === "video" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                          <Play size={24} className="text-[#1E3A32] ml-1" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div className="p-10 md:p-12 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <span className="px-3 py-1 bg-[#D8B46B]/20 text-[#2B2725] text-xs tracking-wide uppercase">{featuredPost.category}</span>
                    {featuredPost.post_type === "video" && (
                      <span className="px-3 py-1 bg-[#6E4F7D]/10 text-[#6E4F7D] text-xs tracking-wide uppercase flex items-center gap-1"><Play size={10} /> Video</span>
                    )}
                    {featuredPost.publish_date && (
                      <div className="flex items-center gap-2 text-[#2B2725]/60 text-sm">
                        <Calendar size={14} />
                        {new Date(featuredPost.publish_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    )}
                    {featuredPost.read_time && featuredPost.post_type !== "video" && (
                      <div className="flex items-center gap-2 text-[#2B2725]/60 text-sm">
                        <Clock size={14} />
                        {featuredPost.read_time} min read
                      </div>
                    )}
                  </div>
                  <h3 className="font-serif text-3xl md:text-4xl text-[#1E3A32] mb-4 leading-tight">{featuredPost.title}</h3>
                  <p className="text-[#2B2725]/80 text-lg leading-relaxed mb-6">{featuredPost.excerpt}</p>
                  <button onClick={() => goToPost(featuredPost.slug)} className="group inline-flex items-center gap-2 text-[#1E3A32] font-medium hover:gap-3 transition-all">
                    {featuredPost.post_type === "video" ? "Watch" : "Read Article"}
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* 2. All Posts */}
      <section id="latest" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-serif text-3xl md:text-4xl text-[#1E3A32] mb-12">
              {selectedCategory === "All" ? "Latest Posts" : selectedCategory}
            </h2>
            {filteredPosts.length === 0 ? (
              <p className="text-[#2B2725]/60 text-center py-12">No posts in this category yet. Check back soon.</p>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredPosts.map((post) => (
                  <PostCard key={post.id} post={post} onClick={goToPost} />
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* 3. Mind-Styling Podcasts */}
      <section className="py-20 bg-[#1E3A32]">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="text-center mb-10">
              <Mic size={36} className="text-[#D8B46B] mx-auto mb-4" />
              <h2 className="font-serif text-3xl md:text-4xl text-[#F9F5EF] mb-4">
                <CmsText contentKey="blog.podcasts.title" page="Blog" blockTitle="Podcasts Section Title" fallback="Mind-Styling Podcasts" contentType="short_text" />
              </h2>
              <p className="text-[#F9F5EF]/80 text-lg leading-relaxed max-w-2xl mx-auto mb-6">
                <CmsText contentKey="blog.podcasts.description" page="Blog" blockTitle="Podcasts Section Description" fallback="Listen to Roberta's conversations on podcasts across the web — on emotional intelligence, hypnosis, identity, and change." contentType="rich_text" />
              </p>
                      {/* Podcast appearances loaded from database */}
              <PodcastGrid />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Work With Me CTA */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-[#1E3A32] mb-8">
              <CmsText contentKey="blog.cta.title" page="Blog" blockTitle="CTA Title" fallback="Want to Take This Work Deeper?" contentType="short_text" />
            </h2>
            <p className="text-[#2B2725]/80 text-lg leading-relaxed mb-10">
              <CmsText contentKey="blog.cta.description" page="Blog" blockTitle="CTA Description" fallback="If something you read here resonates, there are several ways we can work together:" contentType="rich_text" />
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
              <Link to={createPageUrl("LearnHypnosis")} className="text-[#1E3A32] hover:text-[#D8B46B] transition-colors">Hypnosis Training</Link>
              <span className="hidden sm:block text-[#2B2725]/30">•</span>
              <Link to={createPageUrl("CleaningOutYourCloset")} className="text-[#1E3A32] hover:text-[#D8B46B] transition-colors">Private Mind Styling (1:1)</Link>
              <span className="hidden sm:block text-[#2B2725]/30">•</span>
              <Link to={createPageUrl("Programs")} className="text-[#1E3A32] hover:text-[#D8B46B] transition-colors">All Programs & Pricing</Link>
            </div>
            <Link to={createPageUrl("Contact")} className="group inline-flex items-center gap-3 px-8 py-4 bg-[#1E3A32] text-[#F9F5EF] text-sm tracking-wide hover:bg-[#2B2725] transition-all duration-300">
              Explore Ways to Work With Me
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}