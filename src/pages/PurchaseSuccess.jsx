import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { CheckCircle, ArrowRight, Sparkles, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEO from "../components/SEO";
import { useCart } from "../components/shop/CartContext";

export default function PurchaseSuccess() {
  const [purchaseType, setPurchaseType] = useState("");
  const [paymentType, setPaymentType] = useState("");
  const [audiobookSlug, setAudiobookSlug] = useState(null);
  const { clearCart } = useCart();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setPurchaseType(params.get("type") || "");
    setPaymentType(params.get("payment_type") || "");
    clearCart();

    // Verify the Stripe session is legitimate
    const session_id = params.get("session_id");
    if (session_id) {
      base44.functions.invoke('verifyStripeSession', { session_id })
        .then(async (res) => {
          if (!res.data?.valid) {
            window.location.href = createPageUrl('Programs');
            return;
          }
          // Check if purchase includes an audiobook
          const productIds = res.data?.product_ids;
          if (productIds) {
            try {
              const ids = productIds.split(',').map(id => id.trim()).filter(Boolean);
              const audiobooks = await base44.entities.Audiobook.filter({ status: "published" });
              
              // Direct match: audiobook.product_id matches a purchased product ID
              for (const ab of audiobooks) {
                if (ab.product_id && ids.includes(ab.product_id)) {
                  setAudiobookSlug(ab.slug);
                  return;
                }
              }
              
              // Indirect match: a purchased product has a purchase_option with audiobook_id
              const products = await base44.entities.Product.filter({});
              const purchasedProducts = products.filter(p => ids.includes(p.id));
              for (const product of purchasedProducts) {
                if (product.purchase_options?.length > 0) {
                  for (const opt of product.purchase_options) {
                    if (opt.type === 'audiobook' && opt.audiobook_id) {
                      const matchedAb = audiobooks.find(ab => ab.id === opt.audiobook_id);
                      if (matchedAb) {
                        setAudiobookSlug(matchedAb.slug);
                        return;
                      }
                    }
                  }
                }
                // Also check bundled products
                if (product.is_bundle && product.bundled_product_ids?.length > 0) {
                  const bundledProducts = products.filter(p => product.bundled_product_ids.includes(p.id));
                  for (const bp of bundledProducts) {
                    if (bp.purchase_options?.length > 0) {
                      for (const opt of bp.purchase_options) {
                        if (opt.type === 'audiobook' && opt.audiobook_id) {
                          const matchedAb = audiobooks.find(ab => ab.id === opt.audiobook_id);
                          if (matchedAb) {
                            setAudiobookSlug(matchedAb.slug);
                            return;
                          }
                        }
                      }
                    }
                  }
                }
              }
            } catch {}
          }
        })
        .catch(() => {});
    }
  }, []);

  const getTitle = () => {
    if (purchaseType === "certification") {
      return "Welcome to Your Mind Styling Certification!";
    }
    return "Purchase Successful!";
  };

  const getDescription = () => {
    if (purchaseType === "certification") {
      if (paymentType.includes("payment_plan")) {
        return "Your payment plan is set up. Access your program now and start your transformation.";
      }
      return "Your full payment is confirmed. Access your program now and start your transformation.";
    }
    return "Thank you for your purchase. You now have access to your content.";
  };

  return (
    <div className="min-h-screen bg-[#F9F5EF] pt-32 pb-24">
      <SEO
        title="Purchase Successful | Your Mind Stylist"
        description="Your purchase was successful"
        canonical="/app/purchase/success"
      />
      <div className="max-w-3xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* Success Icon */}
          <div className="w-24 h-24 bg-[#A6B7A3] rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle size={48} className="text-white" />
          </div>

          {/* Title */}
          <h1 className="font-serif text-3xl md:text-4xl text-[#1E3A32] mb-4">
            {getTitle()}
          </h1>
          
          {/* Description */}
          <p className="text-lg text-[#2B2725]/80 mb-12 max-w-xl mx-auto">
            {getDescription()}
          </p>

          {/* What's Next */}
          <div className="bg-white p-8 mb-8 text-left">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="text-[#D8B46B]" size={24} />
              <h2 className="font-serif text-2xl text-[#1E3A32]">What's Next?</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#1E3A32] text-[#F9F5EF] flex items-center justify-center flex-shrink-0 font-medium">
                  1
                </div>
                <div>
                  <h3 className="font-medium text-[#1E3A32] mb-1">Check Your Email</h3>
                  <p className="text-[#2B2725]/70 text-sm">
                    You'll receive a confirmation email with your purchase details and access instructions.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#1E3A32] text-[#F9F5EF] flex items-center justify-center flex-shrink-0 font-medium">
                  2
                </div>
                <div>
                  <h3 className="font-medium text-[#1E3A32] mb-1">Access Your Content</h3>
                  <p className="text-[#2B2725]/70 text-sm">
                    Head to your Client Portal to start exploring your new program. If your purchase includes an audiobook, you can listen directly on the site or download it for offline listening.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#1E3A32] text-[#F9F5EF] flex items-center justify-center flex-shrink-0 font-medium">
                  3
                </div>
                <div>
                  <h3 className="font-medium text-[#1E3A32] mb-1">Begin Your Journey</h3>
                  <p className="text-[#2B2725]/70 text-sm">
                    Start with the first module and move at your own pace.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Audiobook CTA — shown when purchase includes an audiobook */}
          {audiobookSlug && (
            <div className="bg-white p-8 mb-8 text-center border border-[#6E4F7D]/20">
              <div className="w-14 h-14 bg-[#6E4F7D]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Headphones size={28} className="text-[#6E4F7D]" />
              </div>
              <h2 className="font-serif text-2xl text-[#1E3A32] mb-2">Your audiobook is ready</h2>
              <p className="text-[#2B2725]/70 mb-6">
                You can listen directly on the site or download the audio file to listen on your preferred device.
              </p>
              <Link to={`/audiobook/${audiobookSlug}`}>
                <Button className="px-8 py-6 text-lg gap-2" style={{ backgroundColor: "#6E4F7D" }}>
                  <Headphones size={20} />
                  Listen Now
                </Button>
              </Link>
            </div>
          )}

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={createPageUrl("ClientPortal")}>
              <Button className={`${audiobookSlug ? 'bg-transparent border border-[#1E3A32] text-[#1E3A32] hover:bg-[#1E3A32]/5' : 'bg-[#1E3A32] hover:bg-[#2B2725] text-[#F9F5EF]'} px-8 py-6 text-lg`}>
                Go to Client Portal
                <ArrowRight size={20} className="ml-2" />
              </Button>
            </Link>
            <Link to={createPageUrl("Dashboard")}>
              <Button variant="outline" className="border-[#1E3A32] text-[#1E3A32] px-8 py-6 text-lg">
                View Dashboard
              </Button>
            </Link>
          </div>

          {/* Support */}
          <div className="mt-12 pt-8 border-t border-[#E4D9C4]">
            <p className="text-sm text-[#2B2725]/60">
              Have questions? <Link to={createPageUrl("Contact")} className="text-[#D8B46B] hover:underline">Contact us</Link> for support.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}