import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle2, AlertTriangle, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";

export default function CalendarTrustPanel() {
  const queryClient = useQueryClient();
  const [syncResult, setSyncResult] = useState(null);

  // Get availability settings for sync info
  const { data: settings = [] } = useQuery({
    queryKey: ["availability-settings"],
    queryFn: () => base44.entities.AvailabilitySettings.list(),
  });

  // Get calendar-synced rules to determine last sync time
  const { data: calendarRules = [] } = useQuery({
    queryKey: ["calendar-sync-rules"],
    queryFn: () => base44.entities.AvailabilityRule.filter({ source: "calendar_sync", active: true }),
  });

  // Find the most recent calendar sync rule to estimate last sync
  const lastSyncRule = calendarRules.length > 0
    ? calendarRules.reduce((latest, rule) => 
        new Date(rule.updated_date) > new Date(latest.updated_date) ? rule : latest
      )
    : null;

  const lastSyncTime = lastSyncRule?.updated_date;
  const syncedCalendars = settings[0]?.synced_calendars || [];
  const timezone = settings[0]?.timezone || "America/Los_Angeles";

  // Manual sync mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke("syncGoogleCalendarToAvailability", {});
      return res.data;
    },
    onSuccess: (data) => {
      setSyncResult(data);
      queryClient.invalidateQueries({ queryKey: ["blockedTimes"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-sync-rules"] });
      setTimeout(() => setSyncResult(null), 10000);
    },
    onError: (err) => {
      setSyncResult({ error: err.message });
      setTimeout(() => setSyncResult(null), 10000);
    }
  });

  const googleCalendarsCount = calendarRules.length;
  const hasGoogleSync = googleCalendarsCount > 0 || syncedCalendars.length > 0;

  return (
    <div className="bg-white border border-[#E4D9C4] shadow-sm p-4 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Sync Status */}
        <div className="flex items-center gap-6 flex-wrap">
          {/* Google Calendar Status */}
          <div className="flex items-center gap-2">
            {hasGoogleSync ? (
              <CheckCircle2 size={18} className="text-green-600" />
            ) : (
              <AlertTriangle size={18} className="text-amber-500" />
            )}
            <span className="text-sm font-medium text-[#1E3A32]">
              {hasGoogleSync ? "Google Calendar sync active" : "Google Calendar not synced"}
            </span>
          </div>

          {/* Last Sync Time */}
          {lastSyncTime && (
            <div className="flex items-center gap-2 text-sm text-[#2B2725]/70">
              <Clock size={14} />
              <span>Last sync: {format(new Date(lastSyncTime), "MMM d, h:mm a")}</span>
            </div>
          )}

          {/* Synced Events Count */}
          {googleCalendarsCount > 0 && (
            <Badge variant="outline" className="text-xs">
              <Calendar size={12} className="mr-1" />
              {googleCalendarsCount} Google event{googleCalendarsCount !== 1 ? 's' : ''} blocking
            </Badge>
          )}

          {/* Timezone */}
          <span className="text-xs text-[#2B2725]/50">
            Timezone: {timezone}
          </span>
        </div>

        {/* Run Sync Button */}
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

      {/* Sync Result Message */}
      {syncResult && (
        <div className={`mt-3 p-3 rounded text-sm ${
          syncResult.error 
            ? "bg-red-50 text-red-700 border border-red-200" 
            : "bg-green-50 text-green-700 border border-green-200"
        }`}>
          {syncResult.error ? (
            <span>Sync failed: {syncResult.error}</span>
          ) : (
            <span>
              ✓ Sync complete: {syncResult.rules_created || syncResult.synced_events || 0} events synced
              {syncResult.rules_deleted > 0 && `, ${syncResult.rules_deleted} stale removed`}
              {syncResult.calendars_synced && ` from ${syncResult.calendars_synced.length} calendar(s)`}
            </span>
          )}
        </div>
      )}
    </div>
  );
}