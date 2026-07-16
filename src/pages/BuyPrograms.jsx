import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  ShoppingCart, ArrowRight, CheckCircle,
  Crown, Heart, Loader2
} from "lucide-react";

// Hypnosis Training = courses (practitioner training) and bundles
const isHypnosisTraining = (p) =>
  p.product_subtype === "course" || p.is_bundle || p.type === "bundle";

// Signature Services = everything else (consultations, webinars, personal programs)
const isSignatureService = (p) => !isHypnosisTraining(p);

function ProductCard({ product }) {
  const priceDisplay = product.price_display || "show_price";
  const price = priceDisplay === "contact_for_pricing" 
    ? "Contact for Pricing" 
    : priceDisplay === "hidden" 
      ? null 
      : product.price 
        ? `$${(product.price / 100).toFixed(0)}` 
        : "Contact";
  const interval = priceDisplay === "show_price" && product.billing_interval === "monthly" ? "/mo" : priceDisplay === "show_price" && product.billing_interval === "yearly" ? "/yr" : "";

  return (
    <div className="bg-white p-8 border border-[#E4D9C4] hover:border-[#D8B46B] transition-all rounded-lg flex flex-col">
      <h3 className="font-serif text-xl text-[#1E3A32] mb-3">{product.name}</h3>
      {product.tagline && <p className="text-[#D8B46B] text-xs tracking-widest uppercase mb-2">{product.tagline}</p>}
      {product.short_description && (
        <p className="text-[#2B2725]/70 text-sm mb-4 flex-1">{product.short_description}</p>
      )}
      {product.features?.length > 0 && (
        <ul className="space-y-1 mb-4">
          {product.features.slice(0, 3).map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-[#2B2725]/70">
              <CheckCircle size={13} className="text-[#A6B7A3] flex-shrink-0 mt-0.5" />
              {f}
            </li>
          ))}
        </ul>
      )}
      {price && (
        <p className="text-2xl font-bold text-[#1E3A32] mb-6">
          {price}{interval}
          {priceDisplay === "show_price" && product.payment_plan_options?.length > 0 && (
            <span className="text-sm font-normal text-[#2B2725]/60 ml-2">or payment plan</span>
          )}
        </p>
      )}
      <Link to={createPageUrl(`ProductPage?slug=${product.slug || product.key}`)}>
        <Button className="w-full bg-[#1E3A32] hover:bg-[#2B2725]">
          Learn More <ArrowRight size={16} className="ml-2" />
        </Button>
      </Link>
    </div>
  );
}

function BundleCard({ bundle }) {
  return (
    <div className="bg-[#1E3A32] text-white p-8 rounded-lg flex flex-col hover:bg-[#2B2725] transition-all">
      {bundle.tagline && <p className="text-[#D8B46B] text-xs tracking-widest uppercase mb-3">{bundle.tagline}</p>}
      <h3 className="font-serif text-2xl mb-3">{bundle.name}</h3>
      {bundle.short_description && (
        <p className="text-white/70 text-sm mb-4 flex-1">{bundle.short_description}</p>
      )}
      {bundle.features?.length > 0 && (
        <ul className="space-y-2 mb-4">
          {bundle.features.slice(0, 4).map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-white/80">
              <CheckCircle size={14} className="text-[#D8B46B] flex-shrink-0 mt-0.5" />
              {f}
            </li>
          ))}
        </ul>
      )}
      <p className="text-3xl font-bold text-[#D8B46B] mb-6">
        ${((bundle.price || 0) / 100).toFixed(0)}
        {bundle.payment_plan_options?.length > 0 && (
          <span className="text-sm font-normal text-white/60 ml-2">or payment plan</span>
        )}
      </p>
      <Link to={createPageUrl(`ProductPage?slug=${bundle.slug || bundle.key}`)}>
        <Button className="w-full bg-[#D8B46B] text-[#1E3A32] hover:bg-[#C5A35B] font-semibold">
          View Bundle <ArrowRight size={16} className="ml-2" />
        </Button>
      </Link>
    </div>
  );
}

export default function BuyPrograms() {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["buy-programs-products"],
    queryFn: () => base44.entities.Product.list("-display_order", 200),
  });

  const published = products.filter(p => p.status === "published" && p.ui_group !== "hidden");
  const sorted = [...published].sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999));

  const hypnosisItems = sorted.filter(isHypnosisTraining);
  const signatureItems = sorted.filter(isSignatureService);

  return (
    <div className="bg-[#F9F5EF] min-h-screen pt-32 pb-12">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <ShoppingCart size={48} className="text-[#D8B46B] mx-auto mb-6" />
          <h1 className="font-serif text-4xl md:text-5xl text-[#1E3A32] leading-tight mb-4">
            Upgrade Your Journey
          </h1>
          <p className="text-[#2B2725]/80 text-xl leading-relaxed max-w-3xl mx-auto">
            Choose your next step in transformation. Every program is designed to help you understand yourself better and build lasting emotional resilience.
          </p>
        </motion.div>

        {isLoading && (
          <div className="flex justify-center py-20">
            <Loader2 size={40} className="animate-spin text-[#D8B46B]" />
          </div>
        )}

        {/* Signature Services */}
        {signatureItems.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-4">
              <Heart size={28} className="text-[#6E4F7D]" />
              <h2 className="font-serif text-2xl md:text-3xl text-[#1E3A32]">Signature Services</h2>
            </div>
            <p className="text-[#2B2725]/70 mb-8">One-on-one hypnosis, coaching & personal programs with Roberta</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {signatureItems.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}

        {/* Hypnosis Training */}
        {hypnosisItems.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-4">
              <Crown size={28} className="text-[#D8B46B]" />
              <h2 className="font-serif text-2xl md:text-3xl text-[#1E3A32]">Hypnosis Training</h2>
            </div>
            <p className="text-[#2B2725]/70 mb-8">Professional hypnosis courses and complete training bundles</p>
            <div className="grid md:grid-cols-2 gap-6">
              {hypnosisItems.map(p =>
                p.is_bundle || p.type === "bundle"
                  ? <BundleCard key={p.id} bundle={p} />
                  : <ProductCard key={p.id} product={p} />
              )}
            </div>
          </div>
        )}

        {/* How to Choose */}
        {!isLoading && (
          <div className="bg-white p-8 rounded-lg mb-16">
            <Heart size={40} className="text-[#D8B46B] mx-auto mb-6" />
            <h2 className="font-serif text-3xl text-[#1E3A32] text-center mb-8">How to Choose What's Right</h2>
            <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              <div className="bg-[#F9F5EF] p-6 border-l-4 border-[#D8B46B] rounded">
                <p className="text-[#2B2725]/80 mb-2 text-sm">New to this world?</p>
                <p className="font-serif text-lg text-[#1E3A32]">Pocket Mindset™ is the perfect gentle entry.</p>
              </div>
              <div className="bg-[#F9F5EF] p-6 border-l-4 border-[#6E4F7D] rounded">
                <p className="text-[#2B2725]/80 mb-2 text-sm">Want structured learning?</p>
                <p className="font-serif text-lg text-[#1E3A32]">LENS™ Toolkit Series is your foundation.</p>
              </div>
              <div className="bg-[#F9F5EF] p-6 border-l-4 border-[#A6B7A3] rounded">
                <p className="text-[#2B2725]/80 mb-2 text-sm">Want community + live support?</p>
                <p className="font-serif text-lg text-[#1E3A32]">Salon Group Coaching delivers that.</p>
              </div>
              <div className="bg-[#F9F5EF] p-6 border-l-4 border-[#1E3A32] rounded">
                <p className="text-[#2B2725]/80 mb-2 text-sm">Want the deepest transformation?</p>
                <p className="font-serif text-lg text-[#1E3A32]">Private one-to-one work is for you.</p>
              </div>
            </div>
          </div>
        )}

        {/* Questions CTA */}
        <div className="text-center">
          <p className="text-[#2B2725]/70 mb-4 text-lg">Still have questions?</p>
          <Link to={createPageUrl("Contact")}>
            <Button variant="outline" className="border-[#D8B46B] text-[#D8B46B] hover:bg-[#D8B46B] hover:text-[#1E3A32]">
              Contact Us <ArrowRight size={18} className="ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}