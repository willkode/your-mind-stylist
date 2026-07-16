import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Send, Upload, X, Mail, CheckCircle2, Zap, Users } from "lucide-react";
import toast from "react-hot-toast";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import TemplatePicker from "./TemplatePicker";

export default function MassEmailDialog({ open, onOpenChange, leads }) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedStages, setSelectedStages] = useState([]);
  const [selectedSources, setSelectedSources] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [sendResult, setSendResult] = useState(null);
  const [templateApplied, setTemplateApplied] = useState(false);

  // Get unique tags, stages, sources from leads
  const allTags = [...new Set(leads.flatMap(l => l.tags || []))].sort();
  const stages = ["new", "contacted", "booked", "qualified", "proposal", "negotiation", "won", "lost"];
  const allSources = [...new Set(leads.map(l => l.source).filter(Boolean))].sort();

  // Fetch MailerLite groups
  const { data: groupsData } = useQuery({
    queryKey: ["mailerlite-groups"],
    queryFn: async () => {
      const res = await base44.functions.invoke("mailerLiteGetGroups", {});
      return res.data;
    },
    enabled: open,
  });

  const groups = groupsData?.groups || [];

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setSendResult(null);
      setTemplateApplied(false);
    }
  }, [open]);

  // Calculate filtered lead count
  const filteredLeadCount = leads.filter(lead => {
    const tagMatch = selectedTags.length === 0 || selectedTags.some(tag => lead.tags?.includes(tag));
    const stageMatch = selectedStages.length === 0 || selectedStages.includes(lead.stage);
    const sourceMatch = selectedSources.length === 0 || selectedSources.includes(lead.source);
    return tagMatch && stageMatch && sourceMatch;
  }).length;

  const handleUploadAttachment = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      for (const file of files) {
        const uploadedFile = await base44.integrations.Core.UploadFile({ file });
        setAttachments(prev => [...prev, { name: file.name, url: uploadedFile.file_url, size: file.size }]);
      }
    } catch (error) {
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error("Subject and message are required");
      return;
    }
    if (filteredLeadCount === 0 && !selectedGroupId) {
      toast.error("No leads match your filters");
      return;
    }

    setSending(true);
    setSendResult(null);
    try {
      const response = await base44.functions.invoke("sendMassEmailViaCRM", {
        subject,
        body,
        attachments,
        useMailerLite: true,
        groupId: selectedGroupId || undefined,
        filters: {
          tags: selectedTags,
          stages: selectedStages,
          sources: selectedSources,
        },
      });

      setSendResult(response.data);

      if (response.data.success) {
        toast.success(`Campaign sent to ${response.data.recipientCount} recipients via ${response.data.method === 'mailerlite' ? 'MailerLite' : 'email'}!`);
      }
    } catch (error) {
      toast.error(`Failed to send: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setSubject("");
    setBody("");
    setAttachments([]);
    setSelectedTags([]);
    setSelectedStages([]);
    setSelectedSources([]);
    setSelectedGroupId("");
    setSendResult(null);
    setTemplateApplied(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail size={20} className="text-[#D8B46B]" />
            Send Mass Email
            <span className="text-xs font-normal text-[#2B2725]/50 ml-2 flex items-center gap-1">
              <Zap size={12} className="text-[#D8B46B]" /> Powered by MailerLite
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Success state */}
        {sendResult?.success && !sendResult?.partial ? (
          <div className="text-center py-10">
            <CheckCircle2 size={56} className="mx-auto text-green-500 mb-4" />
            <h3 className="text-xl font-serif text-[#1E3A32] mb-2">Campaign Sent!</h3>
            <p className="text-[#2B2725]/70 mb-1">
              Your email was sent to <strong>{sendResult.recipientCount}</strong> recipients
            </p>
            <p className="text-xs text-[#2B2725]/50">
              {sendResult.method === 'mailerlite' ? 'Delivered via MailerLite with unsubscribe links and tracking' : 'Delivered via Resend'}
            </p>
            <Button onClick={handleClose} className="mt-6 bg-[#1E3A32] hover:bg-[#2B2725]">
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Template picker — show only if subject & body are empty */}
            {!templateApplied && !subject && !body && (
              <TemplatePicker
                onSelect={(tpl) => {
                  setSubject(tpl.subject || "");
                  setBody(tpl.body || "");
                  setTemplateApplied(true);
                }}
                onSkip={() => setTemplateApplied(true)}
              />
            )}

            {/* Audience targeting */}
            <div className="border rounded-lg p-4 bg-[#F9F5EF]/50">
              <h3 className="font-medium text-sm mb-4 flex items-center gap-2">
                <Users size={16} className="text-[#1E3A32]" />
                Target Audience
              </h3>

              {/* MailerLite Group */}
              <div className="mb-4">
                <Label className="text-xs font-semibold mb-2 block">Send to MailerLite Group (optional)</Label>
                <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="All filtered leads (no specific group)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>All filtered leads</SelectItem>
                    {groups.map(g => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name} ({g.active_count || 0} subscribers)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-[#2B2725]/40 mt-1">
                  Select a MailerLite group to send to an existing audience, or leave empty to use the filters below
                </p>
              </div>

              {!selectedGroupId && (
                <>
                  {/* Tags */}
                  {allTags.length > 0 && (
                    <div className="mb-4">
                      <Label className="text-xs font-semibold mb-2 block">By Tags</Label>
                      <div className="flex flex-wrap gap-2">
                        {allTags.map(tag => (
                          <label key={tag} className="flex items-center gap-1.5 cursor-pointer text-sm bg-white px-2 py-1 rounded border border-[#E4D9C4]">
                            <Checkbox
                              checked={selectedTags.includes(tag)}
                              onCheckedChange={(checked) => {
                                setSelectedTags(checked ? [...selectedTags, tag] : selectedTags.filter(t => t !== tag));
                              }}
                            />
                            {tag}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stages */}
                  <div className="mb-4">
                    <Label className="text-xs font-semibold mb-2 block">By Pipeline Stage</Label>
                    <div className="flex flex-wrap gap-2">
                      {stages.map(stage => {
                        const count = leads.filter(l => l.stage === stage).length;
                        if (count === 0) return null;
                        return (
                          <label key={stage} className="flex items-center gap-1.5 cursor-pointer text-sm bg-white px-2 py-1 rounded border border-[#E4D9C4]">
                            <Checkbox
                              checked={selectedStages.includes(stage)}
                              onCheckedChange={(checked) => {
                                setSelectedStages(checked ? [...selectedStages, stage] : selectedStages.filter(s => s !== stage));
                              }}
                            />
                            {stage} ({count})
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sources */}
                  {allSources.length > 0 && (
                    <div className="mb-4">
                      <Label className="text-xs font-semibold mb-2 block">By Source</Label>
                      <div className="flex flex-wrap gap-2">
                        {allSources.map(source => {
                          const count = leads.filter(l => l.source === source).length;
                          return (
                            <label key={source} className="flex items-center gap-1.5 cursor-pointer text-sm bg-white px-2 py-1 rounded border border-[#E4D9C4]">
                              <Checkbox
                                checked={selectedSources.includes(source)}
                                onCheckedChange={(checked) => {
                                  setSelectedSources(checked ? [...selectedSources, source] : selectedSources.filter(s => s !== source));
                                }}
                              />
                              {source.replace(/_/g, ' ')} ({count})
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="bg-white p-3 rounded-lg border border-[#D8B46B]/30 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#D8B46B]/10 flex items-center justify-center flex-shrink-0">
                      <Users size={18} className="text-[#D8B46B]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#1E3A32]">{filteredLeadCount} recipients</p>
                      <p className="text-[10px] text-[#2B2725]/50">
                        {selectedTags.length === 0 && selectedStages.length === 0 && selectedSources.length === 0
                          ? "All leads in your database"
                          : "Matching your filter criteria"}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Email Content */}
            <div className="space-y-4">
              <div>
                <Label>Subject Line</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Message</Label>
                <div className="border rounded-lg bg-white mt-1">
                  <ReactQuill
                    value={body}
                    onChange={setBody}
                    modules={{
                      toolbar: [
                        [{ header: [1, 2, 3, false] }],
                        ["bold", "italic", "underline", "strike"],
                        ["blockquote"],
                        [{ list: "ordered" }, { list: "bullet" }],
                        [{ align: [] }],
                        ["link", "image"],
                        ["clean"]
                      ]
                    }}
                    theme="snow"
                    placeholder="Write your message here..."
                    style={{ minHeight: "250px" }}
                  />
                </div>
              </div>

              {/* Attachments */}
              <div>
                <Label>Attachments (Optional)</Label>
                <div className="flex gap-2 mt-2">
                  <label className="flex-1">
                    <input type="file" multiple onChange={handleUploadAttachment} disabled={uploading} className="hidden" />
                    <Button asChild variant="outline" className="w-full cursor-pointer" disabled={uploading}>
                      <span>
                        {uploading ? (
                          <><Loader2 size={14} className="animate-spin mr-2" /> Uploading...</>
                        ) : (
                          <><Upload size={14} className="mr-2" /> Add Files</>
                        )}
                      </span>
                    </Button>
                  </label>
                </div>
                {attachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {attachments.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                        <span className="text-gray-700 truncate">{file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)</span>
                        <button onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700">
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-4 border-t">
              <p className="text-xs text-[#2B2725]/40">
                Sent via MailerLite with proper unsubscribe links &amp; tracking
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose} disabled={sending}>Cancel</Button>
                <Button
                  onClick={handleSend}
                  disabled={sending || (filteredLeadCount === 0 && !selectedGroupId)}
                  className="bg-[#1E3A32] hover:bg-[#2B2725] text-white"
                >
                  {sending ? (
                    <><Loader2 size={14} className="animate-spin mr-2" /> Sending Campaign...</>
                  ) : (
                    <><Send size={14} className="mr-2" /> Send Campaign</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}