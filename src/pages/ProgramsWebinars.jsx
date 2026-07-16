import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import SEO from "../components/SEO";
import { ArrowLeft, Sparkles, Calendar, Clock, Users, ShoppingCart, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

export default function ProgramsWebinars() {
  const [checkoutLoading, setCheckoutLoading] = useState(null);

  const handlePurchase = async (productId) => {
    setCheckoutLoading(productId);
    const response = await base44.functions.invoke('createProductCheckout', { product_id: productId });
    if (response.data?.url) {
      window.location.href = response.data.url;
    } else {
      setCheckoutLoading(null);
    }
  };

  // Products with product_subtype = "webinar" from Product Manager
  const { data: webinarProducts = [], isLoading } = useQuery({
    queryKey: ["webinar-products"],
    queryFn: async () => {
      const all = await base44.entities.Product.filter({ 
        status: "published",
        product_subtype: "webinar"
      });
      return all.sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999));
    },
  });

  // Also pull from the Webinar entity for any linked webinars
  const { data: webinars = [] } = useQuery({
    queryKey: ["published-webinars"],
    queryFn: async () => {
      return await base44.entities.Webinar.filter({ status: "published" }, "-created_date");
    },
  });

  const formatPrice = (price) => {
    if (!price || price === 0) return "Free";
    return `$${(price / 100).toFixed(2)}`;
  };

  const allWebinars = [
    ...webinarProducts.map(p => ({
      id: p.id,
      type: 'product',
      name: p.name,
      tagline: p.tagline,
      description: p.short_description,
      price: p.price,
      thumbnail: p.thumbnail,
      slug: p.slug
    })),
    // Include Webinar-entity items not already covered by a product
    ...webinars.filter(w => !webinarProducts.find(p => p.related_webinar_id === w.id)).map(w => ({
      id: w.id,
      type: 'webinar',
      name: w.title,
      description: w.short_description,
      price: w.price,
      event_date: w.event_date,
      thumbnail: w.thumbnail
    }))
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6E4F7D] mx-auto mb-4"></div>
          <p className="text-[#2B2725]/70">Loading webinars...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F5EF]">
      <SEO
        title="Webinars & Live Events | Your Mind Stylist"
        description="Join live sessions and workshops for real-time learning and transformation"
      />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-[#1E3A32] to-[#2B4A40] text-white">
        <div className="max-w-6xl mx-auto px-6">
          <Link to={createPageUrl("Programs")} className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-6 transition-colors">
            <ArrowLeft size={18} />
            <span className="text-sm">Back to All Programs</span>
          </Link>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Sparkles size={40} className="text-[#D8B46B]" />
              <h1 className="font-serif text-4xl md:text-5xl">Webinars & Live Events</h1>
            </div>
            <p className="text-xl text-white/90 max-w-3xl">
              Join live sessions and workshops for real-time learning, Q&A, and community connection.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Webinars Grid */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          {allWebinars.length === 0 ? (
            <div className="text-center py-20">
              <Sparkles size={64} className="mx-auto mb-4 text-[#6E4F7D]/40" />
              <h3 className="font-serif text-2xl text-[#1E3A32] mb-2">No Webinars Available Yet</h3>
              <p className="text-[#2B2725]/70 mb-6">Check back soon for upcoming live events.</p>
              <Link to={createPageUrl("Programs")}>
                <Button variant="outline" className="border-[#1E3A32] text-[#1E3A32]">
                  View All Programs
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {allWebinars.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="group"
                >
                  <Link to={item.type === 'product' ? createPageUrl(`ProductPage?slug=${item.slug}`) : createPageUrl(`WebinarPage?id=${item.id}`)}>
                    <div className="bg-white shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden h-full flex flex-col">
                      {item.thumbnail && (
                        <div className="h-48 overflow-hidden">
                          <img
                            src={item.thumbnail}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="font-serif text-xl text-[#1E3A32] mb-2 group-hover:text-[#6E4F7D] transition-colors">
                          {item.name}
                        </h3>
                        {item.tagline && (
                          <p className="text-sm text-[#6E4F7D] mb-3 font-medium">{item.tagline}</p>
                        )}
                        {item.event_date && (
                          <div className="flex items-center gap-2 text-sm text-[#D8B46B] mb-3">
                            <Calendar size={14} />
                            <span>{new Date(item.event_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                        )}
                        {item.description && (
                          <p className="text-sm text-[#2B2725]/70 mb-4 line-clamp-3 flex-1">
                            {item.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between pt-4 border-t border-[#E4D9C4] mt-auto">
                          <span className="text-2xl font-bold text-[#1E3A32]">
                            {formatPrice(item.price)}
                          </span>
                          <span className="text-[#6E4F7D] text-sm font-medium group-hover:translate-x-1 transition-transform">
                            Learn More →
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-[#6E4F7D] text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Users size={48} className="mx-auto mb-4" />
          <h2 className="font-serif text-3xl mb-4">Join Our Community</h2>
          <p className="text-white/90 mb-8 text-lg">
            Webinars are a great way to experience Mind Styling in a supportive group setting with live interaction.
          </p>
          <Link to={createPageUrl("Contact")}>
            <Button className="bg-[#D8B46B] text-[#1E3A32] hover:bg-[#C5A35B] px-8 py-6 text-lg">
              Get Notified of Upcoming Events
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}