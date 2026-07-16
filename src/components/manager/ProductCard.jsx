import React from "react";
import { Edit, ExternalLink, Trash2, DollarSign, Eye, EyeOff, Package } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProductCard({ product, onEdit, onToggleStatus, onDelete }) {
  return (
    <div className="bg-white p-5 border border-[#E4D9C4] hover:border-[#D8B46B] transition-colors relative rounded-sm">
      {/* Status indicator */}
      <div className="absolute top-4 right-4">
        {product.status === "published" ? (
          <Eye size={15} className="text-[#A6B7A3]" />
        ) : (
          <EyeOff size={15} className="text-[#2B2725]/30" />
        )}
      </div>

      <h3 className="font-serif text-lg text-[#1E3A32] mb-1 pr-6 leading-snug">{product.name}</h3>
      {product.tagline && (
        <p className="text-xs text-[#2B2725]/60 mb-3">{product.tagline}</p>
      )}

      {/* Price */}
      <div className="flex items-center gap-1 mb-3">
        <DollarSign size={14} className="text-[#D8B46B]" />
        <span className="font-medium text-[#1E3A32]">
          {product.price ? `$${(product.price / 100).toFixed(2)}` : "Free"}
        </span>
        {product.billing_interval && product.billing_interval !== "one_time" && (
          <span className="text-xs text-[#2B2725]/50">/ {product.billing_interval}</span>
        )}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        <span className="text-xs px-2 py-0.5 bg-[#F9F5EF] text-[#2B2725]/60 rounded">
          {product.type}
        </span>
        {(product.is_bundle || product.type === "bundle") && (
          <span className="text-xs px-2 py-0.5 bg-[#6E4F7D]/10 text-[#6E4F7D] rounded flex items-center gap-1">
            <Package size={11} /> Bundle
          </span>
        )}
        {product.stripe_product_id && (
          <span className="text-xs px-2 py-0.5 bg-[#A6B7A3]/20 text-[#2B2725]/60 rounded">
            Synced
          </span>
        )}
        {product.status === "draft" && (
          <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 rounded">
            Draft
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1.5">
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => onEdit(product)} className="flex-1 h-8">
            <Edit size={13} className="mr-1" /> Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (product.slug) window.open(`/ProductPage?slug=${product.slug}&preview=true`, "_blank");
              else alert("Add a slug to preview this product");
            }}
            className="flex-1 h-8"
          >
            <ExternalLink size={13} className="mr-1" /> Preview
          </Button>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => onToggleStatus(product)} className="flex-1 h-8 text-xs">
            {product.status === "published" ? "Unpublish" : "Publish"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => onDelete(product)} className="text-red-500 h-8 px-3">
            <Trash2 size={13} />
          </Button>
        </div>
      </div>
    </div>
  );
}