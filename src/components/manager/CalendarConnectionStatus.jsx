import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Calendar, CheckCircle, AlertTriangle, XCircle, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function CalendarConnectionStatus() {
  const [testing, setTesting] = useState(false);

  // Fetch the most recent sync logs to determine status
  const { data: recentLogs = [], refetch } = useQuery({
    queryKey: ["calendarSyncLogs"],
    queryFn: () => base44.entities.CalendarSyncLog.list("-created_date", 5),
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  const latestLog = recentLogs[0];
  const consecutiveFailures = latestLog?.status === 'failure' 
    ? (latestLog.consecutive_failures || 1)
    : 0;
  const isConnected = latestLog?.status === 'success';
  const isWarning = consecutiveFailures === 1;
  const isCritical = consecutiveFailures >= 2;
  const lastChecked = latestLog?.created_date 
    ? new Date(latestLog.created_date)
    : null;

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const res = await base44.functions.invoke("checkCalendarHealth", {});
      const result = res.data;
      if (result.connected) {
        toast.success("Google Calendar is connected and working.");
      } else {
        toast.error(result.error || "Google Calendar connection failed.");
      }
      refetch();
    } catch (err) {
      toast.error("Could not test calendar connection.");
    } finally {
      setTesting(false);
    }
  };

  const formatTimeAgo = (date) => {
    if (!date) return "Never checked";
    const mins = Math.floor((Date.now() - date.getTime()) / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  // Determine visual state
  let statusColor, statusBg, StatusIcon, statusText, statusDesc;
  if (!latestLog) {
    statusColor = "text-[#2B2725]/40";
    statusBg = "bg-[#F9F5EF]";
    StatusIcon = Calendar;
    statusText = "Not Checked";
    statusDesc = "Run a test to check connection";
  } else if (isCritical) {
    statusColor = "text-red-600";
    statusBg = "bg-red-50 border border-red-200";
    StatusIcon = XCircle;
    statusText = "Disconnected";
    statusDesc = `${consecutiveFailures} consecutive failures — ${latestLog.error_message || "needs reconnection"}`;
  } else if (isWarning) {
    statusColor = "text-amber-600";
    statusBg = "bg-amber-50 border border-amber-200";
    StatusIcon = AlertTriangle;
    statusText = "Warning";
    statusDesc = "Last sync attempt failed — monitoring";
  } else if (isConnected) {
    statusColor = "text-emerald-600";
    statusBg = "bg-emerald-50 border border-emerald-200";
    StatusIcon = CheckCircle;
    statusText = "Connected";
    statusDesc = `${latestLog.calendars_synced?.length || 0} calendars syncing`;
  } else {
    statusColor = "text-[#2B2725]/40";
    statusBg = "bg-[#F9F5EF]";
    StatusIcon = Calendar;
    statusText = "Unknown";
    statusDesc = "Run a test to check";
  }

  return (
    <div className={`p-4 rounded ${statusBg}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`mt-0.5 ${statusColor}`}>
            {isConnected ? <Wifi size={20} /> : isCritical ? <WifiOff size={20} /> : <StatusIcon size={20} />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-xs text-[#2B2725]/60 uppercase tracking-wide">Google Calendar</p>
              <span className={`text-xs font-medium ${statusColor}`}>{statusText}</span>
            </div>
            <p className="text-xs text-[#2B2725]/50 mt-1 truncate">{statusDesc}</p>
            {lastChecked && (
              <p className="text-[10px] text-[#2B2725]/30 mt-1">
                Last checked: {formatTimeAgo(lastChecked)}
              </p>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleTestConnection}
          disabled={testing}
          className="text-[#2B2725]/50 hover:text-[#1E3A32] shrink-0 h-8 w-8 p-0"
          title="Test calendar connection"
        >
          <RefreshCw size={14} className={testing ? "animate-spin" : ""} />
        </Button>
      </div>
    </div>
  );
}