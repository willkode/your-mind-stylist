import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Video, Headphones, FileSpreadsheet, Link as LinkIcon, Download, ChevronDown, ChevronUp } from "lucide-react";

const TYPE_ICONS = {
  pdf: FileText,
  video: Video,
  audio: Headphones,
  link: LinkIcon,
  worksheet: FileSpreadsheet,
  text: FileText,
  image: FileText,
};

const TYPE_LABELS = {
  pdf: "PDF",
  video: "Video",
  audio: "Audio",
  link: "Link",
  worksheet: "Worksheet",
  text: "Text",
  image: "Image",
};

/**
 * Shows resources attached to a product via Resource.product_ids.
 * Only renders for products the user owns (caller is responsible for ownership check).
 * Uses getResourceAccess for server-side verified download.
 */
export default function ProductIncludedResources({ resources }) {
  const [expanded, setExpanded] = useState(false);

  if (!resources || resources.length === 0) return null;

  const handleDownload = async (resource) => {
    try {
      const response = await base44.functions.invoke("getResourceAccess", {
        resource_id: resource.id,
      });
      if (response.data?.hasAccess && response.data?.file_url) {
        window.open(response.data.file_url, "_blank");
        // Track download count (non-blocking)
        base44.entities.Resource.update(resource.id, {
          download_count: (resource.download_count || 0) + 1,
        }).catch(() => {});
      }
    } catch {
      // Silently fail — resource access denied
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-[#E4D9C4]">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 w-full text-left"
      >
        <Download size={13} className="text-[#D8B46B]" />
        <span className="text-xs font-medium text-[#1E3A32]">
          Included Resources
        </span>
        <Badge className="bg-[#D8B46B]/10 text-[#D8B46B] text-[9px] ml-1">
          {resources.length}
        </Badge>
        <span className="ml-auto">
          {expanded ? (
            <ChevronUp size={12} className="text-[#2B2725]/40" />
          ) : (
            <ChevronDown size={12} className="text-[#2B2725]/40" />
          )}
        </span>
      </button>

      {expanded && (
        <div className="mt-2 space-y-1.5">
          {resources.map((resource) => {
            const Icon = TYPE_ICONS[resource.resource_type] || FileText;
            return (
              <button
                key={resource.id}
                onClick={() => handleDownload(resource)}
                className="flex items-center gap-2 w-full p-2 rounded hover:bg-[#F9F5EF] transition-colors text-left group"
              >
                <div className="p-1 bg-[#D8B46B]/10 rounded flex-shrink-0">
                  <Icon size={12} className="text-[#D8B46B]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#1E3A32] truncate">{resource.title}</p>
                  <p className="text-[10px] text-[#2B2725]/50">
                    {TYPE_LABELS[resource.resource_type] || resource.resource_type}
                    {resource.category ? ` · ${resource.category}` : ""}
                  </p>
                </div>
                <Download
                  size={12}
                  className="text-[#D8B46B] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}