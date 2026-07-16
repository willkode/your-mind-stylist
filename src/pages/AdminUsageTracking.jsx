import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Activity, Zap, User, Calendar, TrendingUp, Image, FileText, Search } from "lucide-react";
import moment from "moment";

const FEATURE_LABELS = {
  blog_content_generator: "Blog Content Generator",
  blog_summarizer: "Blog Summarizer",
  seo_analyzer: "SEO Analyzer",
  image_generator: "Image Generator",
  content_repurposer: "Content Repurposer",
  seo_optimizer: "SEO Optimizer",
  ai_helper: "AI Helper",
  other: "Other",
};

const FEATURE_COLORS = {
  blog_content_generator: "#6E4F7D",
  blog_summarizer: "#8B6B9D",
  seo_analyzer: "#1E3A32",
  image_generator: "#D8B46B",
  content_repurposer: "#A6B7A3",
  seo_optimizer: "#2B4A40",
  ai_helper: "#E4D9C4",
  other: "#999",
};

const FEATURE_ICONS = {
  blog_content_generator: FileText,
  blog_summarizer: FileText,
  seo_analyzer: Search,
  image_generator: Image,
  content_repurposer: FileText,
  seo_optimizer: TrendingUp,
  ai_helper: Zap,
  other: Activity,
};

export default function AdminUsageTracking() {
  const [timeRange, setTimeRange] = useState("30");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["integrationUsageLogs"],
    queryFn: () => base44.entities.IntegrationUsageLog.list("-created_date", 500),
  });

  const cutoff = useMemo(() => {
    return moment().subtract(parseInt(timeRange), "days").toDate();
  }, [timeRange]);

  const filteredLogs = useMemo(() => {
    return logs.filter(l => new Date(l.created_date) >= cutoff);
  }, [logs, cutoff]);

  // Aggregate by user
  const byUser = useMemo(() => {
    const map = {};
    filteredLogs.forEach(l => {
      if (!map[l.user_email]) map[l.user_email] = { email: l.user_email, name: l.user_name, count: 0, credits: 0 };
      map[l.user_email].count++;
      map[l.user_email].credits += (l.estimated_credits || 1);
    });
    return Object.values(map).sort((a, b) => b.credits - a.credits);
  }, [filteredLogs]);

  // Aggregate by feature
  const byFeature = useMemo(() => {
    const map = {};
    filteredLogs.forEach(l => {
      if (!map[l.feature]) map[l.feature] = { feature: l.feature, count: 0, credits: 0 };
      map[l.feature].count++;
      map[l.feature].credits += (l.estimated_credits || 1);
    });
    return Object.values(map).sort((a, b) => b.credits - a.credits);
  }, [filteredLogs]);

  // Aggregate by day
  const byDay = useMemo(() => {
    const map = {};
    filteredLogs.forEach(l => {
      const day = moment(l.created_date).format("MMM D");
      if (!map[day]) map[day] = { day, credits: 0 };
      map[day].credits += (l.estimated_credits || 1);
    });
    return Object.values(map).reverse();
  }, [filteredLogs]);

  const totalCredits = filteredLogs.reduce((sum, l) => sum + (l.estimated_credits || 1), 0);
  const totalCalls = filteredLogs.length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center">
        <p className="text-[#2B2725]/60">Loading usage data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl text-[#1E3A32] mb-1">Integration Usage Tracking</h1>
            <p className="text-[#2B2725]/60 text-sm">Monitor AI feature usage and estimated credit consumption</p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-[#2B2725]/60 flex items-center gap-2">
                <Zap size={16} className="text-[#D8B46B]" />
                Estimated Credits Used
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-[#1E3A32]">{totalCredits}</p>
              <p className="text-xs text-[#2B2725]/50 mt-1">in the last {timeRange} days</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-[#2B2725]/60 flex items-center gap-2">
                <Activity size={16} className="text-[#6E4F7D]" />
                Total AI Calls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-[#1E3A32]">{totalCalls}</p>
              <p className="text-xs text-[#2B2725]/50 mt-1">across all features</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-[#2B2725]/60 flex items-center gap-2">
                <User size={16} className="text-[#1E3A32]" />
                Active Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-[#1E3A32]">{byUser.length}</p>
              <p className="text-xs text-[#2B2725]/50 mt-1">unique users using AI features</p>
            </CardContent>
          </Card>
        </div>

        {/* Daily Usage Chart */}
        {byDay.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg text-[#1E3A32] flex items-center gap-2">
                <Calendar size={18} />
                Daily Credit Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={byDay}>
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="credits" fill="#6E4F7D" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* By Feature */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-[#1E3A32]">Usage by Feature</CardTitle>
            </CardHeader>
            <CardContent>
              {byFeature.length === 0 ? (
                <p className="text-[#2B2725]/50 text-sm">No usage data yet</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={byFeature}
                        dataKey="credits"
                        nameKey="feature"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ feature }) => FEATURE_LABELS[feature]?.split(" ")[0] || feature}
                      >
                        {byFeature.map((entry) => (
                          <Cell key={entry.feature} fill={FEATURE_COLORS[entry.feature] || "#999"} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [value + " credits", FEATURE_LABELS[name] || name]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-4">
                    {byFeature.map((f) => {
                      const Icon = FEATURE_ICONS[f.feature] || Activity;
                      return (
                        <div key={f.feature} className="flex items-center justify-between py-2 border-b border-[#E4D9C4] last:border-0">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: FEATURE_COLORS[f.feature] }} />
                            <Icon size={14} className="text-[#2B2725]/50" />
                            <span className="text-sm text-[#2B2725]">{FEATURE_LABELS[f.feature] || f.feature}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-[#2B2725]/50">{f.count} calls</span>
                            <Badge variant="outline" className="text-xs">{f.credits} credits</Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* By User */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-[#1E3A32]">Usage by User</CardTitle>
            </CardHeader>
            <CardContent>
              {byUser.length === 0 ? (
                <p className="text-[#2B2725]/50 text-sm">No usage data yet</p>
              ) : (
                <div className="space-y-3">
                  {byUser.map((u) => (
                    <div key={u.email} className="flex items-center justify-between py-3 border-b border-[#E4D9C4] last:border-0">
                      <div>
                        <p className="text-sm font-medium text-[#1E3A32]">{u.name || "Unknown"}</p>
                        <p className="text-xs text-[#2B2725]/50">{u.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-[#6E4F7D]">{u.credits}</p>
                        <p className="text-xs text-[#2B2725]/50">{u.count} calls</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Log */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg text-[#1E3A32]">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredLogs.length === 0 ? (
              <p className="text-[#2B2725]/50 text-sm">No activity in this time range</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredLogs.slice(0, 50).map((log) => {
                  const Icon = FEATURE_ICONS[log.feature] || Activity;
                  return (
                    <div key={log.id} className="flex items-center justify-between py-2 px-3 rounded hover:bg-[#F9F5EF] border-b border-[#E4D9C4]/50 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: (FEATURE_COLORS[log.feature] || "#999") + "20" }}>
                          <Icon size={14} style={{ color: FEATURE_COLORS[log.feature] || "#999" }} />
                        </div>
                        <div>
                          <p className="text-sm text-[#2B2725]">
                            <span className="font-medium">{log.user_name || log.user_email}</span>
                            {" used "}
                            <span className="text-[#6E4F7D]">{FEATURE_LABELS[log.feature] || log.feature}</span>
                          </p>
                          {log.details && <p className="text-xs text-[#2B2725]/50 truncate max-w-md">{log.details}</p>}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <Badge variant="outline" className="text-xs">{log.estimated_credits || 1} cr</Badge>
                        <p className="text-xs text-[#2B2725]/40 mt-1">{moment(log.created_date).fromNow()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}