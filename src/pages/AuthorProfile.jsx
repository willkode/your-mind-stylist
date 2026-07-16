import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Save, User, CheckCircle } from "lucide-react";
import ImageManager from "../components/blog/ImageManager";

export default function AuthorProfile() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    display_name: "",
    bio: "",
    profile_image: "",
    website: "",
    social_links: {
      twitter: "",
      linkedin: "",
      instagram: "",
    },
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        console.error("Failed to fetch user:", e);
      }
    };
    fetchUser();
  }, []);

  const { data: authorProfile, isLoading } = useQuery({
    queryKey: ["authorProfile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const authors = await base44.entities.Author.filter({ user_id: user.id });
      return authors[0] || null;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (authorProfile) {
      setFormData({
        display_name: authorProfile.display_name || "",
        bio: authorProfile.bio || "",
        profile_image: authorProfile.profile_image || "",
        website: authorProfile.website || "",
        social_links: authorProfile.social_links || { twitter: "", linkedin: "", instagram: "" },
      });
    } else if (user) {
      setFormData(prev => ({
        ...prev,
        display_name: user.full_name || "",
      }));
    }
  }, [authorProfile, user]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Author.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authorProfile"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Author.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authorProfile"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const handleSave = () => {
    if (!user) return;
    const dataToSave = {
      display_name: formData.display_name,
      bio: formData.bio || "",
      profile_image: formData.profile_image || "",
      website: formData.website || "",
      social_links: formData.social_links || {},
      user_id: user.id,
    };

    if (authorProfile?.id) {
      updateMutation.mutate({ id: authorProfile.id, data: dataToSave });
    } else {
      createMutation.mutate(dataToSave);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="font-serif text-4xl text-[#1E3A32] mb-2">Author Profile</h1>
          <p className="text-[#2B2725]/70">Manage your public author information</p>
        </div>

        <div className="bg-white p-8 space-y-6">
          <div>
            <Label>Display Name *</Label>
            <Input
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              placeholder="How your name appears on blog posts"
            />
          </div>

          <div>
            <Label>Bio</Label>
            <Textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell readers about yourself..."
              rows={4}
            />
          </div>

          <div className="border border-[#D8B46B]/20 rounded-lg p-6 bg-[#F9F5EF]">
            <Label className="mb-4 block">Profile Picture</Label>
            {formData.profile_image && (
              <div className="mb-4">
                <img
                  src={formData.profile_image}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md"
                />
              </div>
            )}
            <ImageManager
              onSetFeaturedImage={(url) => setFormData({ ...formData, profile_image: url })}
              mode="featured"
            />
          </div>

          <div>
            <Label>Website</Label>
            <Input
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://yourwebsite.com"
            />
          </div>

          <div className="border-t pt-6">
            <h3 className="font-medium text-[#1E3A32] mb-4">Social Media</h3>
            <div className="space-y-4">
              <div>
                <Label>Twitter/X</Label>
                <Input
                  value={formData.social_links?.twitter || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      social_links: { ...formData.social_links, twitter: e.target.value },
                    })
                  }
                  placeholder="@username"
                />
              </div>
              <div>
                <Label>LinkedIn</Label>
                <Input
                  value={formData.social_links?.linkedin || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      social_links: { ...formData.social_links, linkedin: e.target.value },
                    })
                  }
                  placeholder="linkedin.com/in/username"
                />
              </div>
              <div>
                <Label>Instagram</Label>
                <Input
                  value={formData.social_links?.instagram || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      social_links: { ...formData.social_links, instagram: e.target.value },
                    })
                  }
                  placeholder="@username"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end border-t pt-6">
            {!user && (
              <p className="text-sm text-red-500 mr-4 self-center">Loading user data...</p>
            )}
            <Button onClick={handleSave} disabled={isSaving} className="bg-[#1E3A32]">
              {saved ? (
                <><CheckCircle size={18} className="mr-2" />Saved!</>
              ) : (
                <><Save size={18} className="mr-2" />{isSaving ? "Saving..." : "Save Profile"}</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}