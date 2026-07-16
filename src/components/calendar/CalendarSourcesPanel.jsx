import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw, CheckCircle2, AlertTriangle, Calendar, Clock,
  ChevronDown, ChevronUp, Info, Shield, Globe, FileDown, Phone as PhoneIcon
} from "lucide-react";
import { format } from "date-fns";

function CalendarTypeLabel({ type }) {
  const config = {
    primary: { label: "Primary", className: "bg-teal-100 text-teal-800" },
    owned: { label: "Owned", className: "bg-blue-100 text-blue-800" },
    imported: { label: "Imported / iCal", className: "bg-amber-100 text-amber-800" },
    subscribed: { label: "Subscribed", className: "bg-indigo-100 text-indigo-800" },
  };
  const c = config[type] || { label: type, className: "bg-gray-100 text-gray-700" };
  return <Badge className={`text-[10px] ${c.className}`}>{c.label}</Badge>;
}

function RecommendationBadge({ recommendation, eventCount }) {
  if (recommendation === "disabled") {
    return (
      <Badge className="bg-gray-100 text-gray-500 border border-gray-200 text-[10px]">
        Disabled
      </Badge>
    );
  }
  if (eventCount === 0) {
    return (
      <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px]">
        Inactive — safe to review
      </Badge>
    );
  }
  if (recommendation === "review") {
    return (
      <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px]">
        Review
      </Badge>
    );
  }
  return (
    <Badge className="bg-green-50 text-green-700 border border-green-200 text-[10px]">
      Keep
    </Badge>
  );
}

function CalendarSourceRow({ cal, syncedBlocks }) {
  const blocksForCal = syncedBlocks[cal.display_name] || syncedBlocks[cal.calendar_id] || 0;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border-b border-[#E4D9C4] last:border-b-0">
      {/* Color dot + Name */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className="w-3 h-3 rounded-full flex-shrink-0 border"
          style={{ backgroundColor: cal.background_color || '#ccc' }}
        />
        <div className="min-w-0">
          <div className="font-medium text-sm text-[#1E3A32] truncate">
            {cal.display_name}
          </div>
          {cal.account_email && cal.account_email !== cal.display_name && (
            <div className="text-[11px] text-[#2B2725]/50 truncate">{cal.account_email}</div>
          )}
        </div>
      </div>

      {/* Type */}
      <div className="flex-shrink-0">
        <CalendarTypeLabel type={cal.type} />
      </div>

      {/* Sync status */}
      <div className="flex-shrink-0 text-center min-w-[70px]">
        {cal.disabled ? (
          <Badge className="bg-gray-100 text-gray-400 border border-gray-200 text-[10px]">
            Disabled
          </Badge>
        ) : cal.included_in_sync ? (
          <Badge className="bg-green-50 text-green-700 border border-green-200 text-[10px]">
            Syncing
          </Badge>
        ) : (
          <Badge className="bg-gray-50 text-gray-500 border border-gray-200 text-[10px]">
            Not synced
          </Badge>
        )}
      </div>

      {/* Event count */}
      <div className="flex-shrink-0 text-center min-w-[100px]">
        <span className={`text-sm font-medium ${cal.event_count_180d === 0 ? 'text-[#2B2725]/40' : 'text-[#1E3A32]'}`}>
          {cal.event_count_180d}
        </span>
        <span className="text-[10px] text-[#2B2725]/50 ml-1">events</span>
        {blocksForCal > 0 && (
          <span className="text-[10px] text-[#2B2725]/40 ml-1">({blocksForCal} blocks)</span>
        )}
      </div>

      {/* Recommendation */}
      <div className="flex-shrink-0 min-w-[130px] text-right">
        <RecommendationBadge recommendation={cal.recommendation} eventCount={cal.event_count_180d} />
      </div>
    </div>
  );
}

export default function CalendarSourcesPanel() {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  const { data: sourcesData, isLoading } = useQuery({
    queryKey: ["calendar-sources"],
    queryFn: async () => {
      const res = await base44.functions.invoke("getCalendarSources", {});
      return res.data;
    },
    staleTime: 60000,
  });

  // Manual sync
  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke("syncGoogleCalendarToAvailability", {});
      return res.data;
    },
    onSuccess: (data) => {
      setSyncResult(data);
      queryClient.invalidateQueries({ queryKey: ["blockedTimes"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-sync-rules"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-sources"] });
      setTimeout(() => setSyncResult(null), 12000);
    },
    onError: (err) => {
      setSyncResult({ error: err.message });
      setTimeout(() => setSyncResult(null), 10000);
    }
  });

  const calendars = sourcesData?.calendars || [];
  const lastSyncTime = sourcesData?.last_sync_time;
  const totalBlocks = sourcesData?.total_synced_blocks || 0;
  const syncedBlocks = sourcesData?.synced_blocks_by_calendar || {};
  const connected = sourcesData?.connected;

  return (
    <div className="bg-white border border-[#E4D9C4] shadow-sm mb-6">
      {/* Summary Bar */}
      <div className="p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-6 flex-wrap">
          {/* Connection status */}
          <div className="flex items-center gap-2">
            {connected ? (
              <CheckCircle2 size={18} className="text-green-600" />
            ) : (
              <AlertTriangle size={18} className="text-amber-500" />
            )}
            <span className="text-sm font-medium text-[#1E3A32]">
              {connected ? "Google Calendar connected" : "Google Calendar not connected"}
            </span>
          </div>

          {/* Last sync */}
          {lastSyncTime && (
            <div className="flex items-center gap-2 text-sm text-[#2B2725]/70">
              <Clock size={14} />
              <span>Last sync: {format(new Date(lastSyncTime), "MMM d, h:mm a")}</span>
            </div>
          )}

          {/* Calendar count */}
          {calendars.length > 0 && (
            <Badge variant="outline" className="text-xs">
              <Calendar size={12} className="mr-1" />
              {calendars.length} calendar{calendars.length !== 1 ? 's' : ''} · {totalBlocks} blocks
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-xs"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {expanded ? "Hide Sources" : "View Sources"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            className="flex items-center gap-2"
          >
            <RefreshCw size={14} className={syncMutation.isPending ? "animate-spin" : ""} />
            {syncMutation.isPending ? "Syncing..." : "Run Sync Now"}
          </Button>
        </div>
      </div>

      {/* Sync Result */}
      {syncResult && (
        <div className={`mx-4 mb-3 p-3 rounded text-sm ${
          syncResult.error
            ? "bg-red-50 text-red-700 border border-red-200"
            : "bg-green-50 text-green-700 border border-green-200"
        }`}>
          {syncResult.error ? (
            <span>Sync failed: {syncResult.error}</span>
          ) : (
            <span>
              ✓ Sync complete: {syncResult.synced_events || 0} events synced
              {syncResult.deleted_stale > 0 && `, ${syncResult.deleted_stale} stale removed`}
              {syncResult.calendars_synced && ` from ${syncResult.calendars_synced.length} calendar(s)`}
            </span>
          )}
        </div>
      )}

      {/* Expanded Sources Panel */}
      {expanded && (
        <div className="border-t border-[#E4D9C4]">
          {/* Explanation */}
          <div className="bg-[#F9F5EF] px-4 py-3 flex items-start gap-3">
            <Info size={16} className="text-[#D8B46B] mt-0.5 flex-shrink-0" />
            <p className="text-xs text-[#2B2725]/70 leading-relaxed">
              Your website blocks time based on synced Google Calendar events, manual blocks, and website bookings. 
              Some calendars may come from older imports or subscriptions. Review sources before disabling them.
            </p>
          </div>

          {/* Column Headers */}
          <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-[#F9F5EF]/50 border-b border-[#E4D9C4] text-[10px] text-[#2B2725]/50 uppercase tracking-wider font-medium">
            <div className="flex-1">Calendar</div>
            <div className="flex-shrink-0 w-[85px]">Type</div>
            <div className="flex-shrink-0 w-[70px] text-center">Sync</div>
            <div className="flex-shrink-0 w-[100px] text-center">Events (180d)</div>
            <div className="flex-shrink-0 w-[130px] text-right">Status</div>
          </div>

          {/* Calendar Rows */}
          {isLoading ? (
            <div className="p-6 text-center text-sm text-[#2B2725]/50">
              <RefreshCw size={16} className="animate-spin mx-auto mb-2" />
              Loading calendar sources...
            </div>
          ) : calendars.length === 0 ? (
            <div className="p-6 text-center text-sm text-[#2B2725]/50">
              No calendars found. Connect Google Calendar first.
            </div>
          ) : (
            calendars.map((cal) => (
              <CalendarSourceRow key={cal.id} cal={cal} syncedBlocks={syncedBlocks} />
            ))
          )}

          {/* Per-calendar annotations */}
          {calendars.length > 0 && (
            <div className="px-4 py-3 bg-[#F9F5EF]/30 border-t border-[#E4D9C4] space-y-2">
              {calendars.map((cal) => {
                if (cal.type === "primary") {
                  return (
                    <div key={cal.id} className="flex items-start gap-2 text-xs text-[#2B2725]/60">
                      <Shield size={12} className="text-teal-600 mt-0.5 flex-shrink-0" />
                      <span><strong>{cal.display_name}</strong> — Primary Google Calendar. This is the main calendar for the connected account.</span>
                    </div>
                  );
                }
                if (cal.type === "imported") {
                  return (
                    <div key={cal.id} className="flex items-start gap-2 text-xs text-[#2B2725]/60">
                      <FileDown size={12} className="text-amber-600 mt-0.5 flex-shrink-0" />
                      <span><strong>{cal.display_name}</strong> — Imported/iCal legacy feed. Contains {cal.event_count_180d} events. Review before disabling — currently the largest source of calendar blocks.</span>
                    </div>
                  );
                }
                if (cal.event_count_180d === 0) {
                  return (
                    <div key={cal.id} className="flex items-start gap-2 text-xs text-[#2B2725]/60">
                      <AlertTriangle size={12} className="text-amber-500 mt-0.5 flex-shrink-0" />
                      <span><strong>{cal.display_name}</strong> — Empty/inactive (0 events in 180 days). Candidate to disable, but will not be disabled automatically.</span>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}