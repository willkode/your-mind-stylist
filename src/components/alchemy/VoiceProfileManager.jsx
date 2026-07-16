import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Mic, Plus, Edit2, Trash2, Star, Sparkles } from "lucide-react";

export default function VoiceProfileManager({ onSelect }) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [formData, setFormData] = useState({
    profile_name: "",
    tone_descriptors: [],
    writing_rules: "",
    example_text: "",
    vocabulary_preferences: "",
    sentence_structure: "medium_balanced",
    perspective: "second_person",
    use_contractions: true,
    formality_level: "conversational",
    is_default: false
  });

  const queryClient = useQueryClient();

  const { data: profiles = [] } = useQuery({
    queryKey: ['voiceProfiles'],
    queryFn: () => base44.entities.VoiceProfile.filter({ active: true })
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.VoiceProfile.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['voiceProfiles']);
      setShowDialog(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.VoiceProfile.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['voiceProfiles']);
      setShowDialog(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.VoiceProfile.update(id, { active: false }),
    onSuccess: () => queryClient.invalidateQueries(['voiceProfiles'])
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id) => {
      // Unset all other defaults
      for (const profile of profiles) {
        if (profile.is_default) {
          await base44.entities.VoiceProfile.update(profile.id, { is_default: false });
        }
      }
      // Set this one as default
      await base44.entities.VoiceProfile.update(id, { is_default: true });
    },
    onSuccess: () => queryClient.invalidateQueries(['voiceProfiles'])
  });

  const resetForm = () => {
    setFormData({
      profile_name: "",
      tone_descriptors: [],
      writing_rules: "",
      example_text: "",
      vocabulary_preferences: "",
      sentence_structure: "medium_balanced",
      perspective: "second_person",
      use_contractions: true,
      formality_level: "conversational",
      is_default: false
    });
    setEditingProfile(null);
  };

  const handleEdit = (profile) => {
    setEditingProfile(profile);
    setFormData({
      profile_name: profile.profile_name,
      tone_descriptors: profile.tone_descriptors || [],
      writing_rules: profile.writing_rules,
      example_text: profile.example_text || "",
      vocabulary_preferences: profile.vocabulary_preferences || "",
      sentence_structure: profile.sentence_structure,
      perspective: profile.perspective,
      use_contractions: profile.use_contractions,
      formality_level: profile.formality_level,
      is_default: profile.is_default
    });
    setShowDialog(true);
  };

  const handleSubmit = () => {
    if (editingProfile) {
      updateMutation.mutate({ id: editingProfile.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const defaultProfile = profiles.find(p => p.is_default);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl text-[#1E3A32] flex items-center gap-2">
            <Mic className="text-[#D8B46B]" />
            Your Writing Voice
          </h2>
          <p className="text-[#2B2725]/70 text-sm mt-1">
            Train the AI to write in your unique style
          </p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="bg-[#6E4F7D]">
          <Plus size={16} className="mr-2" />
          New Voice Profile
        </Button>
      </div>

      {defaultProfile && (
        <Card className="p-4 border-2 border-[#D8B46B] bg-[#FFF9F0]">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <Star className="text-[#D8B46B] mt-1 fill-[#D8B46B]" size={20} />
              <div>
                <h3 className="font-medium text-[#1E3A32] mb-1">Default Voice Profile</h3>
                <p className="text-sm text-[#2B2725]/70 mb-2">{defaultProfile.profile_name}</p>
                <div className="flex flex-wrap gap-2">
                  {defaultProfile.tone_descriptors?.map((tone, idx) => (
                    <Badge key={idx} variant="outline" className="bg-white">
                      {tone}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <Button size="sm" variant="ghost" onClick={() => handleEdit(defaultProfile)}>
              <Edit2 size={14} />
            </Button>
          </div>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {profiles.filter(p => !p.is_default).map((profile) => (
          <Card key={profile.id} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-medium text-[#1E3A32]">{profile.profile_name}</h3>
                <p className="text-xs text-[#2B2725]/60 mt-1">
                  {profile.formality_level} • {profile.perspective}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDefaultMutation.mutate(profile.id)}
                  title="Set as default"
                >
                  <Star size={14} />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleEdit(profile)}>
                  <Edit2 size={14} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteMutation.mutate(profile.id)}
                >
                  <Trash2 size={14} className="text-red-500" />
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {profile.tone_descriptors?.slice(0, 3).map((tone, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {tone}
                </Badge>
              ))}
            </div>
            {onSelect && (
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => onSelect(profile)}
              >
                Use This Voice
              </Button>
            )}
          </Card>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="text-[#D8B46B]" size={20} />
              {editingProfile ? "Edit Voice Profile" : "Create Voice Profile"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label>Profile Name *</Label>
              <Input
                value={formData.profile_name}
                onChange={(e) => setFormData({ ...formData, profile_name: e.target.value })}
                placeholder="e.g., My Writing Voice"
              />
            </div>

            <div>
              <Label>Tone Descriptors</Label>
              <p className="text-xs text-[#2B2725]/60 mb-2">
                Add comma-separated words (e.g., warm, intelligent, grounded)
              </p>
              <Input
                value={formData.tone_descriptors.join(", ")}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  tone_descriptors: e.target.value.split(",").map(t => t.trim()).filter(Boolean)
                })}
                placeholder="warm, authoritative, conversational"
              />
            </div>

            <div>
              <Label>Writing Rules & Style Guidelines *</Label>
              <p className="text-xs text-[#2B2725]/60 mb-2">
                Be specific about your style (e.g., "I start paragraphs with action verbs", "I avoid corporate jargon")
              </p>
              <Textarea
                value={formData.writing_rules}
                onChange={(e) => setFormData({ ...formData, writing_rules: e.target.value })}
                placeholder="Describe your writing style in detail..."
                rows={6}
              />
            </div>

            <div>
              <Label>Example of Your Writing (Optional but Recommended)</Label>
              <p className="text-xs text-[#2B2725]/60 mb-2">
                Paste a sample of your writing so the AI can learn your exact style
              </p>
              <Textarea
                value={formData.example_text}
                onChange={(e) => setFormData({ ...formData, example_text: e.target.value })}
                placeholder="Paste a paragraph or two of your writing..."
                rows={4}
              />
            </div>

            <div>
              <Label>Vocabulary Preferences (Optional)</Label>
              <Textarea
                value={formData.vocabulary_preferences}
                onChange={(e) => setFormData({ ...formData, vocabulary_preferences: e.target.value })}
                placeholder="Words/phrases to use or avoid..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Sentence Structure</Label>
                <Select
                  value={formData.sentence_structure}
                  onValueChange={(value) => setFormData({ ...formData, sentence_structure: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short_punchy">Short & Punchy</SelectItem>
                    <SelectItem value="medium_balanced">Medium Balanced</SelectItem>
                    <SelectItem value="long_flowing">Long & Flowing</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Formality Level</Label>
                <Select
                  value={formData.formality_level}
                  onValueChange={(value) => setFormData({ ...formData, formality_level: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="conversational">Conversational</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Perspective</Label>
                <Select
                  value={formData.perspective}
                  onValueChange={(value) => setFormData({ ...formData, perspective: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="first_person">First Person (I/We)</SelectItem>
                    <SelectItem value="second_person">Second Person (You)</SelectItem>
                    <SelectItem value="third_person">Third Person (They)</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between pt-6">
                <Label>Use Contractions</Label>
                <Switch
                  checked={formData.use_contractions}
                  onCheckedChange={(checked) => setFormData({ ...formData, use_contractions: checked })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#FFF9F0] rounded border border-[#D8B46B]/30">
              <div>
                <Label className="mb-0">Set as Default Voice</Label>
                <p className="text-xs text-[#2B2725]/60">Use this voice for all AI generation</p>
              </div>
              <Switch
                checked={formData.is_default}
                onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!formData.profile_name || !formData.writing_rules}
                className="bg-[#1E3A32]"
              >
                {editingProfile ? "Update Profile" : "Create Profile"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}