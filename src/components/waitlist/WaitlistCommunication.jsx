import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, MessageSquare, Phone, Clock } from "lucide-react";
import { format } from "date-fns";

export default function WaitlistCommunication({ entry, onUpdate }) {
  const [sending, setSending] = useState(false);
  const [messageType, setMessageType] = useState("email");
  const [message, setMessage] = useState("");

  const handleSend = async () => {
    if (!message.trim()) return;

    setSending(true);
    try {
      // Send email if email type
      if (messageType === "email") {
        await base44.functions.invoke("sendWaitlistEmail", {
          to: entry.user_email,
          subject: "Update on Your Booking Request",
          message
        });
      }

      // Log communication
      const updatedLog = [
        ...(entry.communication_log || []),
        {
          date: new Date().toISOString(),
          type: messageType,
          message,
          sent_by: (await base44.auth.me()).email
        }
      ];

      await base44.entities.WaitingList.update(entry.id, {
        communication_log: updatedLog,
        contacted_date: new Date().toISOString(),
        status: entry.status === 'waiting' ? 'contacted' : entry.status
      });

      setMessage("");
      if (onUpdate) onUpdate();
      alert("Message sent successfully");
    } catch (error) {
      console.error("Send error:", error);
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "email": return <Mail size={16} />;
      case "sms": return <MessageSquare size={16} />;
      case "call": return <Phone size={16} />;
      default: return <Clock size={16} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Send Message */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Send Message</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Message Type</Label>
            <Select value={messageType} onValueChange={setMessageType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="call">Call Log</SelectItem>
                <SelectItem value="note">Internal Note</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Message</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={messageType === "email" ? "Compose email message..." : "Enter message or notes..."}
              rows={6}
            />
          </div>

          <Button
            onClick={handleSend}
            disabled={sending || !message.trim()}
            className="w-full bg-[#1E3A32]"
          >
            {sending ? "Sending..." : "Send Message"}
          </Button>
        </CardContent>
      </Card>

      {/* Communication History */}
      {entry.communication_log && entry.communication_log.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Communication History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {entry.communication_log
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map((log, idx) => (
                  <div key={idx} className="flex gap-3 pb-3 border-b last:border-0">
                    <div className="flex-shrink-0 text-[#D8B46B]">
                      {getIcon(log.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-[#1E3A32] capitalize">
                          {log.type}
                        </span>
                        <span className="text-xs text-[#2B2725]/60">
                          {format(new Date(log.date), "MMM d, h:mm a")}
                        </span>
                      </div>
                      <p className="text-sm text-[#2B2725]/80 whitespace-pre-wrap">
                        {log.message}
                      </p>
                      {log.sent_by && (
                        <p className="text-xs text-[#2B2725]/60 mt-1">
                          By: {log.sent_by}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}