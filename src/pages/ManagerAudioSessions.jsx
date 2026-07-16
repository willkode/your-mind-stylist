import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Upload, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ReactQuill from "react-quill";

const CATEGORIES = [
  "Calm & Nervous System Resets",
  "Confidence & Identity",
  "Clarity & Decisions",
  "Emotional Release",
  "Performance Prep",
  "Rest & Recovery",
];

const emptyForm = {
  title: "",
  slug: "",
  category: "",
  description: "",
  audio_url: "",
  duration: "",
  cover_image: "",
  status: "draft",
};

export default function ManagerAudioSessions() {
  const queryClient = useQueryClient();
  const [editingSession, setEditingSession] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["allAudioSessions"],
    queryFn: () => base44.entities.AudioSession.list("-created_date"),
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editingSession) {
        return base44.entities.AudioSession.update(editingSession.id, data);
      }
      return base44.entities.AudioSession.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allAudioSessions"] });
      setShowForm(false);
      setEditingSession(null);
      setForm(emptyForm);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AudioSession.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["allAudioSessions"] }),
  });

  const handleEdit = (session) => {
    setEditingSession(session);
    setForm({ ...session });
    setShowForm(true);
  };

  const handleNew = () => {
    setEditingSession(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingSession(null);
    setForm(emptyForm);
  };

  const handleAudioUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingAudio(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, audio_url: file_url }));
    setUploadingAudio(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImage(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, cover_image: file_url }));
    setUploadingImage(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const slug = form.slug || form.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    saveMutation.mutate({ ...form, slug });
  };

  return (
    <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl text-[#1E3A32]">Audio Sessions</h1>
            <p className="text-[#2B2725]/60 mt-1">Manage Pocket Mindset™ audio library</p>
          </div>
          <Button onClick={handleNew} className="bg-[#1E3A32] hover:bg-[#2B2725] text-white gap-2">
            <Plus size={16} /> New Session
          </Button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white border border-[#E4D9C4] p-6 mb-8 rounded-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-xl text-[#1E3A32]">
                {editingSession ? "Edit Session" : "New Session"}
              </h2>
              <button onClick={handleCancel} className="text-[#2B2725]/40 hover:text-[#2B2725]">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-[#1E3A32] block mb-1">Title *</label>
                  <Input
                    required
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Session title"
                    className="border-[#E4D9C4]"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#1E3A32] block mb-1">Category *</label>
                  <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger className="border-[#E4D9C4]">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-[#1E3A32] block mb-1">Duration (minutes)</label>
                  <Input
                    type="number"
                    value={form.duration}
                    onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                    placeholder="e.g. 12"
                    className="border-[#E4D9C4]"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#1E3A32] block mb-1">Status</label>
                  <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                    <SelectTrigger className="border-[#E4D9C4]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-[#1E3A32] block mb-1">Description</label>
                <ReactQuill
                  value={form.description}
                  onChange={v => setForm(f => ({ ...f, description: v }))}
                  className="bg-white"
                />
              </div>

              {/* Audio File */}
              <div>
                <label className="text-sm font-medium text-[#1E3A32] block mb-1">Audio File *</label>
                <p className="text-xs text-[#2B2725]/50 mb-2">
                  Upload MP3/WAV/M4A (max ~50MB, ~50 min at 128kbps) — or paste an external URL below. 
                  Clients <strong>stream</strong> the audio in-browser; they do not download it.
                  For files larger than 50MB, use a direct-link URL (e.g. Dropbox: change <code>?dl=0</code> to <code>?raw=1</code>).
                </p>
                {form.audio_url ? (
                  <div className="flex items-center gap-3 p-3 bg-[#F9F5EF] border border-[#E4D9C4] rounded">
                    <Check size={16} className="text-green-600" />
                    <span className="text-sm text-[#2B2725]/70 truncate flex-1">{form.audio_url}</span>
                    <button type="button" onClick={() => setForm(f => ({ ...f, audio_url: "" }))} className="text-[#2B2725]/40 hover:text-red-500">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-[#D8B46B]/50 rounded cursor-pointer hover:border-[#D8B46B] transition-colors">
                      <Upload size={16} className="text-[#D8B46B]" />
                      <span className="text-sm text-[#2B2725]/70">
                        {uploadingAudio ? "Uploading..." : "Upload audio file (MP3, WAV, M4A — max 50MB)"}
                      </span>
                      <input type="file" accept="audio/*" className="hidden" onChange={handleAudioUpload} disabled={uploadingAudio} />
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-px bg-[#E4D9C4]" />
                      <span className="text-xs text-[#2B2725]/40">or paste a URL</span>
                      <div className="flex-1 h-px bg-[#E4D9C4]" />
                    </div>
                    <Input
                      value={form.audio_url}
                      onChange={e => setForm(f => ({ ...f, audio_url: e.target.value }))}
                      placeholder="https://dropbox.com/... or any direct audio URL"
                      className="border-[#E4D9C4]"
                    />
                  </div>
                )}
              </div>

              {/* Cover Image */}
              <div>
                <label className="text-sm font-medium text-[#1E3A32] block mb-1">Cover Image</label>
                <p className="text-xs text-[#2B2725]/50 mb-2">
                  Recommended: <strong>square (1:1), 800×800px minimum</strong>, JPEG or PNG. Displayed as a thumbnail in the library.
                </p>
                {form.cover_image ? (
                  <div className="flex items-center gap-3">
                    <img src={form.cover_image} alt="cover" className="w-20 h-20 object-cover rounded" />
                    <button type="button" onClick={() => setForm(f => ({ ...f, cover_image: "" }))} className="text-sm text-red-500 hover:underline">Remove</button>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-[#D8B46B]/50 rounded cursor-pointer hover:border-[#D8B46B] transition-colors">
                    <Upload size={16} className="text-[#D8B46B]" />
                    <span className="text-sm text-[#2B2725]/70">
                      {uploadingImage ? "Uploading..." : "Upload cover image (square, 800×800px+, JPEG/PNG)"}
                    </span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                  </label>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={saveMutation.isPending} className="bg-[#1E3A32] hover:bg-[#2B2725] text-white">
                  {saveMutation.isPending ? "Saving..." : (editingSession ? "Save Changes" : "Create Session")}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>
              </div>
            </form>
          </div>
        )}

        {/* Sessions List */}
        {isLoading ? (
          <div className="text-center py-16 text-[#2B2725]/60">Loading...</div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-16 text-[#2B2725]/60">
            <p className="mb-4">No audio sessions yet.</p>
            <Button onClick={handleNew} className="bg-[#1E3A32] text-white gap-2"><Plus size={16} /> Create First Session</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map(session => (
              <div key={session.id} className="bg-white border border-[#E4D9C4] p-5 rounded-lg flex items-center gap-4">
                {session.cover_image && (
                  <img src={session.cover_image} alt={session.title} className="w-16 h-16 object-cover rounded flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-[#1E3A32] truncate">{session.title}</h3>
                    <Badge className={session.status === "published" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}>
                      {session.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-[#2B2725]/60">{session.category}{session.duration ? ` · ${session.duration} min` : ""}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(session)} className="text-[#2B2725]/60 hover:text-[#1E3A32]">
                    <Pencil size={15} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { if (confirm("Delete this session?")) deleteMutation.mutate(session.id); }}
                    className="text-[#2B2725]/60 hover:text-red-500"
                  >
                    <Trash2 size={15} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}