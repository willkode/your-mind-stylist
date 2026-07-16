import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, Search, Grid, List, FileText, Image, Video, Music, 
  File, MoreVertical, Pencil, Trash2, Download, Eye, Link as LinkIcon
} from "lucide-react";
import { motion } from "framer-motion";
import ResourceUploadModal from "@/components/manager/ResourceUploadModal";
import ResourceEditModal from "@/components/manager/ResourceEditModal";
import ResourcePreviewModal from "@/components/manager/ResourcePreviewModal";

export default function ManagerResources() {
  const [view, setView] = useState("grid"); // grid or list
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [previewResource, setPreviewResource] = useState(null);

  const queryClient = useQueryClient();

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ["resources"],
    queryFn: () => base44.entities.Resource.list("-created_date"),
  });

  const deleteResourceMutation = useMutation({
    mutationFn: (id) => base44.entities.Resource.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    },
  });

  const getFileIcon = (type) => {
    const icons = {
      pdf: FileText,
      video: Video,
      audio: Music,
      image: Image,
      text: FileText,
      link: LinkIcon,
      worksheet: FileText,
    };
    return icons[type] || File;
  };

  const categories = [
    "Worksheets",
    "Guides",
    "Audio Sessions",
    "Videos",
    "Templates",
    "Graphics",
    "Tools",
    "Other"
  ];

  const types = ["pdf", "video", "audio", "image", "text", "link", "worksheet"];

  const filteredResources = resources.filter((resource) => {
    const matchesSearch = resource.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resource.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || resource.category === filterCategory;
    const matchesType = filterType === "all" || resource.resource_type === filterType;
    return matchesSearch && matchesCategory && matchesType;
  });

  const copyLink = (url) => {
    navigator.clipboard.writeText(url);
    alert("Link copied to clipboard!");
  };

  const handleDelete = async (resource) => {
    if (!confirm(`Delete "${resource.title}"? This cannot be undone.`)) return;
    deleteResourceMutation.mutate(resource.id);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A32] mx-auto mb-4"></div>
          <p className="text-[#2B2725]/70">Loading resources...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F5EF] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-serif text-4xl text-[#1E3A32] mb-2">Resource Library</h1>
              <p className="text-[#2B2725]/70">
                Upload and manage files for your courses and lessons
              </p>
            </div>
            <Button
              onClick={() => setUploadModalOpen(true)}
              className="bg-[#1E3A32] hover:bg-[#2B2725]"
            >
              <Upload size={16} className="mr-2" />
              Upload Files
            </Button>
          </div>

          {/* Filters */}
          <Card className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              {/* Search */}
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2B2725]/40" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search resources..."
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Type Filter */}
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {types.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* View Toggle */}
              <div className="flex gap-1 border border-[#E4D9C4] rounded-lg p-1">
                <Button
                  size="sm"
                  variant={view === "grid" ? "default" : "ghost"}
                  onClick={() => setView("grid")}
                  className={view === "grid" ? "bg-[#1E3A32]" : ""}
                >
                  <Grid size={16} />
                </Button>
                <Button
                  size="sm"
                  variant={view === "list" ? "default" : "ghost"}
                  onClick={() => setView("list")}
                  className={view === "list" ? "bg-[#1E3A32]" : ""}
                >
                  <List size={16} />
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <p className="text-sm text-[#2B2725]/60 mb-1">Total Resources</p>
            <p className="text-2xl font-bold text-[#1E3A32]">{resources.length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-[#2B2725]/60 mb-1">PDFs</p>
            <p className="text-2xl font-bold text-[#1E3A32]">
              {resources.filter(r => r.resource_type === "pdf").length}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-[#2B2725]/60 mb-1">Worksheets</p>
            <p className="text-2xl font-bold text-[#1E3A32]">
              {resources.filter(r => r.resource_type === "worksheet").length}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-[#2B2725]/60 mb-1">Videos</p>
            <p className="text-2xl font-bold text-[#1E3A32]">
              {resources.filter(r => r.resource_type === "video").length}
            </p>
          </Card>
        </div>

        {/* Resources Grid/List */}
        {filteredResources.length === 0 ? (
          <Card className="p-12 text-center">
            <Upload size={48} className="mx-auto text-[#D8B46B] mb-4" />
            <h3 className="font-serif text-2xl text-[#1E3A32] mb-2">No Resources Yet</h3>
            <p className="text-[#2B2725]/70 mb-6">
              {searchQuery || filterCategory !== "all" || filterType !== "all" 
                ? "No resources match your filters" 
                : "Upload your first file to get started"}
            </p>
            {!searchQuery && filterCategory === "all" && filterType === "all" && (
              <Button onClick={() => setUploadModalOpen(true)} className="bg-[#1E3A32]">
                <Upload size={16} className="mr-2" />
                Upload Files
              </Button>
            )}
          </Card>
        ) : view === "grid" ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredResources.map((resource) => {
              const Icon = getFileIcon(resource.resource_type);
              return (
                <motion.div
                  key={resource.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Card className="p-4 hover:shadow-lg transition-shadow group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-3 bg-[#D8B46B]/10 rounded-lg">
                        <Icon size={24} className="text-[#D8B46B]" />
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setPreviewResource(resource)}
                        >
                          <Eye size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingResource(resource)}
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(resource)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                    <h3 className="font-medium text-[#1E3A32] mb-1 line-clamp-2">
                      {resource.title}
                    </h3>
                    {resource.description && (
                      <p className="text-sm text-[#2B2725]/60 mb-3 line-clamp-2">
                        {resource.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mb-3">
                      {resource.category && (
                        <Badge variant="outline" className="text-xs">
                          {resource.category}
                        </Badge>
                      )}
                      <Badge className="bg-[#D8B46B]/20 text-[#1E3A32] text-xs">
                        {resource.resource_type}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => copyLink(resource.file_url)}
                      >
                        <LinkIcon size={14} className="mr-1" />
                        Copy Link
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                      >
                        <a href={resource.file_url} target="_blank" rel="noopener noreferrer">
                          <Download size={14} />
                        </a>
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredResources.map((resource) => {
              const Icon = getFileIcon(resource.resource_type);
              return (
                <Card key={resource.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-[#D8B46B]/10 rounded">
                      <Icon size={20} className="text-[#D8B46B]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-[#1E3A32]">{resource.title}</h3>
                      <p className="text-sm text-[#2B2725]/60">{resource.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {resource.category && (
                        <Badge variant="outline">{resource.category}</Badge>
                      )}
                      <Badge className="bg-[#D8B46B]/20 text-[#1E3A32]">
                        {resource.resource_type}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setPreviewResource(resource)}>
                        <Eye size={16} />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => copyLink(resource.file_url)}>
                        <LinkIcon size={16} />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingResource(resource)}>
                        <Pencil size={16} />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(resource)}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {uploadModalOpen && (
        <ResourceUploadModal onClose={() => setUploadModalOpen(false)} />
      )}

      {editingResource && (
        <ResourceEditModal
          resource={editingResource}
          onClose={() => setEditingResource(null)}
        />
      )}

      {previewResource && (
        <ResourcePreviewModal
          resource={previewResource}
          onClose={() => setPreviewResource(null)}
        />
      )}
    </div>
  );
}