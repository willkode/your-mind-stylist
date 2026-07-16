import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { motion } from "framer-motion";
import { Trash2, ShoppingCart, ArrowRight, ArrowLeft, Loader2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SEO from "../components/SEO";
import { useCart } from "../components/shop/CartContext";
import { base44 } from "@/api/base44Client";
import { toast } from "react-hot-toast";
import { Truck } from "lucide-react";

export default function Cart() {
  const { items, removeItem, clearCart, total } = useCart();
  const [giftCode, setGiftCode] = useState("");
  const [validatingCode, setValidatingCode] = useState(false);
  const [appliedCode, setAppliedCode] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const formatPrice = (cents) => `$${(cents / 100).toFixed(2)}`;

  // Check if cart has physical items (books are physical)
  const hasPhysicalItems = items.some(item => 
    item.product_subtype === 'book' || 
    item.product_subtype === 'physical_product' ||
    item.isPhysical
  );

  const discount = appliedCode
    ? Math.round((total * appliedCode.discount_percentage) / 100)
    : 0;
  const finalTotal = total - discount;

  const handleApplyCode = async () => {
    if (!giftCode.trim()) return;
    setValidatingCode(true);
    try {
      const { data } = await base44.functions.invoke("validateGiftCode", {
        code: giftCode.trim().toUpperCase(),
        product_id: items[0]?.id,
      });
      if (data?.valid) {
        setAppliedCode(data);
        toast.success("Gift code applied!");
      } else {
        toast.error(data?.message || "Invalid or expired code");
      }
    } catch {
      toast.error("Could not validate code. Try again.");
    } finally {
      setValidatingCode(false);
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setCheckoutLoading(true);

    try {

      const affiliateCode = localStorage.getItem("affiliate_code");
      const timestamp = localStorage.getItem("affiliate_code_timestamp");
      const isValid = timestamp && Date.now() - parseInt(timestamp) < 30 * 24 * 60 * 60 * 1000;

      const payload = {
        product_ids: items.map(item => item.id),
      };
      if (isValid && affiliateCode) payload.affiliate_code = affiliateCode;
      if (appliedCode) payload.gift_code = giftCode.trim().toUpperCase();

      const { data } = await base44.functions.invoke("createProductCheckout", payload);
      if (data?.free && data?.url) {
        // 100% gift code — no Stripe needed, redirect directly to success
        clearCart();
        window.location.href = data.url;
      } else if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.error("Failed to create checkout");
        setCheckoutLoading(false);
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="bg-[#F9F5EF] min-h-screen pt-32 pb-24">
      <SEO title="Cart | Your Mind Stylist" description="Review your cart and checkout." />

      <div className="max-w-5xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="flex items-center gap-4 mb-10">
            <Link
              to={createPageUrl("Shop")}
              className="flex items-center gap-2 text-sm text-[#2B2725]/60 hover:text-[#1E3A32] transition-colors"
            >
              <ArrowLeft size={16} /> Back to Shop
            </Link>
          </div>

          <h1 className="font-serif text-4xl text-[#1E3A32] mb-10">Your Cart</h1>

          {items.length === 0 ? (
            <div className="text-center py-24">
              <ShoppingCart size={48} className="text-[#D8B46B] mx-auto mb-6 opacity-40" />
              <h2 className="font-serif text-2xl text-[#1E3A32] mb-4">Your cart is empty</h2>
              <p className="text-[#2B2725]/60 mb-8">Explore books, webinars, and programs from Roberta.</p>
              <Link
                to={createPageUrl("Shop")}
                className="inline-flex items-center gap-2 px-8 py-4 bg-[#1E3A32] text-[#F9F5EF] text-sm tracking-wide hover:bg-[#2B2725] transition-all"
              >
                Browse Products <ArrowRight size={15} />
              </Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-10">
              {/* Items */}
              <div className="lg:col-span-2 space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white border border-[#E4D9C4] p-5 flex gap-5 items-start"
                  >
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt={item.name}
                        className="w-20 h-20 object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-[#1E3A32]/5 flex-shrink-0 flex items-center justify-center text-3xl">
                        {item.product_subtype === "book" ? "📖" :
                         item.product_subtype === "webinar" ? "📹" :
                         item.product_subtype === "course" ? "🎓" : "✨"}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-serif text-lg text-[#1E3A32]">{item.name}</h3>
                      {item.tagline && (
                        <p className="text-[#D8B46B] text-sm mt-0.5">{item.tagline}</p>
                      )}
                      {item.short_description && (
                        <p className="text-[#2B2725]/60 text-sm mt-1 line-clamp-1">{item.short_description}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-3 flex-shrink-0">
                      <span className="font-serif text-xl text-[#1E3A32]">
                        {item.price ? `$${(item.price / 100).toFixed(2)}` : "Free"}
                      </span>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-[#2B2725]/30 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  onClick={clearCart}
                  className="text-xs text-[#2B2725]/40 hover:text-red-500 transition-colors mt-2"
                >
                  Clear cart
                </button>
              </div>

              {/* Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white border border-[#E4D9C4] p-6 sticky top-28">
                  <h2 className="font-serif text-xl text-[#1E3A32] mb-6">Order Summary</h2>

                  <div className="space-y-3 mb-6 text-sm">
                    <div className="flex justify-between text-[#2B2725]/70">
                      <span>Subtotal</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                    {appliedCode && (
                      <div className="flex justify-between text-green-600">
                        <span>Gift Code ({appliedCode.discount_percentage}% off)</span>
                        <span>−{formatPrice(discount)}</span>
                      </div>
                    )}
                    <div className="border-t border-[#E4D9C4] pt-3 flex justify-between font-semibold text-[#1E3A32]">
                      <span>Total</span>
                      <span className="font-serif text-xl">{formatPrice(finalTotal)}</span>
                    </div>
                  </div>

                  {/* Gift code */}
                  <div className="mb-6">
                    <p className="text-xs text-[#2B2725]/60 mb-2 flex items-center gap-1">
                      <Tag size={12} /> Have a gift code?
                    </p>
                    <div className="flex gap-2">
                      <Input
                        value={giftCode}
                        onChange={(e) => setGiftCode(e.target.value.toUpperCase())}
                        placeholder="ENTER CODE"
                        className="text-sm uppercase tracking-wider"
                        disabled={!!appliedCode}
                      />
                      {!appliedCode ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleApplyCode}
                          disabled={validatingCode || !giftCode.trim()}
                          className="flex-shrink-0"
                        >
                          {validatingCode ? <Loader2 size={14} className="animate-spin" /> : "Apply"}
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setAppliedCode(null); setGiftCode(""); }}
                          className="flex-shrink-0 text-red-500 border-red-200"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={handleCheckout}
                    disabled={checkoutLoading}
                    className="w-full bg-[#1E3A32] hover:bg-[#2B2725] text-[#F9F5EF] py-6 text-sm tracking-wide"
                  >
                    {checkoutLoading ? (
                      <><Loader2 size={16} className="animate-spin mr-2" /> Processing...</>
                    ) : (
                      <>Checkout → Pay Securely</>
                    )}
                  </Button>

                  {hasPhysicalItems && (
                    <div className="mt-4 p-3 bg-[#1E3A32]/5 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Truck size={16} className="text-[#1E3A32] mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-[#1E3A32]">Shipping address required</p>
                          <p className="text-[10px] text-[#2B2725]/60 mt-0.5">
                            You'll enter your full shipping address, country, postal code, and phone number at checkout. Free shipping on orders over $50.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <p className="text-[10px] text-[#2B2725]/40 text-center mt-3">
                    Secured by Stripe · SSL encrypted
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}