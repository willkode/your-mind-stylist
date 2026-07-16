import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import SEO from "../components/SEO";
import { ArrowLeft, BookOpen, Clock, CheckCircle, ShoppingCart, Loader2, Package, ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

export default function ProgramsCourses() {
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

  // Products with product_subtype = "course" (Hypnosis Training) from Product Manager
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["course-products"],
    queryFn: async () => {
      const all = await base44.entities.Product.filter({ 
        status: "published",
        product_subtype: "course"
      });
      return all.sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999));
    },
  });

  const { data: allBundles = [] } = useQuery({
    queryKey: ["course-page-bundles"],
    queryFn: () => base44.entities.Product.filter({ status: "published", is_bundle: true }),
  });

  const bundles = allBundles.filter(b => (b.show_on_pages || []).includes("courses"));

  const formatPrice = (price, billing_interval) => {
    if (!price || price === 0) return "Contact for Pricing";
    const dollars = (price / 100).toFixed(2);
    if (billing_interval === "monthly") return `$${dollars}/mo`;
    if (billing_interval === "yearly") return `$${dollars}/yr`;
    return `$${dollars}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6E4F7D] mx-auto mb-4"></div>
          <p className="text-[#2B2725]/70">Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F5EF]">
      <SEO
        title="Courses & Training | Your Mind Stylist"
        description="Comprehensive learning programs to master Mind Styling techniques"
      />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-[#6E4F7D] to-[#8B659B] text-white">
        <div className="max-w-6xl mx-auto px-6">
          <Link to={createPageUrl("Programs")} className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors">
            <ArrowLeft size={18} />
            <span className="text-sm">Back to All Programs</span>
          </Link>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <BookOpen size={40} />
              <h1 className="font-serif text-4xl md:text-5xl">Courses & Training</h1>
            </div>
            <p className="text-xl text-white/90 max-w-3xl">
              Comprehensive learning programs designed to help you master Mind Styling techniques and transform your inner world.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Bundles Section */}
      {bundles.length > 0 && (
        <section className="py-12 px-6 bg-[#1E3A32]">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-2 justify-center">
              <Package size={28} className="text-[#D8B46B]" />
              <h2 className="font-serif text-2xl md:text-3xl text-white">Bundles & Packages</h2>
            </div>
            <p className="text-white/60 text-center mb-8 text-sm">Get more for less — curated combinations</p>
            <div className="grid md:grid-cols-2 gap-6">
              {bundles.map(bundle => (
                <div key={bundle.id} className="bg-white/10 border border-[#D8B46B]/30 rounded-lg p-6 hover:border-[#D8B46B] transition-all">
                  {bundle.tagline && <p className="text-[#D8B46B] text-xs tracking-widest uppercase mb-2">{bundle.tagline}</p>}
                  <h3 className="font-serif text-xl text-white mb-2">{bundle.name}</h3>
                  {bundle.short_description && <p className="text-white/70 text-sm mb-4">{bundle.short_description}</p>}
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-[#D8B46B]">${((bundle.price || 0) / 100).toFixed(0)}</span>
                    <Link to={createPageUrl(`ProductPage?key=${bundle.key}`)}>
                      <Button className="bg-[#D8B46B] text-[#1E3A32] hover:bg-[#C5A35B] font-semibold">
                        View Bundle <ArrowRight size={16} className="ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Courses Grid */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          {products.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen size={64} className="mx-auto mb-4 text-[#6E4F7D]/40" />
              <h3 className="font-serif text-2xl text-[#1E3A32] mb-2">No Courses Available Yet</h3>
              <p className="text-[#2B2725]/70 mb-6">Check back soon for new learning programs.</p>
              <Link to={createPageUrl("Programs")}>
                <Button variant="outline" className="border-[#6E4F7D] text-[#6E4F7D]">
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
                        <p className="text-sm text-[#6E4F7D] mb-3 font-medium">{product.tagline}</p>
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
                              <CheckCircle size={14} className="text-[#6E4F7D] mt-0.5 flex-shrink-0" />
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
                              className="flex-1 text-center text-sm py-2.5 border border-[#6E4F7D] text-[#6E4F7D] hover:bg-[#6E4F7D] hover:text-white transition-colors"
                            >
                              Details
                            </Link>
                          )}
                          <button
                            onClick={() => handlePurchase(product.id)}
                            disabled={checkoutLoading === product.id}
                            className="flex-1 flex items-center justify-center gap-2 text-sm py-2.5 bg-[#6E4F7D] text-white hover:bg-[#5D4169] transition-colors disabled:opacity-50"
                          >
                            {checkoutLoading === product.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <><ShoppingCart size={14} /> Enroll Now</>
                            )}
                          </button>
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
          <h2 className="font-serif text-3xl mb-4">Not Sure Which Course is Right?</h2>
          <p className="text-white/80 mb-8 text-lg">
            Schedule a complimentary consultation to discuss your goals and find the perfect fit.
          </p>
          <Link to={createPageUrl("Bookings")}>
            <Button className="bg-[#D8B46B] text-[#1E3A32] hover:bg-[#C5A35B] px-8 py-6 text-lg">
              Book Free Consultation
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}