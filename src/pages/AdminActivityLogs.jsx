import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollText, Loader2, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import RoleBadge from "@/components/admin/RoleBadge";

const ACTION_TYPES = [
  "record_created",
  "record_updated",
  "status_changed",
  "note_added",
  "note_edited",
  "note_deleted",
  "role_changed",
];

const ACTION_BADGE = {
  role_changed: "bg-[#6E4F7D]/15 text-[#6E4F7D]",
  note_added: "bg-[#D8B46B]/20 text-[#8a6d2f]",
  note_edited: "bg-[#D8B46B]/20 text-[#8a6d2f]",
  note_deleted: "bg-red-100 text-red-700",
  status_changed: "bg-amber-100 text-amber-700",
};

export default function AdminActivityLogs() {
  const [actor, setActor] = useState("");
  const [actionType, setActionType] = useState("all");
  const [entityType, setEntityType] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["activity-logs", actor, actionType, entityType, from, to],
    queryFn: async () => {
      const res = await base44.functions.invoke("adminActivity", {
        action: "list",
        actor: actor || undefined,
        action_type: actionType === "all" ? undefined : actionType,
        entity_type: entityType === "all" ? undefined : entityType,
        from: from || undefined,
        to: to || undefined,
      });
      return res.data;
    },
  });

  const logs = data?.logs || [];
  const entityTypes = [...new Set(logs.map((l) => l.entity_type).filter(Boolean))];

  const resetFilters = () => {
    setActor("");
    setActionType("all");
    setEntityType("all");
    setFrom("");
    setTo("");
  };

  return (
    <div className="min-h-screen bg-[#F9F5EF] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <ScrollText size={28} className="text-[#1E3A32]" />
          <h1 className="font-serif text-3xl md:text-4xl text-[#1E3A32]">Activity Logs</h1>
        </div>
        <p className="text-[#2B2725]/70 mb-8">
          Audit trail of staff actions — role changes, internal notes, and operational events.
        </p>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[180px]">
              <label className="text-xs text-[#2B2725]/60 mb-1 block">User (email)</label>
              <Input value={actor} onChange={(e) => setActor(e.target.value)} placeholder="Filter by user..." />
            </div>
            <div>
              <label className="text-xs text-[#2B2725]/60 mb-1 block">Action</label>
              <Select value={actionType} onValueChange={setActionType}>
                <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actions</SelectItem>
                  {ACTION_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-[#2B2725]/60 mb-1 block">Entity</label>
              <Select value={entityType} onValueChange={setEntityType}>
                <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All entities</SelectItem>
                  {entityTypes.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-[#2B2725]/60 mb-1 block">From</label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-[150px]" />
            </div>
            <div>
              <label className="text-xs text-[#2B2725]/60 mb-1 block">To</label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-[150px]" />
            </div>
            <Button variant="outline" onClick={resetFilters} className="border-[#E4D9C4]">
              <RotateCcw size={14} className="mr-2" /> Reset
            </Button>
          </div>
        </Card>

        {/* Log list */}
        {isLoading || isFetching ? (
          <div className="flex justify-center py-16">
            <Loader2 size={28} className="animate-spin text-[#D8B46B]" />
          </div>
        ) : logs.length === 0 ? (
          <Card className="p-12 text-center">
            <ScrollText size={40} className="mx-auto text-[#D8B46B] mb-4" />
            <p className="text-[#2B2725]/60">No activity logged yet — staff actions will appear here.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <Card key={log.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex-1 min-w-[240px]">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge className={`text-xs ${ACTION_BADGE[log.action_type || log.action] || "bg-[#A6B7A3]/20 text-[#1E3A32]"}`}>
                        {(log.action_type || log.action || "action").replace(/_/g, " ")}
                      </Badge>
                      {log.entity_type && (
                        <Badge variant="outline" className="text-xs">{log.entity_type}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-[#2B2725]">{log.details || log.target}</p>
                    {log.metadata?.before !== undefined && (
                      <p className="text-xs text-[#2B2725]/50 mt-1">
                        {String(log.metadata.before)} → {String(log.metadata.after)}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-sm text-[#1E3A32] font-medium">{log.actor}</span>
                      {log.actor_role && <RoleBadge role={log.actor_role} />}
                    </div>
                    <p className="text-xs text-[#2B2725]/50 mt-0.5">
                      {format(new Date(log.created_date), "MMM d, yyyy h:mm a")}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}