import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, SendHorizonal } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import toast from "react-hot-toast";

const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"],
  ],
};

export default function SendIndividualEmailDialog({ open, onOpenChange, recipientEmail, recipientName }) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error("Subject and body are required");
      return;
    }
    setSending(true);
    try {
      const brandedHtml = `<div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #F9F5EF; padding: 0;">
  <div style="text-align: center; padding: 32px 24px 16px;">
    <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693a98b3e154ab3b36c88ebb/fad26f1a8_mind-stylist-whie-gold-logo2x.png" alt="Your Mind Stylist" style="height: 60px; width: auto;" />
  </div>
  <div style="background: white; border-radius: 12px; margin: 0 24px; padding: 32px 28px; border: 1px solid #E4D9C4;">
    ${body}
  </div>
  <div style="text-align: center; padding: 24px; color: #2B2725; opacity: 0.5; font-size: 12px;">
    <p style="margin: 0;">&copy; ${new Date().getFullYear()} Your Mind Stylist &middot; Las Vegas, NV</p>
    <p style="margin: 4px 0 0;"><a href="https://yourmindstylist.com" style="color: #6E4F7D;">yourmindstylist.com</a></p>
  </div>
</div>`;
      await base44.integrations.Core.SendEmail({
        to: recipientEmail,
        subject,
        body: brandedHtml,
        from_name: "Roberta Fernandez",
      });
      // Log the send for analytics
      try {
        await base44.entities.EmailSendLog.create({
          recipient_email: recipientEmail,
          recipient_name: recipientName || "",
          subject,
          email_type: "individual",
          send_type: "individual",
          provider: "base44",
          status: "sent",
          method: "platform",
        });
      } catch (_) { /* don't fail for logging */ }
      toast.success(`Email sent to ${recipientName || recipientEmail}`);
      setSubject("");
      setBody("");
      onOpenChange(false);
    } catch (err) {
      toast.error("Failed to send: " + (err.message || "Unknown error"));
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send Email to {recipientName || recipientEmail}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs text-[#2B2725]/60">To</Label>
            <p className="text-sm font-medium text-[#1E3A32]">{recipientEmail}</p>
          </div>
          <div>
            <Label>Subject</Label>
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
                modules={QUILL_MODULES}
                theme="snow"
                placeholder="Write your message..."
                style={{ minHeight: "200px" }}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={sending || !subject.trim() || !body.trim()}
              className="bg-[#1E3A32] hover:bg-[#2B2725] text-white"
            >
              {sending ? (
                <Loader2 size={14} className="animate-spin mr-2" />
              ) : (
                <SendHorizonal size={14} className="mr-2" />
              )}
              {sending ? "Sending..." : "Send Email"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}