import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, TrendingUp, Target, DollarSign, Search, Filter, Mail, Phone, Calendar, MessageSquare, CheckCircle2, Clock, Upload, Send, Loader2, Trash2, Tag, X, Plus } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import SendSMSDialog from "../components/crm/SendSMSDialog";
import LeadImport from "../components/manager/LeadImport";
import LeadTagManager from "../components/manager/LeadTagManager";
import ManualEnrollmentModal from "../components/manager/ManualEnrollmentModal";
import MassEmailDialog from "../components/crm/MassEmailDialog";

export default function ManagerCRM() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_date"); // 'name' or 'created_date'
  const [selectedLead, setSelectedLead] = useState(null);
  const [editingLead, setEditingLead] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [stageUpdateDialogOpen, setStageUpdateDialogOpen] = useState(false);
  const [newStage, setNewStage] = useState("");
  const [stageNotes, setStageNotes] = useState("");
  const [smsDialogOpen, setSmsDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState(null);
  const [newTagInput, setNewTagInput] = useState("");
  const [addLeadDialogOpen, setAddLeadDialogOpen] = useState(false);
  const [enrollmentModalOpen, setEnrollmentModalOpen] = useState(false);
  const [massEmailDialogOpen, setMassEmailDialogOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [newLead, setNewLead] = useState({ first_name: "", last_name: "", full_name: "", email: "", phone: "", source: "", stage: "new", notes: "" });

  // Fetch leads
  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: () => base44.entities.Lead.list("-created_date", 500),
  });

  // Fetch activities
  const { data: activities = [] } = useQuery({
    queryKey: ["leadActivities"],
    queryFn: () => base44.entities.LeadActivity.list("-created_date", 200),
  });

  // Update stage mutation
  const updateStageMutation = useMutation({
    mutationFn: ({ lead_id, stage, notes }) =>
      base44.functions.invoke("updateLeadStage", { lead_id, stage, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["leadActivities"] });
      setStageUpdateDialogOpen(false);
      setStageNotes("");
      toast.success("Lead stage updated!");
    },
  });

  // Update lead mutation
  const updateLeadMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Lead.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead updated!");
    },
  });

  // Create lead mutation
  const createLeadMutation = useMutation({
    mutationFn: (data) => base44.entities.Lead.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setAddLeadDialogOpen(false);
      setNewLead({ full_name: "", email: "", phone: "", source: "", stage: "new", notes: "" });
      toast.success("Lead added!");
    },
  });

  // Delete lead mutation
  const deleteLeadMutation = useMutation({
    mutationFn: (id) => base44.entities.Lead.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setDeleteConfirmOpen(false);
      setDetailsDialogOpen(false);
      setLeadToDelete(null);
      toast.success("Contact deleted.");
    },
  });

  // Filter and sort leads
  const filteredLeads = leads
    .filter((lead) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        lead.email?.toLowerCase().includes(query) ||
        lead.full_name?.toLowerCase().includes(query) ||
        lead.phone?.includes(query);

      const matchesStage = stageFilter === "all" || lead.stage === stageFilter;
      const matchesSource = sourceFilter === "all" || lead.source === sourceFilter;

      return matchesSearch && matchesStage && matchesSource;
    })
    .sort((a, b) => {
      if (sortBy === "name") {
        return (a.full_name || "").localeCompare(b.full_name || "");
      }
      return new Date(b.created_date) - new Date(a.created_date);
    });

  // Group by stage for pipeline view — includes all stages that leads can be in
  const stages = ["new", "contacted", "booked", "qualified", "proposal", "negotiation", "won", "lost"];
  const pipelineData = stages.map((stage) => ({
    stage,
    leads: filteredLeads.filter((l) => l.stage === stage),
  }));

  // Calculate stats
  const totalLeads = leads.length;
  const hotLeads = leads.filter((l) => l.interest_level === "hot").length;
  const convertedLeads = leads.filter((l) => l.converted_to_client).length;
  const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : 0;
  const totalValue = leads.reduce((sum, l) => sum + (l.total_value || 0), 0);
  const avgLeadScore = totalLeads > 0 ? (leads.reduce((sum, l) => sum + (l.lead_score || 0), 0) / totalLeads).toFixed(0) : 0;

  // Get activities for selected lead
  const getLeadActivities = (leadId) => {
    return activities
      .filter((a) => a.lead_id === leadId)
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
      .slice(0, 10);
  };

  // Stage colors
  const stageColors = {
    new: "bg-blue-100 text-blue-800",
    contacted: "bg-purple-100 text-purple-800",
    qualified: "bg-green-100 text-green-800",
    proposal: "bg-yellow-100 text-yellow-800",
    negotiation: "bg-orange-100 text-orange-800",
    won: "bg-emerald-100 text-emerald-800",
    lost: "bg-gray-100 text-gray-600",
  };

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

  return (
    <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="font-serif text-4xl text-[#1E3A32] mb-2">CRM & Lead Management</h1>
            <p className="text-[#2B2725]/70">Track leads, manage pipeline, and convert prospects</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button
              onClick={() => setMassEmailDialogOpen(true)}
              className="bg-[#D8B46B] hover:bg-[#C9A557] text-[#1E3A32]"
            >
              <Mail size={16} className="mr-2" />
              Mass Email
            </Button>
            <Button
              onClick={async () => {
                setSyncing(true);
                try {
                  const response = await base44.functions.invoke('syncLeadsToMailerLite', {});
                  if (response.data.success) {
                    toast.success(`Synced ${response.data.syncedCount} leads to MailerLite`);
                  }
                } catch (e) {
                  toast.error("Sync failed: " + e.message);
                } finally {
                  setSyncing(false);
                }
              }}
              disabled={syncing}
              variant="outline"
              className="border-[#D8B46B] text-[#1E3A32]"
            >
              {syncing ? <Loader2 size={16} className="animate-spin mr-2" /> : <Send size={16} className="mr-2" />}
              {syncing ? "Syncing..." : "Sync to MailerLite"}
            </Button>
            <Button
              onClick={() => setEnrollmentModalOpen(true)}
              className="bg-[#6E4F7D] hover:bg-[#5A3F69] text-[#F9F5EF]"
            >
              <Plus size={16} className="mr-2" />
              Enroll User
            </Button>
            <Button
              onClick={() => setAddLeadDialogOpen(true)}
              className="bg-[#1E3A32] hover:bg-[#2B2725] text-[#F9F5EF]"
            >
              <Plus size={16} className="mr-2" />
              Add Lead
            </Button>
            <Button
              onClick={() => setImportDialogOpen(true)}
              variant="outline"
              className="border-[#D8B46B] text-[#1E3A32]"
            >
              <Upload size={16} className="mr-2" />
              Import Leads
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#2B2725]/60">Total Leads</p>
                  <p className="text-2xl font-bold text-[#1E3A32]">{totalLeads}</p>
                </div>
                <Users size={32} className="text-[#D8B46B]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#2B2725]/60">Hot Leads</p>
                  <p className="text-2xl font-bold text-[#1E3A32]">{hotLeads}</p>
                </div>
                <Target size={32} className="text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#2B2725]/60">Converted</p>
                  <p className="text-2xl font-bold text-[#1E3A32]">{convertedLeads}</p>
                </div>
                <CheckCircle2 size={32} className="text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#2B2725]/60">Conv. Rate</p>
                  <p className="text-2xl font-bold text-[#1E3A32]">{conversionRate}%</p>
                </div>
                <TrendingUp size={32} className="text-[#6E4F7D]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#2B2725]/60">Avg Score</p>
                  <p className="text-2xl font-bold text-[#1E3A32]">{avgLeadScore}</p>
                </div>
                <Target size={32} className="text-[#A6B7A3]" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="list" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Pipeline View */}
          <TabsContent value="pipeline">
            {/* Filters */}
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
                      <SelectItem value="paid_ad">Paid Ad</SelectItem>
                      <SelectItem value="organic_search">Organic Search</SelectItem>
                      <SelectItem value="networking">Networking</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Sort" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created_date">Recent</SelectItem>
                      <SelectItem value="name">Name (A-Z)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Pipeline Board */}
            <div className="grid grid-cols-4 lg:grid-cols-8 gap-3">
              {pipelineData.map((column) => (
                <div key={column.stage}>
                  <div className="bg-white rounded-lg border border-[#E4D9C4] p-4 min-h-[600px]">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-[#1E3A32]">{stageLabels[column.stage]}</h3>
                      <Badge variant="outline">{column.leads.length}</Badge>
                    </div>

                    <div className="space-y-3">
                      {column.leads.map((lead) => (
                        <motion.div
                          key={lead.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-[#F9F5EF] p-3 rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => {
                            setSelectedLead(lead);
                            setEditingLead({ ...lead });
                            setDetailsDialogOpen(true);
                          }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <p className="font-medium text-sm text-[#1E3A32] truncate">
                              {lead.full_name || lead.email}
                            </p>
                            <Badge
                              className={
                                lead.interest_level === "hot"
                                  ? "bg-red-100 text-red-800"
                                  : lead.interest_level === "warm"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-blue-100 text-blue-800"
                              }
                            >
                              {lead.interest_level}
                            </Badge>
                          </div>

                          <p className="text-xs text-[#2B2725]/60 mb-2">{lead.email}</p>

                          <div className="flex items-center justify-between">
                            <span className="text-xs text-[#2B2725]/50">{lead.source}</span>
                            <div className="flex items-center gap-1">
                              <Target size={10} className="text-[#D8B46B]" />
                              <span className="text-xs font-medium">{lead.lead_score}</span>
                            </div>
                          </div>

                          {lead.next_follow_up_date && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-[#2B2725]/60">
                              <Clock size={10} />
                              <span>Follow up: {new Date(lead.next_follow_up_date).toLocaleDateString()}</span>
                            </div>
                          )}


                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* List View */}
          <TabsContent value="list">
            <Card>
              <CardHeader>
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
                      <SelectItem value="networking">Networking</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Sort" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created_date">Recent</SelectItem>
                      <SelectItem value="name">Name (A-Z)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-center py-8 text-[#2B2725]/60">Loading...</p>
                ) : filteredLeads.length === 0 ? (
                  <p className="text-center py-8 text-[#2B2725]/60">No leads found</p>
                ) : (
                  <div className="space-y-3">
                    {filteredLeads.map((lead) => (
                      <motion.div
                        key={lead.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border border-[#E4D9C4] rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => {
                          setSelectedLead(lead);
                          setEditingLead({ ...lead });
                          setDetailsDialogOpen(true);
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-medium text-[#1E3A32]">
                                {lead.full_name || lead.email}
                              </h3>
                              <Badge className={stageColors[lead.stage]}>
                                {stageLabels[lead.stage]}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={
                                  lead.interest_level === "hot"
                                    ? "border-red-500 text-red-600"
                                    : lead.interest_level === "warm"
                                    ? "border-yellow-500 text-yellow-600"
                                    : "border-blue-500 text-blue-600"
                                }
                              >
                                {lead.interest_level}
                              </Badge>
                            </div>

                            <div className="flex gap-6 text-sm text-[#2B2725]/70 flex-wrap">
                              <span className="flex items-center gap-1">
                                <Mail size={14} />
                                {lead.email}
                              </span>
                              {lead.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone size={14} />
                                  {lead.phone}
                                </span>
                              )}
                              <span>Source: {lead.source}</span>
                              <span className="flex items-center gap-1">
                                <Target size={14} className="text-[#D8B46B]" />
                                Score: {lead.lead_score}
                              </span>
                            </div>
                            {lead.tags && lead.tags.length > 0 && (
                              <div className="flex gap-1 flex-wrap mt-1">
                                {lead.tags.map(tag => (
                                  <span key={tag} className="bg-[#D8B46B]/20 text-[#1E3A32] text-xs px-2 py-0.5 rounded-full">{tag}</span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="text-right flex flex-col items-end gap-2">
                            <p className="text-xs text-[#2B2725]/60">
                              Created: {new Date(lead.created_date).toLocaleDateString()}
                            </p>
                            {lead.next_follow_up_date && (
                              <p className="text-xs text-[#D8B46B] font-medium">
                                Follow up: {new Date(lead.next_follow_up_date).toLocaleDateString()}
                              </p>
                            )}
                            <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 px-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLead(lead);
                                  setEditingLead({ ...lead });
                                  setEmailSubject("");
                                  setEmailBody("");
                                  setEmailDialogOpen(true);
                              }}
                            >
                              <Mail size={12} className="mr-1" />
                              Email
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 px-2 border-red-300 text-red-600 hover:bg-red-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLeadToDelete(lead);
                                setDeleteConfirmOpen(true);
                              }}
                            >
                              <Trash2 size={12} />
                            </Button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Lead Sources</CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    // Dynamically compute all sources present in real data
                    const allSources = [...new Set(leads.map(l => l.source || "unknown"))].sort();
                    const sourceDisplayNames = {
                      website: "Website",
                      masterclass: "Masterclass",
                      referral: "Referral",
                      social_media: "Social Media",
                      paid_ad: "Paid Ad",
                      organic_search: "Organic Search",
                      booking_system: "Booking / Website",
                      product_purchase: "Product Purchase",
                      unknown: "Unknown",
                    };
                    return allSources.map((source) => {
                      const count = leads.filter((l) => (l.source || "unknown") === source).length;
                      const percentage = totalLeads > 0 ? ((count / totalLeads) * 100).toFixed(1) : 0;
                      return (
                        <div key={source} className="mb-4">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">{sourceDisplayNames[source] || source.replace(/_/g, " ")}</span>
                            <span className="text-sm font-medium">{count} ({percentage}%)</span>
                          </div>
                          <div className="h-2 bg-[#E4D9C4] rounded-full overflow-hidden">
                            <div className="h-full bg-[#D8B46B]" style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      );
                    });
                  })()}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pipeline Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  {stages.slice(0, -1).map((stage) => {
                    const count = leads.filter((l) => l.stage === stage).length;
                    const percentage = totalLeads > 0 ? ((count / totalLeads) * 100).toFixed(1) : 0;
                    return (
                      <div key={stage} className="mb-4">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">{stageLabels[stage]}</span>
                          <span className="text-sm font-medium">
                            {count} ({percentage}%)
                          </span>
                        </div>
                        <div className="h-2 bg-[#E4D9C4] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#1E3A32]"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Lead Details Dialog */}
        <Dialog open={detailsDialogOpen} onOpenChange={(open) => {
          setDetailsDialogOpen(open);
          if (!open) setEditingLead(null);
        }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Lead Details</DialogTitle>
            </DialogHeader>
            {selectedLead && editingLead && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-4">Contact Information</h3>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label>First Name</Label>
                          <Input
                            value={editingLead.first_name || ""}
                            onChange={(e) => setEditingLead({ ...editingLead, first_name: e.target.value, full_name: `${e.target.value} ${editingLead.last_name || ""}`.trim() })}
                            placeholder="First name"
                          />
                        </div>
                        <div>
                          <Label>Last Name</Label>
                          <Input
                            value={editingLead.last_name || ""}
                            onChange={(e) => setEditingLead({ ...editingLead, last_name: e.target.value, full_name: `${editingLead.first_name || ""} ${e.target.value}`.trim() })}
                            placeholder="Last name"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input value={editingLead.email} readOnly className="bg-gray-50" />
                      </div>
                      <div>
                        <Label>Phone</Label>
                        <Input
                          value={editingLead.phone || ""}
                          onChange={(e) => setEditingLead({ ...editingLead, phone: e.target.value })}
                          placeholder="Enter phone..."
                        />
                      </div>
                      <div>
                        <Label>Street Address</Label>
                        <Input value={editingLead.address_line1 || ""} onChange={(e) => setEditingLead({ ...editingLead, address_line1: e.target.value })} placeholder="123 Main St" />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <Input value={editingLead.city || ""} onChange={(e) => setEditingLead({ ...editingLead, city: e.target.value })} placeholder="City" />
                        <Input value={editingLead.state || ""} onChange={(e) => setEditingLead({ ...editingLead, state: e.target.value })} placeholder="State" />
                        <Input value={editingLead.zip || ""} onChange={(e) => setEditingLead({ ...editingLead, zip: e.target.value })} placeholder="ZIP" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-4">Lead Info</h3>
                    <div className="space-y-3">
                      <div>
                        <Label>Stage</Label>
                        <Select
                          value={editingLead.stage || "new"}
                          onValueChange={(value) => setEditingLead({ ...editingLead, stage: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {stages.map((stage) => (
                              <SelectItem key={stage} value={stage}>{stageLabels[stage]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Interest Level</Label>
                        <Select
                          value={editingLead.interest_level || "warm"}
                          onValueChange={(value) => setEditingLead({ ...editingLead, interest_level: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cold">Cold</SelectItem>
                            <SelectItem value="warm">Warm</SelectItem>
                            <SelectItem value="hot">Hot</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Lead Score</Label>
                        <Input
                          type="number"
                          value={editingLead.lead_score || 0}
                          onChange={(e) => setEditingLead({ ...editingLead, lead_score: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <Label>Source</Label>
                        <Input value={editingLead.source || ""} readOnly className="bg-gray-50" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>What They Inquired About</Label>
                    <Input value={editingLead.what_inquired_about || ""} onChange={(e) => setEditingLead({ ...editingLead, what_inquired_about: e.target.value })} placeholder="e.g. LENS™, consultation..." />
                  </div>
                  <div>
                    <Label>What They Bought</Label>
                    <Input value={editingLead.what_they_bought || ""} onChange={(e) => setEditingLead({ ...editingLead, what_they_bought: e.target.value })} placeholder="e.g. Pocket Mindset™..." />
                  </div>
                  <div>
                    <Label>Date of Purchase</Label>
                    <Input type="date" value={editingLead.date_of_purchase || ""} onChange={(e) => setEditingLead({ ...editingLead, date_of_purchase: e.target.value })} />
                  </div>
                  <div>
                    <Label>Follow-Up Actions</Label>
                    <Input value={editingLead.follow_up_actions || ""} onChange={(e) => setEditingLead({ ...editingLead, follow_up_actions: e.target.value })} placeholder="e.g. Send welcome email..." />
                  </div>
                </div>

                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={editingLead.notes || ""}
                    onChange={(e) => setEditingLead({ ...editingLead, notes: e.target.value })}
                    className="min-h-[100px]"
                    placeholder="Add notes..."
                  />
                </div>

                {/* Tags */}
                <div>
                  <LeadTagManager
                    tags={editingLead.tags || []}
                    onChange={(newTags) => setEditingLead({ ...editingLead, tags: newTags })}
                  />
                </div>

                <div className="flex justify-between items-center pt-2">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEmailSubject("");
                        setEmailBody("");
                        setEmailDialogOpen(true);
                      }}
                      className="flex items-center gap-2"
                    >
                      <Mail size={14} />
                      Send Email
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setLeadToDelete(selectedLead);
                        setDeleteConfirmOpen(true);
                      }}
                      className="flex items-center gap-2 border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                      Delete
                    </Button>
                  </div>
                  <Button
                    onClick={() => {
                      updateLeadMutation.mutate({
                        id: editingLead.id,
                        data: {
                          first_name: editingLead.first_name,
                          last_name: editingLead.last_name,
                          full_name: editingLead.full_name,
                          phone: editingLead.phone,
                          address_line1: editingLead.address_line1,
                          city: editingLead.city,
                          state: editingLead.state,
                          zip: editingLead.zip,
                          stage: editingLead.stage,
                          interest_level: editingLead.interest_level,
                          lead_score: editingLead.lead_score,
                          notes: editingLead.notes,
                          tags: editingLead.tags || [],
                          what_inquired_about: editingLead.what_inquired_about,
                          what_they_bought: editingLead.what_they_bought,
                          date_of_purchase: editingLead.date_of_purchase,
                          follow_up_actions: editingLead.follow_up_actions,
                        },
                      }, {
                        onSuccess: () => {
                          setSelectedLead(editingLead);
                          setDetailsDialogOpen(false);
                        }
                      });
                    }}
                    disabled={updateLeadMutation.isPending}
                    className="bg-[#1E3A32] hover:bg-[#2B2725] text-white"
                  >
                    {updateLeadMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>

                <div>
                  <h3 className="font-medium mb-4">Recent Activity</h3>
                  <div className="space-y-2">
                    {getLeadActivities(selectedLead.id).map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 p-3 bg-[#F9F5EF] rounded-lg"
                      >
                        <MessageSquare size={16} className="text-[#D8B46B] mt-1" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[#1E3A32]">
                            {activity.activity_type.replace("_", " ")}
                          </p>
                          <p className="text-xs text-[#2B2725]/60">{activity.description}</p>
                          <p className="text-xs text-[#2B2725]/40 mt-1">
                            {new Date(activity.created_date).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Stage Update Dialog */}
        <Dialog open={stageUpdateDialogOpen} onOpenChange={setStageUpdateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Lead Stage</DialogTitle>
            </DialogHeader>
            {selectedLead && (
              <div className="space-y-4">
                <div>
                  <Label>New Stage</Label>
                  <Select value={newStage} onValueChange={setNewStage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map((stage) => (
                        <SelectItem key={stage} value={stage}>
                          {stageLabels[stage]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Notes (optional)</Label>
                  <Textarea
                    value={stageNotes}
                    onChange={(e) => setStageNotes(e.target.value)}
                    placeholder="Add any notes about this stage change..."
                    className="min-h-[100px]"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setStageUpdateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() =>
                      updateStageMutation.mutate({
                        lead_id: selectedLead.id,
                        stage: newStage,
                        notes: stageNotes,
                      })
                    }
                    disabled={updateStageMutation.isPending}
                  >
                    Update Stage
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Email Compose Dialog */}
        <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Send Email to {editingLead?.full_name || editingLead?.email || selectedLead?.full_name || selectedLead?.email}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>To</Label>
                <Input value={editingLead?.email || selectedLead?.email || ""} readOnly className="bg-gray-50" />
              </div>
              <div>
                <Label>Subject</Label>
                <Input
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Email subject..."
                />
              </div>
              <div>
                <Label>Message</Label>
                <Textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="Write your message..."
                  className="min-h-[160px]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>Cancel</Button>
                <Button
                  disabled={!emailSubject.trim() || !emailBody.trim() || sendingEmail}
                  onClick={async () => {
                    setSendingEmail(true);
                    try {
                      const emailTo = editingLead?.email || selectedLead?.email;
                      await base44.integrations.Core.SendEmail({
                        to: emailTo,
                        from_name: "Roberta Fernandez - Your Mind Stylist",
                        subject: emailSubject,
                        body: emailBody,
                      });
                      const leadId = editingLead?.id || selectedLead?.id;
                      await base44.entities.LeadActivity.create({
                        lead_id: leadId,
                        activity_type: "email_sent",
                        description: `Email sent: "${emailSubject}"`,
                      });
                      queryClient.invalidateQueries({ queryKey: ["leadActivities"] });
                      toast.success("Email sent!");
                      setEmailDialogOpen(false);
                    } catch (e) {
                      toast.error("Failed to send email: " + e.message);
                    } finally {
                      setSendingEmail(false);
                    }
                  }}
                  className="bg-[#1E3A32] hover:bg-[#2B2725] text-white"
                >
                  {sendingEmail ? <Loader2 size={14} className="animate-spin mr-2" /> : <Send size={14} className="mr-2" />}
                  Send Email
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Lead Dialog */}
        <Dialog open={addLeadDialogOpen} onOpenChange={setAddLeadDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Contact</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>First Name</Label>
                  <Input
                    value={newLead.first_name}
                    onChange={(e) => setNewLead(prev => ({ ...prev, first_name: e.target.value, full_name: `${e.target.value} ${prev.last_name}`.trim() }))}
                    placeholder="Jane"
                  />
                </div>
                <div>
                  <Label>Last Name</Label>
                  <Input
                    value={newLead.last_name}
                    onChange={(e) => setNewLead(prev => ({ ...prev, last_name: e.target.value, full_name: `${prev.first_name} ${e.target.value}`.trim() }))}
                    placeholder="Smith"
                  />
                </div>
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={newLead.email}
                  onChange={(e) => setNewLead(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="jane@example.com"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={newLead.phone}
                  onChange={(e) => setNewLead(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(555) 000-0000"
                />
              </div>
              <div>
                <Label>Street Address</Label>
                <Input
                  value={newLead.address_line1 || ""}
                  onChange={(e) => setNewLead(prev => ({ ...prev, address_line1: e.target.value }))}
                  placeholder="123 Main St"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <Label>City</Label>
                  <Input value={newLead.city || ""} onChange={(e) => setNewLead(prev => ({ ...prev, city: e.target.value }))} placeholder="Las Vegas" />
                </div>
                <div>
                  <Label>State</Label>
                  <Input value={newLead.state || ""} onChange={(e) => setNewLead(prev => ({ ...prev, state: e.target.value }))} placeholder="NV" />
                </div>
                <div>
                  <Label>ZIP</Label>
                  <Input value={newLead.zip || ""} onChange={(e) => setNewLead(prev => ({ ...prev, zip: e.target.value }))} placeholder="89101" />
                </div>
              </div>
              <div>
                <Label>What They Inquired About</Label>
                <Input
                  value={newLead.what_inquired_about || ""}
                  onChange={(e) => setNewLead(prev => ({ ...prev, what_inquired_about: e.target.value }))}
                  placeholder="e.g. LENS™ program, initial consultation..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Stage</Label>
                  <Select value={newLead.stage} onValueChange={(v) => setNewLead(prev => ({ ...prev, stage: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["new","contacted","booked","qualified","proposal","negotiation","won","lost"].map(s => (
                        <SelectItem key={s} value={s}>{stageLabels[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Source</Label>
                  <Select value={newLead.source} onValueChange={(v) => setNewLead(prev => ({ ...prev, source: v }))}>
                    <SelectTrigger><SelectValue placeholder="Source" /></SelectTrigger>
                    <SelectContent>
                      {["website","masterclass","referral","social_media","paid_ad","organic_search","email_campaign","event","other"].map(s => (
                        <SelectItem key={s} value={s}>{s.replace(/_/g,' ').replace(/\b\w/g,l=>l.toUpperCase())}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={newLead.notes}
                  onChange={(e) => setNewLead(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any notes about this contact..."
                  className="min-h-[80px]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setAddLeadDialogOpen(false)}>Cancel</Button>
                <Button
                  disabled={!newLead.email.trim() || createLeadMutation.isPending}
                  onClick={() => createLeadMutation.mutate(newLead)}
                  className="bg-[#1E3A32] hover:bg-[#2B2725] text-white"
                >
                  {createLeadMutation.isPending ? "Adding..." : "Add Contact"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* SMS Dialog */}
        <SendSMSDialog
          open={smsDialogOpen}
          onOpenChange={setSmsDialogOpen}
          lead={selectedLead}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["leadActivities"] });
            queryClient.invalidateQueries({ queryKey: ["leads"] });
          }}
        />

        {/* Delete Confirmation */}
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Contact</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{leadToDelete?.full_name || leadToDelete?.email}</strong>? This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteLeadMutation.mutate(leadToDelete?.id)}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleteLeadMutation.isPending ? "Deleting..." : "Delete Contact"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Import Dialog */}
        <LeadImport
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["leads"] });
            setImportDialogOpen(false);
          }}
        />

        {/* Manual Enrollment Modal */}
        <ManualEnrollmentModal
          open={enrollmentModalOpen}
          onOpenChange={setEnrollmentModalOpen}
          onSuccess={() => {
            // Optionally refresh leads if you want to show enrollment info
          }}
        />

        {/* Mass Email Dialog */}
        <MassEmailDialog
          open={massEmailDialogOpen}
          onOpenChange={setMassEmailDialogOpen}
          leads={leads}
        />
      </div>
    </div>
  );
}