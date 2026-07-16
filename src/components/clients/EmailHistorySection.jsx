import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Mail, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { format } from "date-fns";

const STATUS_ICONS = {
  sent: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
  failed: { icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
  unknown: { icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
};

const TYPE_LABELS = {
  invite: "Invite",
  resend_invite: "Resend Invite",
  booking_confirmation: "Booking Confirmation",
  booking_reminder: "Booking Reminder",
  enrollment: "Enrollment",
  individual: "Manual Email",
  mass_campaign: "Campaign",
  sequence: "Sequence",
  masterclass: "Masterclass",
  other: "Other",
};

export default function EmailHistorySection({ email }) {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["email-history", email],
    queryFn: () => base44.entities.EmailSendLog.filter({ recipient_email: email?.toLowerCase() }, "-created_date", 20),
    enabled: !!email,
    staleTime: 30000,
  });

  if (isLoading) {
    return (
      <div className="text-sm text-[#2B2725]/40 flex items-center gap-2">
        <Clock size={14} className="animate-pulse" /> Loading email history...
      </div>
    );
  }

  if (logs.length === 0) {
    return <p className="text-sm text-[#2B2725]/40 italic">No emails sent yet</p>;
  }

  return (
    <div className="space-y-2">
      {logs.map((log) => {
        const statusConfig = STATUS_ICONS[log.status] || STATUS_ICONS.unknown;
        const StatusIcon = statusConfig.icon;
        return (
          <div
            key={log.id}
            className={`flex items-start gap-3 p-2.5 rounded-lg ${statusConfig.bg}`}
          >
            <StatusIcon size={14} className={`${statusConfig.color} flex-shrink-0 mt-0.5`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-[#1E3A32] truncate">{log.subject}</span>
                <Badge className="text-[9px] bg-white/60 text-[#2B2725]/60">
                  {TYPE_LABELS[log.email_type] || log.email_type}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[#2B2725]/50 mt-0.5">
                <span>{format(new Date(log.created_date), "MMM d, h:mm a")}</span>
                <span>·</span>
                <span className="capitalize">{log.provider || "base44"}</span>
                {log.status === "failed" && log.error_message && (
                  <>
                    <span>·</span>
                    <span className="text-red-600 truncate">{log.error_message}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}