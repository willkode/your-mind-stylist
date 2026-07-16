import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { ArrowLeft, Calendar, Clock, User } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import SEO from "../components/SEO";
import LeadMagnetCTA from "../components/leadmagnet/LeadMagnetCTA";

export default function BlogPost() {
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get("slug");

  const { data: post, isLoading } = useQuery({
    queryKey: ["blogPost", slug],
    queryFn: async () => {
      const posts = await base44.entities.BlogPost.filter({ slug, status: "published" });
      if (!posts || posts.length === 0) return null;
      
      const postData = posts[0];
      
      // Fetch author if author_id exists
      if (postData.author_id) {
        const authors = await base44.entities.Author.filter({ id: postData.author_id });
        if (authors && authors.length > 0) {
          postData.author = authors[0];
        }
      }
      
      return postData;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9F5EF] pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-[#2B2725]/60">Loading...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#F9F5EF] pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="font-serif text-3xl text-[#1E3A32] mb-4">Post Not Found</h1>
          <Link to={createPageUrl("Blog")} className="text-[#D8B46B] hover:underline">
            Return to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F5EF]">
      <SEO
        title={post.meta_title || post.title}
        description={post.meta_description || post.excerpt}
        canonical={`/blog/${post.slug}`}
        article={true}
        author={post.author?.display_name || "Roberta Fernandez"}
        publishedTime={post.publish_date}
        modifiedTime={post.updated_date}
        ogImage={post.featured_image}
        tags={post.tags || []}
        category={post.category}
      />

      {/* Back Link */}
      <div className="pt-32 pb-8">
        <div className="max-w-4xl mx-auto px-6">
          <Link
            to={createPageUrl("Blog")}
            className="inline-flex items-center gap-2 text-[#2B2725]/60 hover:text-[#1E3A32] transition-colors"
          >
            <ArrowLeft size={18} />
            Back to Blog
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <section className="pb-12">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-6">
              <span className="inline-block px-4 py-1 bg-[#D8B46B]/20 text-[#1E3A32] text-xs tracking-wider uppercase">
                {post.category}
              </span>
            </div>

            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-[#1E3A32] leading-tight mb-6">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="text-xl text-[#2B2725]/70 leading-relaxed mb-8">
                {post.excerpt}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-6 text-sm text-[#2B2725]/60">
              {post.author && (
                <div className="flex items-center gap-2">
                  <User size={16} />
                  <span>{post.author.display_name}</span>
                </div>
              )}
              {post.publish_date && (
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  <span>{new Date(post.publish_date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </div>
              )}
              {post.read_time && (
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  <span>{post.read_time} min read</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Video Embed (for video posts) */}
      {post.post_type === "video" && post.video_embed_url && (
        <section className="pb-16">
          <div className="max-w-5xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="aspect-video w-full rounded-lg shadow-lg overflow-hidden"
            >
              <iframe
                src={post.video_embed_url}
                title={post.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </motion.div>
          </div>
        </section>
      )}

      {/* Featured Image (for written posts) */}
      {post.post_type !== "video" && post.featured_image && (
        <section className="pb-16">
          <div className="max-w-5xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <img
                src={post.featured_image}
                alt={post.title}
                className="w-full h-[400px] md:h-[500px] object-cover rounded-lg shadow-lg"
              />
            </motion.div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <section className="pb-20">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="prose prose-lg max-w-none"
          >
            <div 
              dangerouslySetInnerHTML={{ __html: post.content }}
              className="blog-content"
            />
          </motion.div>
        </div>
      </section>

      {/* Author Bio */}
      {post.author && (
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-col md:flex-row gap-8 items-start"
            >
              {post.author.profile_image && (
                <img
                  src={post.author.profile_image}
                  alt={post.author.display_name}
                  className="w-32 h-32 rounded-full object-cover"
                />
              )}
              <div className="flex-1">
                <h3 className="font-serif text-2xl text-[#1E3A32] mb-3">
                  About {post.author.display_name}
                </h3>
                {post.author.bio && (
                  <p className="text-[#2B2725]/70 leading-relaxed mb-4">
                    {post.author.bio}
                  </p>
                )}
                {post.author.website && (
                  <a
                    href={post.author.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#D8B46B] hover:text-[#1E3A32] transition-colors"
                  >
                    Visit Website →
                  </a>
                )}
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <section className="py-12 bg-[#F9F5EF]">
          <div className="max-w-4xl mx-auto px-6">
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-4 py-2 bg-white text-[#2B2725]/70 text-sm border border-[#E4D9C4]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Lead Magnet CTA */}
      <div className="max-w-4xl mx-auto px-6">
        <LeadMagnetCTA placement="blog" />
      </div>

      {/* CTA Section */}
      <section className="py-20 bg-[#1E3A32]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-serif text-3xl md:text-4xl text-[#F9F5EF] mb-6">
              Ready to Transform Your Mind?
            </h2>
            <p className="text-[#F9F5EF]/80 text-lg mb-8 max-w-2xl mx-auto">
              Explore my programs and discover how Mind Styling can help you rewrite your
              patterns and create lasting change.
            </p>
            <Link
              to={createPageUrl("Pricing")}
              className="inline-flex items-center gap-3 px-8 py-4 bg-[#D8B46B] text-[#1E3A32] text-sm tracking-wide hover:bg-[#F9F5EF] transition-all duration-300"
            >
              Explore Programs
            </Link>
          </motion.div>
        </div>
      </section>

      <style>{`
        .blog-content h2 {
          font-family: 'Playfair Display', serif;
          font-size: 2rem;
          color: #1E3A32;
          margin-top: 2rem;
          margin-bottom: 1rem;
          font-weight: 600;
        }
        
        .blog-content h3 {
          font-family: 'Playfair Display', serif;
          font-size: 1.5rem;
          color: #1E3A32;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          font-weight: 600;
        }
        
        .blog-content p {
          color: rgba(43, 39, 37, 0.8);
          font-size: 1.125rem;
          line-height: 1.75;
          margin-bottom: 0.4rem;
        }

        .blog-content p + p {
          margin-top: 0;
        }

        .blog-content p:empty {
          display: none;
        }
        
        .blog-content ul, .blog-content ol {
          margin-left: 1.5rem;
          margin-bottom: 0.75rem;
        }
        
        .blog-content li {
          color: rgba(43, 39, 37, 0.8);
          font-size: 1.125rem;
          line-height: 1.75;
          margin-bottom: 0.2rem;
        }
        
        .blog-content img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 2rem 0;
        }
        
        .blog-content strong {
          color: #1E3A32;
          font-weight: 600;
        }
        
        .blog-content a {
          color: #D8B46B;
          text-decoration: underline;
        }
        
        .blog-content a:hover {
          color: #1E3A32;
        }
        
        .blog-content blockquote {
          border-left: 4px solid #D8B46B;
          padding-left: 1.5rem;
          margin: 2rem 0;
          font-style: italic;
          color: rgba(43, 39, 37, 0.7);
        }
        
        .blog-content .blog-video {
          width: 100%;
          min-height: 400px;
          border-radius: 0.5rem;
          margin: 2rem 0;
          border: none;
        }
      `}</style>
    </div>
  );
}