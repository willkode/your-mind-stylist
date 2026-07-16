import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, Users, XCircle, RefreshCw, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ManagerSubscriptionAnalytics() {
  const [timeRange, setTimeRange] = useState("30");

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["subscriptionEvents", timeRange],
    queryFn: async () => {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(timeRange));
      
      const allEvents = await base44.entities.ActivityLog.filter({
        event_category: "subscription_management"
      });
      
      return allEvents.filter(e => new Date(e.created_date) >= daysAgo);
    },
  });

  // Calculate metrics
  const metrics = {
    views: events.filter(e => e.event_type === 'subscription.view_subscriptions').length,
    cancellations: events.filter(e => e.event_type === 'subscription.cancel').length,
    reactivations: events.filter(e => e.event_type === 'subscription.reactivate').length,
    paymentUpdates: events.filter(e => e.event_type === 'subscription.update_payment').length,
  };

  // Calculate rates
  const cancellationRate = metrics.views > 0 
    ? ((metrics.cancellations / metrics.views) * 100).toFixed(1)
    : 0;

  const reactivationRate = metrics.cancellations > 0
    ? ((metrics.reactivations / metrics.cancellations) * 100).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-4xl text-[#1E3A32] mb-2">Subscription Analytics</h1>
            <p className="text-[#2B2725]/70">Track subscription management and retention</p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-[#2B2725]/70">
                <Users size={16} />
                Portal Views
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-[#1E3A32]">{metrics.views}</p>
              <p className="text-xs text-[#2B2725]/60 mt-1">Customer portal accessed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-[#2B2725]/70">
                <XCircle size={16} />
                Cancellations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-600">{metrics.cancellations}</p>
              <p className="text-xs text-red-600 mt-1">{cancellationRate}% of views</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-[#2B2725]/70">
                <RefreshCw size={16} />
                Reactivations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{metrics.reactivations}</p>
              <p className="text-xs text-green-600 mt-1">{reactivationRate}% of cancellations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-[#2B2725]/70">
                <Calendar size={16} />
                Payment Updates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-[#1E3A32]">{metrics.paymentUpdates}</p>
              <p className="text-xs text-[#2B2725]/60 mt-1">Payment methods updated</p>
            </CardContent>
          </Card>
        </div>

        {/* Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp size={20} />
              Key Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-[#F9F5EF] rounded">
                <h3 className="font-medium text-[#1E3A32] mb-2">Retention Health</h3>
                <p className="text-[#2B2725]/80">
                  {cancellationRate < 5 
                    ? "🟢 Excellent retention rate. Subscribers are highly satisfied."
                    : cancellationRate < 10
                    ? "🟡 Good retention rate, but watch for trends."
                    : "🔴 High cancellation rate. Consider reaching out to understand why."}
                </p>
              </div>

              <div className="p-4 bg-[#F9F5EF] rounded">
                <h3 className="font-medium text-[#1E3A32] mb-2">Win-back Rate</h3>
                <p className="text-[#2B2725]/80">
                  {reactivationRate > 20
                    ? "🟢 Strong win-back performance. Your retention campaigns are working."
                    : reactivationRate > 10
                    ? "🟡 Moderate reactivation rate. Room for improvement in win-back efforts."
                    : "🔴 Low reactivation rate. Consider implementing win-back campaigns."}
                </p>
              </div>

              {metrics.paymentUpdates > metrics.cancellations && (
                <div className="p-4 bg-green-50 border border-green-200 rounded">
                  <h3 className="font-medium text-green-900 mb-2">✅ Positive Signal</h3>
                  <p className="text-green-800">
                    More payment updates than cancellations suggests users are choosing to stay and fix payment issues rather than cancel.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}