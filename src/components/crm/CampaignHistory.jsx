import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Mail, Eye, MousePointer, UserMinus, AlertTriangle, Loader2, BarChart3 } from "lucide-react";
import moment from "moment";

export default function CampaignHistory() {
  const { data: campaignsData, isLoading } = useQuery({
    queryKey: ["mailerlite-campaigns"],
    queryFn: async () => {
      const res = await base44.functions.invoke("getMailerLiteCampaigns", { status: "sent", limit: 20 });
      return res.data;
    },
  });

  const campaigns = campaignsData?.campaigns || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="animate-spin text-[#D8B46B]" size={24} />
        <span className="ml-2 text-[#2B2725]/60">Loading campaigns...</span>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="text-center py-16">
        <BarChart3 size={48} className="mx-auto text-[#2B2725]/20 mb-4" />
        <p className="text-[#2B2725]/60 text-lg">No campaigns sent yet</p>
        <p className="text-[#2B2725]/40 text-sm mt-1">Campaigns sent via MailerLite will appear here with analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {campaigns.map((campaign) => (
        <div
          key={campaign.id}
          className="bg-white border border-[#E4D9C4] rounded-lg p-5 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-[#1E3A32] truncate">{campaign.subject}</h3>
              <p className="text-xs text-[#2B2725]/50 mt-1">
                {moment(campaign.sent_at).format("MMM D, YYYY · h:mm A")}
              </p>
            </div>
            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium flex-shrink-0 ml-3">
              Sent
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatBlock
              icon={Mail}
              label="Sent"
              value={campaign.stats.sent}
              color="#1E3A32"
            />
            <StatBlock
              icon={Eye}
              label="Opened"
              value={campaign.stats.unique_opens_count}
              sub={campaign.stats.open_rate ? `${(campaign.stats.open_rate * 100).toFixed(1)}%` : null}
              color="#D8B46B"
            />
            <StatBlock
              icon={MousePointer}
              label="Clicked"
              value={campaign.stats.unique_clicks_count}
              sub={campaign.stats.click_rate ? `${(campaign.stats.click_rate * 100).toFixed(1)}%` : null}
              color="#6E4F7D"
            />
            <StatBlock
              icon={UserMinus}
              label="Unsubs"
              value={campaign.stats.unsubscribes_count}
              color="#ef4444"
            />
            <StatBlock
              icon={AlertTriangle}
              label="Bounced"
              value={campaign.stats.bounces_count}
              color="#f59e0b"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function StatBlock({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="flex items-center gap-2 bg-[#F9F5EF] rounded-lg p-2.5">
      <Icon size={14} style={{ color }} className="flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-[#2B2725]/50">{label}</p>
        <p className="font-semibold text-sm text-[#1E3A32]">
          {value}
          {sub && <span className="text-xs font-normal text-[#2B2725]/50 ml-1">{sub}</span>}
        </p>
      </div>
    </div>
  );
}