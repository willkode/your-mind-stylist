import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Mail, Filter, Plus, Trash2, Upload, Info, Archive } from "lucide-react";
import LeadsDatabaseTable from "./LeadsDatabaseTable";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import LeadImport from "../manager/LeadImport";
import LeadDetailsDialog from "./LeadDetailsDialog.jsx";
import PersonDetailPanel from "./PersonDetailPanel";
import KajabiImportModal from "./KajabiImportModal";
import AddLeadDialog from "./AddLeadDialog";
import { UserCheck } from "lucide-react";

export default function LeadsSection({ leads, users, isLoading }) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [selectedLead, setSelectedLead] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [kajabiDialogOpen, setKajabiDialogOpen] = useState(false);
  const [addLeadDialogOpen, setAddLeadDialogOpen] = useState(false);
  const [personPanelOpen, setPersonPanelOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [showArchived, setShowArchived] = useState(false);

  const stages = ["new", "contacted", "booked", "qualified", "proposal", "negotiation", "won", "lost"];
  const stageLabels = {
    new: "New",
    contacted: "Contacted",
    booked: "Booked",
    qualified: "Qualified",
    proposal: "Proposal",
    negotiation: "Negotiation",
    won: "Won",
    lost: "Lost",
  };

  const stageColors = {
    new: "bg-blue-100 text-blue-800",
    contacted: "bg-purple-100 text-purple-800",
    qualified: "bg-green-100 text-green-800",
    proposal: "bg-yellow-100 text-yellow-800",
    negotiation: "bg-orange-100 text-orange-800",
    won: "bg-emerald-100 text-emerald-800",
    lost: "bg-gray-100 text-gray-600",
  };

  const createLeadMutation = useMutation({
    mutationFn: (data) => base44.entities.Lead.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setAddLeadDialogOpen(false);
      toast.success("Lead added!");
    },
  });

  const deleteLeadMutation = useMutation({
    mutationFn: (id) => base44.entities.Lead.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead deleted");
    },
  });

  // Helper to get full name
  const getFullName = (lead) => {
    if (lead.full_name) return lead.full_name;
    if (lead.first_name && lead.last_name) return `${lead.first_name} ${lead.last_name}`;
    if (lead.first_name) return lead.first_name;
    return lead.email;
  };

  // Exclude leads who already have a matching User account OR are converted clients; exclude archived unless toggle is on
  const userEmails = new Set((users || []).map((u) => u.email?.toLowerCase()));
  const visibleLeads = leads.filter((l) => {
    if (userEmails.has(l.email?.toLowerCase())) return false;
    if (l.converted_to_client) return false;
    if (!showArchived && l.lead_status === "archived") return false;
    return true;
  });
  const archivedCount = leads.filter((l) => !userEmails.has(l.email?.toLowerCase()) && !l.converted_to_client && l.lead_status === "archived").length;

  const markAsClientMutation = useMutation({
    mutationFn: (leadId) => base44.entities.Lead.update(leadId, { converted_to_client: true, stage: "won" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Marked as client");
    },
  });

  // Filter leads
  const filteredLeads = visibleLeads.filter((lead) => {
    const query = searchQuery.toLowerCase();
    const fullName = getFullName(lead);
    // Also check individual name parts for partial matching
    const matchesSearch =
      lead.email?.toLowerCase().includes(query) ||
      fullName.toLowerCase().includes(query) ||
      lead.first_name?.toLowerCase().includes(query) ||
      lead.last_name?.toLowerCase().includes(query) ||
      lead.phone?.includes(query);

    const matchesStage = stageFilter === "all" || lead.stage === stageFilter;
    const matchesSource = sourceFilter === "all" || lead.source === sourceFilter;

    return matchesSearch && matchesStage && matchesSource;
  });

  // Group by stage for pipeline
  const pipelineData = stages.map((stage) => ({
    stage,
    leads: filteredLeads.filter((l) => l.stage === stage),
  }));

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 bg-[#D8B46B]/10 border border-[#D8B46B]/30 rounded-lg">
        <Info size={18} className="text-[#D8B46B] mt-0.5 flex-shrink-0" />
        <p className="text-sm text-[#2B2725]/80">
          <strong>Leads</strong> are prospects and inquiries who are not yet classified as clients. 
          Use <strong>"Mark as Client"</strong> to move someone to the Clients section when they become a client.
          To give someone platform access, use <strong>"Invite to Platform"</strong> in the header.
        </p>
      </div>

      {/* Show Archived Toggle */}
      {archivedCount > 0 && (
        <button
          onClick={() => setShowArchived(!showArchived)}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            showArchived
              ? "bg-gray-200 text-gray-800"
              : "bg-transparent text-[#2B2725]/50 hover:bg-gray-100"
          }`}
        >
          <Archive size={14} />
          {showArchived ? "Hide Archived" : `Show Archived (${archivedCount})`}
        </button>
      )}

      {/* Top Actions */}
      <div className="flex gap-3 flex-wrap">
        <Button
          onClick={() => setAddLeadDialogOpen(true)}
          className="bg-[#1E3A32] hover:bg-[#2B2725] text-[#F9F5EF]"
        >
          <Plus size={16} className="mr-2" />
          Add Lead
        </Button>
        <Button
          onClick={() => setKajabiDialogOpen(true)}
          className="bg-[#D8B46B] hover:bg-[#C9A555] text-[#1E3A32] font-medium"
        >
          <Upload size={16} className="mr-2" />
          Import from Kajabi (→ Users)
        </Button>
        <Button
          onClick={() => setImportDialogOpen(true)}
          variant="outline"
          className="border-[#D8B46B] text-[#1E3A32]"
        >
          <Upload size={16} className="mr-2" />
          Import CSV
        </Button>
      </div>

      <Tabs defaultValue="list" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        {/* Pipeline View */}
        <TabsContent value="pipeline">
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex gap-4 items-center">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2B2725]/40" size={16} />
                  <Input
                    placeholder="Search leads..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Sources" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="masterclass">Masterclass</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="social_media">Social Media</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {pipelineData.map((column) => (
              <div key={column.stage}>
                <div className="bg-white rounded-lg border border-[#E4D9C4] p-4 min-h-[500px]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-[#1E3A32] text-sm">{stageLabels[column.stage]}</h3>
                    <Badge variant="outline">{column.leads.length}</Badge>
                  </div>

                  <div className="space-y-2">
                    {column.leads.map((lead) => (
                      <motion.div
                        key={lead.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[#F9F5EF] p-3 rounded-lg cursor-pointer hover:shadow-md transition-shadow text-sm"
                        onClick={() => {
                          setSelectedLead(lead);
                          setDetailsDialogOpen(true);
                        }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPerson({ email: lead.email, name: getFullName(lead) });
                            setPersonPanelOpen(true);
                          }}
                          className="font-medium text-[#1E3A32] truncate hover:text-[#6E4F7D] hover:underline transition-colors text-left w-full"
                        >
                          {getFullName(lead)}
                        </button>
                        <p className="text-xs text-[#2B2725]/60 truncate">{lead.email}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Database View */}
        <TabsContent value="list">
          <div className="space-y-4">
            <div className="flex gap-4 items-center flex-wrap bg-white rounded-lg border border-[#E4D9C4] p-4">
              <div className="flex-1 relative min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2B2725]/40" size={16} />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="networking">Networking</SelectItem>
                  <SelectItem value="internet">Internet</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="colleague">Colleague</SelectItem>
                  <SelectItem value="vendor">Vendor</SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="masterclass">Masterclass</SelectItem>
                  <SelectItem value="social_media">Social Media</SelectItem>
                  <SelectItem value="paid_ad">Paid Ad</SelectItem>
                  <SelectItem value="organic_search">Organic Search</SelectItem>
                  <SelectItem value="email_campaign">Email Campaign</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="booking_system">Booking</SelectItem>
                  <SelectItem value="product_purchase">Purchase</SelectItem>
                  <SelectItem value="free_masterclass">Free Masterclass</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Stages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  {stages.map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      {stageLabels[stage]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {isLoading ? (
              <p className="text-center py-8 text-[#2B2725]/60">Loading...</p>
            ) : (
              <LeadsDatabaseTable
                leads={filteredLeads}
                onSelectLead={(lead) => {
                  setSelectedLead(lead);
                  setDetailsDialogOpen(true);
                }}
                onMarkAsClient={(leadId) => markAsClientMutation.mutate(leadId)}
              />
            )}
            <div className="text-center text-sm text-[#2B2725]/60">
              Showing {filteredLeads.length} of {visibleLeads.length} leads
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Lead Details Dialog */}
      {selectedLead && (
        <LeadDetailsDialog
          open={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
          lead={selectedLead}
        />
      )}

      {/* Import Dialog */}
      <LeadImport
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["leads"] });
          setImportDialogOpen(false);
        }}
      />

      {/* Kajabi Import Modal */}
      <KajabiImportModal
        open={kajabiDialogOpen}
        onOpenChange={setKajabiDialogOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["leads"] });
          setKajabiDialogOpen(false);
        }}
      />

      {/* Add Lead Dialog */}
      <AddLeadDialog
        open={addLeadDialogOpen}
        onOpenChange={setAddLeadDialogOpen}
      />

      {/* Person Detail Panel */}
      {selectedPerson && (
        <PersonDetailPanel
          open={personPanelOpen}
          onOpenChange={setPersonPanelOpen}
          email={selectedPerson.email}
          name={selectedPerson.name}
        />
      )}
    </div>
  );
}