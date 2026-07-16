import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, Video, Headphones, Link as LinkIcon, FileSpreadsheet,
  Plus, Save, Trash2, Eye, Upload, X, ChevronRight, Search
} from "lucide-react";
import { motion } from "framer-motion";

export default function ManagerResourceEditor() {
  const queryClient = useQueryClient();
  const [selectedResource, setSelectedResource] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [uploadingFile, setUploadingFile] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    resource_type: "pdf",
    file_url: "",
    thumbnail: "",
    file_size: "",
    access_level: "public",
    product_ids: [],
    category: "Worksheets",
    tags: [],
    status: "draft",
    featured: false,
    sort_order: 0
  });

  const [tagInput, setTagInput] = useState("");

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ["resources"],
    queryFn: () => base44.entities.Resource.list("-updated_date"),
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => base44.entities.Product.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Resource.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Resource.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Resource.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      resetForm();
    },
  });

  const handleSelectResource = (resource) => {
    setSelectedResource(resource);
    setFormData({
      title: resource.title || "",
      description: resource.description || "",
      resource_type: resource.resource_type || "pdf",
      file_url: resource.file_url || "",
      thumbnail: resource.thumbnail || "",
      file_size: resource.file_size || "",
      access_level: resource.access_level || "public",
      product_ids: resource.product_ids || [],
      category: resource.category || "Worksheets",
      tags: resource.tags || [],
      status: resource.status || "draft",
      featured: resource.featured || false,
      sort_order: resource.sort_order || 0
    });
  };

  const resetForm = () => {
    setSelectedResource(null);
    setFormData({
      title: "",
      description: "",
      resource_type: "pdf",
      file_url: "",
      thumbnail: "",
      file_size: "",
      access_level: "public",
      product_ids: [],
      category: "Worksheets",
      tags: [],
      status: "draft",
      featured: false,
      sort_order: 0
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedResource) {
      updateMutation.mutate({ id: selectedResource.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      if (type === "thumbnail") {
        setFormData({ ...formData, thumbnail: file_url });
      } else {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        setFormData({ 
          ...formData, 
          file_url,
          file_size: `${fileSizeMB} MB`
        });
      }
    } catch (error) {
      alert("File upload failed: " + error.message);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const handleToggleProduct = (productId) => {
    const newProductIds = formData.product_ids.includes(productId)
      ? formData.product_ids.filter(id => id !== productId)
      : [...formData.product_ids, productId];
    setFormData({ ...formData, product_ids: newProductIds });
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
    return <Icon size={18} />;
  };

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || resource.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A32]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F5EF] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="font-serif text-4xl text-[#1E3A32] mb-2">Resource Library Manager</h1>
          <p className="text-[#2B2725]/70">Upload and manage downloadable resources for your clients</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Resource List Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Resources
                  <Button size="sm" onClick={resetForm}>
                    <Plus size={16} className="mr-1" />
                    New
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#2B2725]/40" size={16} />
                    <Input
                      placeholder="Search resources..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger>
                      <SelectValue />
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
                </div>

                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {filteredResources.length === 0 ? (
                    <p className="text-sm text-[#2B2725]/60 text-center py-8">
                      No resources found
                    </p>
                  ) : (
                    filteredResources.map((resource) => (
                      <motion.div
                        key={resource.id}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => handleSelectResource(resource)}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          selectedResource?.id === resource.id
                            ? "border-[#D8B46B] bg-[#D8B46B]/10"
                            : "border-[#E4D9C4] hover:border-[#D8B46B]/50"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div className="text-[#D8B46B] mt-1">
                            {getResourceIcon(resource.resource_type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-[#1E3A32] truncate">
                              {resource.title}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {resource.status}
                              </Badge>
                              {resource.featured && (
                                <Badge className="text-xs bg-[#D8B46B]">Featured</Badge>
                              )}
                            </div>
                          </div>
                          <ChevronRight size={16} className="text-[#2B2725]/40" />
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Editor Form */}
          <div className="lg:col-span-2">
            {selectedResource === null && resources.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText size={48} className="mx-auto mb-4 text-[#D8B46B]" />
                  <h3 className="font-serif text-2xl text-[#1E3A32] mb-2">
                    Create Your First Resource
                  </h3>
                  <p className="text-[#2B2725]/70 mb-6">
                    Upload PDFs, videos, audio files, or add helpful links for your clients
                  </p>
                  <Button onClick={resetForm} className="bg-[#1E3A32]">
                    <Plus size={16} className="mr-2" />
                    Create Resource
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <form onSubmit={handleSubmit}>
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {selectedResource ? "Edit Resource" : "New Resource"}
                    </CardTitle>
                    <CardDescription>
                      {selectedResource
                        ? "Update resource details and settings"
                        : "Add a new resource to your library"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="basic" className="space-y-6">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="basic">Basic Info</TabsTrigger>
                        <TabsTrigger value="access">Access & Products</TabsTrigger>
                        <TabsTrigger value="settings">Settings</TabsTrigger>
                      </TabsList>

                      {/* Basic Info Tab */}
                      <TabsContent value="basic" className="space-y-4">
                        <div>
                          <Label>Resource Title *</Label>
                          <Input
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g., Inner Rehearsal Worksheet"
                            required
                          />
                        </div>

                        <div>
                          <Label>Description</Label>
                          <Textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Describe what this resource is and how to use it..."
                            rows={4}
                          />
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <Label>Resource Type *</Label>
                            <Select
                              value={formData.resource_type}
                              onValueChange={(value) => setFormData({ ...formData, resource_type: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pdf">PDF Document</SelectItem>
                                <SelectItem value="video">Video</SelectItem>
                                <SelectItem value="audio">Audio File</SelectItem>
                                <SelectItem value="worksheet">Worksheet/Spreadsheet</SelectItem>
                                <SelectItem value="link">External Link</SelectItem>
                                <SelectItem value="text">Text Content</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>Category</Label>
                            <Select
                              value={formData.category}
                              onValueChange={(value) => setFormData({ ...formData, category: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Worksheets">Worksheets</SelectItem>
                                <SelectItem value="Guides">Guides</SelectItem>
                                <SelectItem value="Audio Sessions">Audio Sessions</SelectItem>
                                <SelectItem value="Videos">Videos</SelectItem>
                                <SelectItem value="Templates">Templates</SelectItem>
                                <SelectItem value="Tools">Tools</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label>File/Link URL *</Label>
                          <div className="flex gap-2">
                            <Input
                              value={formData.file_url}
                              onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                              placeholder="https://... or upload a file"
                            />
                            <div className="relative">
                              <input
                                type="file"
                                onChange={(e) => handleFileUpload(e, "file")}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                disabled={uploadingFile}
                              />
                              <Button type="button" variant="outline" disabled={uploadingFile}>
                                {uploadingFile ? "Uploading..." : <><Upload size={16} className="mr-2" />Upload</>}
                              </Button>
                            </div>
                          </div>
                          {formData.file_size && (
                            <p className="text-xs text-[#2B2725]/60 mt-1">File size: {formData.file_size}</p>
                          )}
                        </div>

                        <div>
                          <Label>Thumbnail Image</Label>
                          <div className="flex gap-2">
                            <Input
                              value={formData.thumbnail}
                              onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                              placeholder="https://... or upload an image"
                            />
                            <div className="relative">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileUpload(e, "thumbnail")}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                disabled={uploadingFile}
                              />
                              <Button type="button" variant="outline" disabled={uploadingFile}>
                                <Upload size={16} />
                              </Button>
                            </div>
                          </div>
                          {formData.thumbnail && (
                            <img src={formData.thumbnail} alt="Preview" className="mt-2 w-32 h-32 object-cover rounded" />
                          )}
                        </div>

                        <div>
                          <Label>Tags</Label>
                          <div className="flex gap-2 mb-2">
                            <Input
                              value={tagInput}
                              onChange={(e) => setTagInput(e.target.value)}
                              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                              placeholder="Add tags..."
                            />
                            <Button type="button" onClick={handleAddTag} variant="outline">
                              <Plus size={16} />
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {formData.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                                {tag}
                                <X
                                  size={12}
                                  className="cursor-pointer"
                                  onClick={() => handleRemoveTag(tag)}
                                />
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </TabsContent>

                      {/* Access & Products Tab */}
                      <TabsContent value="access" className="space-y-4">
                        <div>
                          <Label>Access Level *</Label>
                          <Select
                            value={formData.access_level}
                            onValueChange={(value) => setFormData({ ...formData, access_level: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="public">Public - Anyone can access</SelectItem>
                              <SelectItem value="authenticated">Authenticated - Logged-in users only</SelectItem>
                              <SelectItem value="product_gated">Product Gated - Requires purchase</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {formData.access_level === "product_gated" && (
                          <div>
                            <Label>Required Products</Label>
                            <p className="text-sm text-[#2B2725]/60 mb-3">
                              Users must own one of these products to access this resource
                            </p>
                            {products.length === 0 ? (
                              <p className="text-sm text-[#2B2725]/60 italic">
                                No products available. Create products first.
                              </p>
                            ) : (
                              <div className="space-y-2 max-h-64 overflow-y-auto border border-[#E4D9C4] rounded-lg p-3">
                                {products.map((product) => (
                                  <label
                                    key={product.id}
                                    className="flex items-center gap-2 p-2 hover:bg-[#F9F5EF] rounded cursor-pointer"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={formData.product_ids.includes(product.stripe_product_id)}
                                      onChange={() => handleToggleProduct(product.stripe_product_id)}
                                      className="w-4 h-4"
                                    />
                                    <span className="text-sm">{product.name}</span>
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </TabsContent>

                      {/* Settings Tab */}
                      <TabsContent value="settings" className="space-y-4">
                        <div>
                          <Label>Status</Label>
                          <Select
                            value={formData.status}
                            onValueChange={(value) => setFormData({ ...formData, status: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="published">Published</SelectItem>
                              <SelectItem value="archived">Archived</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.featured}
                              onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">Featured Resource</span>
                          </label>
                          <p className="text-xs text-[#2B2725]/60 ml-6">
                            Featured resources appear at the top of the library
                          </p>
                        </div>

                        <div>
                          <Label>Sort Order</Label>
                          <Input
                            type="number"
                            value={formData.sort_order}
                            onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                            placeholder="0"
                          />
                          <p className="text-xs text-[#2B2725]/60 mt-1">
                            Lower numbers appear first
                          </p>
                        </div>

                        {selectedResource && (
                          <div className="pt-4 border-t border-[#E4D9C4]">
                            <Label className="text-[#2B2725]/70 mb-2 block">Statistics</Label>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-[#F9F5EF] p-3 rounded">
                                <div className="text-2xl font-serif text-[#1E3A32]">
                                  {selectedResource.download_count || 0}
                                </div>
                                <div className="text-xs text-[#2B2725]/60">Downloads</div>
                              </div>
                              <div className="bg-[#F9F5EF] p-3 rounded">
                                <div className="text-2xl font-serif text-[#1E3A32]">
                                  {selectedResource.view_count || 0}
                                </div>
                                <div className="text-xs text-[#2B2725]/60">Views</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between mt-6 pt-6 border-t border-[#E4D9C4]">
                      <div>
                        {selectedResource && (
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this resource?")) {
                                deleteMutation.mutate(selectedResource.id);
                              }
                            }}
                          >
                            <Trash2 size={16} className="mr-2" />
                            Delete
                          </Button>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={resetForm}>
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          className="bg-[#1E3A32]"
                          disabled={createMutation.isPending || updateMutation.isPending}
                        >
                          <Save size={16} className="mr-2" />
                          {selectedResource ? "Update Resource" : "Create Resource"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}