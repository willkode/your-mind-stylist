import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import WebAnalyticsOverview from "@/components/analytics/WebAnalyticsOverview";
import WebAnalyticsTopPages from "@/components/analytics/WebAnalyticsTopPages";
import WebAnalyticsTrafficSources from "@/components/analytics/WebAnalyticsTrafficSources";
import WebAnalyticsEmptyState from "@/components/analytics/WebAnalyticsEmptyState";

const DATE_RANGES = [
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
];

export default function ManagerWebAnalytics() {
  const [days, setDays] = useState(30);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["webAnalytics", days],
    queryFn: async () => {
      const res = await base44.functions.invoke("getWebAnalytics", { days });
      return res.data;
    },
    staleTime: 5 * 60 * 1000, // 5 min cache
    retry: 1,
  });

  const hasData = data?.overview && (
    data.overview.totalUsers > 0 ||
    data.overview.sessions > 0 ||
    data.overview.pageViews > 0
  );

  return (
    <div className="min-h-screen bg-[#F9F5EF] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1E3A32]/10 rounded-lg flex items-center justify-center">
              <BarChart3 size={20} className="text-[#1E3A32]" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold text-[#1E3A32]">Website Analytics</h1>
              <p className="text-sm text-[#2B2725]/60">Traffic and visitor insights from Google Analytics</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Date Range Selector */}
            <div className="flex bg-white rounded-lg border border-[#E4D9C4] overflow-hidden">
              {DATE_RANGES.map((range) => (
                <button
                  key={range.value}
                  onClick={() => setDays(range.value)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    days === range.value
                      ? "bg-[#1E3A32] text-white"
                      : "text-[#2B2725]/70 hover:bg-[#F9F5EF]"
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>

            {/* Refresh */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              disabled={isFetching}
              className="border-[#E4D9C4]"
            >
              <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3 text-[#2B2725]/60">
              <RefreshCw size={20} className="animate-spin" />
              <span>Loading analytics data...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-700 font-medium mb-2">Unable to load analytics data</p>
            <p className="text-sm text-red-600/70 mb-4">{error.message || "Please try again."}</p>
            <Button variant="outline" onClick={() => refetch()} className="border-red-200 text-red-700">
              Try Again
            </Button>
          </div>
        )}

        {/* Not Connected State */}
        {!isLoading && !error && data?.notConnected && (
          <div className="bg-[#D8B46B]/10 border border-[#D8B46B]/30 rounded-xl p-8 text-center">
            <p className="text-[#1E3A32] font-medium mb-2">Google Analytics needs to be reconnected</p>
            <p className="text-sm text-[#2B2725]/60">
              The Google Analytics connection didn't carry over to this site. Once it's reconnected in the app settings, your traffic data will appear here automatically.
            </p>
          </div>
        )}

        {/* Data or Empty State */}
        {!isLoading && !error && !data?.notConnected && (
          <>
            {hasData && data.overview.totalUsers < 10 && (
              <div className="bg-[#D8B46B]/10 border border-[#D8B46B]/30 rounded-lg px-5 py-3 mb-6 text-sm text-[#2B2725]/70">
                Analytics began collecting on June 21, 2026. Data grows as visitors use your published site. It may take 24–48 hours for meaningful traffic data to appear.
              </div>
            )}
            {hasData ? (
              <div className="space-y-6">
                <WebAnalyticsOverview overview={data.overview} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <WebAnalyticsTopPages pages={data.topPages} />
                  <WebAnalyticsTrafficSources sources={data.trafficSources} />
                </div>
              </div>
            ) : (
              <WebAnalyticsEmptyState />
            )}
          </>
        )}
      </div>
    </div>
  );
}