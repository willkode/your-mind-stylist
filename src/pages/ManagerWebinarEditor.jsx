import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Eye, Trash2, Plus } from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { createPageUrl } from "../utils";

export default function ManagerWebinarEditor() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedWebinar, setSelectedWebinar] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    short_description: "",
    scheduled_date: "",
    duration_minutes: 60,
    media_url: "",
    thumbnail: "",
    price: 0,
    status: "draft",
    access_level: "free",
    template_choice: "detailed",
    featured: false,
    learning_outcomes: [""],
    host_name: "Roberta Fernandez",
    host_bio: "",
    host_image: ""
  });

  const { data: webinars = [], isLoading } = useQuery({
    queryKey: ["webinars"],
    queryFn: () => base44.entities.Webinar.list("-created_date"),
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const webinar = await base44.entities.Webinar.create(data);
      // If paid, sync with Stripe
      if (data.price > 0) {
        await base44.functions.invoke('syncWebinarStripe', { webinar_id: webinar.id });
      }
      return webinar;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webinars"] });
      setIsCreating(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const webinar = await base44.entities.Webinar.update(id, data);
      // If paid, sync with Stripe
      if (data.price > 0) {
        await base44.functions.invoke('syncWebinarStripe', { webinar_id: id });
      }
      return webinar;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webinars"] });
      setSelectedWebinar(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Webinar.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webinars"] });
      setSelectedWebinar(null);
      resetForm();
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      description: "",
      short_description: "",
      scheduled_date: "",
      duration_minutes: 60,
      media_url: "",
      thumbnail: "",
      price: 0,
      status: "draft",
      access_level: "free",
      template_choice: "detailed",
      featured: false,
      learning_outcomes: [""],
      host_name: "Roberta Fernandez",
      host_bio: "",
      host_image: ""
    });
  };

  const handleEdit = (webinar) => {
    setSelectedWebinar(webinar);
    setFormData({
      ...webinar,
      learning_outcomes: webinar.learning_outcomes || [""]
    });
    setIsCreating(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Auto-generate slug from title if empty
    if (!formData.slug) {
      formData.slug = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }

    // Clean up learning outcomes
    const cleanedData = {
      ...formData,
      learning_outcomes: formData.learning_outcomes.filter(outcome => outcome.trim() !== ""),
      price: parseInt(formData.price),
      duration_minutes: parseInt(formData.duration_minutes)
    };

    if (selectedWebinar) {
      updateMutation.mutate({ id: selectedWebinar.id, data: cleanedData });
    } else {
      createMutation.mutate(cleanedData);
    }
  };

  const handleDelete = (id, title) => {
    if (window.confirm(`Delete webinar "${title}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const addLearningOutcome = () => {
    setFormData({
      ...formData,
      learning_outcomes: [...formData.learning_outcomes, ""]
    });
  };

  const updateLearningOutcome = (index, value) => {
    const updated = [...formData.learning_outcomes];
    updated[index] = value;
    setFormData({ ...formData, learning_outcomes: updated });
  };

  const removeLearningOutcome = (index) => {
    const updated = formData.learning_outcomes.filter((_, i) => i !== index);
    setFormData({ ...formData, learning_outcomes: updated });
  };

  const handlePreview = () => {
    if (selectedWebinar) {
      window.open(createPageUrl(`WebinarPage?slug=${selectedWebinar.slug}`), '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A32] mx-auto mb-4"></div>
          <p className="text-[#2B2725]/70">Loading webinars...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F5EF] py-8 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-serif text-4xl text-[#1E3A32] mb-2">Webinar Manager</h1>
            <p className="text-[#2B2725]/70">Create and manage your webinars</p>
          </div>
          {!isCreating && !selectedWebinar && (
            <Button 
              onClick={() => setIsCreating(true)}
              className="bg-[#1E3A32] hover:bg-[#2B2725] text-white"
            >
              <Plus size={20} className="mr-2" />
              Create New Webinar
            </Button>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Webinar List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">All Webinars</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {webinars.map((webinar) => (
                  <div
                    key={webinar.id}
                    onClick={() => handleEdit(webinar)}
                    className={`p-3 rounded cursor-pointer transition-colors ${
                      selectedWebinar?.id === webinar.id
                        ? 'bg-[#D8B46B]/20 border border-[#D8B46B]'
                        : 'bg-white hover:bg-[#F9F5EF] border border-transparent'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-[#1E3A32] mb-1">{webinar.title}</h3>
                        <div className="flex gap-2 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            webinar.status === 'published' ? 'bg-green-100 text-green-800' :
                            webinar.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {webinar.status}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            webinar.access_level === 'free' ? 'bg-blue-100 text-blue-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {webinar.access_level}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {webinars.length === 0 && (
                  <p className="text-center text-[#2B2725]/60 py-8">No webinars yet</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Editor Form */}
          <div className="lg:col-span-2">
            {(isCreating || selectedWebinar) ? (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>
                      {selectedWebinar ? 'Edit Webinar' : 'Create New Webinar'}
                    </CardTitle>
                    <div className="flex gap-2">
                      {selectedWebinar && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handlePreview}
                        >
                          <Eye size={16} className="mr-2" />
                          Preview
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setIsCreating(false);
                          setSelectedWebinar(null);
                          resetForm();
                        }}
                      >
                        <ArrowLeft size={16} className="mr-2" />
                        Back
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit}>
                    <Tabs defaultValue="basic" className="w-full">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="basic">Basic Info</TabsTrigger>
                        <TabsTrigger value="content">Content</TabsTrigger>
                        <TabsTrigger value="pricing">Pricing</TabsTrigger>
                        <TabsTrigger value="settings">Settings</TabsTrigger>
                      </TabsList>

                      {/* Basic Info Tab */}
                      <TabsContent value="basic" className="space-y-4 mt-4">
                        <div>
                          <Label>Title *</Label>
                          <Input
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                            placeholder="e.g., Mastering Mind Styling"
                          />
                        </div>
                        <div>
                          <Label>URL Slug</Label>
                          <Input
                            value={formData.slug}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                            placeholder="Auto-generated from title"
                          />
                          <p className="text-xs text-[#2B2725]/60 mt-1">
                            Leave blank to auto-generate
                          </p>
                        </div>
                        <div>
                          <Label>Short Description</Label>
                          <Textarea
                            value={formData.short_description}
                            onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                            rows={2}
                            placeholder="Brief summary for listings"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Scheduled Date</Label>
                            <Input
                              type="datetime-local"
                              value={formData.scheduled_date}
                              onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>Duration (minutes)</Label>
                            <Input
                              type="number"
                              value={formData.duration_minutes}
                              onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Thumbnail Image URL</Label>
                          <Input
                            value={formData.thumbnail}
                            onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                            placeholder="https://..."
                          />
                        </div>
                      </TabsContent>

                      {/* Content Tab */}
                      <TabsContent value="content" className="space-y-4 mt-4">
                        <div>
                          <Label>Full Description</Label>
                          <div className="mt-2">
                            <ReactQuill
                              theme="snow"
                              value={formData.description}
                              onChange={(value) => setFormData({ ...formData, description: value })}
                              className="bg-white"
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Media URL (YouTube, Vimeo, or hosted video)</Label>
                          <Input
                            value={formData.media_url}
                            onChange={(e) => setFormData({ ...formData, media_url: e.target.value })}
                            placeholder="https://youtube.com/..."
                          />
                        </div>
                        <div>
                          <Label>Learning Outcomes</Label>
                          {formData.learning_outcomes.map((outcome, index) => (
                            <div key={index} className="flex gap-2 mb-2">
                              <Input
                                value={outcome}
                                onChange={(e) => updateLearningOutcome(index, e.target.value)}
                                placeholder="What will they learn?"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => removeLearningOutcome(index)}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addLearningOutcome}
                          >
                            <Plus size={16} className="mr-2" />
                            Add Outcome
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Host Name</Label>
                            <Input
                              value={formData.host_name}
                              onChange={(e) => setFormData({ ...formData, host_name: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>Host Image URL</Label>
                            <Input
                              value={formData.host_image}
                              onChange={(e) => setFormData({ ...formData, host_image: e.target.value })}
                              placeholder="https://..."
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Host Bio</Label>
                          <Textarea
                            value={formData.host_bio}
                            onChange={(e) => setFormData({ ...formData, host_bio: e.target.value })}
                            rows={2}
                          />
                        </div>
                      </TabsContent>

                      {/* Pricing Tab */}
                      <TabsContent value="pricing" className="space-y-4 mt-4">
                        <div>
                          <Label>Access Level</Label>
                          <Select 
                            value={formData.access_level} 
                            onValueChange={(v) => setFormData({ 
                              ...formData, 
                              access_level: v,
                              price: v === 'free' ? 0 : formData.price
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="free">Free - Anyone can access</SelectItem>
                              <SelectItem value="paid">Paid - Purchase required</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {formData.access_level === 'paid' && (
                          <div>
                            <Label>Price (in cents)</Label>
                            <Input
                              type="number"
                              value={formData.price}
                              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                              placeholder="e.g., 9700 for $97.00"
                            />
                            <p className="text-sm text-[#2B2725]/60 mt-1">
                              Preview: ${(formData.price / 100).toFixed(2)}
                            </p>
                            <p className="text-xs text-[#2B2725]/60 mt-2">
                              Stripe product and price will be automatically created/updated when you save
                            </p>
                          </div>
                        )}
                      </TabsContent>

                      {/* Settings Tab */}
                      <TabsContent value="settings" className="space-y-4 mt-4">
                        <div>
                          <Label>Status</Label>
                          <Select 
                            value={formData.status} 
                            onValueChange={(v) => setFormData({ ...formData, status: v })}
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
                          <Label>Page Template</Label>
                          <Select 
                            value={formData.template_choice} 
                            onValueChange={(v) => setFormData({ ...formData, template_choice: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="minimal">Minimal - Clean and simple</SelectItem>
                              <SelectItem value="detailed">Detailed - Rich with features</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Featured Webinar</Label>
                          <Switch
                            checked={formData.featured}
                            onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                          />
                        </div>
                      </TabsContent>
                    </Tabs>

                    {/* Form Actions */}
                    <div className="flex justify-between items-center mt-6 pt-6 border-t">
                      {selectedWebinar && (
                        <Button
                          type="button"
                          variant="outline"
                          className="text-red-600"
                          onClick={() => handleDelete(selectedWebinar.id, selectedWebinar.title)}
                        >
                          <Trash2 size={16} className="mr-2" />
                          Delete Webinar
                        </Button>
                      )}
                      <div className="flex gap-2 ml-auto">
                        <Button type="submit" className="bg-[#1E3A32] hover:bg-[#2B2725]">
                          <Save size={16} className="mr-2" />
                          {selectedWebinar ? 'Update' : 'Create'} Webinar
                        </Button>
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-20 text-center">
                  <h3 className="font-serif text-2xl text-[#1E3A32] mb-4">
                    Select a webinar to edit or create a new one
                  </h3>
                  <p className="text-[#2B2725]/70 mb-6">
                    Choose from the list or click "Create New Webinar" to get started
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}