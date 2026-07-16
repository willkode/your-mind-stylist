import React, { useState, useEffect, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Search, X, FileText, Package, Users, Loader2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { motion, AnimatePresence } from "framer-motion";
import useDebouncedValue from "./utils/useDebouncedValue";

export default function GlobalSearch({ isOpen, onClose }) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const [results, setResults] = useState({ products: [], pages: [], roadmap: [], users: [], blogPosts: [] });
  const [isSearching, setIsSearching] = useState(false);

  const STATIC_PAGES = [
    { name: "LENS™ Mind Styling Framework", description: "Flagship Mind Styling framework", page: "LENS" },
    { name: "Cleaning Out Your Closet", description: "One-on-one hypnosis work", page: "CleaningOutYourCloset" },
    { name: "Pocket Mindset™", description: "Daily guided experiences", page: "PocketMindset" },
    { name: "Hypnosis Training & Certification", description: "Become a certified hypnotist", page: "LearnHypnosis" },
    { name: "Speaking & Training", description: "Mind Styling for Organizations", page: "SpeakingTraining" },
    { name: "Initial Consultation", description: "Schedule a free consult", page: "Consultations" },
    { name: "Book a Session", description: "Book an appointment with Roberta", page: "Bookings" },
    { name: "Programs & Tools", description: "All programs and offerings", page: "Programs" },
    { name: "Blog", description: "Articles and insights", page: "Blog" },
    { name: "About", description: "About Roberta Fernandez", page: "About" },
    { name: "Contact", description: "Get in touch", page: "Contact" },
    { name: "Podcast", description: "Listen to the podcast", page: "Podcast" },
  ];

  useEffect(() => {
    const search = async () => {
      if (debouncedQuery.trim().length < 2) {
        setResults({ products: [], pages: [], roadmap: [], users: [], blogPosts: [] });
        return;
      }

      setIsSearching(true);
      try {
        const searchLower = debouncedQuery.toLowerCase();

        // Search static pages
        const pages = STATIC_PAGES.filter(
          (p) =>
            p.name?.toLowerCase().includes(searchLower) ||
            p.description?.toLowerCase().includes(searchLower)
        ).slice(0, 5);

        // Search products (published only)
        const allProducts = await base44.entities.Product.filter({ status: "published" });
        const products = allProducts
          .filter(
            (p) =>
              p.name?.toLowerCase().includes(searchLower) ||
              p.short_description?.toLowerCase().includes(searchLower) ||
              p.tagline?.toLowerCase().includes(searchLower)
          )
          .slice(0, 5);

        // Search blog posts
        const allPosts = await base44.entities.BlogPost.filter({ status: "published" });
        const blogPosts = allPosts
          .filter(
            (b) =>
              b.title?.toLowerCase().includes(searchLower) ||
              b.excerpt?.toLowerCase().includes(searchLower)
          )
          .slice(0, 5);

        // Admin-only searches
        let roadmap = [];
        let users = [];
        try {
          const user = await base44.auth.me();
          if (user?.role === "admin" || user?.role === "manager") {
            const allRoadmap = await base44.entities.RoadmapItem.list();
            roadmap = allRoadmap
              .filter(
                (r) =>
                  r.title?.toLowerCase().includes(searchLower) ||
                  r.description?.toLowerCase().includes(searchLower)
              )
              .slice(0, 3);
          }
          if (user?.role === "admin") {
            const allUsers = await base44.entities.User.list();
            users = allUsers
              .filter(
                (u) =>
                  u.full_name?.toLowerCase().includes(searchLower) ||
                  u.email?.toLowerCase().includes(searchLower)
              )
              .slice(0, 3);
          }
        } catch (e) {
          // Not logged in — skip admin searches
        }

        setResults({ products, pages, roadmap, users, blogPosts });
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    };

    search();
  }, [debouncedQuery]);

  const handleClose = useCallback(() => {
    setQuery("");
    setResults({ products: [], pages: [], roadmap: [], users: [], blogPosts: [] });
    onClose();
  }, [onClose]);

  const totalResults = useMemo(
    () =>
      results.products.length +
      results.pages.length +
      results.roadmap.length +
      results.users.length +
      results.blogPosts.length,
    [results]
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] p-0 overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b">
          <Search size={20} className="text-[#2B2725]/60" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, programs, blog posts..."
            className="border-0 focus-visible:ring-0 text-lg"
            autoFocus
          />
          {isSearching && <Loader2 size={20} className="animate-spin text-[#D8B46B]" />}
        </div>

        <div className="overflow-y-auto max-h-[60vh] p-4">
          {query.trim().length < 2 && (
            <p className="text-center text-[#2B2725]/60 py-8">
              Type at least 2 characters to search...
            </p>
          )}

          {query.trim().length >= 2 && totalResults === 0 && !isSearching && (
            <p className="text-center text-[#2B2725]/60 py-8">No results found.</p>
          )}

          <AnimatePresence>
            {/* Pages */}
            {results.pages?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <h3 className="text-sm font-medium text-[#2B2725]/70 mb-3 flex items-center gap-2">
                  <Search size={16} />
                  Pages ({results.pages.length})
                </h3>
                <div className="space-y-2">
                  {results.pages.map((page) => (
                    <Link
                      key={page.page}
                      to={createPageUrl(page.page)}
                      onClick={handleClose}
                      className="block p-3 bg-[#F9F5EF] hover:bg-[#E4D9C4] rounded transition-colors"
                    >
                      <p className="font-medium text-[#1E3A32]">{page.name}</p>
                      <p className="text-sm text-[#2B2725]/70">{page.description}</p>
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Products */}
            {results.products.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <h3 className="text-sm font-medium text-[#2B2725]/70 mb-3 flex items-center gap-2">
                  <Package size={16} />
                  Products ({results.products.length})
                </h3>
                <div className="space-y-2">
                  {results.products.map((product) => (
                    <Link
                      key={product.id}
                      to={createPageUrl(`ProductPage?slug=${product.slug}`)}
                      onClick={handleClose}
                      className="block p-3 bg-[#F9F5EF] hover:bg-[#E4D9C4] rounded transition-colors"
                    >
                      <p className="font-medium text-[#1E3A32]">{product.name}</p>
                      <p className="text-sm text-[#2B2725]/70 line-clamp-1">
                        {product.short_description}
                      </p>
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Roadmap */}
            {results.roadmap.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <h3 className="text-sm font-medium text-[#2B2725]/70 mb-3 flex items-center gap-2">
                  <FileText size={16} />
                  Roadmap ({results.roadmap.length})
                </h3>
                <div className="space-y-2">
                  {results.roadmap.map((item) => (
                    <Link
                      key={item.id}
                      to={createPageUrl("AdminRoadmap")}
                      onClick={handleClose}
                      className="block p-3 bg-[#F9F5EF] hover:bg-[#E4D9C4] rounded transition-colors"
                    >
                      <p className="font-medium text-[#1E3A32]">{item.title}</p>
                      <p className="text-sm text-[#2B2725]/70 line-clamp-1">
                        {item.description}
                      </p>
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Users */}
            {results.users.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <h3 className="text-sm font-medium text-[#2B2725]/70 mb-3 flex items-center gap-2">
                  <Users size={16} />
                  Users ({results.users.length})
                </h3>
                <div className="space-y-2">
                  {results.users.map((user) => (
                    <Link
                      key={user.id}
                      to={createPageUrl("AdminUsers")}
                      onClick={handleClose}
                      className="block p-3 bg-[#F9F5EF] hover:bg-[#E4D9C4] rounded transition-colors"
                    >
                      <p className="font-medium text-[#1E3A32]">{user.full_name}</p>
                      <p className="text-sm text-[#2B2725]/70">{user.email}</p>
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Blog Posts */}
            {results.blogPosts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <h3 className="text-sm font-medium text-[#2B2725]/70 mb-3 flex items-center gap-2">
                  <FileText size={16} />
                  Blog Posts ({results.blogPosts.length})
                </h3>
                <div className="space-y-2">
                  {results.blogPosts.map((post) => (
                    <Link
                      key={post.id}
                      to={createPageUrl(`BlogPost?slug=${post.slug}`)}
                      onClick={handleClose}
                      className="block p-3 bg-[#F9F5EF] hover:bg-[#E4D9C4] rounded transition-colors"
                    >
                      <p className="font-medium text-[#1E3A32]">{post.title}</p>
                      <p className="text-sm text-[#2B2725]/70 line-clamp-1">{post.excerpt}</p>
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}