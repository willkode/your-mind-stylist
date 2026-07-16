import React from "react";
import { motion } from "framer-motion";
import { ExternalLink, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";

export default function PublicPagesList() {
  const baseUrl = "https://yourmindstylist.com";

  const publicPages = [
    // Main Navigation
    { name: "Home", slug: "Home", category: "Main Navigation" },
    { name: "About", slug: "About", category: "Main Navigation" },
    { name: "Book a Session", slug: "Bookings", category: "Main Navigation" },
    { name: "Podcast", slug: "Podcast", category: "Main Navigation" },
    { name: "Blog", slug: "Blog", category: "Main Navigation" },
    { name: "Contact", slug: "Contact", category: "Main Navigation" },
    
    // Services - Transformational Programs
    { name: "All Programs & Pricing", slug: "Programs", category: "Transformational Programs" },
    { name: "Cleaning Out Your Closet", slug: "CleaningOutYourCloset", category: "Transformational Programs" },
    { name: "Pocket Mindset™", slug: "PocketVisualization", category: "Transformational Programs" },
    
    // Services - Professional Development
    { name: "Hypnosis Training", slug: "LearnHypnosis", category: "Professional Development" },
    { name: "Speaking & Training", slug: "SpeakingTraining", category: "Professional Development" },
    { name: "LENS™", slug: "LENS", category: "Professional Development" },
    
    // Legal Pages
    { name: "Privacy Policy", slug: "LegalPage?slug=privacy-policy", category: "Legal" },
    { name: "Terms of Service", slug: "LegalPage?slug=terms-of-service", category: "Legal" },
    { name: "Cookie Policy", slug: "LegalPage?slug=cookie-policy", category: "Legal" },
    { name: "Accessibility", slug: "Accessibility", category: "Legal" },
    
    // Additional Public Pages
    { name: "Free Masterclass", slug: "FreeMasterclass", category: "Lead Magnets" },
    { name: "Masterclass", slug: "Masterclass", category: "Lead Magnets" },
    { name: "Pricing", slug: "Pricing", category: "Sales" },
    { name: "Work With Me", slug: "WorkWithMe", category: "Sales" },
    { name: "Product Page", slug: "ProductPage", category: "Sales" },
    { name: "Course Page", slug: "CoursePage", category: "Sales" },
    { name: "Blog Post", slug: "BlogPost", category: "Content" },
    { name: "Resources", slug: "Resources", category: "Content" },
    
    // Technical Pages
    { name: "Sitemap", slug: "Sitemap", category: "Technical" },
    { name: "Robots.txt", slug: "RobotsText", category: "Technical" },
  ];

  const groupedPages = publicPages.reduce((acc, page) => {
    if (!acc[page.category]) {
      acc[page.category] = [];
    }
    acc[page.category].push(page);
    return acc;
  }, {});

  const copyUrl = (slug) => {
    const url = `${baseUrl}/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard!");
  };

  const copyAllUrls = () => {
    const allUrls = publicPages.map(page => `${baseUrl}/${page.slug}`).join('\n');
    navigator.clipboard.writeText(allUrls);
    toast.success("All URLs copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-[#F9F5EF] pt-32 pb-12 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl md:text-4xl text-[#1E3A32] mb-3">
            Site Pages Reference
          </h1>
          <p className="text-[#2B2725]/70 text-lg mb-6">
            Complete list of all public-facing pages on Your Mind Stylist website
          </p>
          <Button onClick={copyAllUrls} className="bg-[#1E3A32] hover:bg-[#2B2725]">
            <Copy size={16} className="mr-2" />
            Copy All URLs
          </Button>
        </div>

        {/* Page Count */}
        <div className="bg-white p-4 rounded-lg mb-8 border-l-4 border-[#D8B46B]">
          <p className="text-sm text-[#2B2725]/70">
            <span className="font-medium text-[#1E3A32]">{publicPages.length} public pages</span> indexed
          </p>
        </div>

        {/* Grouped Pages */}
        {Object.entries(groupedPages).map(([category, pages]) => (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h2 className="font-serif text-2xl text-[#1E3A32] mb-4 flex items-center gap-2">
              {category}
              <span className="text-sm font-sans text-[#2B2725]/40 font-normal">
                ({pages.length})
              </span>
            </h2>
            <div className="bg-white rounded-lg overflow-hidden shadow-sm">
              {pages.map((page, index) => (
                <div
                  key={page.slug}
                  className={`p-4 flex items-center justify-between ${
                    index !== pages.length - 1 ? 'border-b border-[#E4D9C4]' : ''
                  } hover:bg-[#F9F5EF] transition-colors`}
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-[#1E3A32] mb-1">{page.name}</h3>
                    <p className="text-sm text-[#2B2725]/60 font-mono">
                      {baseUrl}/{page.slug}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyUrl(page.slug)}
                      className="text-[#6E4F7D] hover:text-[#6E4F7D] hover:bg-[#6E4F7D]/10"
                    >
                      <Copy size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`${baseUrl}/${page.slug}`, '_blank')}
                      className="text-[#D8B46B] hover:text-[#D8B46B] hover:bg-[#D8B46B]/10"
                    >
                      <ExternalLink size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}

        {/* Export Options */}
        <div className="bg-[#1E3A32] text-[#F9F5EF] p-6 rounded-lg">
          <h3 className="font-serif text-xl mb-3">Export Options</h3>
          <p className="text-[#F9F5EF]/70 text-sm mb-4">
            Use these URLs for SEO submission to Google Search Console, Bing Webmaster Tools, or social media indexing.
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={copyAllUrls}
              className="border-[#F9F5EF]/30 text-[#F9F5EF] hover:bg-[#F9F5EF]/10"
            >
              Copy All URLs
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/Sitemap'}
              className="border-[#F9F5EF]/30 text-[#F9F5EF] hover:bg-[#F9F5EF]/10"
            >
              View XML Sitemap
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}