import React from "react";
import { Users, UserPlus, Eye, Clock, ArrowDownUp, BarChart3 } from "lucide-react";

function MetricCard({ icon: Icon, label, value, subtitle, color }) {
  return (
    <div className="bg-white rounded-xl border border-[#E4D9C4] p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-[#2B2725]/60 uppercase tracking-wider font-medium">{label}</p>
          <p className="text-2xl font-serif font-bold text-[#1E3A32] mt-1">{value}</p>
          {subtitle && <p className="text-xs text-[#2B2725]/50 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}m ${secs}s`;
}

function formatPercent(rate) {
  return `${(rate * 100).toFixed(1)}%`;
}

export default function WebAnalyticsOverview({ overview }) {
  if (!overview) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <MetricCard
        icon={Users}
        label="Total Visitors"
        value={overview.totalUsers.toLocaleString()}
        color="bg-[#1E3A32]/10 text-[#1E3A32]"
      />
      <MetricCard
        icon={UserPlus}
        label="New Users"
        value={overview.newUsers.toLocaleString()}
        color="bg-[#D8B46B]/20 text-[#D8B46B]"
      />
      <MetricCard
        icon={BarChart3}
        label="Sessions"
        value={overview.sessions.toLocaleString()}
        color="bg-[#6E4F7D]/10 text-[#6E4F7D]"
      />
      <MetricCard
        icon={Eye}
        label="Page Views"
        value={overview.pageViews.toLocaleString()}
        color="bg-[#A6B7A3]/30 text-[#1E3A32]"
      />
      <MetricCard
        icon={Clock}
        label="Avg. Session"
        value={formatDuration(overview.avgSessionDuration)}
        color="bg-[#E4D9C4]/50 text-[#2B2725]"
      />
      <MetricCard
        icon={ArrowDownUp}
        label="Bounce Rate"
        value={formatPercent(overview.bounceRate)}
        color="bg-red-50 text-red-500"
      />
    </div>
  );
}