import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";
import toast from "react-hot-toast";

export default function QuizSettingsEditor({ quiz }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (quiz) {
      setForm({
        title: quiz.title || "",
        slug: quiz.slug || "",
        subtitle: quiz.subtitle || "",
        intro: quiz.intro || "",
        framework_type: quiz.framework_type || "archetype",
        status: quiz.status || "draft",
        email_gate_enabled: quiz.email_gate_enabled ?? true,
        results_intro_text: quiz.results_intro_text || "",
        results_email_copy: quiz.results_email_copy || "",
        cta_text: quiz.cta_text || "",
        cta_product_id: quiz.cta_product_id || "",
        related_product_id: quiz.related_product_id || "",
        share_enabled: quiz.share_enabled ?? true,
        share_template: quiz.share_template || "",
        lead_magnet_enabled: quiz.lead_magnet_enabled ?? false,
        lead_magnet_title: quiz.lead_magnet_title || "",
        lead_magnet_description: quiz.lead_magnet_description || "",
      });
    }
  }, [quiz]);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.Quiz.update(quiz.id, form);
    queryClient.invalidateQueries({ queryKey: ["manager-quizzes"] });
    setSaving(false);
    toast.success("Quiz settings saved!");
  };

  const { data: products = [] } = useQuery({
    queryKey: ["products-for-quiz-settings"],
    queryFn: () => base44.entities.Product.filter({ product_subtype: "book" }),
  });

  return (
    <div className="bg-white border border-[#E4D9C4] p-6 space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="text-sm text-[#2B2725]/70 mb-1 block">Title</label>
          <Input value={form.title || ""} onChange={e => update("title", e.target.value)} className="border-[#E4D9C4]" />
        </div>
        <div>
          <label className="text-sm text-[#2B2725]/70 mb-1 block">URL Slug</label>
          <Input value={form.slug || ""} onChange={e => update("slug", e.target.value)} className="border-[#E4D9C4]" />
          <p className="text-xs text-[#2B2725]/40 mt-1">Public URL: /quiz/{form.slug}</p>
        </div>
        <div>
          <label className="text-sm text-[#2B2725]/70 mb-1 block">Subtitle</label>
          <Input value={form.subtitle || ""} onChange={e => update("subtitle", e.target.value)} className="border-[#E4D9C4]" />
        </div>
        <div>
          <label className="text-sm text-[#2B2725]/70 mb-1 block">Status</label>
          <Select value={form.status} onValueChange={v => update("status", v)}>
            <SelectTrigger className="border-[#E4D9C4]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="text-sm text-[#2B2725]/70 mb-1 block">Intro Text</label>
        <Textarea value={form.intro || ""} onChange={e => update("intro", e.target.value)} rows={3} className="border-[#E4D9C4]" />
        <p className="text-xs text-[#2B2725]/40 mt-1">Shown on the quiz start screen before questions begin.</p>
      </div>

      <div className="border-t border-[#E4D9C4] pt-6">
        <h3 className="font-serif text-lg text-[#1E3A32] mb-4">Email Gate & Results</h3>
        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={form.email_gate_enabled || false} onChange={e => update("email_gate_enabled", e.target.checked)} className="rounded" />
            <span className="text-sm text-[#2B2725]/80">Require email before showing results</span>
          </label>
          <div>
            <label className="text-sm text-[#2B2725]/70 mb-1 block">Results Intro Text</label>
            <Input value={form.results_intro_text || ""} onChange={e => update("results_intro_text", e.target.value)} className="border-[#E4D9C4]" placeholder="e.g., Now that you've met one of your dogs…" />
          </div>
          <div>
            <label className="text-sm text-[#2B2725]/70 mb-1 block">Email Gate Copy</label>
            <Textarea value={form.results_email_copy || ""} onChange={e => update("results_email_copy", e.target.value)} rows={2} className="border-[#E4D9C4]" />
          </div>
        </div>
      </div>

      <div className="border-t border-[#E4D9C4] pt-6">
        <h3 className="font-serif text-lg text-[#1E3A32] mb-4">CTA & Product Link</h3>
        <p className="text-xs text-[#2B2725]/50 mb-4">Link this quiz to a book so a call-to-action appears after results.</p>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-[#2B2725]/70 mb-1 block">CTA Button Text</label>
            <Input value={form.cta_text || ""} onChange={e => update("cta_text", e.target.value)} className="border-[#E4D9C4]" placeholder="e.g., Read Go Fetch Your Self" />
            <p className="text-xs text-[#2B2725]/40 mt-1">Text shown on the buy button at the end of results</p>
          </div>
          <div>
            <label className="text-sm text-[#2B2725]/70 mb-1 block">CTA Product (Book)</label>
            <Select value={form.cta_product_id || ""} onValueChange={v => update("cta_product_id", v)}>
              <SelectTrigger className="border-[#E4D9C4]"><SelectValue placeholder="Select a book..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>None</SelectItem>
                {products.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name} {p.price ? `($${(p.price / 100).toFixed(2)})` : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-[#2B2725]/40 mt-1">The book shown in the CTA after quiz results</p>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-[#2B2725]/70 mb-1 block">Related Product (Fallback)</label>
            <Select value={form.related_product_id || ""} onValueChange={v => update("related_product_id", v)}>
              <SelectTrigger className="border-[#E4D9C4]"><SelectValue placeholder="Select a book..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>None</SelectItem>
                {products.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name} {p.price ? `($${(p.price / 100).toFixed(2)})` : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-[#2B2725]/40 mt-1">Used if no CTA product is set above. Also used on quiz intro screens.</p>
          </div>
        </div>
      </div>

      <div className="border-t border-[#E4D9C4] pt-6">
        <h3 className="font-serif text-lg text-[#1E3A32] mb-4">Sharing & Lead Magnet</h3>
        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={form.share_enabled || false} onChange={e => update("share_enabled", e.target.checked)} className="rounded" />
            <span className="text-sm text-[#2B2725]/80">Enable social sharing</span>
          </label>
          <div>
            <label className="text-sm text-[#2B2725]/70 mb-1 block">Share Template</label>
            <Input value={form.share_template || ""} onChange={e => update("share_template", e.target.value)} className="border-[#E4D9C4]" placeholder="I'm the [archetype] — what's yours?" />
          </div>
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={form.lead_magnet_enabled || false} onChange={e => update("lead_magnet_enabled", e.target.checked)} className="rounded" />
            <span className="text-sm text-[#2B2725]/80">Offer downloadable lead magnet</span>
          </label>
          {form.lead_magnet_enabled && (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-[#2B2725]/70 mb-1 block">Lead Magnet Title</label>
                <Input value={form.lead_magnet_title || ""} onChange={e => update("lead_magnet_title", e.target.value)} className="border-[#E4D9C4]" />
              </div>
              <div>
                <label className="text-sm text-[#2B2725]/70 mb-1 block">Lead Magnet Description</label>
                <Input value={form.lead_magnet_description || ""} onChange={e => update("lead_magnet_description", e.target.value)} className="border-[#E4D9C4]" />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={saving} className="bg-[#1E3A32] hover:bg-[#2B2725] text-white px-8">
          {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
          Save Settings
        </Button>
      </div>
    </div>
  );
}