import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function SendSMSDialog({ open, onOpenChange, lead, onSuccess }) {
  const [message, setMessage] = useState("");
  const [phoneNumber, setPhoneNumber] = useState(lead?.phone || "");

  const sendSMSMutation = useMutation({
    mutationFn: ({ to, message, lead_id }) =>
      base44.functions.invoke("sendSMS", { to, message, lead_id }),
    onSuccess: () => {
      toast.success("SMS sent!");
      setMessage("");
      if (onSuccess) onSuccess();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to send SMS");
    },
  });

  const handleSend = () => {
    if (!phoneNumber || !message) {
      toast.error("Phone number and message required");
      return;
    }

    sendSMSMutation.mutate({
      to: phoneNumber,
      message,
      lead_id: lead?.id,
    });
  };

  // SMS templates
  const templates = [
    {
      name: "Follow Up",
      text: `Hi ${lead?.full_name || "there"}! This is Roberta from Your Mind Stylist. I wanted to follow up on our conversation. When would be a good time to chat?`,
    },
    {
      name: "Quick Check-In",
      text: `Hi ${lead?.full_name || "there"}! Just checking in to see if you have any questions about Mind Styling. I'm here to help!`,
    },
    {
      name: "Booking Reminder",
      text: `Hi ${lead?.full_name || "there"}! Looking forward to our session. Let me know if you need to reschedule.`,
    },
  ];

  const charCount = message.length;
  const smsCount = Math.ceil(charCount / 160);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare size={20} />
            Send SMS to {lead?.full_name || lead?.email}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Phone Number</Label>
            <Input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div>
            <Label>Message</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="min-h-[150px]"
              maxLength={1600}
            />
            <div className="flex justify-between mt-1 text-xs text-[#2B2725]/60">
              <span>
                {charCount} characters • {smsCount} SMS segment{smsCount > 1 ? "s" : ""}
              </span>
              <span>${(smsCount * 0.0079).toFixed(4)} (estimate)</span>
            </div>
          </div>

          <div>
            <Label>Quick Templates</Label>
            <div className="flex gap-2 flex-wrap mt-2">
              {templates.map((template) => (
                <Button
                  key={template.name}
                  size="sm"
                  variant="outline"
                  onClick={() => setMessage(template.text)}
                >
                  {template.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={!phoneNumber || !message || sendSMSMutation.isPending}
            >
              {sendSMSMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={16} className="mr-2" />
                  Send SMS
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}