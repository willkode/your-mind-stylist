import React from "react";
import { Mail, CheckCircle, Clock } from "lucide-react";

export default function EmailSequenceStatus({ signups }) {
  const totalSignups = signups.length;

  const sequences = [
    {
      name: "Confirmation Email",
      sent: signups.filter(s => s.confirmation_sent).length,
      icon: Mail,
      color: "#6E4F7D"
    },
    {
      name: "Reminder",
      sent: signups.filter(s => s.reminder_sent).length,
      icon: Clock,
      color: "#2D8CFF"
    },
    {
      name: "Follow-up 1 (Post-Watch)",
      sent: signups.filter(s => s.post_email_1_sent).length,
      icon: CheckCircle,
      color: "#A6B7A3"
    },
    {
      name: "Follow-up 2",
      sent: signups.filter(s => s.post_email_2_sent).length,
      icon: CheckCircle,
      color: "#D8B46B"
    },
    {
      name: "Follow-up 3 (Final)",
      sent: signups.filter(s => s.post_email_3_sent).length,
      icon: CheckCircle,
      color: "#1E3A32"
    }
  ];

  return (
    <div className="bg-white p-6 shadow-md">
      <h3 className="font-serif text-xl text-[#1E3A32] mb-6">Email Sequence Progress</h3>
      <div className="space-y-4">
        {sequences.map((seq, idx) => {
          const percentage = totalSignups > 0 ? (seq.sent / totalSignups) * 100 : 0;
          const Icon = seq.icon;
          
          return (
            <div key={idx}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon size={16} style={{ color: seq.color }} />
                  <span className="text-sm text-[#2B2725]">{seq.name}</span>
                </div>
                <span className="text-sm font-medium text-[#1E3A32]">
                  {seq.sent} / {totalSignups}
                </span>
              </div>
              <div className="h-2 bg-[#E4D9C4] rounded-full overflow-hidden">
                <div 
                  className="h-full transition-all duration-500"
                  style={{ 
                    width: `${percentage}%`,
                    backgroundColor: seq.color
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-6 border-t border-[#E4D9C4]">
        <div className="bg-[#F9F5EF] p-4">
          <h4 className="text-sm font-medium text-[#1E3A32] mb-2">Sequence Health</h4>
          <p className="text-xs text-[#2B2725]/70 leading-relaxed">
            Emails are sent automatically based on signup and watch events. Use the automation controls above to manually trigger emails if needed.
          </p>
        </div>
      </div>
    </div>
  );
}