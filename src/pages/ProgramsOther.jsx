import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import SEO from "../components/SEO";
import CmsText from "../components/cms/CmsText";
import { ArrowLeft, Sparkles, ShoppingCart, Loader2, CheckCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

export default function ProgramsOther() {
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

  // Products with product_subtype = "other" from Product Manager
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["other-products"],
    queryFn: async () => {
      const all = await base44.entities.Product.list();
      return all.filter(p => p.product_subtype === "other" && p.status === "published");
    },
  });

  const formatPrice = (price, billing_interval) => {
    if (!price || price === 0) return "Free";
    const dollars = (price / 100).toFixed(2);
    if (billing_interval === "monthly") return `$${dollars}/mo`;
    if (billing_interval === "yearly") return `$${dollars}/yr`;
    return `$${dollars}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2B2725] mx-auto mb-4"></div>
          <p className="text-[#2B2725]/70">Loading programs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F5EF]">
      <SEO
        title="Other Programs & Tools | Your Mind Stylist"
        description="Additional resources, tools, and offerings to support your transformation journey"
      />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-[#2B2725] text-white">
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
              <CmsText
                contentKey="programs-other-hero-title"
                fallback="Other Programs & Tools"
                as="h1"
                className="font-serif text-4xl md:text-5xl"
                page="ProgramsOther"
                blockTitle="Hero Title"
                contentType="short_text"
              />
            </div>
            <CmsText
              contentKey="programs-other-hero-subtitle"
              fallback="Additional resources, tools, and offerings to support your journey — curated by Your Mind Stylist."
              as="p"
              className="text-xl text-white/90 max-w-3xl"
              page="ProgramsOther"
              blockTitle="Hero Subtitle"
              contentType="short_text"
            />
          </motion.div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          {products.length === 0 ? (
            <div className="text-center py-20">
              <Sparkles size={64} className="mx-auto mb-4 text-[#2B2725]/20" />
              <h3 className="font-serif text-2xl text-[#1E3A32] mb-2">More Coming Soon</h3>
              <p className="text-[#2B2725]/70 mb-6">Check back soon for additional tools and resources.</p>
              <Link to={createPageUrl("Programs")}>
                <Button variant="outline" className="border-[#1E3A32] text-[#1E3A32]">
                  View All Programs
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="group"
                >
                  <div className="bg-white shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden h-full flex flex-col">
                    {product.thumbnail && (
                      <div className="h-48 overflow-hidden">
                        <img
                          src={product.thumbnail}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-6 flex-1 flex flex-col">
                      <h3 className="font-serif text-xl text-[#1E3A32] mb-2">
                        {product.name}
                      </h3>
                      {product.tagline && (
                        <p className="text-sm text-[#2B2725]/60 mb-3 font-medium italic">{product.tagline}</p>
                      )}
                      {product.short_description && (
                        <p className="text-sm text-[#2B2725]/70 mb-4 line-clamp-3 flex-1">
                          {product.short_description}
                        </p>
                      )}

                      {product.features && product.features.length > 0 && (
                        <div className="mb-4 space-y-1">
                          {product.features.slice(0, 3).map((feature, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <CheckCircle size={14} className="text-[#D8B46B] mt-0.5 flex-shrink-0" />
                              <span className="text-xs text-[#2B2725]/70">{feature}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="pt-4 border-t border-[#E4D9C4] mt-auto">
                        <div className="text-2xl font-bold text-[#1E3A32] mb-3">
                          {formatPrice(product.price, product.billing_interval)}
                        </div>
                        <div className="flex gap-2">
                          {product.slug && (
                            <Link
                              to={createPageUrl(`ProductPage?slug=${product.slug}`)}
                              className="flex-1 text-center text-sm py-2.5 border border-[#2B2725] text-[#2B2725] hover:bg-[#2B2725] hover:text-white transition-colors"
                            >
                              Details
                            </Link>
                          )}
                          {product.price === 0 ? (
                            <Link
                              to={createPageUrl(`ProductPage?slug=${product.slug}`)}
                              className="flex-1 flex items-center justify-center gap-2 text-sm py-2.5 bg-[#1E3A32] text-white hover:bg-[#2B2725] transition-colors"
                            >
                              Access Free
                            </Link>
                          ) : (
                            <button
                              onClick={() => handlePurchase(product.id)}
                              disabled={checkoutLoading === product.id}
                              className="flex-1 flex items-center justify-center gap-2 text-sm py-2.5 bg-[#1E3A32] text-white hover:bg-[#2B2725] transition-colors disabled:opacity-50"
                            >
                              {checkoutLoading === product.id ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <><ShoppingCart size={14} /> Get It</>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-[#1E3A32] text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <CmsText
            contentKey="programs-other-cta-title"
            fallback="Not Sure What You Need?"
            as="h2"
            className="font-serif text-3xl mb-4"
            page="ProgramsOther"
            blockTitle="CTA Title"
            contentType="short_text"
          />
          <CmsText
            contentKey="programs-other-cta-subtitle"
            fallback="Let's have a conversation about where you are and where you want to go."
            as="p"
            className="text-white/80 mb-8 text-lg"
            page="ProgramsOther"
            blockTitle="CTA Subtitle"
            contentType="short_text"
          />
          <Link to={createPageUrl("Bookings")}>
            <Button className="bg-[#D8B46B] text-[#1E3A32] hover:bg-[#C5A35B] px-8 py-6 text-lg">
              <CmsText
                contentKey="programs-other-cta-button"
                fallback="Book a Consultation"
                as="span"
                page="ProgramsOther"
                blockTitle="CTA Button Text"
                contentType="short_text"
              />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}