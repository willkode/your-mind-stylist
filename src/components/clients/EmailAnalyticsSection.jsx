import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Users, UserCheck, UserX, Mail, Send, TrendingUp, BarChart3 } from "lucide-react";
import SequenceAnalytics from "../sequences/SequenceAnalytics";
import EmailSendHistory from "./EmailSendHistory";

function StatCard({ icon: Icon, label, value, color = "text-[#1E3A32]", subValue }) {
  return (
    <div className="bg-white border border-[#E4D9C4] rounded-lg p-5">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={14} className="text-[#2B2725]/40" />
        <span className="text-xs text-[#2B2725]/60">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {subValue && <p className="text-[10px] text-[#2B2725]/40 mt-0.5">{subValue}</p>}
    </div>
  );
}

export default function EmailAnalyticsSection() {
  // Sequence data
  const { data: sequences = [], isLoading: seqLoading } = useQuery({
    queryKey: ["emailSequences"],
    queryFn: () => base44.entities.EmailSequence.list("-created_date"),
  });
  const { data: allSteps = [] } = useQuery({
    queryKey: ["emailSequenceSteps"],
    queryFn: () => base44.entities.EmailSequenceStep.list("-sequence_id", 500),
  });
  const { data: enrollments = [], isLoading: enrollLoading } = useQuery({
    queryKey: ["userEmailSequences"],
    queryFn: () => base44.entities.UserEmailSequence.list("-created_date", 500),
  });

  // Leads + Users for subscriber stats
  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: () => base44.entities.Lead.list("-created_date", 1000),
  });
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["admin-all-users"],
    queryFn: async () => {
      const res = await base44.functions.invoke("getAllUsers");
      return res.data?.users || [];
    },
  });

  // MailerLite campaigns
  const { data: campaignsData } = useQuery({
    queryKey: ["mailerlite-campaigns"],
    queryFn: async () => {
      const res = await base44.functions.invoke("getMailerLiteCampaigns", { status: "sent", limit: 50 });
      return res.data;
    },
  });

  // Individual email send logs
  const { data: sendLogs = [] } = useQuery({
    queryKey: ["emailSendLogs"],
    queryFn: () => base44.entities.EmailSendLog.list("-created_date", 500),
  });

  const loading = seqLoading || enrollLoading || leadsLoading || usersLoading;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin text-[#D8B46B]" size={24} />
      </div>
    );
  }

  // --- Compute holistic stats ---

  // Total Subscribers = all leads + all users, deduplicated by email
  const emailSet = new Set();
  leads.forEach(l => { if (l.email) emailSet.add(l.email.toLowerCase()); });
  users.forEach(u => { if (u.email) emailSet.add(u.email.toLowerCase()); });
  const totalSubscribers = emailSet.size;

  // Active = total subscribers minus "lost" stage leads
  const lostEmails = new Set();
  leads.filter(l => l.stage === "lost").forEach(l => { if (l.email) lostEmails.add(l.email.toLowerCase()); });
  const activeSubscribers = totalSubscribers - lostEmails.size;

  // Churned = lost stage leads
  const churnedCount = lostEmails.size;

  // Emails Sent = MailerLite campaign sends + individual send logs
  const campaigns = campaignsData?.campaigns || [];
  const campaignSends = campaigns.reduce((sum, c) => sum + (c.stats?.sent || 0), 0);
  const individualSends = sendLogs.filter(l => l.send_type === "individual").length;
  const massCrmSends = sendLogs.filter(l => l.send_type === "mass_campaign").length;
  const sequenceSends = enrollments.reduce((sum, e) => sum + (e.emails_sent || 0), 0);
  const totalEmailsSent = campaignSends + individualSends + sequenceSends;

  // Open/click rates from campaigns
  const totalOpens = campaigns.reduce((sum, c) => sum + (c.stats?.unique_opens_count || 0), 0);
  const avgOpenRate = campaignSends > 0 ? ((totalOpens / campaignSends) * 100).toFixed(1) : "—";

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-serif text-xl text-[#1E3A32]">Email Analytics</h2>
        <p className="text-sm text-[#2B2725]/60 mt-1">Holistic view across all email channels — campaigns, sequences, and individual sends</p>
      </div>

      {/* Top-level stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <StatCard
          icon={Users}
          label="Total Subscribers"
          value={totalSubscribers}
          subValue="Leads + Users (deduped)"
        />
        <StatCard
          icon={UserCheck}
          label="Active"
          value={activeSubscribers}
          color="text-green-600"
          subValue="Excluding lost leads"
        />
        <StatCard
          icon={UserX}
          label="Churned"
          value={churnedCount}
          color="text-red-500"
          subValue="Lost-stage leads"
        />
        <StatCard
          icon={Mail}
          label="Emails Sent"
          value={totalEmailsSent}
          color="text-[#6E4F7D]"
          subValue={`${campaignSends} campaigns · ${individualSends} individual · ${sequenceSends} sequences`}
        />
        <StatCard
          icon={Send}
          label="Individual Sends"
          value={individualSends + massCrmSends}
          color="text-[#D8B46B]"
          subValue={`${individualSends} one-to-one · ${massCrmSends} mass CRM`}
        />
        <StatCard
          icon={TrendingUp}
          label="Avg Open Rate"
          value={avgOpenRate === "—" ? avgOpenRate : `${avgOpenRate}%`}
          color="text-[#1E3A32]"
          subValue="From MailerLite campaigns"
        />
      </div>

      {/* Individual email send history */}
      <div className="mb-8">
        <EmailSendHistory sendLogs={sendLogs} />
      </div>

      {/* Sequence analytics */}
      <div className="mb-4">
        <h3 className="font-serif text-lg text-[#1E3A32] mb-1">Sequence Performance</h3>
        <p className="text-xs text-[#2B2725]/50 mb-4">Automated email sequence metrics</p>
      </div>
      <SequenceAnalytics sequences={sequences} allSteps={allSteps} enrollments={enrollments} />
    </div>
  );
}