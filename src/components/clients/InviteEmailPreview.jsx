import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, Send, Mail } from "lucide-react";

function replaceVariables(text, vars) {
  let result = text || "";
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value || "");
  }
  return result;
}

const TEMPLATE_TYPES = [
  { value: "all", label: "All Templates" },
  { value: "previous_client", label: "Previous Client" },
  { value: "colleague", label: "Colleague" },
  { value: "hypnosis_student", label: "Hypnosis Student" },
  { value: "lens_participant", label: "LENS Participant" },
  { value: "course_buyer", label: "Course / Webinar Buyer" },
  { value: "custom", label: "Custom / General" },
];

export default function InviteEmailPreview({ open, onOpenChange, recipientName, recipientEmail, onConfirmSend, mode = "invite" }) {
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [subjectOverride, setSubjectOverride] = useState("");
  const [sending, setSending] = useState(false);
  const [templateTypeFilter, setTemplateTypeFilter] = useState("all");

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setSelectedTemplateId(null);
      setSubjectOverride("");
      setSending(false);
      setTemplateTypeFilter("all");
    }
  }, [open]);

  // Fetch invite-related templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["invite-email-templates"],
    queryFn: async () => {
      const all = await base44.entities.EmailTemplate.filter({ active: true });
      return all.filter(
        (t) => t.key === "platform_invite" || t.category === "user_notification"
      ).sort((a, b) => {
        if (a.key === "platform_invite") return -1;
        if (b.key === "platform_invite") return 1;
        return (a.name || "").localeCompare(b.name || "");
      });
    },
    enabled: open,
  });

  // Filter templates by type
  const filteredTemplates = templateTypeFilter === "all"
    ? templates
    : templates.filter((t) => {
        const key = t.key || "";
        if (templateTypeFilter === "custom") return key === "platform_invite" || (!key.startsWith("invite_"));
        return key === `invite_${templateTypeFilter}`;
      });

  // Auto-select the branded invite template
  useEffect(() => {
    if (templates.length > 0 && !selectedTemplateId) {
      const branded = templates.find((t) => t.key === "platform_invite");
      setSelectedTemplateId(branded?.id || templates[0].id);
    }
  }, [templates, selectedTemplateId]);

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);
  const firstName = recipientName?.split(" ")[0] || recipientEmail?.split("@")[0] || "there";
  const displayName = recipientName || recipientEmail?.split("@")[0] || "there";

  const previewVars = {
    name: displayName,
    first_name: firstName,
    user_name: displayName,
    login_link: "https://yourmindstylist.com/login",
    current_year: new Date().getFullYear().toString(),
  };

  const previewSubject = replaceVariables(
    subjectOverride || selectedTemplate?.subject || "Your Mind Stylist access from Roberta Fernandez",
    previewVars
  );
  const previewBody = replaceVariables(selectedTemplate?.body || "", previewVars);

  const handleSend = async () => {
    setSending(true);
    try {
      await onConfirmSend({
        templateId: selectedTemplateId,
        subject: previewSubject,
        body: previewBody,
        templateKey: selectedTemplate?.key,
      });
    } finally {
      setSending(false);
    }
  };

  const modeLabels = {
    invite: "Invite to Platform",
    invite_enroll: "Invite + Enroll",
    resend: "Resend Invite",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail size={20} className="text-[#6E4F7D]" />
            {modeLabels[mode] || "Preview Invite Email"}
          </DialogTitle>
          <DialogDescription>
            {mode === "invite_enroll"
              ? "This email directs the recipient to sign up at the login page using their invited email. Once they create their account, enrollment will be available."
              : "This email directs the recipient to sign up at the login page using their invited email address."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Type Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-[#2B2725]">Template Type</Label>
            <Select value={templateTypeFilter} onValueChange={setTemplateTypeFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATE_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Template Selector */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-[#2B2725]">Email Template</Label>
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-[#2B2725]/60">
                <Loader2 size={14} className="animate-spin" /> Loading templates...
              </div>
            ) : (
              <Select value={selectedTemplateId || ""} onValueChange={setSelectedTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {filteredTemplates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} {t.key === "platform_invite" ? "(Default)" : ""}
                    </SelectItem>
                  ))}
                  {filteredTemplates.length === 0 && (
                    <SelectItem value={null} disabled>No templates for this type</SelectItem>
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Recipient info */}
          <div className="flex items-center gap-3 p-3 bg-[#F9F5EF] rounded-lg text-sm">
            <span className="text-[#2B2725]/60">To:</span>
            <span className="font-medium text-[#1E3A32]">{displayName}</span>
            <span className="text-[#2B2725]/50">&lt;{recipientEmail}&gt;</span>
          </div>

          {/* Subject override */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-[#2B2725]">Subject Line</Label>
            <Input
              value={subjectOverride || selectedTemplate?.subject || "Your Mind Stylist access from Roberta Fernandez"}
              onChange={(e) => setSubjectOverride(e.target.value)}
              placeholder="Your Mind Stylist access from Roberta Fernandez"
            />
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-[#2B2725]">
              <Eye size={14} />
              Email Preview
            </div>
            <div
              className="border border-[#E4D9C4] rounded-lg overflow-hidden bg-[#F9F5EF]"
              style={{ maxHeight: "400px", overflowY: "auto" }}
            >
              <div dangerouslySetInnerHTML={{ __html: previewBody }} />
            </div>
          </div>

          {/* Info box */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            <strong>What happens next:</strong> The recipient clicks the button, then chooses <strong>"Sign up"</strong> on the login screen to create their account. They should use the same email address this invite is sent to.
            {mode === "invite_enroll" && (
              <span className="block mt-1">
                Once they create their account, you can enroll them in courses.
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={sending || !selectedTemplate}
              className="bg-[#6E4F7D] hover:bg-[#5A3F69] text-white"
            >
              {sending ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" /> Sending...
                </>
              ) : (
                <>
                  <Send size={16} className="mr-2" /> Send Invite
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}