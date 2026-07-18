import React, { useState, useEffect } from "react";
import SEO from "../components/SEO";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, ArrowRight, ShoppingCart, Loader2, Star, Plus } from "lucide-react";
import { toast } from "react-hot-toast";
import ProductOwnershipCheck from "../components/purchase/ProductOwnershipCheck";
import GiftCodeInput from "../components/purchase/GiftCodeInput";
import { useCart } from "../components/shop/CartContext";
import FreeProductCTA from "../components/purchase/FreeProductCTA";
import LeadMagnetCTA from "../components/leadmagnet/LeadMagnetCTA";
import { useBookingUrl } from "../components/cms/useBookingUrl";

export default function ProductPage() {
  const [isPreview, setIsPreview] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [selectedPriceId, setSelectedPriceId] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState("full");
  const [appliedGiftCode, setAppliedGiftCode] = useState(null);
  const { addItem } = useCart();
  const bookingUrl = useBookingUrl();

  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get("slug") || "";
  const key = urlParams.get("key") || "";
  
  useEffect(() => {
    setIsPreview(new URLSearchParams(window.location.search).get("preview") === "true");
  }, []);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["product", slug, key],
    queryFn: () => {
      const filter = key ? { key } : { slug };
      if (isPreview) {
        return base44.entities.Product.filter(filter);
      }
      return base44.entities.Product.filter({ ...filter, status: "published" });
    },
    enabled: !!(slug || key),
  });

  useEffect(() => {
    const product = products[0];
    if (product && !isPreview) {
      base44.functions.invoke('trackPurchaseEvent', {
        event_type: 'product.detail_viewed',
        product_id: product.id,
        product_key: product.key
      }).catch(() => {});
    }
  }, [products, isPreview]);

  const product = products[0];

  const isFreeProduct = product && product.price === 0 && product.type !== 'consultation';
  const isContactOnly = product && !isFreeProduct && (product.type === 'consultation' || !product.stripe_price_id || product.price_display === 'contact_for_pricing');

  const handlePurchase = async () => {
    // Consultation or products without Stripe price → redirect to booking
    if (isContactOnly) {
      window.open(bookingUrl, '_blank');
      return;
    }

    setCheckoutLoading(true);
    
    // Fire-and-forget tracking — never block checkout
    base44.functions.invoke('trackPurchaseEvent', {
      event_type: 'product.checkout_started',
      product_id: product.id,
      product_key: product.key
    }).catch(() => {});
    
    try {
      const response = await base44.functions.invoke('createProductCheckout', {
        product_id: product.id,
        selected_price_id: selectedPriceId,
        gift_code: appliedGiftCode,
      });

      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        const errMsg = response.data?.error || 'Failed to create checkout session';
        toast.error(errMsg);
        setCheckoutLoading(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not start checkout. Please try again.');
      setCheckoutLoading(false);
    }
  };

  const formatPrice = (price, billing_interval) => {
    if (!price) return null;
    const dollars = (price / 100).toFixed(2);
    if (billing_interval === "monthly") return `$${dollars}/mo`;
    if (billing_interval === "yearly") return `$${dollars}/yr`;
    return `$${dollars}`;
  };

  const getSelectedPrice = () => {
    if (selectedPlan === "full") {
      return product.price;
    }
    const plan = product.payment_plan_options?.find(p => p.name === selectedPlan);
    return plan ? plan.monthly_price : product.price;
  };

  const getSelectedPlanDetails = () => {
    if (selectedPlan === "full") {
      return { price: product.price, label: formatPrice(product.price, product.billing_interval) };
    }
    const plan = product.payment_plan_options?.find(p => p.name === selectedPlan);
    if (plan) {
      return { 
        price: plan.monthly_price, 
        label: `${formatPrice(plan.monthly_price, "monthly")} × ${plan.months} months`,
        total: plan.monthly_price * plan.months
      };
    }
    return { price: product.price, label: formatPrice(product.price, product.billing_interval) };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#D8B46B]" size={32} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-serif text-3xl text-[#1E3A32] mb-4">Product Not Found</h1>
          <Link to={createPageUrl("Programs")} className="text-[#D8B46B] hover:underline">
            View All Programs
          </Link>
        </div>
      </div>
    );
  }

  // Render different templates
  if (product.template_choice === "minimal") {
    return (
      <ProductOwnershipCheck productKey={product.key}>
        <div className="bg-[#F9F5EF] min-h-screen pt-32 pb-24">
        <SEO
          title={`${product.name} | Your Mind Stylist`}
          description={product.short_description}
          canonical={`/product?slug=${product.slug}`}
        />
        {isPreview && (
          <div className="fixed top-0 left-0 right-0 bg-[#D8B46B] text-[#1E3A32] text-center py-3 z-50 font-medium">
            Preview Mode - This page is not yet published
          </div>
        )}
        <div className="max-w-4xl mx-auto px-6">
          {product.thumbnail && product.product_subtype === "book" && (
            <div className="flex justify-center mb-8">
              <img src={product.thumbnail} alt={product.name} className="w-48 h-auto rounded-lg shadow-md" />
            </div>
          )}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="font-serif text-4xl md:text-5xl text-[#1E3A32] mb-4">
              {product.name}
            </h1>
            {product.tagline && (
              <p className="text-[#D8B46B] text-lg mb-6">{product.tagline}</p>
            )}
            <p className="text-[#2B2725]/80 text-lg mb-8 max-w-2xl mx-auto">
              {product.short_description}
            </p>

            {isFreeProduct ? (
              <div className="inline-block bg-white p-8 mb-8">
                <FreeProductCTA product={product} />
              </div>
            ) : isContactOnly ? (
              <div className="inline-block bg-white p-8 mb-8">
                <p className="text-[#2B2725]/70 text-lg mb-4">Pricing discussed during consultation</p>
                <a href={bookingUrl} target="_blank" rel="noopener noreferrer">
                  <Button className="bg-[#1E3A32] hover:bg-[#2B2725] text-[#F9F5EF] px-12 py-6 text-lg">
                    Book a Consultation
                    <ArrowRight size={20} className="ml-2" />
                  </Button>
                </a>
              </div>
            ) : (
              <>
            <div className="inline-block bg-white p-8 mb-8">
              {product.payment_plan_options && product.payment_plan_options.length > 0 && (
                <div className="mb-6 space-y-3">
                  <button
                    onClick={() => {
                      setSelectedPlan("full");
                      setSelectedPriceId(null);
                    }}
                    className={`w-full p-4 border-2 rounded-lg transition-all ${
                      selectedPlan === "full" 
                        ? "border-[#D8B46B] bg-[#D8B46B]/5" 
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="font-medium text-[#1E3A32]">Pay in Full</div>
                    <div className="text-2xl font-serif text-[#1E3A32] mt-1">
                      {formatPrice(product.price, product.billing_interval)}
                    </div>
                  </button>
                  {product.payment_plan_options.map((plan, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedPlan(plan.name);
                        setSelectedPriceId(product.stripe_price_ids?.[idx + 1] || null);
                      }}
                      className={`w-full p-4 border-2 rounded-lg transition-all ${
                        selectedPlan === plan.name 
                          ? "border-[#D8B46B] bg-[#D8B46B]/5" 
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="font-medium text-[#1E3A32]">{plan.name}</div>
                      <div className="text-2xl font-serif text-[#1E3A32] mt-1">
                        {formatPrice(plan.monthly_price, "monthly")} × {plan.months}
                      </div>
                      <div className="text-sm text-[#2B2725]/60 mt-1">
                        Total: {formatPrice(plan.monthly_price * plan.months, "one_time")}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {(!product.payment_plan_options || product.payment_plan_options.length === 0) && (
                <>
                  <div className="font-serif text-5xl text-[#1E3A32] mb-2">
                    {formatPrice(product.price, product.billing_interval)}
                  </div>
                  {product.type === "subscription" && (
                    <p className="text-[#D8B46B] text-sm">Cancel anytime</p>
                  )}
                </>
              )}
            </div>

            <div className="mb-6">
              <GiftCodeInput productId={product.id} onCodeApplied={setAppliedGiftCode} />
            </div>

            <Button
              onClick={handlePurchase}
              disabled={checkoutLoading}
              className="bg-[#1E3A32] hover:bg-[#2B2725] text-[#F9F5EF] px-12 py-6 text-lg"
            >
              {checkoutLoading ? (
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
              </>
            )}

            {product.features && product.features.length > 0 && (
              <div className="mt-16 text-left">
                <h2 className="font-serif text-2xl text-[#1E3A32] mb-6 text-center">
                  What's Included
                </h2>
                <div className="space-y-3 max-w-xl mx-auto">
                  {product.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <Check size={20} className="text-[#A6B7A3] mt-1 flex-shrink-0" />
                      <span className="text-[#2B2725]/80">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
          <LeadMagnetCTA placement="products" inline productContext={{ id: product.id, name: product.name }} />
        </div>
        </div>
      </ProductOwnershipCheck>
    );
  }

  if (product.template_choice === "immersive") {
    return (
      <ProductOwnershipCheck productKey={product.key}>
        <div className="bg-[#1E3A32] min-h-screen">
        <SEO
          title={`${product.name} | Your Mind Stylist`}
          description={product.short_description}
          canonical={`/product?slug=${product.slug}`}
        />
        {isPreview && (
          <div className="fixed top-0 left-0 right-0 bg-[#D8B46B] text-[#1E3A32] text-center py-3 z-50 font-medium">
            Preview Mode - This page is not yet published
          </div>
        )}
        {/* Hero */}
        <section className="pt-32 pb-20 px-6">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-[#D8B46B]/20">
                <Star size={16} className="text-[#D8B46B]" />
                <span className="text-[#D8B46B] text-sm tracking-wider uppercase">
                  {product.tagline || "Premium Program"}
                </span>
              </div>
              <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl text-[#F9F5EF] leading-tight mb-8">
                {product.name}
              </h1>
              <p className="text-[#F9F5EF]/80 text-xl mb-12 max-w-3xl mx-auto">
                {product.short_description}
              </p>

              <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-12">
                {isFreeProduct ? (
                  <FreeProductCTA product={product} variant="dark" />
                ) : isContactOnly ? (
                  <>
                    <p className="text-[#F9F5EF]/70 text-lg">Pricing discussed during consultation</p>
                    <a href={bookingUrl} target="_blank" rel="noopener noreferrer">
                      <Button className="bg-[#D8B46B] hover:bg-[#C9A55A] text-[#1E3A32] px-10 py-6 text-lg">
                        Book a Consultation
                        <ArrowRight size={20} className="ml-2" />
                      </Button>
                    </a>
                  </>
                ) : (
                  <>
                <div className="bg-[#D8B46B] px-8 py-4 text-[#1E3A32]">
                  <div className="font-serif text-4xl mb-1">
                    {formatPrice(product.price, product.billing_interval)}
                  </div>
                  {product.type === "subscription" && (
                    <div className="text-sm">Cancel anytime</div>
                  )}
                </div>
                <div className="mb-6 max-w-xs mx-auto">
                  <GiftCodeInput productId={product.id} onCodeApplied={setAppliedGiftCode} />
                </div>

                <Button
                  onClick={handlePurchase}
                  disabled={checkoutLoading}
                  className="bg-[#F9F5EF] hover:bg-white text-[#1E3A32] px-10 py-6 text-lg"
                >
                  {checkoutLoading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <>
                      Begin Your Journey
                      <ArrowRight size={20} className="ml-2" />
                    </>
                  )}
                </Button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Description */}
        {product.long_description && (
          <section className="py-20 bg-[#F9F5EF]">
            <div className="max-w-4xl mx-auto px-6">
              <div
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: product.long_description }}
              />
            </div>
          </section>
        )}

        {/* Features */}
        {product.features && product.features.length > 0 && (
          <section className="py-20 bg-white">
            <div className="max-w-5xl mx-auto px-6">
              <h2 className="font-serif text-4xl text-[#1E3A32] mb-12 text-center">
                Everything You'll Receive
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                {product.features.map((feature, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#D8B46B]/20 flex items-center justify-center flex-shrink-0">
                      <Check size={16} className="text-[#D8B46B]" />
                    </div>
                    <span className="text-[#2B2725]/80 text-lg">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Lead Magnet CTA */}
        <LeadMagnetCTA placement="products" inline productContext={{ id: product.id, name: product.name }} />

        {/* CTA */}
        <section className="py-20 bg-[#1E3A32] text-center">
        <div className="max-w-4xl mx-auto px-6">
         <h2 className="font-serif text-4xl text-[#F9F5EF] mb-8">
           Ready to Begin?
         </h2>
         <div className="mb-8 max-w-xs mx-auto">
           <GiftCodeInput productId={product.id} onCodeApplied={setAppliedGiftCode} />
         </div>
         <Button
           onClick={handlePurchase}
           disabled={checkoutLoading}
           className="bg-[#D8B46B] hover:bg-[#C9A55A] text-[#1E3A32] px-12 py-6 text-lg"
         >
           {checkoutLoading ? (
             <>
               <Loader2 className="mr-2 h-5 w-5 animate-spin" />
               Processing...
             </>
           ) : (
             <>
               Purchase {product.name}
               <ArrowRight size={20} className="ml-2" />
             </>
           )}
         </Button>
        </div>
        </section>
        </div>
      </ProductOwnershipCheck>
    );
  }

  // Default: Detailed Template
  return (
    <ProductOwnershipCheck productKey={product.key}>
      <div className="bg-[#F9F5EF] min-h-screen pt-32 pb-24">
      <SEO
        title={`${product.name} | Your Mind Stylist`}
        description={product.short_description}
        canonical={`/product?slug=${product.slug}`}
      />
      {isPreview && (
        <div className="fixed top-0 left-0 right-0 bg-[#D8B46B] text-[#1E3A32] text-center py-3 z-50 font-medium">
          Preview Mode - This page is not yet published
        </div>
      )}
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          {/* Left: Image (for books) */}
          {product.thumbnail && product.product_subtype === "book" && (
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center justify-center"
            >
              <img src={product.thumbnail} alt={product.name} className="w-full max-w-sm shadow-lg rounded-lg" />
            </motion.div>
          )}

          {/* Left: Details (or full width if no image) */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-[#D8B46B] text-xs tracking-[0.3em] uppercase mb-4 block">
              {product.category === "foundation" && "Tier 1: Foundation"}
              {product.category === "mid_level" && "Tier 2: Mid-Level"}
              {product.category === "high_touch" && "Tier 3: High-Touch"}
              {product.category === "advanced" && "Advanced"}
            </span>
            <h1 className="font-serif text-4xl md:text-5xl text-[#1E3A32] mb-4">
              {product.name}
            </h1>
            {product.tagline && (
              <p className="text-[#D8B46B] text-xl mb-6">{product.tagline}</p>
            )}
            <p className="text-[#2B2725]/80 text-lg mb-8">
              {product.short_description}
            </p>

            {product.long_description && (
              <div
                className="prose prose-lg mb-8"
                dangerouslySetInnerHTML={{ __html: product.long_description }}
              />
            )}

            {product.features && product.features.length > 0 && (
              <div className="mb-8">
                <h2 className="font-serif text-2xl text-[#1E3A32] mb-4">
                  What's Included
                </h2>
                <div className="space-y-3">
                  {product.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <Check size={20} className="text-[#A6B7A3] mt-1 flex-shrink-0" />
                      <span className="text-[#2B2725]/80">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Right: Purchase Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-white p-8 sticky top-32">
              <div className="text-center mb-8">
                {isFreeProduct ? (
                  <FreeProductCTA product={product} />
                ) : isContactOnly ? (
                  <>
                    <p className="text-[#2B2725]/70 text-lg mb-6">Pricing discussed during consultation</p>
                    <a href={bookingUrl} target="_blank" rel="noopener noreferrer">
                      <Button className="w-full bg-[#1E3A32] hover:bg-[#2B2725] text-[#F9F5EF] py-6 text-lg mb-3">
                        Book a Consultation
                        <ArrowRight size={20} className="ml-2" />
                      </Button>
                    </a>
                    <Link to={createPageUrl("Contact")} className="text-[#D8B46B] text-sm hover:underline">
                      Have questions? Contact us
                    </Link>
                  </>
                ) : (
                  <>
                    {product.payment_plan_options && product.payment_plan_options.length > 0 ? (
                      <div className="space-y-3 mb-6">
                        <button
                          onClick={() => {
                            setSelectedPlan("full");
                            setSelectedPriceId(null);
                          }}
                          className={`w-full p-4 border-2 rounded-lg transition-all text-left ${
                            selectedPlan === "full" 
                              ? "border-[#D8B46B] bg-[#D8B46B]/5" 
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="font-medium text-[#1E3A32]">Pay in Full</div>
                          <div className="text-2xl font-serif text-[#1E3A32] mt-1">
                            {formatPrice(product.price, product.billing_interval)}
                          </div>
                        </button>
                        {product.payment_plan_options.map((plan, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setSelectedPlan(plan.name);
                              setSelectedPriceId(product.stripe_price_ids?.[idx + 1] || null);
                            }}
                            className={`w-full p-4 border-2 rounded-lg transition-all text-left ${
                              selectedPlan === plan.name 
                                ? "border-[#D8B46B] bg-[#D8B46B]/5" 
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <div className="font-medium text-[#1E3A32]">{plan.name}</div>
                            <div className="text-2xl font-serif text-[#1E3A32] mt-1">
                              {formatPrice(plan.monthly_price, "monthly")} × {plan.months}
                            </div>
                            <div className="text-sm text-[#2B2725]/60 mt-1">
                              Total: {formatPrice(plan.monthly_price * plan.months, "one_time")}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <>
                        <div className="font-serif text-5xl text-[#1E3A32] mb-2">
                          {formatPrice(product.price, product.billing_interval)}
                        </div>
                        {product.type === "subscription" && (
                          <p className="text-[#D8B46B] text-sm">Cancel anytime</p>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>

              {!isContactOnly && !isFreeProduct && (
                <>
                  <div className="mb-4">
                    <GiftCodeInput productId={product.id} onCodeApplied={setAppliedGiftCode} />
                  </div>

                  <Button
                    onClick={handlePurchase}
                    disabled={checkoutLoading}
                    className="w-full bg-[#1E3A32] hover:bg-[#2B2725] text-[#F9F5EF] py-6 text-lg mb-3"
                  >
                    {checkoutLoading ? (
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

                  <Button
                    onClick={() => { addItem(product); toast.success(`${product.name} added to cart!`); }}
                    variant="outline"
                    className="w-full border-[#1E3A32] text-[#1E3A32] hover:bg-[#1E3A32]/5 py-5 text-base mb-4"
                  >
                    <Plus size={16} className="mr-2" />
                    Add to Cart
                  </Button>

                  <p className="text-center text-[#2B2725]/60 text-sm mb-6">
                    Secure checkout powered by Stripe
                  </p>
                </>
              )}

              <div className="border-t border-[#E4D9C4] pt-6">
                <h3 className="font-medium text-[#1E3A32] mb-3">
                  Quick Facts
                </h3>
                <div className="space-y-2 text-sm text-[#2B2725]/70">
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className="font-medium text-[#1E3A32]">
                      {product.type === "one_time" && "One-Time Purchase"}
                      {product.type === "subscription" && "Subscription"}
                      {product.type === "payment_plan" && "Payment Plan"}
                      {product.type === "bundle" && "Bundle"}
                    </span>
                  </div>
                  {product.billing_interval !== "one_time" && (
                    <div className="flex justify-between">
                      <span>Billing:</span>
                      <span className="font-medium text-[#1E3A32] capitalize">
                        {product.billing_interval}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 text-center">
                <Link
                  to={createPageUrl("Contact")}
                  className="text-[#D8B46B] text-sm hover:underline"
                >
                  Have questions? Contact us
                </Link>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Lead Magnet CTA */}
        <LeadMagnetCTA placement="products" inline productContext={{ id: product.id, name: product.name }} />
      </div>
      </div>
    </ProductOwnershipCheck>
  );
}