import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import SEO from "../components/SEO";
import LockedResourceModal from "../components/resources/LockedResourceModal";
import { 
  FileText, Video, Headphones, Link as LinkIcon, FileSpreadsheet, Download,
  Lock, Grid3x3, List, Search, Filter, ExternalLink
} from "lucide-react";

export default function Resources() {
  const [viewMode, setViewMode] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [accessFilter, setAccessFilter] = useState("all");
  const [lockedResource, setLockedResource] = useState(null);

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ["resources"],
    queryFn: () => base44.entities.Resource.filter({ status: "published" }, "sort_order"),
    staleTime: 5 * 60 * 1000,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => base44.entities.Product.list(),
    staleTime: 10 * 60 * 1000,
  });

  // Fetch user's course progress to check access
  const { data: userProgress = [] } = useQuery({
    queryKey: ["userCourseProgress", user?.id],
    queryFn: () => base44.entities.UserCourseProgress.filter({ user_id: user.id }),
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
  });

  const hasAccess = (resource) => {
    if (resource.access_level === "public") return true;
    if (resource.access_level === "authenticated" && user) return true;
    if (resource.access_level === "product_gated" && user && resource.product_ids?.length > 0) {
      const purchasedIds = user.purchased_product_ids || [];
      
      // Resolve gating products: resource.product_ids may contain Stripe IDs or entity IDs
      const gatingProducts = products.filter(p =>
        resource.product_ids.includes(p.stripe_product_id) ||
        resource.product_ids.includes(p.id)
      );
      const gatingEntityIds = gatingProducts.map(p => p.id);
      
      // Check 1: Direct product ownership via purchased_product_ids
      if (gatingEntityIds.some(eid => purchasedIds.includes(eid))) return true;
      
      // Check 1.5: Variant-aware — check if user owns a variant of a gating product
      for (const parent of gatingProducts) {
        if (!parent.purchase_options?.length) continue;
        for (const opt of parent.purchase_options) {
          if (opt.bundle_product_id && purchasedIds.includes(opt.bundle_product_id)) return true;
          const vid = opt.product_id;
          if (vid) {
            const ids = Array.isArray(vid) ? vid : [vid];
            if (ids.some(id => purchasedIds.includes(id))) return true;
          }
        }
      }
      
      // Check 2: Check if user purchased a product whose variant links to this resource
      for (const product of products) {
        if (!purchasedIds.includes(product.id)) continue;
        if (product.purchase_options?.length > 0) {
          for (const opt of product.purchase_options) {
            if (opt.digital_resource_id === resource.id) return true;
            const variantId = opt.bundle_product_id || opt.product_id;
            if (variantId && purchasedIds.includes(variantId) && opt.digital_resource_id === resource.id) return true;
          }
        }
      }
      
      // Check 3: Course enrollment via access_grants
      for (const product of gatingProducts) {
        if (product.access_grants?.length > 0) {
          if (userProgress.some(p => product.access_grants.includes(p.course_id))) return true;
        }
      }
      return false;
    }
    return false;
  };

  const handleResourceClick = async (resource) => {
    if (!hasAccess(resource)) {
      setLockedResource(resource);
      return;
    }

    // Verify access server-side before serving
    try {
      const response = await base44.functions.invoke('getResourceAccess', {
        resource_id: resource.id
      });

      if (!response.data.hasAccess) {
        setLockedResource(resource);
        return;
      }

      // Track view
      try {
        await base44.entities.Resource.update(resource.id, {
          view_count: (resource.view_count || 0) + 1
        });
      } catch (error) {
        console.error("Failed to track view:", error);
      }

      // Open resource
      window.open(response.data.file_url, "_blank");
      
      // Track download
      try {
        await base44.entities.Resource.update(resource.id, {
          download_count: (resource.download_count || 0) + 1
        });
      } catch (error) {
        console.error("Failed to track download:", error);
      }
    } catch (error) {
      console.error("Access verification failed:", error);
      setLockedResource(resource);
    }
  };

  const getResourceIcon = (type) => {
    const icons = {
      pdf: FileText,
      video: Video,
      audio: Headphones,
      link: LinkIcon,
      worksheet: FileSpreadsheet,
      text: FileText
    };
    const Icon = icons[type] || FileText;
    return Icon;
  };

  const getAccessBadge = (resource) => {
    if (resource.access_level === "public") {
      return <Badge variant="outline" className="text-xs">Free</Badge>;
    }
    if (resource.access_level === "authenticated") {
      return <Badge variant="outline" className="text-xs">Members Only</Badge>;
    }
    if (resource.access_level === "product_gated") {
      return <Badge className="text-xs bg-[#D8B46B]">Premium</Badge>;
    }
  };

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resource.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || resource.category === categoryFilter;
    const matchesAccess = accessFilter === "all" || resource.access_level === accessFilter;
    return matchesSearch && matchesCategory && matchesAccess;
  });

  const featuredResources = filteredResources.filter(r => r.featured);
  const regularResources = filteredResources.filter(r => !r.featured);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A32]"></div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Resource Library - Your Mind Stylist"
        description="Access worksheets, guides, audio sessions, and tools to support your transformation journey."
      />

      {lockedResource && (
        <LockedResourceModal
          resource={lockedResource}
          products={products}
          onClose={() => setLockedResource(null)}
        />
      )}

      <div className="min-h-screen bg-[#F9F5EF]">
        {/* Hero Section */}
        <section className="relative pt-32 pb-16 px-6 bg-gradient-to-br from-[#1E3A32] to-[#2B4A40] text-white">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-[#D8B46B] text-sm tracking-[0.3em] uppercase mb-4">
                Resource Library
              </p>
              <h1 className="font-serif text-5xl md:text-6xl mb-6">
                Tools for Your Journey
              </h1>
              <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
                Worksheets, guides, audio sessions, and more to support your transformation.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Filters & Controls */}
        <section className="py-8 px-6 bg-white border-b border-[#E4D9C4]">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-1 gap-3 w-full md:w-auto">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#2B2725]/40" size={18} />
                  <Input
                    placeholder="Search resources..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Worksheets">Worksheets</SelectItem>
                    <SelectItem value="Guides">Guides</SelectItem>
                    <SelectItem value="Audio Sessions">Audio Sessions</SelectItem>
                    <SelectItem value="Videos">Videos</SelectItem>
                    <SelectItem value="Templates">Templates</SelectItem>
                    <SelectItem value="Tools">Tools</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={accessFilter} onValueChange={setAccessFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Access" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Access</SelectItem>
                    <SelectItem value="public">Free</SelectItem>
                    <SelectItem value="authenticated">Members</SelectItem>
                    <SelectItem value="product_gated">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3x3 size={16} />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List size={16} />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Resources Display */}
        <section className="py-12 px-6">
          <div className="max-w-6xl mx-auto">
            {filteredResources.length === 0 ? (
              <div className="text-center py-20">
                <FileText size={64} className="mx-auto mb-6 text-[#D8B46B]" />
                <h3 className="font-serif text-2xl text-[#1E3A32] mb-2">No Resources Found</h3>
                <p className="text-[#2B2725]/70">
                  {searchQuery || categoryFilter !== "all" || accessFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Resources will be added soon"}
                </p>
              </div>
            ) : (
              <>
                {/* Featured Resources */}
                {featuredResources.length > 0 && (
                  <div className="mb-12">
                    <h2 className="font-serif text-3xl text-[#1E3A32] mb-6">Featured Resources</h2>
                    <div className={viewMode === "grid" 
                      ? "grid md:grid-cols-2 lg:grid-cols-3 gap-6" 
                      : "space-y-4"
                    }>
                      {featuredResources.map((resource) => (
                        <ResourceCard
                          key={resource.id}
                          resource={resource}
                          viewMode={viewMode}
                          hasAccess={hasAccess(resource)}
                          getResourceIcon={getResourceIcon}
                          getAccessBadge={getAccessBadge}
                          onClick={() => handleResourceClick(resource)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* All Resources */}
                {regularResources.length > 0 && (
                  <div>
                    {featuredResources.length > 0 && (
                      <h2 className="font-serif text-3xl text-[#1E3A32] mb-6">All Resources</h2>
                    )}
                    <div className={viewMode === "grid" 
                      ? "grid md:grid-cols-2 lg:grid-cols-3 gap-6" 
                      : "space-y-4"
                    }>
                      {regularResources.map((resource) => (
                        <ResourceCard
                          key={resource.id}
                          resource={resource}
                          viewMode={viewMode}
                          hasAccess={hasAccess(resource)}
                          getResourceIcon={getResourceIcon}
                          getAccessBadge={getAccessBadge}
                          onClick={() => handleResourceClick(resource)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-6 bg-[#1E3A32] text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-serif text-4xl md:text-5xl mb-6">
              Want More Resources?
            </h2>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Get access to exclusive worksheets, audio sessions, and tools when you work with me.
            </p>
            <Button 
              size="lg"
              className="bg-[#D8B46B] hover:bg-[#C9A55B] text-[#1E3A32] font-medium px-8 py-6 text-lg"
              onClick={() => window.location.href = "/Programs"}
            >
              Explore Programs
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}

function ResourceCard({ resource, viewMode, hasAccess, getResourceIcon, getAccessBadge, onClick }) {
  const Icon = getResourceIcon(resource.resource_type);
  
  if (viewMode === "list") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.01 }}
        onClick={onClick}
        className="bg-white p-6 shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-6"
      >
        <div className={`w-16 h-16 rounded-lg flex items-center justify-center ${
          hasAccess ? "bg-[#D8B46B]/10 text-[#D8B46B]" : "bg-[#E4D9C4] text-[#2B2725]/40"
        }`}>
          {hasAccess ? <Icon size={28} /> : <Lock size={28} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <h3 className="font-serif text-xl text-[#1E3A32]">{resource.title}</h3>
            <div className="flex items-center gap-2 flex-shrink-0">
              {getAccessBadge(resource)}
              {resource.file_size && (
                <span className="text-xs text-[#2B2725]/60">{resource.file_size}</span>
              )}
            </div>
          </div>
          {resource.description && (
            <p className="text-[#2B2725]/70 text-sm line-clamp-2 mb-2">{resource.description}</p>
          )}
          <div className="flex items-center gap-4 text-xs text-[#2B2725]/60">
            <span>{resource.category}</span>
            {resource.download_count > 0 && (
              <span>• {resource.download_count} downloads</span>
            )}
          </div>
        </div>
        {hasAccess ? (
          <Download size={20} className="text-[#D8B46B]" />
        ) : (
          <Lock size={20} className="text-[#2B2725]/40" />
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.03 }}
      onClick={onClick}
      className={`bg-white shadow-md hover:shadow-xl transition-all cursor-pointer overflow-hidden ${
        !hasAccess ? "opacity-75" : ""
      }`}
    >
      {resource.thumbnail && (
        <div className="relative h-48 overflow-hidden">
          <img 
            src={resource.thumbnail} 
            alt={resource.title}
            className="w-full h-full object-cover"
          />
          {!hasAccess && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Lock size={40} className="text-white" />
            </div>
          )}
        </div>
      )}
      <div className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <div className={`p-2 rounded ${hasAccess ? "bg-[#D8B46B]/10 text-[#D8B46B]" : "bg-[#E4D9C4] text-[#2B2725]/40"}`}>
            <Icon size={20} />
          </div>
          {getAccessBadge(resource)}
        </div>
        <h3 className="font-serif text-xl text-[#1E3A32] mb-2">{resource.title}</h3>
        {resource.description && (
          <p className="text-[#2B2725]/70 text-sm line-clamp-3 mb-4">{resource.description}</p>
        )}
        <div className="flex items-center justify-between text-xs text-[#2B2725]/60">
          <span>{resource.category}</span>
          {resource.file_size && <span>{resource.file_size}</span>}
        </div>
        {resource.download_count > 0 && (
          <div className="mt-3 pt-3 border-t border-[#E4D9C4] text-xs text-[#2B2725]/60">
            {resource.download_count} downloads
          </div>
        )}
      </div>
    </motion.div>
  );
}