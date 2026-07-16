import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { Sparkles, BookOpen, Headphones, Video, ShoppingBag, ChevronDown, ChevronUp } from "lucide-react";
import ProductIncludedResources from "./ProductIncludedResources";

function getProductPresentation(product) {
  const isConsultation = product.type === "consultation" || product.category === "high_touch";
  const hasCourse = !!product.related_course_id;
  const hasWebinar = !!product.related_webinar_id;
  const isAudiobook = product.product_subtype === "book" || product.product_subtype === "audiobook";

  if (isConsultation) {
    return {
      badge: "Your Program",
      badgeClass: "bg-[#A6B7A3]/20 text-[#1E3A32]",
      icon: Sparkles,
      iconColor: "text-[#6E4F7D]",
      ctaLabel: "Contact Roberta to Schedule",
      ctaUrl: createPageUrl("Contact"),
      note: "This is a personalized service. Roberta will coordinate scheduling with you directly.",
    };
  }
  if (hasCourse) {
    return {
      badge: "Enrolled",
      badgeClass: "bg-[#1E3A32]/10 text-[#1E3A32]",
      icon: BookOpen,
      iconColor: "text-[#1E3A32]",
      ctaLabel: "Continue Learning",
      ctaUrl: product.slug ? createPageUrl(`ProductPage?slug=${product.slug}`) : null,
      note: null,
    };
  }
  if (isAudiobook) {
    return {
      badge: "Available",
      badgeClass: "bg-[#D8B46B]/15 text-[#D8B46B]",
      icon: Headphones,
      iconColor: "text-[#D8B46B]",
      ctaLabel: "Listen Now",
      ctaUrl: product.slug ? createPageUrl(`ProductPage?slug=${product.slug}`) : null,
      note: null,
    };
  }
  if (hasWebinar) {
    return {
      badge: "Available",
      badgeClass: "bg-[#6E4F7D]/10 text-[#6E4F7D]",
      icon: Video,
      iconColor: "text-[#6E4F7D]",
      ctaLabel: "Watch Now",
      ctaUrl: product.slug ? createPageUrl(`ProductPage?slug=${product.slug}`) : null,
      note: null,
    };
  }
  return {
    badge: "Included",
    badgeClass: "bg-[#A6B7A3]/20 text-[#1E3A32]",
    icon: ShoppingBag,
    iconColor: "text-[#D8B46B]",
    ctaLabel: "View Details",
    ctaUrl: product.slug ? createPageUrl(`ProductPage?slug=${product.slug}`) : null,
    note: null,
  };
}

export default function PurchasedProductsSection({ products, resources = [], expanded, onToggle }) {
  if (!products || products.length === 0) return null;

  return (
    <div className="mb-8">
      <button onClick={onToggle} className="w-full flex items-center justify-between mb-4 group">
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-[#D8B46B]" />
          <h2 className="font-serif text-xl text-[#1E3A32]">Your Programs</h2>
          <Badge className="bg-[#D8B46B]/10 text-[#D8B46B] text-[10px]">{products.length}</Badge>
        </div>
        {expanded ? <ChevronUp className="text-[#D8B46B]" /> : <ChevronDown className="text-[#D8B46B]" />}
      </button>
      {expanded && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => {
            const pres = getProductPresentation(product);
            const Icon = pres.icon;
            return (
              <Card key={product.id} className="p-5 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <Icon size={28} className={pres.iconColor} />
                  <Badge className={pres.badgeClass}>
                    {pres.badge}
                  </Badge>
                </div>
                {product.thumbnail && (
                  <img src={product.thumbnail} alt={product.name} className="w-full h-32 object-cover rounded mb-3" />
                )}
                <h3 className="font-serif text-lg text-[#1E3A32] mb-1">{product.name}</h3>
                {product.tagline && (
                  <p className="text-xs text-[#6E4F7D] italic mb-2">{product.tagline}</p>
                )}
                <p className="text-xs text-[#2B2725]/60 mb-3 line-clamp-2">{product.short_description}</p>
                {pres.note && (
                  <p className="text-xs text-[#2B2725]/50 italic mb-3">{pres.note}</p>
                )}
                {pres.ctaUrl && (
                  <Link to={pres.ctaUrl}>
                    <Button variant="outline" className="w-full text-sm border-[#D8B46B] text-[#1E3A32]">
                      {pres.ctaLabel}
                    </Button>
                  </Link>
                )}
                <ProductIncludedResources
                  resources={resources.filter(r =>
                    (r.product_ids || []).includes(product.stripe_product_id)
                  )}
                />
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}