import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit2, Trash2, Copy, Loader2, FileText, X, ToggleLeft, ToggleRight } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import toast from "react-hot-toast";

const CATEGORY_LABELS = {
  marketing: "Marketing",
  newsletter: "Newsletter",
  follow_up: "Follow-Up",
  event: "Event",
  announcement: "Announcement",
  manager_notification: "Manager",
  user_notification: "User",
  admin_notification: "Admin",
  booking_reminder: "Booking Reminder",
};

const CATEGORY_COLORS = {
  marketing: "bg-purple-100 text-purple-800",
  newsletter: "bg-blue-100 text-blue-800",
  follow_up: "bg-amber-100 text-amber-800",
  event: "bg-pink-100 text-pink-800",
  announcement: "bg-emerald-100 text-emerald-800",
  booking_reminder: "bg-teal-100 text-teal-800",
};

const AVAILABLE_VARIABLES = [
  { key: "{{first_name}}", desc: "Lead's first name" },
  { key: "{{full_name}}", desc: "Lead's full name" },
  { key: "{{email}}", desc: "Lead's email" },
  { key: "{{company}}", desc: "Company/brand name" },
];

const BOOKING_VARIABLES = [
  { key: "{{client_name}}", desc: "Client full name" },
  { key: "{{first_name}}", desc: "Client first name" },
  { key: "{{service_name}}", desc: "Service/appointment type name" },
  { key: "{{date_time}}", desc: "Formatted date and time" },
  { key: "{{duration}}", desc: "Session duration in minutes" },
  { key: "{{zoom_link}}", desc: "Zoom join URL" },
  { key: "{{zoom_password}}", desc: "Zoom meeting password" },
  { key: "{{client_email}}", desc: "Client email address" },
  { key: "{{client_phone}}", desc: "Client phone number" },
  { key: "{{amount}}", desc: "Payment amount" },
  { key: "{{current_year}}", desc: "Current year" },
];

export default function EmailTemplateManager() {
  const queryClient = useQueryClient();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [filterCategory, setFilterCategory] = useState("all");

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["email-templates"],
    queryFn: () => base44.entities.EmailTemplate.list("-created_date", 100),
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (data.id) {
        return base44.entities.EmailTemplate.update(data.id, data);
      }
      return base44.entities.EmailTemplate.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      setEditorOpen(false);
      setEditingTemplate(null);
      toast.success("Template saved!");
    },
    onError: (e) => toast.error("Failed: " + e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.EmailTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast.success("Template deleted");
    },
  });

  const filtered = templates.filter(t => {
    if (filterCategory === "all") return true;
    return t.category === filterCategory;
  });

  const marketingCategories = ["marketing", "newsletter", "follow_up", "event", "announcement", "user_notification", "manager_notification", "booking_reminder"];

  const openEditor = (template = null) => {
    setEditingTemplate(template ? { ...template } : {
      key: "",
      name: "",
      category: "marketing",
      subject: "",
      body: "",
      variables: ["{{first_name}}", "{{full_name}}"],
      active: true,
    });
    setEditorOpen(true);
  };

  const duplicateTemplate = (template) => {
    openEditor({
      ...template,
      id: undefined,
      key: template.key + "-copy",
      name: template.name + " (Copy)",
      is_starter: false,
    });
  };

  return (
    <div className="space-y-6">
      {/* Actions bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button onClick={() => openEditor()} className="bg-[#1E3A32] hover:bg-[#2B2725] text-white">
          <Plus size={16} className="mr-1" /> New Template
        </Button>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {marketingCategories.map(c => (
              <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-[#2B2725]/50 ml-auto">
          {filtered.length} template{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Templates grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-[#D8B46B]" size={24} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <FileText size={48} className="mx-auto text-[#2B2725]/20 mb-4" />
          <p className="text-[#2B2725]/60 mb-4">No templates yet. Create one or seed starter templates.</p>
          <Button onClick={() => openEditor()} variant="outline">
            <Plus size={16} className="mr-1" /> Create Your First Template
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((tpl) => (
            <div key={tpl.id} className="bg-white border border-[#E4D9C4] rounded-lg p-5 hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-[#1E3A32] truncate">{tpl.name}</h3>
                  <p className="text-xs text-[#2B2725]/50 truncate mt-1">{tpl.subject}</p>
                </div>
                <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                  {tpl.is_starter && (
                    <Badge className="bg-[#D8B46B]/10 text-[#D8B46B] text-[10px]">Starter</Badge>
                  )}
                  {tpl.active === false && (
                    <Badge className="bg-red-100 text-red-600 text-[10px]">Inactive</Badge>
                  )}
                </div>
              </div>
              <Badge className={`text-[10px] ${CATEGORY_COLORS[tpl.category] || "bg-gray-100 text-gray-600"}`}>
                {CATEGORY_LABELS[tpl.category] || tpl.category}
              </Badge>
              {tpl.variables?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {tpl.variables.slice(0, 3).map(v => (
                    <span key={v} className="text-[9px] bg-[#F9F5EF] text-[#2B2725]/50 px-1.5 py-0.5 rounded">
                      {v}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-1 mt-4 pt-3 border-t border-[#E4D9C4]/60 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openEditor(tpl)}>
                  <Edit2 size={12} className="mr-1" /> Edit
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => duplicateTemplate(tpl)}>
                  <Copy size={12} className="mr-1" /> Duplicate
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-red-500 hover:text-red-700 ml-auto"
                  onClick={() => {
                    if (confirm(`Delete "${tpl.name}"?`)) deleteMutation.mutate(tpl.id);
                  }}
                >
                  <Trash2 size={12} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Template Editor Dialog */}
      {editorOpen && editingTemplate && (
        <TemplateEditorDialog
          open={editorOpen}
          onOpenChange={(v) => { if (!v) { setEditorOpen(false); setEditingTemplate(null); } }}
          template={editingTemplate}
          onSave={(data) => saveMutation.mutate(data)}
          saving={saveMutation.isPending}
        />
      )}
    </div>
  );
}

function TemplateEditorDialog({ open, onOpenChange, template, onSave, saving }) {
  const [form, setForm] = useState({ ...template });

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = () => {
    if (!form.name?.trim() || !form.subject?.trim()) {
      toast.error("Name and subject are required");
      return;
    }
    if (!form.key?.trim()) {
      form.key = form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    }
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template.id ? "Edit Template" : "New Email Template"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Template Name</Label>
              <Input value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="e.g., Monthly Newsletter" className="mt-1" />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => updateField("category", v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="newsletter">Newsletter</SelectItem>
                  <SelectItem value="follow_up">Follow-Up</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="announcement">Announcement</SelectItem>
                  <SelectItem value="user_notification">User Notification</SelectItem>
                  <SelectItem value="manager_notification">Manager Notification</SelectItem>
                  <SelectItem value="booking_reminder">Booking Reminder</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Subject Line</Label>
            <Input value={form.subject} onChange={(e) => updateField("subject", e.target.value)} placeholder="e.g., {{first_name}}, something special for you" className="mt-1" />
          </div>

          {/* Variables hint */}
          <div className="bg-[#F9F5EF] rounded-lg p-3">
            <p className="text-xs font-semibold text-[#1E3A32] mb-2">Available Variables (click to insert)</p>
            <div className="flex flex-wrap gap-2">
              {(form.category === "booking_reminder" ? BOOKING_VARIABLES : AVAILABLE_VARIABLES).map(v => (
                <button
                  key={v.key}
                  type="button"
                  className="text-xs bg-white px-2 py-1 rounded border border-[#E4D9C4] hover:border-[#D8B46B] transition-colors"
                  onClick={() => {
                    updateField("body", (form.body || "") + v.key);
                    if (!form.variables?.includes(v.key)) {
                      updateField("variables", [...(form.variables || []), v.key]);
                    }
                  }}
                  title={v.desc}
                >
                  {v.key}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Email Body</Label>
            <div className="border rounded-lg bg-white mt-1">
              <ReactQuill
                value={form.body || ""}
                onChange={(v) => updateField("body", v)}
                modules={{
                  toolbar: [
                    [{ header: [1, 2, 3, false] }],
                    ["bold", "italic", "underline", "strike"],
                    ["blockquote"],
                    [{ list: "ordered" }, { list: "bullet" }],
                    [{ align: [] }],
                    ["link", "image"],
                    ["clean"],
                  ],
                }}
                theme="snow"
                placeholder="Write your email template..."
                style={{ minHeight: "300px" }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 py-2">
            <Switch
              checked={form.active !== false}
              onCheckedChange={(v) => updateField("active", v)}
              id="template-active"
            />
            <Label htmlFor="template-active" className="text-sm cursor-pointer">
              {form.active !== false ? "Active" : "Inactive"}
            </Label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-[#1E3A32] hover:bg-[#2B2725] text-white">
              {saving ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
              {template.id ? "Save Changes" : "Create Template"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}