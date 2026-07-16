import React, { useState } from "react";
import { Mail, Send, Users, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import moment from "moment";

const TYPE_CONFIG = {
  individual: { label: "Individual", icon: Send, color: "bg-blue-100 text-blue-700" },
  mass_campaign: { label: "Mass Campaign", icon: Users, color: "bg-purple-100 text-purple-700" },
  sequence: { label: "Sequence", icon: Mail, color: "bg-green-100 text-green-700" },
};

export default function EmailSendHistory({ sendLogs }) {
  const [expanded, setExpanded] = useState(false);
  const displayLogs = expanded ? sendLogs : sendLogs.slice(0, 5);

  if (sendLogs.length === 0) {
    return (
      <div className="bg-white border border-[#E4D9C4] rounded-lg p-6 text-center">
        <Mail size={32} className="mx-auto text-[#2B2725]/20 mb-2" />
        <p className="text-sm text-[#2B2725]/50">No individual email sends logged yet</p>
        <p className="text-xs text-[#2B2725]/30 mt-1">Emails sent from the Leads or Users table will appear here</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E4D9C4] rounded-lg overflow-hidden">
      <div className="px-5 py-4 border-b border-[#E4D9C4] flex items-center justify-between">
        <div>
          <h3 className="font-serif text-lg text-[#1E3A32]">Email Send Log</h3>
          <p className="text-xs text-[#2B2725]/50">{sendLogs.length} total sends tracked</p>
        </div>
      </div>
      <div className="divide-y divide-[#E4D9C4]/50">
        {displayLogs.map((log) => {
          const config = TYPE_CONFIG[log.send_type] || TYPE_CONFIG.individual;
          const Icon = config.icon;
          return (
            <div key={log.id} className="px-5 py-3 flex items-center gap-3 hover:bg-[#F9F5EF]/50 transition-colors">
              <Icon size={14} className="text-[#2B2725]/40 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#1E3A32] truncate">{log.subject}</p>
                <p className="text-xs text-[#2B2725]/50 truncate">
                  To: {log.recipient_name ? `${log.recipient_name} (${log.recipient_email})` : log.recipient_email}
                  {log.recipient_count > 1 && ` + ${log.recipient_count - 1} more`}
                </p>
              </div>
              <Badge className={`${config.color} text-[10px] flex-shrink-0`}>{config.label}</Badge>
              <span className="text-[10px] text-[#2B2725]/40 flex-shrink-0 whitespace-nowrap">
                {moment(log.created_date).fromNow()}
              </span>
            </div>
          );
        })}
      </div>
      {sendLogs.length > 5 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-5 py-3 text-xs text-[#6E4F7D] hover:bg-[#F9F5EF]/50 transition-colors flex items-center justify-center gap-1 border-t border-[#E4D9C4]/50"
        >
          {expanded ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> Show all {sendLogs.length} sends</>}
        </button>
      )}
    </div>
  );
}