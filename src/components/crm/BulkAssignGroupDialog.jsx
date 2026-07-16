import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, Users, CheckCircle2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

export default function BulkAssignGroupDialog({ open, onOpenChange, leads }) {
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [search, setSearch] = useState("");
  const [filterSource, setFilterSource] = useState("all");
  const [filterStage, setFilterStage] = useState("all");

  const { data: groupsData } = useQuery({
    queryKey: ["mailerlite-groups"],
    queryFn: async () => {
      const res = await base44.functions.invoke("mailerLiteGetGroups", {});
      return res.data;
    },
    enabled: open,
  });

  const groups = groupsData?.groups || [];
  const allSources = [...new Set(leads.map(l => l.source).filter(Boolean))].sort();
  const stages = ["new", "contacted", "booked", "qualified", "proposal", "negotiation", "won", "lost"];

  const filteredLeads = leads.filter(l => {
    if (!l.email) return false;
    const q = search.toLowerCase();
    const nameMatch = (l.full_name || l.first_name || l.email || "").toLowerCase().includes(q) ||
      (l.email || "").toLowerCase().includes(q);
    const sourceMatch = filterSource === "all" || l.source === filterSource;
    const stageMatch = filterStage === "all" || l.stage === filterStage;
    return nameMatch && sourceMatch && stageMatch;
  });

  const getDisplayName = (lead) => lead.full_name || lead.first_name || lead.email;

  const toggleLead = (id) => {
    setSelectedLeadIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedLeadIds.length === filteredLeads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(filteredLeads.map(l => l.id));
    }
  };

  const handleAssign = async () => {
    if (!selectedGroupId || selectedLeadIds.length === 0) {
      toast.error("Select a group and at least one lead");
      return;
    }
    setSending(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke("mailerLiteBulkAddToGroup", {
        leadIds: selectedLeadIds,
        groupId: selectedGroupId,
      });
      setResult(res.data);
      if (res.data.success) {
        toast.success(`Added ${res.data.addedCount} leads to group!`);
      }
    } catch (error) {
      toast.error("Failed: " + error.message);
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setSelectedLeadIds([]);
    setSelectedGroupId("");
    setResult(null);
    setSearch("");
    setFilterSource("all");
    setFilterStage("all");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users size={20} className="text-[#6E4F7D]" />
            Add Leads to MailerLite Group
          </DialogTitle>
        </DialogHeader>

        {result?.success ? (
          <div className="text-center py-10">
            <CheckCircle2 size={56} className="mx-auto text-green-500 mb-4" />
            <h3 className="text-xl font-serif text-[#1E3A32] mb-2">Done!</h3>
            <p className="text-[#2B2725]/70">
              Added <strong>{result.addedCount}</strong> of {result.totalRequested} leads to the group
            </p>
            <Button onClick={handleClose} className="mt-6 bg-[#1E3A32] hover:bg-[#2B2725]">Close</Button>
          </div>
        ) : (
          <>
            {/* Group selector */}
            <div className="space-y-3 pb-4 border-b border-[#E4D9C4]">
              <Label className="text-sm font-semibold">Select MailerLite Group</Label>
              <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Choose a group..." />
                </SelectTrigger>
                <SelectContent>
                  {groups.map(g => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name} ({g.active_count || 0} subscribers)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filters */}
            <div className="flex gap-3 pt-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2B2725]/40" size={14} />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search leads..."
                  className="pl-8 h-9 text-sm"
                />
              </div>
              <Select value={filterSource} onValueChange={setFilterSource}>
                <SelectTrigger className="w-36 h-9 text-sm">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  {allSources.map(s => (
                    <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStage} onValueChange={setFilterStage}>
                <SelectTrigger className="w-36 h-9 text-sm">
                  <SelectValue placeholder="Stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  {stages.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Select all */}
            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <Checkbox
                  checked={filteredLeads.length > 0 && selectedLeadIds.length === filteredLeads.length}
                  onCheckedChange={toggleAll}
                />
                Select all ({filteredLeads.length})
              </label>
              <span className="text-xs text-[#D8B46B] font-medium">
                {selectedLeadIds.length} selected
              </span>
            </div>

            {/* Lead list */}
            <div className="flex-1 overflow-y-auto border border-[#E4D9C4] rounded-lg divide-y divide-[#E4D9C4]/60 min-h-0 max-h-[300px]">
              {filteredLeads.map((lead) => (
                <label
                  key={lead.id}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#F9F5EF]/50 cursor-pointer"
                >
                  <Checkbox
                    checked={selectedLeadIds.includes(lead.id)}
                    onCheckedChange={() => toggleLead(lead.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1E3A32] truncate">{getDisplayName(lead)}</p>
                    <p className="text-xs text-[#2B2725]/50 truncate">{lead.email}</p>
                  </div>
                  {lead.source && (
                    <span className="text-[10px] bg-[#F9F5EF] text-[#2B2725]/60 px-2 py-0.5 rounded flex-shrink-0">
                      {lead.source.replace(/_/g, ' ')}
                    </span>
                  )}
                </label>
              ))}
              {filteredLeads.length === 0 && (
                <p className="text-center py-8 text-sm text-[#2B2725]/50">No leads match your filters</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t border-[#E4D9C4]">
              <Button variant="outline" onClick={handleClose} disabled={sending}>Cancel</Button>
              <Button
                onClick={handleAssign}
                disabled={sending || selectedLeadIds.length === 0 || !selectedGroupId}
                className="bg-[#6E4F7D] hover:bg-[#5A3F69] text-white"
              >
                {sending ? (
                  <><Loader2 size={14} className="animate-spin mr-2" /> Assigning...</>
                ) : (
                  <>Add {selectedLeadIds.length} Lead{selectedLeadIds.length !== 1 ? 's' : ''} to Group</>
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}