import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, Check, Package } from "lucide-react";
import SEO from "../components/SEO";
import { useCart } from "../components/shop/CartContext";
import { toast } from "react-hot-toast";
import CmsText from "../components/cms/CmsText";

const SUBTYPE_LABELS = {
  webinar: { label: "Webinar", icon: "📹", color: "bg-blue-50 text-blue-700 border-blue-200" },
  book: { label: "Book", icon: "📖", color: "bg-amber-50 text-amber-700 border-amber-200" },
  course: { label: "Course", icon: "🎓", color: "bg-purple-50 text-purple-700 border-purple-200" },
  digital_service: { label: "Digital", icon: "💻", color: "bg-green-50 text-green-700 border-green-200" },
  physical_product: { label: "Physical", icon: "📦", color: "bg-orange-50 text-orange-700 border-orange-200" },
  other: { label: "Other", icon: "✨", color: "bg-gray-50 text-gray-700 border-gray-200" },
  bundle: { label: "Bundle", icon: "🎁", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
};

const SECTIONS = [
  { key: "signature", label: "Signature Products", icon: "✨", match: (p) => p.is_bundle || p.type === "bundle" || (!p.product_subtype && p.type !== "bundle") || p.ui_group === "hero" || p.ui_group === "featured" },
  { key: "webinar", label: "Webinars", icon: "📹", match: (p) => p.product_subtype === "webinar" },
  { key: "book", label: "Books", icon: "📖", match: (p) => p.product_subtype === "book" },
  { key: "course", label: "Hypnotist's Training", icon: "🎓", match: (p) => p.product_subtype === "course" },
  { key: "other", label: "Other", icon: "✨", match: (p) => ["digital_service", "physical_product", "other"].includes(p.product_subtype) },
];

export default function Shop() {
  const { addItem, items } = useCart();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["shop-products"],
    queryFn: async () => {
      const all = await base44.entities.Product.filter({ status: "published", active: true }, "display_order");
      return all.filter(p => p.ui_group !== "hidden");
    },
  });



  const formatPrice = (price, interval) => {
    if (!price) return "Free";
    const d = (price / 100).toFixed(2);
    if (interval === "monthly") return `$${d}/mo`;
    if (interval === "yearly") return `$${d}/yr`;
    return `$${d}`;
  };

  const isInCart = (id) => items.some((i) => i.id === id);

  const handleAdd = (product) => {
    addItem(product);
    toast.success(`${product.name} added to cart!`, {
      icon: "🛒",
      style: { background: "#1E3A32", color: "#F9F5EF" },
    });
  };

  return (
    <div className="bg-[#F9F5EF] min-h-screen">
      <SEO
        title="Products & Shop | Your Mind Stylist"
        description="Books, webinars, hypnosis courses, and digital tools from Roberta Fernandez — Your Mind Stylist."
        canonical="/shop"
      />

      {/* Hero */}
      <section className="pt-32 pb-16">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="text-[#D8B46B] text-xs tracking-[0.3em] uppercase mb-4 block">
              Products & Shop
            </span>
            <h1 className="font-serif text-4xl md:text-5xl text-[#1E3A32] mb-4">
              <CmsText
                contentKey="shop.hero.title"
                page="Shop"
                blockTitle="Shop Hero Title"
                fallback="Everything You Need to Style Your Mind"
                contentType="short_text"
                as="span"
              />
            </h1>
            <p className="text-[#2B2725]/70 text-lg max-w-2xl mx-auto">
              <CmsText
                contentKey="shop.hero.subtitle"
                page="Shop"
                blockTitle="Shop Hero Subtitle"
                fallback="Books, live webinars, hypnosis programs, and digital tools — all crafted by Roberta to support your transformation."
                contentType="short_text"
                as="span"
              />
            </p>
          </motion.div>
        </div>
      </section>

      {/* Sectioned Products */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-6 space-y-16">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-lg h-64 animate-pulse border border-[#E4D9C4]" />
              ))}
            </div>
          ) : (
            SECTIONS.map((section) => {
              const sectionProducts = products.filter(section.match);
              if (sectionProducts.length === 0) return null;
              return (
                <div key={section.key}>
                  <div className="mb-6 pb-3 border-b border-[#E4D9C4]">
                    <h2 className="font-serif text-2xl text-[#1E3A32]">
                      {section.icon} {section.label}
                    </h2>
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sectionProducts.map((product, i) => {
                      const subtype = SUBTYPE_LABELS[product.product_subtype] || null;
                      const inCart = isInCart(product.id);
                      return (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className={`bg-white border hover:shadow-md transition-all flex flex-col group ${
                                    product.ui_group === "hero" ? "border-[#D8B46B]" : "border-[#E4D9C4] hover:border-[#D8B46B]"
                                  }`}
                              >
                                {product.thumbnail && (
                                  <div className="relative h-48 overflow-hidden">
                                    <img
                                      src={product.thumbnail}
                                      alt={product.name}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    {subtype && (
                                      <span className={`absolute top-3 left-3 text-xs px-2 py-1 rounded border font-medium ${subtype.color}`}>
                                        {subtype.icon} {subtype.label}
                                      </span>
                                    )}
                                    {product.ui_group === "hero" && (
                                      <span className="absolute top-3 right-3 text-xs px-2 py-1 bg-[#D8B46B] text-[#1E3A32] font-semibold rounded">
                                        Popular
                                      </span>
                                    )}
                                  </div>
                                )}
                                <div className="p-6 flex flex-col flex-1">
                                  {!product.thumbnail && (
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center gap-2">
                                        {subtype && (
                                          <span className={`text-xs px-2 py-1 rounded border font-medium ${subtype.color}`}>
                                            {subtype.icon} {subtype.label}
                                          </span>
                                        )}
                                      </div>
                                      {product.ui_group === "hero" && (
                                        <span className="text-xs px-2 py-1 bg-[#D8B46B] text-[#1E3A32] font-semibold rounded">
                                          Popular
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  <h3 className="font-serif text-xl text-[#1E3A32] mb-2 leading-snug">{product.name}</h3>
                                  {product.tagline && <p className="text-[#2B2725]/60 text-sm mb-2">{product.tagline}</p>}
                                  <p className="text-[#2B2725]/60 text-sm mb-4 flex-1">{product.short_description}</p>
                                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#E4D9C4]">
                                    <span className="font-serif text-2xl text-[#1E3A32]">
                                      {formatPrice(product.price, product.billing_interval)}
                                    </span>
                                    <div className="flex gap-2">
                                      {product.slug && (
                                        <Link
                                          to={createPageUrl(`ProductPage?slug=${product.slug}`)}
                                          className="px-3 py-2 border border-[#E4D9C4] text-[#2B2725]/70 text-xs hover:border-[#D8B46B] transition-colors"
                                        >
                                          Details
                                        </Link>
                                      )}
                                      <button
                                        onClick={() => inCart ? null : handleAdd(product)}
                                        className={`flex items-center gap-1.5 px-4 py-2 text-sm transition-all ${
                                          inCart ? "bg-green-600 text-white cursor-default" : "bg-[#1E3A32] text-[#F9F5EF] hover:bg-[#2B2725]"
                                        }`}
                                      >
                                        {inCart ? <><Check size={14} /> Added</> : <><ShoppingCart size={14} /> Buy Now</>}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-[#1E3A32] text-[#F9F5EF] text-center">
        <div className="max-w-xl mx-auto px-6">
          <h2 className="font-serif text-3xl mb-4">Not sure where to start?</h2>
          <p className="text-[#F9F5EF]/70 mb-8">Book a free consultation with Roberta and she'll guide you to the right program.</p>
          <Link
            to={createPageUrl("Bookings")}
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#D8B46B] text-[#1E3A32] text-sm font-semibold tracking-wide hover:bg-[#C5A35B] transition-all"
          >
            Book a Free Consultation
          </Link>
        </div>
      </section>
    </div>
  );
}