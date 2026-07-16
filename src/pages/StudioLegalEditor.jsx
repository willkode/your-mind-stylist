import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Save, ArrowLeft } from "lucide-react";

export default function StudioLegalEditor() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get("slug");

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    last_reviewed: new Date().toISOString().split("T")[0],
  });

  const { data: existingPage, isLoading } = useQuery({
    queryKey: ["legalPage", slug],
    queryFn: async () => {
      const pages = await base44.entities.LegalPage.filter({ slug });
      return pages[0];
    },
    enabled: !!slug,
  });

  useEffect(() => {
    if (existingPage) {
      setFormData(existingPage);
    } else if (slug) {
      // Set title based on slug
      const titles = {
        "privacy-policy": "Privacy Policy",
        "terms-of-service": "Terms of Service",
        "cookie-policy": "Cookie Policy",
        "disclaimer": "Disclaimer",
      };
      setFormData((prev) => ({
        ...prev,
        title: titles[slug] || "",
        slug: slug,
      }));
    }
  }, [existingPage, slug]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.LegalPage.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["legalPages"] });
      navigate(createPageUrl("StudioLegal"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LegalPage.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["legalPages"] });
      navigate(createPageUrl("StudioLegal"));
    },
  });

  const handleSave = () => {
    if (existingPage) {
      updateMutation.mutate({ id: existingPage.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-[#2B2725]/60">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl("StudioLegal"))}
            className="mb-4"
          >
            <ArrowLeft size={18} className="mr-2" />
            Back to Legal Pages
          </Button>
          <h1 className="font-serif text-4xl text-[#1E3A32] mb-2">
            {existingPage ? "Edit" : "Create"} Legal Page
          </h1>
          <p className="text-[#2B2725]/70">{formData.title || "Legal Document"}</p>
        </div>

        <div className="bg-white p-8 space-y-6">
          <div>
            <Label>Page Title</Label>
            <Input value={formData.title} disabled className="bg-gray-50" />
            <p className="text-xs text-[#2B2725]/60 mt-1">Read-only</p>
          </div>

          <div>
            <Label>Slug</Label>
            <Input value={formData.slug} disabled className="bg-gray-50" />
            <p className="text-xs text-[#2B2725]/60 mt-1">Read-only</p>
          </div>

          <div>
            <Label>Last Reviewed</Label>
            <Input
              type="date"
              value={formData.last_reviewed}
              onChange={(e) => setFormData({ ...formData, last_reviewed: e.target.value })}
            />
          </div>

          <div>
            <Label className="mb-2 block">Content</Label>
            <ReactQuill
              value={formData.content}
              onChange={(content) => setFormData({ ...formData, content })}
              theme="snow"
              className="bg-white"
              style={{ minHeight: "500px" }}
            />
          </div>

          <div className="bg-[#D8B46B]/10 p-4 text-sm text-[#2B2725]/80">
            <strong>Important:</strong> These pages must stay accurate. If you need legal review,
            consult your legal partner before making large changes.
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => navigate(createPageUrl("StudioLegal"))}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-[#1E3A32] hover:bg-[#2B2725] text-[#F9F5EF]"
            >
              <Save size={18} className="mr-2" />
              Save Legal Text
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}