import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Mail, Eye, MousePointer, UserX, AlertTriangle } from "lucide-react";

function StatCard({ icon: Icon, label, value, color = "text-[#1E3A32]", subValue }) {
  return (
    <div className="bg-white border border-[#E4D9C4] rounded-lg p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={14} className="text-[#2B2725]/40" />
        <span className="text-xs text-[#2B2725]/60">{label}</span>
      </div>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      {subValue && <p className="text-[10px] text-[#2B2725]/40 mt-0.5">{subValue}</p>}
    </div>
  );
}

export default function SequenceAnalytics({ sequences, allSteps, enrollments }) {
  // Aggregate stats
  const totalEnrolled = enrollments.length;
  const active = enrollments.filter((e) => e.status === "active").length;
  const churned = enrollments.filter((e) => e.status === "completed" || e.status === "churned").length;
  const unsubscribed = enrollments.filter((e) => e.status === "unsubscribed").length;
  const totalEmailsSent = enrollments.reduce((sum, e) => sum + (e.emails_sent || 0), 0);
  const churnRate = totalEnrolled > 0 ? Math.round((churned / totalEnrolled) * 100) : 0;

  // Per-sequence breakdown
  const sequenceBreakdown = sequences.map((seq) => {
    const seqSteps = allSteps.filter((s) => s.sequence_id === seq.id).sort((a, b) => a.step_number - b.step_number);
    const seqEnrollments = enrollments.filter((e) => e.sequence_id === seq.id);
    const seqActive = seqEnrollments.filter((e) => e.status === "active").length;
    const seqChurned = seqEnrollments.filter((e) => e.status === "completed" || e.status === "churned").length;
    const seqTotalSent = seqEnrollments.reduce((s, e) => s + (e.emails_sent || 0), 0);

    return {
      ...seq,
      steps: seqSteps,
      enrollmentCount: seqEnrollments.length,
      activeCount: seqActive,
      churnedCount: seqChurned,
      totalSent: seqTotalSent,
    };
  });

  return (
    <div className="space-y-6">
      {/* Global stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon={Users} label="Total Enrolled" value={totalEnrolled} />
        <StatCard icon={Users} label="Active" value={active} color="text-green-600" />
        <StatCard icon={AlertTriangle} label="Churned" value={churned} color="text-amber-600" />
        <StatCard icon={UserX} label="Unsubscribed" value={unsubscribed} color="text-red-500" />
        <StatCard icon={Mail} label="Emails Sent" value={totalEmailsSent} color="text-[#6E4F7D]" />
        <StatCard icon={AlertTriangle} label="Churn Rate" value={`${churnRate}%`} color="text-[#D8B46B]" />
      </div>

      {/* Per-sequence breakdown */}
      {sequenceBreakdown.length === 0 ? (
        <p className="text-center py-8 text-[#2B2725]/50 text-sm">No sequences to analyze yet.</p>
      ) : (
        <div className="space-y-4">
          {sequenceBreakdown.map((seq) => (
            <Card key={seq.id} className="border-[#E4D9C4]">
              <CardContent className="pt-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-serif text-lg text-[#1E3A32]">{seq.name}</h3>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px]">{seq.trigger_type}</Badge>
                      <Badge className={seq.active ? "bg-green-100 text-green-800 text-[10px]" : "bg-gray-100 text-gray-600 text-[10px]"}>
                        {seq.active ? "Active" : "Paused"}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-[#1E3A32] font-semibold">{seq.enrollmentCount} enrolled</p>
                    <p className="text-[#2B2725]/50 text-xs">{seq.totalSent} emails sent</p>
                  </div>
                </div>

                {/* Per-step metrics */}
                {seq.steps.length > 0 && (
                  <div className="bg-[#F9F5EF] rounded-lg p-3">
                    <p className="text-xs font-semibold text-[#1E3A32] mb-2">Step Performance</p>
                    <div className="space-y-2">
                      {seq.steps.map((step, i) => (
                        <div key={step.id} className="flex items-center gap-3 text-xs">
                          <Badge variant="outline" className="font-mono text-[10px] w-6 h-6 flex items-center justify-center p-0">
                            {i + 1}
                          </Badge>
                          <span className="flex-1 truncate text-[#2B2725]/70">{step.subject}</span>
                          <div className="flex gap-3 flex-shrink-0 text-[#2B2725]/60">
                            <span className="flex items-center gap-1">
                              <Mail size={10} /> {step.sent_count || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye size={10} /> {step.open_rate || 0}%
                            </span>
                            <span className="flex items-center gap-1">
                              <MousePointer size={10} /> {step.click_rate || 0}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Funnel mini-viz */}
                {seq.steps.length > 1 && seq.enrollmentCount > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-[#1E3A32] mb-2">Subscriber Funnel</p>
                    <div className="flex items-end gap-1 h-12">
                      {seq.steps.map((step, i) => {
                        const pct = seq.enrollmentCount > 0
                          ? Math.max(5, ((step.sent_count || 0) / seq.enrollmentCount) * 100)
                          : 5;
                        return (
                          <div
                            key={step.id}
                            className="bg-[#1E3A32]/20 rounded-t flex-1 relative group"
                            style={{ height: `${pct}%`, minHeight: "4px" }}
                            title={`Step ${i + 1}: ${step.sent_count || 0} sent`}
                          >
                            <div
                              className="absolute bottom-0 left-0 right-0 bg-[#1E3A32] rounded-t transition-all"
                              style={{ height: `${pct}%`, minHeight: "4px" }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}