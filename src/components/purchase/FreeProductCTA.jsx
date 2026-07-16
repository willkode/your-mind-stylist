import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowRight, Download, PlayCircle } from "lucide-react";

/**
 * FreeProductCTA — renders an appropriate CTA for free ($0) products.
 *
 * Priority:
 * 1. If product has a related_course_id → link to course/webinar page
 * 2. If product has a related_webinar_id → link to webinar page
 * 3. If a published Resource with matching product_id exists → direct download
 * 4. Fallback: "Learn More" → Contact page
 */
export default function FreeProductCTA({ product, variant = "default" }) {
  // Fetch linked resources for this product
  const { data: linkedResources = [] } = useQuery({
    queryKey: ["free-product-resources", product.id],
    queryFn: () => base44.entities.Resource.filter({ 
      status: "published",
      access_level: "public"
    }),
    select: (resources) => resources.filter(r => 
      r.product_ids?.includes(product.id) && r.file_url
    ),
  });

  // Fetch linked course if exists
  const { data: linkedCourse } = useQuery({
    queryKey: ["free-product-course", product.related_course_id],
    queryFn: () => base44.entities.Course.filter({ id: product.related_course_id }),
    enabled: !!product.related_course_id,
    select: (courses) => courses[0] || null,
  });

  // Determine CTA type
  const getCTA = () => {
    // 1. Linked course/webinar
    if (product.related_course_id && linkedCourse) {
      const isMasterclass = linkedCourse.type === "Webinar" || linkedCourse.type === "Other";
      return {
        label: isMasterclass ? "Watch Free Masterclass" : "Access Free Course",
        href: createPageUrl("FreeMasterclass") + `?course=${linkedCourse.slug}`,
        icon: PlayCircle,
        type: "link",
      };
    }

    // 2. Linked webinar
    if (product.related_webinar_id) {
      return {
        label: "Watch Free",
        href: createPageUrl("FreeMasterclass"),
        icon: PlayCircle,
        type: "link",
      };
    }

    // 3. Linked public resource (PDF, etc.)
    if (linkedResources.length > 0) {
      const resource = linkedResources[0];
      return {
        label: "Download Free",
        href: resource.file_url,
        icon: Download,
        type: "download",
      };
    }

    // 4. Fallback
    return {
      label: "Learn More",
      href: createPageUrl("Contact"),
      icon: ArrowRight,
      type: "link",
    };
  };

  const cta = getCTA();
  const Icon = cta.icon;

  // Dark variant for immersive template
  const isDark = variant === "dark";

  if (cta.type === "download") {
    return (
      <div className="text-center">
        <p className={`text-lg mb-4 ${isDark ? "text-[#D8B46B]" : "text-[#D8B46B]"} font-serif`}>
          Free Resource
        </p>
        <a href={cta.href} target="_blank" rel="noopener noreferrer" download>
          <Button className={`px-12 py-6 text-lg ${
            isDark 
              ? "bg-[#D8B46B] hover:bg-[#C9A55A] text-[#1E3A32]" 
              : "bg-[#1E3A32] hover:bg-[#2B2725] text-[#F9F5EF]"
          }`}>
            <Icon size={20} className="mr-2" />
            {cta.label}
          </Button>
        </a>
      </div>
    );
  }

  return (
    <div className="text-center">
      <p className={`text-lg mb-4 ${isDark ? "text-[#D8B46B]" : "text-[#D8B46B]"} font-serif`}>
        Free Access
      </p>
      <Link to={cta.href}>
        <Button className={`px-12 py-6 text-lg ${
          isDark 
            ? "bg-[#D8B46B] hover:bg-[#C9A55A] text-[#1E3A32]" 
            : "bg-[#1E3A32] hover:bg-[#2B2725] text-[#F9F5EF]"
        }`}>
          <Icon size={20} className="mr-2" />
          {cta.label}
        </Button>
      </Link>
    </div>
  );
}