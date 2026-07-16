import React, { useState, useEffect } from "react";
import SEO from "../components/SEO";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layers, Sparkles, Play, User, Check, ArrowRight, ShoppingCart, ExternalLink, Loader2, Package, BookOpen, Users, Crown } from "lucide-react";
import { toast } from "react-hot-toast";
import RecommendedProducts from "../components/purchase/RecommendedProducts";

export default function PurchaseCenter() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [purchasingProductId, setPurchasingProductId] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        // Track purchase center view
        await base44.functions.invoke('trackPurchaseEvent', {
          event_type: 'purchase_center.viewed'
        });
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  // Set auth layout
  if (typeof window !== 'undefined') {
    window.__USE_AUTH_LAYOUT = true;
  }

  // Fetch all published products
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["published-products"],
    queryFn: async () => {
      const all = await base44.entities.Product.filter({ status: "published" }, "display_order");
      return all;
    },
  });

  // Group products by category
  const productsByCategory = {
    foundation: products.filter(p => p.category === "foundation"),
    mid_level: products.filter(p => p.category === "mid_level"),
    high_touch: products.filter(p => p.category === "high_touch"),
    advanced: products.filter(p => p.category === "advanced"),
  };

  const formatPrice = (price, billing_interval) => {
    if (!price) return "Free";
    const dollars = (price / 100).toFixed(2);
    if (billing_interval === "monthly") return `$${dollars}/mo`;
    if (billing_interval === "yearly") return `$${dollars}/yr`;
    return `$${dollars}`;
  };

  const handlePurchase = async (productId, priceId = null) => {
    setPurchasingProductId(productId);
    setCheckoutLoading(true);
    
    // Track checkout started event
    try {
      await base44.functions.invoke('trackPurchaseEvent', {
        event_type: 'product.checkout_started',
        product_id: productId
      });
    } catch (e) {
      // Non-critical, continue with checkout
    }
    
    try {
      const response = await base44.functions.invoke('createProductCheckout', {
        product_id: productId,
        price_id: priceId,
      });

      if (response.data.url) {
        window.location.href = response.data.url;
      } else {
        toast.error('Failed to create checkout session');
        setCheckoutLoading(false);
        setPurchasingProductId(null);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Something went wrong. Please try again.');
      setCheckoutLoading(false);
      setPurchasingProductId(null);
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "foundation": return Sparkles;
      case "mid_level": return BookOpen;
      case "high_touch": return Users;
      case "advanced": return Crown;
      default: return Package;
    }
  };

  const getCategoryLabel = (category) => {
    switch (category) {
      case "foundation": return "Foundation & Everyday Support";
      case "mid_level": return "Mid-Level Learning";
      case "high_touch": return "High-Touch Coaching";
      case "advanced": return "Advanced Opportunities";
      default: return category;
    }
  };

  if (loading || productsLoading) {
    return (
      <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#D8B46B]" size={32} />
      </div>
    );
  }

  return (
    <div className="bg-[#F9F5EF] min-h-screen pt-32 pb-24">
      <SEO
        title="Purchase Center | Your Mind Stylist"
        description="Explore and purchase programs, subscriptions, and services."
        canonical="/purchase-center"
      />
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="mb-12">
            <span className="text-[#D8B46B] text-xs tracking-[0.3em] uppercase mb-4 block">
              Purchase Center
            </span>
            <h1 className="font-serif text-3xl md:text-4xl text-[#1E3A32] mb-4">
              Your Programs & Subscriptions
            </h1>
            <p className="text-[#2B2725]/70 text-lg">
              Explore and purchase all Mind Stylist offerings.
            </p>
          </div>

          {/* Recommended Products */}
          <RecommendedProducts />

          {/* Products by Category */}
          {Object.entries(productsByCategory).map(([category, categoryProducts]) => {
            if (categoryProducts.length === 0) return null;

            const CategoryIcon = getCategoryIcon(category);

            return (
              <div key={category} className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <CategoryIcon size={24} className="text-[#D8B46B]" />
                  <h2 className="font-serif text-2xl text-[#1E3A32]">
                    {getCategoryLabel(category)}
                  </h2>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  {categoryProducts.map((product) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      className={`bg-white p-8 md:p-10 relative overflow-hidden ${
                        product.ui_group === "hero" || product.ui_group === "featured"
                          ? "border-2 border-[#D8B46B]"
                          : "border border-[#E4D9C4]"
                      }`}
                    >
                      {/* Badge */}
                      {product.ui_group === "hero" && (
                        <div className="absolute top-4 right-4 px-3 py-1 bg-[#D8B46B] text-[#1E3A32] text-xs uppercase tracking-wide">
                          Popular
                        </div>
                      )}
                      {product.ui_group === "featured" && (
                        <div className="absolute top-4 right-4 px-3 py-1 bg-[#A6B7A3] text-white text-xs uppercase tracking-wide">
                          Best Value
                        </div>
                      )}

                      {/* Content */}
                      <h3 className="font-serif text-2xl md:text-3xl text-[#1E3A32] mb-2">
                        {product.name}
                      </h3>
                      {product.tagline && (
                        <p className="text-[#2B2725]/60 text-sm uppercase tracking-wide mb-4">
                          {product.tagline}
                        </p>
                      )}
                      <p className="text-[#2B2725]/80 mb-6">
                        {product.short_description}
                      </p>

                      {/* Features */}
                      {product.features && product.features.length > 0 && (
                        <div className="mb-6 space-y-2">
                          {product.features.map((feature, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <Check size={16} className="text-[#A6B7A3] mt-1 flex-shrink-0" />
                              <span className="text-sm text-[#2B2725]/80">{feature}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Pricing */}
                      <div className="mb-6 pb-6 border-t border-[#E4D9C4] pt-6">
                        <div className="font-serif text-4xl text-[#1E3A32] mb-2">
                          {formatPrice(product.price, product.billing_interval)}
                        </div>
                        {product.type === "subscription" && (
                          <p className="text-[#D8B46B] text-sm">Cancel anytime</p>
                        )}
                      </div>

                      {/* CTA */}
                      <Button
                        onClick={() => handlePurchase(product.id)}
                        disabled={checkoutLoading && purchasingProductId === product.id}
                        className={`w-full py-6 text-lg ${
                          product.ui_group === "hero" || product.ui_group === "featured"
                            ? "bg-[#D8B46B] hover:bg-[#C9A55A] text-[#1E3A32]"
                            : "bg-[#1E3A32] hover:bg-[#2B2725] text-[#F9F5EF]"
                        }`}
                      >
                        {checkoutLoading && purchasingProductId === product.id ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <ShoppingCart size={20} className="mr-2" />
                            Purchase Now
                          </>
                        )}
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Help Section */}
          <div className="mt-16 bg-white p-8 text-center">
            <h3 className="font-serif text-2xl text-[#1E3A32] mb-4">
              Need Help Choosing?
            </h3>
            <p className="text-[#2B2725]/70 mb-6">
              Not sure which path is right for you? Schedule a complimentary consultation.
            </p>
            <Link
              to={createPageUrl("Contact")}
              className="inline-flex items-center gap-2 px-8 py-4 border border-[#D8B46B] text-[#1E3A32] text-sm tracking-wide hover:bg-[#D8B46B]/10 transition-all duration-300"
            >
              Schedule Consultation
              <ArrowRight size={16} />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}