import React from "react";
import { ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { useCart } from "@/components/shop/CartContext";
import haptics from "@/components/utils/haptics";
import { toast } from "react-hot-toast";

export default function ProductCard({ product }) {
  const { addItem } = useCart();

  const formatPrice = (price, interval) => {
    if (!price) return null;
    const d = (price / 100).toFixed(2);
    if (interval === "monthly") return `$${d}/mo`;
    if (interval === "yearly") return `$${d}/yr`;
    return `$${d}`;
  };

  const handleAddToCart = () => {
    addItem(product);
    haptics.light();
    toast.success(`${product.name} added to cart!`);
  };

  return (
    <div className="bg-white border border-[#E4D9C4] flex flex-col overflow-hidden">
      {product.thumbnail && (
        <div className="w-full aspect-[3/4] bg-gray-100 overflow-hidden">
          <img src={product.thumbnail} alt={product.name} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-serif text-base text-[#1E3A32] mb-1">{product.name}</h3>
      {product.tagline && <p className="text-xs text-[#D8B46B] mb-2">{product.tagline}</p>}
      <p className="text-xs text-[#2B2725]/70 mb-3 flex-1 line-clamp-2">{product.short_description}</p>
        {product.type === 'consultation' || (!product.price && !product.stripe_price_id) ? (
          <p className="text-sm text-[#6E4F7D] mb-3 italic">Consultation-based pricing</p>
        ) : formatPrice(product.price, product.billing_interval) ? (
          <p className="text-lg font-bold text-[#1E3A32] mb-3">{formatPrice(product.price, product.billing_interval)}</p>
        ) : null}
        <Link
          to={createPageUrl(product.slug ? `ProductPage?slug=${product.slug}` : `Programs`)}
          className="block text-center text-xs py-2 bg-[#1E3A32] text-white hover:bg-[#2B2725] transition-colors"
        >
          Details
        </Link>
      </div>
    </div>
  );
}