import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, BookOpen, Upload, HelpCircle, Loader2, Library, ExternalLink, DollarSign, Headphones } from "lucide-react";
import { Link } from "react-router-dom";
import AudiobookSetupGuide from "@/components/audiobook/AudiobookSetupGuide";
import AudiobookChapterEditor from "@/components/audiobook/AudiobookChapterEditor";
import ResourceAudioPicker from "@/components/audiobook/ResourceAudioPicker";
import CreateProductShortcut from "@/components/audiobook/CreateProductShortcut";

export default function ManagerAudiobooks() {
  const [editingBook, setEditingBook] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  const queryClient = useQueryClient();

  const { data: audiobooks = [], isLoading } = useQuery({
    queryKey: ["audiobooks"],
    queryFn: () => base44.entities.Audiobook.list(),
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => base44.entities.Product.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Audiobook.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["audiobooks"] }),
  });

  return (
    <div className="bg-[#F9F5EF] min-h-screen pt-8 pb-24 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl text-[#1E3A32] mb-2">Audiobook Manager</h1>
            <p className="text-sm text-[#2B2725]/60">
              Upload and manage audiobooks with chapter navigation for your clients
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowGuide(true)}
              className="border-[#E4D9C4] text-[#2B2725]/70 gap-2"
            >
              <HelpCircle size={16} />
              Setup Guide
            </Button>
            <Button
              onClick={() => setEditingBook({
                title: "", slug: "", author: "Roberta Fernandez", narrator: "Roberta Fernandez",
                description: "", cover_image: "", audio_url: "", chapters: [],
                status: "draft", access_level: "product_gated", file_format: "mp3",
              })}
              className="bg-[#1E3A32] hover:bg-[#2B2725] gap-2"
            >
              <Plus size={16} />
              New Audiobook
            </Button>
          </div>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="text-center py-16 text-[#2B2725]/50">Loading...</div>
        ) : audiobooks.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-[#E4D9C4] rounded-lg">
            <BookOpen size={48} className="mx-auto text-[#E4D9C4] mb-4" />
            <h3 className="font-serif text-xl text-[#1E3A32] mb-2">No audiobooks yet</h3>
            <p className="text-sm text-[#2B2725]/60 mb-6">
              Click "Setup Guide" to learn how to prepare your audiobook files,<br />
              then "New Audiobook" to add your first one.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {audiobooks.map((book) => (
              <div key={book.id} className="bg-white p-5 rounded-lg border border-[#E4D9C4] flex items-center gap-5">
                {book.cover_image && (
                  <img src={book.cover_image} alt="" className="w-16 h-16 rounded object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-serif text-lg text-[#1E3A32] truncate">{book.title}</h3>
                    <Badge className={book.status === "published" ? "bg-[#A6B7A3] text-white" : "bg-[#E4D9C4] text-[#2B2725]/60"}>
                      {book.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-[#2B2725]/50">
                    {book.chapters?.length || 0} chapters • {book.file_format?.toUpperCase() || "MP3"}
                    {book.file_size_mb ? ` • ${book.file_size_mb} MB` : ""}
                  </p>
                  <p className="text-xs text-[#2B2725]/40 mt-1">
                    /audiobook/{book.slug}
                  </p>
                </div>
                <div className="flex gap-2">
                  {book.slug && (
                    <Link to={`/audiobook/${book.slug}`}>
                      <Button size="sm" variant="outline" className="gap-1 text-[#6E4F7D] border-[#6E4F7D]/30 hover:bg-[#6E4F7D]/5">
                        <Headphones size={14} /> Preview
                      </Button>
                    </Link>
                  )}
                  <Button size="sm" variant="outline" onClick={() => setEditingBook(book)} className="gap-1">
                    <Pencil size={14} /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => {
                      if (confirm("Delete this audiobook?")) deleteMutation.mutate(book.id);
                    }}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      {editingBook && (
        <AudiobookEditDialog
          audiobook={editingBook}
          products={products}
          onClose={() => setEditingBook(null)}
          queryClient={queryClient}
        />
      )}

      {/* Setup Guide Dialog */}
      {showGuide && (
        <Dialog open={showGuide} onOpenChange={setShowGuide}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl text-[#1E3A32]">
                Audiobook Setup Guide
              </DialogTitle>
            </DialogHeader>
            <AudiobookSetupGuide />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

const DRAFT_KEY = "audiobook-editor-draft";

function AudiobookEditDialog({ audiobook, products, onClose, queryClient }) {
  const isNew = !audiobook.id;
  const [form, setForm] = useState(() => {
    // For new audiobooks, check localStorage for a recovered draft
    if (!audiobook.id) {
      try {
        const saved = localStorage.getItem(DRAFT_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          // Only restore if it has real content (not just defaults)
          if (parsed.title || parsed.description || (parsed.chapters && parsed.chapters.length > 0)) {
            return parsed;
          }
        }
      } catch {}
    }
    return { ...audiobook };
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showResourcePicker, setShowResourcePicker] = useState(false);
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState(null); // null | 'saving' | 'saved' | 'draft-saved'
  const [showDraftRecovery, setShowDraftRecovery] = useState(() => {
    if (!audiobook.id) {
      try {
        const saved = localStorage.getItem(DRAFT_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          return !!(parsed.title || parsed.description || (parsed.chapters && parsed.chapters.length > 0));
        }
      } catch {}
    }
    return false;
  });
  const autosaveTimerRef = React.useRef(null);
  const formRef = React.useRef(form);
  formRef.current = form;
  const initialFormRef = React.useRef(JSON.stringify(form));
  const hasSavedRef = React.useRef(false);

  // Autosave: debounce 2 seconds after any form change (only for existing audiobooks)
  // For new audiobooks: persist to localStorage as draft protection
  React.useEffect(() => {
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(async () => {
      if (isNew) {
        // Save to localStorage for draft recovery
        try {
          localStorage.setItem(DRAFT_KEY, JSON.stringify(formRef.current));
          setAutosaveStatus('draft-saved');
          setTimeout(() => setAutosaveStatus(null), 1500);
        } catch {}
      } else {
        setAutosaveStatus('saving');
        await base44.entities.Audiobook.update(audiobook.id, formRef.current);
        queryClient.invalidateQueries({ queryKey: ["audiobooks"] });
        setAutosaveStatus('saved');
        setTimeout(() => setAutosaveStatus(null), 2000);
      }
    }, 2000);
    return () => { if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current); };
  }, [form]);

  // Warn before browser/tab close
  React.useEffect(() => {
    const handler = (e) => {
      const isDirty = JSON.stringify(formRef.current) !== initialFormRef.current;
      if (isDirty && !hasSavedRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  const handleClose = () => {
    const isDirty = JSON.stringify(form) !== initialFormRef.current;
    if (isDirty && !hasSavedRef.current) {
      if (!confirm("You have unsaved changes. Are you sure you want to close?")) return;
    }
    // Clear draft on intentional close
    if (isNew) {
      try { localStorage.removeItem(DRAFT_KEY); } catch {}
    }
    onClose();
  };

  const discardDraft = () => {
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
    setForm({ ...audiobook });
    initialFormRef.current = JSON.stringify(audiobook);
    setShowDraftRecovery(false);
  };

  const handleFileUpload = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm((prev) => ({ ...prev, [field]: file_url }));
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.title || !form.slug || !form.audio_url) {
      alert("Title, slug, and audio file are required.");
      return;
    }
    setSaving(true);
    if (isNew) {
      await base44.entities.Audiobook.create(form);
      try { localStorage.removeItem(DRAFT_KEY); } catch {}
    } else {
      await base44.entities.Audiobook.update(audiobook.id, form);
    }
    hasSavedRef.current = true;
    queryClient.invalidateQueries({ queryKey: ["audiobooks"] });
    setSaving(false);
    onClose();
  };

  const handleQuickSaveDraft = async () => {
    if (!form.title || !form.slug) {
      alert("Title and slug are required to save as draft.");
      return;
    }
    setSaving(true);
    const draftForm = { ...form, status: "draft" };
    if (isNew) {
      await base44.entities.Audiobook.create(draftForm);
      try { localStorage.removeItem(DRAFT_KEY); } catch {}
    } else {
      await base44.entities.Audiobook.update(audiobook.id, draftForm);
    }
    hasSavedRef.current = true;
    queryClient.invalidateQueries({ queryKey: ["audiobooks"] });
    setSaving(false);
    onClose();
  };

  const updateField = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  return (
    <Dialog open onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-[#1E3A32]">
            {isNew ? "New Audiobook" : `Edit: ${audiobook.title}`}
          </DialogTitle>
        </DialogHeader>

        {/* Draft Recovery Banner */}
        {showDraftRecovery && (
          <div className="bg-[#D8B46B]/10 border border-[#D8B46B]/30 rounded-lg p-3 flex items-center justify-between">
            <p className="text-sm text-[#1E3A32]">
              <strong>Draft recovered.</strong> We found unsaved work from a previous session.
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={discardDraft} className="text-xs">
                Discard
              </Button>
              <Button size="sm" onClick={() => setShowDraftRecovery(false)} className="text-xs bg-[#1E3A32] hover:bg-[#2B2725]">
                Keep Working
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-5 mt-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Title *</Label>
              <Input value={form.title} onChange={(e) => updateField("title", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Slug *</Label>
              <Input
                value={form.slug}
                onChange={(e) => updateField("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                placeholder="my-audiobook"
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Author</Label>
              <Input value={form.author || ""} onChange={(e) => updateField("author", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Narrator</Label>
              <Input value={form.narrator || ""} onChange={(e) => updateField("narrator", e.target.value)} className="mt-1" />
            </div>
          </div>

          <div>
            <Label className="text-xs">Description</Label>
            <Textarea value={form.description || ""} onChange={(e) => updateField("description", e.target.value)} className="mt-1" rows={3} />
          </div>

          {/* Files */}
          <div className="border-t border-[#E4D9C4] pt-5">
            <h3 className="text-sm font-medium text-[#1E3A32] mb-3">Audio File</h3>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Audio File URL * (MP3 recommended)</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={form.audio_url || ""}
                    onChange={(e) => updateField("audio_url", e.target.value)}
                    placeholder="https://..."
                    className="flex-1"
                  />
                  <label className="cursor-pointer">
                    <input type="file" accept="audio/*" className="hidden" onChange={(e) => handleFileUpload(e, "audio_url")} />
                    <Button type="button" variant="outline" className="gap-1" asChild>
                      <span>{uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Upload</span>
                    </Button>
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-1"
                    onClick={() => setShowResourcePicker(true)}
                  >
                    <Library size={14} /> Resources
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">File Format</Label>
                  <Select value={form.file_format || "mp3"} onValueChange={(v) => updateField("file_format", v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mp3">MP3</SelectItem>
                      <SelectItem value="m4b">M4B</SelectItem>
                      <SelectItem value="m4a">M4A</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">File Size (MB)</Label>
                  <Input
                    type="number"
                    value={form.file_size_mb || ""}
                    onChange={(e) => updateField("file_size_mb", parseFloat(e.target.value) || null)}
                    placeholder="e.g. 250"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">Download URL (optional — if different from streaming URL)</Label>
                <Input
                  value={form.download_url || ""}
                  onChange={(e) => updateField("download_url", e.target.value)}
                  placeholder="Leave blank to use audio URL"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Cover Image */}
          <div>
            <Label className="text-xs">Cover Image</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={form.cover_image || ""}
                onChange={(e) => updateField("cover_image", e.target.value)}
                placeholder="https://..."
                className="flex-1"
              />
              <label className="cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, "cover_image")} />
                <Button type="button" variant="outline" className="gap-1" asChild>
                  <span><Upload size={14} /> Upload</span>
                </Button>
              </label>
            </div>
          </div>

          {/* Chapters */}
          <div className="border-t border-[#E4D9C4] pt-5">
            <AudiobookChapterEditor
              chapters={form.chapters || []}
              onChange={(chapters) => updateField("chapters", chapters)}
            />
          </div>

          {/* Access & Status */}
          <div className="border-t border-[#E4D9C4] pt-5">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={form.status || "draft"} onValueChange={(v) => updateField("status", v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Access Level</Label>
                <Select value={form.access_level || "product_gated"} onValueChange={(v) => updateField("access_level", v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="product_gated">Product Gated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Linked Product</Label>
                <Select value={form.product_id || ""} onValueChange={(v) => updateField("product_id", v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>None</SelectItem>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}{p.price ? ` ($${(p.price / 100).toFixed(2)})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2 mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1"
                    onClick={() => setShowCreateProduct(true)}
                    disabled={!form.title || !form.slug}
                  >
                    <DollarSign size={12} /> Create New Product
                  </Button>
                  {form.product_id && (
                    <a
                      href={`/ManagerProducts`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-[#D8B46B] hover:text-[#1E3A32] transition-colors pt-1"
                    >
                      View in Product Manager <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Save */}
          <div className="flex justify-between items-center gap-3 pt-4 border-t border-[#E4D9C4]">
            <span className="text-xs text-[#2B2725]/50">
              {autosaveStatus === 'saving' && '⟳ Saving...'}
              {autosaveStatus === 'saved' && '✓ Saved'}
              {autosaveStatus === 'draft-saved' && '✓ Draft backed up locally'}
              {!autosaveStatus && (isNew ? 'Draft auto-backed up locally' : 'Changes auto-save')}
            </span>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose}>{isNew ? "Cancel" : "Close"}</Button>
              {isNew && (
                <Button variant="outline" onClick={handleQuickSaveDraft} disabled={saving} className="gap-2">
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  Save as Draft
                </Button>
              )}
              <Button onClick={handleSave} disabled={saving} className="bg-[#1E3A32] hover:bg-[#2B2725] gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />}
                {isNew ? "Create Audiobook" : "Save & Close"}
              </Button>
            </div>
          </div>
        </div>

        {/* Resource Audio Picker */}
        <ResourceAudioPicker
          open={showResourcePicker}
          onClose={() => setShowResourcePicker(false)}
          onSelect={(resource) => {
            updateField("audio_url", resource.file_url);
            if (resource.id) updateField("resource_id", resource.id);
          }}
        />

        {/* Create Product Shortcut */}
        <CreateProductShortcut
          open={showCreateProduct}
          onClose={() => setShowCreateProduct(false)}
          audiobookTitle={form.title}
          audiobookSlug={form.slug}
          onProductCreated={(productId) => {
            updateField("product_id", productId);
            queryClient.invalidateQueries({ queryKey: ["products"] });
          }}
        />
      </DialogContent>
    </Dialog>
  );
}