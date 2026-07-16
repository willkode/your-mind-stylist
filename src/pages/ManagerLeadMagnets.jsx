import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Download, ExternalLink, Upload, X } from "lucide-react";
import { createPageUrl } from "@/utils";

const EMPTY_FORM = {
  title: "",
  slug: "",
  description: "",
  file_url: "",
  thumbnail: "",
  category: "Mindset",
  mailerlite_group_id: "",
  benefits: ["", "", ""],
  cta_text: "Get Your Free Download",
  show_on_blog: false,
  show_on_homepage: false,
  show_on_programs: false,
  show_on_products: false,
  active: true,
};

export default function ManagerLeadMagnets() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["leadMagnets"],
    queryFn: () => base44.entities.LeadMagnet.list("-created_date"),
  });

  const { data: downloads = [] } = useQuery({
    queryKey: ["leadMagnetDownloads"],
    queryFn: () => base44.entities.LeadMagnetDownload.list("-created_date", 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.LeadMagnet.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["leadMagnets"] }); close(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LeadMagnet.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["leadMagnets"] }); close(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.LeadMagnet.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leadMagnets"] }),
  });

  const close = () => { setIsOpen(false); setEditing(null); setForm(EMPTY_FORM); };

  const openEdit = (item) => {
    setEditing(item);
    setForm({ ...EMPTY_FORM, ...item, benefits: item.benefits?.length ? item.benefits : ["", "", ""] });
    setIsOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...form, benefits: form.benefits.filter(Boolean) };
    if (editing) {
      updateMutation.mutate({ id: editing.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    if (type === "file") setUploading(true);
    else setUploadingThumb(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    if (type === "file") { setForm(f => ({ ...f, file_url })); setUploading(false); }
    else { setForm(f => ({ ...f, thumbnail: file_url })); setUploadingThumb(false); }
  };

  const autoSlug = (title) => title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const downloadCountFor = (id) => downloads.filter(d => d.lead_magnet_id === id).length;

  return (
    <div className="min-h-screen bg-[#F9F5EF] py-10 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-serif text-3xl text-[#1E3A32]">Lead Magnets</h1>
            <p className="text-[#2B2725]/60 mt-1 text-sm">Free downloads to grow your email list</p>
          </div>
          <Button onClick={() => setIsOpen(true)} className="bg-[#1E3A32] hover:bg-[#2B2725] text-[#F9F5EF]">
            <Plus size={18} className="mr-2" /> New Lead Magnet
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-[#2B2725]/50">Loading...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 bg-white">
            <p className="text-[#2B2725]/50 mb-4">No lead magnets yet</p>
            <Button onClick={() => setIsOpen(true)} className="bg-[#1E3A32] text-[#F9F5EF]">
              Create Your First Lead Magnet
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map(item => (
              <div key={item.id} className="bg-white p-6 flex gap-4 items-start">
                {item.thumbnail && (
                  <img src={item.thumbnail} alt={item.title} className="w-16 h-16 object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-medium text-[#1E3A32] text-lg">{item.title}</h3>
                      <p className="text-sm text-[#2B2725]/60 mt-0.5">{item.description}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                        <Edit size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500"
                        onClick={() => window.confirm(`Delete "${item.title}"?`) && deleteMutation.mutate(item.id)}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3 items-center">
                    <Badge variant="outline">{item.category}</Badge>
                    {item.show_on_blog && <Badge className="bg-[#A6B7A3]/20 text-[#1E3A32]">Blog CTA</Badge>}
                    {item.show_on_homepage && <Badge className="bg-[#D8B46B]/20 text-[#2B2725]">Homepage</Badge>}
                    {item.show_on_programs && <Badge className="bg-[#6E4F7D]/20 text-[#6E4F7D]">Programs</Badge>}
                    {item.show_on_products && <Badge className="bg-[#1E3A32]/10 text-[#1E3A32]">Products</Badge>}
                    {!item.active && <Badge variant="outline" className="text-red-500">Inactive</Badge>}
                    <span className="text-sm text-[#2B2725]/50 flex items-center gap-1">
                      <Download size={12} /> {downloadCountFor(item.id)} downloads
                    </span>
                    <a
                      href={createPageUrl(`LeadMagnetPage?slug=${item.slug}`)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[#1E3A32] underline flex items-center gap-1 ml-auto"
                    >
                      View Landing Page <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={isOpen} onOpenChange={(o) => { if (!o) close(); }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit" : "New"} Lead Magnet</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value, slug: f.slug || autoSlug(e.target.value) }))}
                  required
                />
              </div>
              <div>
                <Label>Slug (URL) *</Label>
                <Input
                  value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: autoSlug(e.target.value) }))}
                  required
                  placeholder="e.g. 5-mindset-shifts"
                />
                <p className="text-xs text-[#2B2725]/50 mt-1">Landing page: /lead-magnet/{form.slug || "your-slug"}</p>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                />
              </div>

              {/* File Upload */}
              <div>
                <Label>Downloadable File *</Label>
                {form.file_url ? (
                  <div className="flex items-center gap-2 mt-1">
                    <a href={form.file_url} target="_blank" rel="noreferrer" className="text-sm text-[#1E3A32] underline truncate">
                      File uploaded ✓
                    </a>
                    <Button type="button" variant="ghost" size="icon" onClick={() => setForm(f => ({ ...f, file_url: "" }))}>
                      <X size={14} />
                    </Button>
                  </div>
                ) : (
                  <label className="mt-1 flex items-center gap-2 cursor-pointer border border-dashed border-[#D8B46B]/50 p-3 hover:bg-[#F9F5EF]">
                    <Upload size={16} className="text-[#1E3A32]" />
                    <span className="text-sm text-[#2B2725]/70">{uploading ? "Uploading..." : "Click to upload PDF or file"}</span>
                    <input type="file" className="hidden" disabled={uploading} onChange={e => handleFileUpload(e, "file")} />
                  </label>
                )}
              </div>

              {/* Thumbnail */}
              <div>
                <Label>Cover Image (optional)</Label>
                {form.thumbnail ? (
                  <div className="flex items-center gap-2 mt-1">
                    <img src={form.thumbnail} alt="thumb" className="w-16 h-16 object-cover" />
                    <Button type="button" variant="ghost" size="icon" onClick={() => setForm(f => ({ ...f, thumbnail: "" }))}>
                      <X size={14} />
                    </Button>
                  </div>
                ) : (
                  <label className="mt-1 flex items-center gap-2 cursor-pointer border border-dashed border-[#D8B46B]/50 p-3 hover:bg-[#F9F5EF]">
                    <Upload size={16} className="text-[#1E3A32]" />
                    <span className="text-sm text-[#2B2725]/70">{uploadingThumb ? "Uploading..." : "Click to upload image"}</span>
                    <input type="file" accept="image/*" className="hidden" disabled={uploadingThumb} onChange={e => handleFileUpload(e, "thumb")} />
                  </label>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Mindset", "Hypnosis", "Emotional Intelligence", "Leadership", "Communication", "Relationships", "Other"].map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>CTA Button Text</Label>
                  <Input value={form.cta_text} onChange={e => setForm(f => ({ ...f, cta_text: e.target.value }))} />
                </div>
              </div>

              <div>
                <Label>MailerLite Group ID (optional)</Label>
                <Input
                  value={form.mailerlite_group_id}
                  onChange={e => setForm(f => ({ ...f, mailerlite_group_id: e.target.value }))}
                  placeholder="Paste the group ID from MailerLite"
                />
              </div>

              <div>
                <Label>Benefits (shown as bullet points)</Label>
                {form.benefits.map((b, i) => (
                  <Input
                    key={i}
                    value={b}
                    onChange={e => setForm(f => ({ ...f, benefits: f.benefits.map((x, j) => j === i ? e.target.value : x) }))}
                    placeholder={`Benefit ${i + 1}`}
                    className="mb-2"
                  />
                ))}
                <Button type="button" variant="ghost" size="sm" className="text-xs"
                  onClick={() => setForm(f => ({ ...f, benefits: [...f.benefits, ""] }))}>
                  + Add benefit
                </Button>
              </div>

              <div className="space-y-3 border-t pt-4">
                <p className="text-xs tracking-[0.15em] text-[#D8B46B] uppercase font-medium mb-1">Page Placements</p>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show at end of blog posts</Label>
                    <p className="text-xs text-[#2B2725]/50">Appears as CTA below every blog post</p>
                  </div>
                  <Switch checked={form.show_on_blog} onCheckedChange={v => setForm(f => ({ ...f, show_on_blog: v }))} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show on homepage</Label>
                    <p className="text-xs text-[#2B2725]/50">Featured section on the homepage</p>
                  </div>
                  <Switch checked={form.show_on_homepage} onCheckedChange={v => setForm(f => ({ ...f, show_on_homepage: v }))} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show on Programs page</Label>
                    <p className="text-xs text-[#2B2725]/50">Inline email capture form on the Programs page</p>
                  </div>
                  <Switch checked={form.show_on_programs} onCheckedChange={v => setForm(f => ({ ...f, show_on_programs: v }))} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show on Product pages</Label>
                    <p className="text-xs text-[#2B2725]/50">Inline email capture form on individual product pages</p>
                  </div>
                  <Switch checked={form.show_on_products} onCheckedChange={v => setForm(f => ({ ...f, show_on_products: v }))} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Active</Label>
                    <p className="text-xs text-[#2B2725]/50">Landing page is publicly accessible</p>
                  </div>
                  <Switch checked={form.active} onCheckedChange={v => setForm(f => ({ ...f, active: v }))} />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={close} className="flex-1">Cancel</Button>
                <Button type="submit" className="flex-1 bg-[#1E3A32] text-[#F9F5EF]">
                  {editing ? "Update" : "Create"} Lead Magnet
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}