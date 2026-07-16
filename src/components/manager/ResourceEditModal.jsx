import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import { motion } from "framer-motion";

export default function ResourceEditModal({ resource, onClose }) {
  const [formData, setFormData] = useState({
    title: resource.title || "",
    description: resource.description || "",
    category: resource.category || "Other",
    status: resource.status || "published"
  });

  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Resource.update(resource.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
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

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen p-6 flex items-start justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-lg max-w-2xl w-full p-8 my-8"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-serif text-2xl text-[#1E3A32]">Edit Resource</h2>
            <button onClick={onClose} className="text-[#2B2725]/40 hover:text-[#2B2725]">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                placeholder="Add a description to help users understand what this resource is for..."
              />
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
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
                </SelectContent>
              </Select>
              <p className="text-xs text-[#2B2725]/60 mt-1">
                Only published resources can be attached to courses
              </p>
            </div>

            <div className="bg-[#F9F5EF] p-4 rounded-lg">
              <p className="text-sm text-[#2B2725]/70 mb-2">
                <strong>File URL:</strong>
              </p>
              <p className="text-xs text-[#2B2725]/60 break-all">
                {resource.file_url}
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="bg-[#1E3A32] hover:bg-[#2B2725]"
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}