import React, { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, SendHorizonal, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import toast from "react-hot-toast";
import { debounce } from "lodash";

const VARIABLES = [
  { key: "{{name}}", desc: "Recipient name" },
  { key: "{{email}}", desc: "Recipient email" },
  { key: "{{first_name}}", desc: "First name" },
  { key: "{{product_name}}", desc: "Product name" },
];

const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ align: [] }],
    ["link", "image"],
    ["clean"],
  ],
};

export default function StepEditorDialog({ open, onOpenChange, step, sequenceId, nextStepNumber, onSave, saving }) {
  const isEditing = !!step?.id;
  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [showTestInput, setShowTestInput] = useState(false);

  const handleSendTest = async () => {
    if (!testEmail?.trim()) {
      toast.error("Enter an email address");
      return;
    }
    if (!form.subject?.trim() || !form.body_html?.trim()) {
      toast.error("Subject and body are required to send a test");
      return;
    }
    setSendingTest(true);
    try {
      const res = await base44.functions.invoke("sendTestSequenceEmail", {
        to_email: testEmail.trim(),
        subject: form.subject,
        body_html: form.body_html,
        cta_text: form.cta_text,
        cta_url: form.cta_url,
        preview_text: form.preview_text,
      });
      toast.success(res.data.message || "Test email sent!");
    } catch (err) {
      toast.error("Failed to send test: " + (err.message || "Unknown error"));
    } finally {
      setSendingTest(false);
    }
  };

  const [form, setForm] = useState({
    sequence_id: sequenceId,
    step_number: nextStepNumber || 1,
    delay_days: 0,
    delay_hours: 0,
    subject: "",
    preview_text: "",
    body_html: "",
    cta_text: "",
    cta_url: "",
    active: true,
  });

  // --- Autosave for existing steps ---
  const [autoSaveStatus, setAutoSaveStatus] = useState(null); // null | 'saving' | 'saved'
  const autoSaveTimerRef = useRef(null);
  const lastSavedRef = useRef(null);

  const debouncedAutosave = useCallback(
    debounce(async (currentForm) => {
      if (!currentForm.id) return;
      if (!currentForm.subject?.trim() && !currentForm.body_html?.trim()) return;

      const formKey = JSON.stringify({
        subject: currentForm.subject, preview_text: currentForm.preview_text,
        body_html: currentForm.body_html, cta_text: currentForm.cta_text,
        cta_url: currentForm.cta_url, delay_days: currentForm.delay_days,
        delay_hours: currentForm.delay_hours,
      });
      if (formKey === lastSavedRef.current) return;

      setAutoSaveStatus('saving');
      try {
        await base44.entities.EmailSequenceStep.update(currentForm.id, {
          subject: currentForm.subject,
          preview_text: currentForm.preview_text,
          body_html: currentForm.body_html,
          cta_text: currentForm.cta_text,
          cta_url: currentForm.cta_url,
          delay_days: currentForm.delay_days,
          delay_hours: currentForm.delay_hours,
        });
        lastSavedRef.current = formKey;
        setAutoSaveStatus('saved');
        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = setTimeout(() => setAutoSaveStatus(null), 3000);
      } catch {
        setAutoSaveStatus(null);
      }
    }, 2000),
    []
  );

  useEffect(() => {
    if (open && form.id) debouncedAutosave(form);
    return () => debouncedAutosave.cancel();
  }, [form, open, debouncedAutosave]);

  useEffect(() => {
    if (step?.id) {
      setForm({ ...step });
    } else {
      setForm({
        sequence_id: sequenceId,
        step_number: nextStepNumber || 1,
        delay_days: 0,
        delay_hours: 0,
        subject: "",
        preview_text: "",
        body_html: "",
        cta_text: "",
        cta_url: "",
        active: true,
      });
    }
    lastSavedRef.current = null;
    setAutoSaveStatus(null);
  }, [step, sequenceId, nextStepNumber, open]);

  const handleSave = () => {
    if (!form.subject?.trim() || !form.body_html?.trim()) {
      toast.error("Subject and body are required");
      return;
    }
    debouncedAutosave.cancel();
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {isEditing ? "Edit Email Step" : "Add Email to Sequence"}
            {autoSaveStatus === 'saving' && (
              <span className="flex items-center gap-1 text-xs font-normal text-[#2B2725]/40">
                <Loader2 size={12} className="animate-spin" /> Saving...
              </span>
            )}
            {autoSaveStatus === 'saved' && (
              <span className="flex items-center gap-1 text-xs font-normal text-emerald-600">
                <Check size={12} /> Saved
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Timing */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Step Number</Label>
              <Input
                type="number"
                min={1}
                value={form.step_number}
                onChange={(e) => setForm({ ...form, step_number: parseInt(e.target.value) || 1 })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Delay (Days)</Label>
              <Input
                type="number"
                min={0}
                value={form.delay_days}
                onChange={(e) => setForm({ ...form, delay_days: parseInt(e.target.value) || 0 })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Delay (Hours)</Label>
              <Input
                type="number"
                min={0}
                max={23}
                value={form.delay_hours}
                onChange={(e) => setForm({ ...form, delay_hours: parseInt(e.target.value) || 0 })}
                className="mt-1"
              />
            </div>
          </div>

          {/* Subject */}
          <div>
            <Label>Subject Line</Label>
            <Input
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="e.g., {{first_name}}, here's your next step"
              className="mt-1"
            />
          </div>

          {/* Preview text */}
          <div>
            <Label>Preview Text <span className="text-[#2B2725]/40 font-normal">(optional)</span></Label>
            <Input
              value={form.preview_text || ""}
              onChange={(e) => setForm({ ...form, preview_text: e.target.value })}
              placeholder="Shown in inbox preview..."
              className="mt-1"
            />
          </div>

          {/* Variables */}
          <div className="bg-[#F9F5EF] rounded-lg p-3">
            <p className="text-xs font-semibold text-[#1E3A32] mb-2">Available Variables</p>
            <div className="flex flex-wrap gap-2">
              {VARIABLES.map((v) => (
                <button
                  key={v.key}
                  type="button"
                  className="text-xs bg-white px-2 py-1 rounded border border-[#E4D9C4] hover:border-[#D8B46B] transition-colors"
                  onClick={() => setForm({ ...form, body_html: (form.body_html || "") + ` ${v.key}` })}
                  title={v.desc}
                >
                  {v.key}
                </button>
              ))}
            </div>
          </div>

          {/* Body */}
          <div>
            <Label>Email Body</Label>
            <div className="border rounded-lg bg-white mt-1">
              <ReactQuill
                value={form.body_html || ""}
                onChange={(v) => setForm({ ...form, body_html: v })}
                modules={QUILL_MODULES}
                theme="snow"
                placeholder="Write your email..."
                style={{ minHeight: "250px" }}
              />
            </div>
          </div>

          {/* CTA */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>CTA Button Text <span className="text-[#2B2725]/40 font-normal">(optional)</span></Label>
              <Input
                value={form.cta_text || ""}
                onChange={(e) => setForm({ ...form, cta_text: e.target.value })}
                placeholder="Get Started"
                className="mt-1"
              />
            </div>
            <div>
              <Label>CTA Button URL <span className="text-[#2B2725]/40 font-normal">(optional)</span></Label>
              <Input
                value={form.cta_url || ""}
                onChange={(e) => setForm({ ...form, cta_url: e.target.value })}
                placeholder="https://..."
                className="mt-1"
              />
            </div>
          </div>

          {/* Send Test Email */}
          <div className="bg-[#F0EDE8] rounded-lg p-4 border border-[#E4D9C4]">
            {!showTestInput ? (
              <button
                type="button"
                onClick={() => setShowTestInput(true)}
                className="flex items-center gap-2 text-sm text-[#6E4F7D] hover:text-[#1E3A32] font-medium transition-colors"
              >
                <SendHorizonal size={15} />
                Send a test email to yourself
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-medium text-[#1E3A32]">Send Test Email</p>
                <p className="text-[11px] text-[#2B2725]/50">Variables will be replaced with sample data. Subject will be prefixed with [TEST].</p>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleSendTest}
                    disabled={sendingTest || !testEmail?.trim()}
                    className="bg-[#6E4F7D] hover:bg-[#5A3F69] text-white"
                  >
                    {sendingTest ? <Loader2 size={14} className="animate-spin mr-1" /> : <SendHorizonal size={14} className="mr-1" />}
                    {sendingTest ? "Sending..." : "Send Test"}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-[#1E3A32] hover:bg-[#2B2725] text-white">
              {saving && <Loader2 size={14} className="animate-spin mr-2" />}
              {isEditing ? "Save Changes" : "Add Email"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}