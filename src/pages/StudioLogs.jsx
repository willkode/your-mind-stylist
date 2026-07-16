import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, CheckCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";

export default function StudioLogs() {
  const [filter, setFilter] = useState("all");

  const { data: activityLogs = [], isLoading } = useQuery({
    queryKey: ["activityLogs"],
    queryFn: () => base44.entities.ActivityLog.list("-created_date", 100),
  });

  const filteredLogs = filter === "all" 
    ? activityLogs 
    : activityLogs.filter(log => log.action.toLowerCase().includes(filter));

  return (
    <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Activity size={32} className="text-[#1E3A32]" />
            <h1 className="font-serif text-4xl text-[#1E3A32]">Activity & App Logs</h1>
          </div>
          <p className="text-[#2B2725]/70">
            Read-only visibility so you know what's happening
          </p>
        </div>

        {/* System Status */}
        <div className="bg-white p-6 mb-6">
          <h2 className="font-serif text-2xl text-[#1E3A32] mb-4">System Status</h2>
          <div className="flex items-center gap-3">
            <CheckCircle size={24} className="text-[#A6B7A3]" />
            <div>
              <p className="font-medium text-[#1E3A32]">Portal Available</p>
              <p className="text-sm text-[#2B2725]/60">All systems operational</p>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white p-6 mb-6">
          <div className="flex items-center gap-4">
            <label className="text-sm text-[#2B2725]/70">Filter:</label>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activity</SelectItem>
                <SelectItem value="publish">Published Content</SelectItem>
                <SelectItem value="role">Role Changes</SelectItem>
                <SelectItem value="setting">Setting Changes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Activity Log */}
        <div className="bg-white overflow-hidden">
          <div className="px-6 py-4 bg-[#F9F5EF]">
            <h3 className="font-medium text-[#1E3A32]">Activity Log</h3>
          </div>
          {isLoading ? (
            <div className="p-12 text-center text-[#2B2725]/60">Loading logs...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-[#2B2725]/60">No activity logs yet.</div>
          ) : (
            <div className="divide-y divide-[#E4D9C4]">
              {filteredLogs.map((log) => (
                <div key={log.id} className="px-6 py-4 hover:bg-[#F9F5EF]/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-[#1E3A32] font-medium mb-1">{log.action}</p>
                      <div className="flex items-center gap-4 text-sm text-[#2B2725]/60">
                        <span>By: {log.actor}</span>
                        {log.target && <span>Target: {log.target}</span>}
                        <span>{format(new Date(log.created_date), "MMM d, yyyy 'at' h:mm a")}</span>
                      </div>
                      {log.details && (
                        <p className="text-sm text-[#2B2725]/70 mt-2">{log.details}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-[#D8B46B]/10 p-4 text-sm text-[#2B2725]/80">
          <strong>Note:</strong> These logs show high-level app activity only. Raw infrastructure logs and stack traces are not exposed here.
        </div>
      </div>
    </div>
  );
}