import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FileText, Video, Headphones, FileSpreadsheet, Link as LinkIcon, Search, AlertCircle, Check } from "lucide-react";
import { toast } from "react-hot-toast";

const TYPE_ICONS = {
  pdf: FileText,
  video: Video,
  audio: Headphones,
  link: LinkIcon,
  worksheet: FileSpreadsheet,
  text: FileText,
  image: FileText,
};

/**
 * Panel for attaching/detaching existing Resource records to a product.
 * Uses the existing Resource.product_ids field (stores Stripe product IDs).
 * Renders inside the ManagerProducts edit dialog.
 */
export default function ProductResourcesPanel({ stripeProductId }) {
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(null); // resource id being saved
  const queryClient = useQueryClient();

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ["resources-for-product-panel"],
    queryFn: () => base44.entities.Resource.filter({ status: "published" }, "title"),
    staleTime: 30 * 1000,
  });

  // No stripe_product_id yet — show message
  if (!stripeProductId) {
    return (
      <div className="border border-[#E4D9C4] rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle size={18} className="text-[#D8B46B] mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-[#1E3A32] text-sm">Included Resources</p>
            <p className="text-xs text-[#2B2725]/60 mt-1">
              Save and sync this product to Stripe first, then you can attach resources. Resources can only be linked after the product has a Stripe ID.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isAttached = (resource) => {
    return (resource.product_ids || []).includes(stripeProductId);
  };

  const attachedResources = resources.filter(isAttached);
  const filteredResources = resources.filter((r) => {
    if (!search) return true;
    return r.title.toLowerCase().includes(search.toLowerCase()) ||
           r.category?.toLowerCase().includes(search.toLowerCase());
  });

  const handleToggle = async (resource) => {
    setSaving(resource.id);
    const currentIds = resource.product_ids || [];
    const attached = currentIds.includes(stripeProductId);

    let newProductIds;
    let newAccessLevel = resource.access_level;

    if (attached) {
      // Detach: remove this stripe product id
      newProductIds = currentIds.filter((id) => id !== stripeProductId);
      // If no more product_ids, don't change access_level — manager can decide
    } else {
      // Attach: add this stripe product id
      newProductIds = [...currentIds, stripeProductId];
      // Auto-set access_level to product_gated if it was public
      if (resource.access_level === "public") {
        newAccessLevel = "product_gated";
      }
    }

    try {
      await base44.entities.Resource.update(resource.id, {
        product_ids: newProductIds,
        access_level: newAccessLevel,
      });
      queryClient.invalidateQueries({ queryKey: ["resources-for-product-panel"] });
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      toast.success(attached ? `Removed "${resource.title}"` : `Attached "${resource.title}"`);
    } catch (err) {
      toast.error("Failed to update resource: " + err.message);
    } finally {
      setSaving(null);
    }
  };

  if (isLoading) {
    return (
      <div className="border border-[#E4D9C4] rounded-lg p-4">
        <p className="text-sm text-[#2B2725]/60">Loading resources...</p>
      </div>
    );
  }

  return (
    <div className="border border-[#E4D9C4] rounded-lg p-4 space-y-3">
      <div>
        <p className="font-medium text-[#1E3A32] text-sm">Included Resources</p>
        <p className="text-xs text-[#2B2725]/60 mt-0.5">
          Select resources that are included with this product. Clients who purchase or are granted this product will see these resources.
        </p>
      </div>

      {/* Attached count */}
      {attachedResources.length > 0 && (
        <div className="flex items-center gap-2">
          <Badge className="bg-[#A6B7A3]/20 text-[#1E3A32] text-xs">
            {attachedResources.length} attached
          </Badge>
        </div>
      )}

      {/* Search */}
      {resources.length > 5 && (
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#2B2725]/40" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search resources..."
            className="pl-8 text-sm h-8"
          />
        </div>
      )}

      {/* Resource list */}
      <div className="max-h-64 overflow-y-auto space-y-1 border border-[#E4D9C4] rounded-lg p-2">
        {resources.length === 0 ? (
          <p className="text-xs text-[#2B2725]/60 text-center py-4">
            No published resources yet. Create resources in the Resource Library first.
          </p>
        ) : filteredResources.length === 0 ? (
          <p className="text-xs text-[#2B2725]/60 text-center py-4">
            No resources match "{search}"
          </p>
        ) : (
          filteredResources.map((resource) => {
            const attached = isAttached(resource);
            const Icon = TYPE_ICONS[resource.resource_type] || FileText;
            const isSaving = saving === resource.id;

            return (
              <label
                key={resource.id}
                className={`flex items-center gap-2.5 p-2 rounded cursor-pointer transition-colors ${
                  attached ? "bg-[#A6B7A3]/10" : "hover:bg-[#F9F5EF]"
                } ${isSaving ? "opacity-60 pointer-events-none" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={attached}
                  onChange={() => handleToggle(resource)}
                  disabled={isSaving}
                  className="w-3.5 h-3.5 accent-[#1E3A32] flex-shrink-0"
                />
                <Icon size={14} className="text-[#D8B46B] flex-shrink-0" />
                <span className="text-sm text-[#1E3A32] flex-1 truncate">{resource.title}</span>
                {resource.category && (
                  <span className="text-[10px] text-[#2B2725]/50 flex-shrink-0">{resource.category}</span>
                )}
                {attached && <Check size={12} className="text-[#A6B7A3] flex-shrink-0" />}
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}