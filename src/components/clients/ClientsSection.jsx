import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, UserMinus, Info, Mail, Clock, Archive } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import PersonDetailPanel from "./PersonDetailPanel";
import LeadDetailsDialog from "./LeadDetailsDialog";
import SendIndividualEmailDialog from "./SendIndividualEmailDialog";

const sourceLabels = {
  networking: "Networking", internet: "Internet", referral: "Referral",
  client: "Client", colleague: "Colleague", vendor: "Vendor",
  website: "Website", masterclass: "Masterclass", social_media: "Social Media",
  paid_ad: "Paid Ad", organic_search: "Organic Search", email_campaign: "Email Campaign",
  event: "Event", booking_system: "Booking", product_purchase: "Purchase",
  free_masterclass: "Free Masterclass", csv_import: "CSV Import",
  lead_magnet: "Lead Magnet", contact_form: "Contact Form", other: "Other",
};

const sourceColors = {
  networking: "bg-blue-100 text-blue-800", referral: "bg-purple-100 text-purple-800",
  website: "bg-blue-100 text-blue-800", masterclass: "bg-pink-100 text-pink-800",
  social_media: "bg-violet-100 text-violet-800", product_purchase: "bg-emerald-100 text-emerald-800",
  booking_system: "bg-teal-100 text-teal-800", csv_import: "bg-amber-100 text-amber-800",
};

const getFullName = (lead) => {
  if (lead.first_name && lead.last_name) return `${lead.first_name} ${lead.last_name}`;
  if (lead.full_name) return lead.full_name;
  if (lead.first_name) return lead.first_name;
  return lead.email || "—";
};

export default function ClientsSection({ leads, users, isLoading }) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [selectedLead, setSelectedLead] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [personPanelOpen, setPersonPanelOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailTarget, setEmailTarget] = useState(null);
  const [showArchived, setShowArchived] = useState(false);

  const unmarkClientMutation = useMutation({
    mutationFn: (leadId) => base44.entities.Lead.update(leadId, { converted_to_client: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Moved back to Leads");
    },
  });

  // Filter: converted clients who are NOT yet app Users
  const userEmails = new Set((users || []).map((u) => u.email?.toLowerCase()));
  const clientLeads = leads.filter((l) => {
    if (!l.converted_to_client) return false;
    if (userEmails.has(l.email?.toLowerCase())) return false;
    if (!showArchived && l.lead_status === "archived") return false;
    return true;
  });

  const archivedCount = leads.filter((l) =>
    l.converted_to_client && !userEmails.has(l.email?.toLowerCase()) && l.lead_status === "archived"
  ).length;

  // Search + source filter
  const filteredClients = clientLeads.filter((lead) => {
    const q = searchQuery.toLowerCase();
    const name = getFullName(lead).toLowerCase();
    const matchesSearch = name.includes(q) || lead.email?.toLowerCase().includes(q) || lead.phone?.includes(searchQuery);
    const matchesSource = sourceFilter === "all" || lead.source === sourceFilter;
    return matchesSearch && matchesSource;
  });

  const getInviteStatusBadge = (lead) => {
    if (lead.invite_status === "invited") {
      return (
        <Badge className="bg-amber-100 text-amber-800 text-[10px] gap-1">
          <Clock size={10} />
          Invited — Awaiting Setup
        </Badge>
      );
    }
    return (
      <Badge className="bg-[#A6B7A3]/20 text-[#1E3A32] text-[10px]">
        Not Yet Invited
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
        <Info size={18} className="text-emerald-700 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-emerald-900">
          <strong>Clients</strong> are people you have a business or client relationship with. 
          Being a "client" here does <em>not</em> mean they have a platform login — it means they're part of your client base.
          To give them app access, use <strong>"Invite to Platform"</strong> from the Clients Hub header.
        </p>
      </div>

      {/* Show Archived Toggle */}
      {archivedCount > 0 && (
        <button
          onClick={() => setShowArchived(!showArchived)}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            showArchived ? "bg-gray-200 text-gray-800" : "bg-transparent text-[#2B2725]/50 hover:bg-gray-100"
          }`}
        >
          <Archive size={14} />
          {showArchived ? "Hide Archived" : `Show Archived (${archivedCount})`}
        </button>
      )}

      {/* Filters */}
      <Card className="bg-white">
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center flex-wrap">
            <div className="flex-1 relative min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2B2725]/40" size={16} />
              <Input
                placeholder="Search clients by name, email, or phone..."
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
                <SelectItem value="referral">Referral</SelectItem>
                <SelectItem value="website">Website</SelectItem>
                <SelectItem value="masterclass">Masterclass</SelectItem>
                <SelectItem value="booking_system">Booking</SelectItem>
                <SelectItem value="product_purchase">Purchase</SelectItem>
                <SelectItem value="csv_import">CSV Import</SelectItem>
                <SelectItem value="contact_form">Contact Form</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <div className="overflow-x-auto border border-[#E4D9C4] rounded-lg bg-white">
        <table className="w-full text-sm">
          <thead className="bg-[#F9F5EF] border-b border-[#E4D9C4]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#2B2725] uppercase tracking-wide">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#2B2725] uppercase tracking-wide">Email</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#2B2725] uppercase tracking-wide">Phone</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#2B2725] uppercase tracking-wide">Location</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#2B2725] uppercase tracking-wide">What They Bought</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#2B2725] uppercase tracking-wide">Source</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#2B2725] uppercase tracking-wide">Invite Status</th>
              <th className="px-4 py-3 w-28"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4D9C4]/60">
            {filteredClients.map((lead) => {
              const location = [lead.city, lead.state].filter(Boolean).join(", ");
              return (
                <tr
                  key={lead.id}
                  className={`cursor-pointer transition-colors ${lead.lead_status === "archived" ? "bg-gray-50/80 opacity-60 hover:opacity-80" : "hover:bg-[#F9F5EF]/50"}`}
                  onClick={() => { setSelectedLead(lead); setDetailsDialogOpen(true); }}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPerson({ email: lead.email, name: getFullName(lead) });
                        setPersonPanelOpen(true);
                      }}
                      className="font-medium text-[#1E3A32] hover:text-[#6E4F7D] hover:underline transition-colors text-left"
                    >
                      {getFullName(lead)}
                    </button>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPerson({ email: lead.email, name: getFullName(lead) });
                          setPersonPanelOpen(true);
                        }}
                        className="text-[#2B2725]/70 hover:text-[#6E4F7D] hover:underline transition-colors"
                      >
                        {lead.email || "—"}
                      </button>
                      {lead.email && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEmailTarget({ email: lead.email, name: getFullName(lead) });
                            setEmailDialogOpen(true);
                          }}
                          className="p-1 rounded hover:bg-[#D8B46B]/20 text-[#6E4F7D] hover:text-[#1E3A32] transition-colors flex-shrink-0"
                          title={`Email ${lead.email}`}
                        >
                          <Mail size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#2B2725]/70 whitespace-nowrap">{lead.phone || "—"}</td>
                  <td className="px-4 py-3 text-[#2B2725]/70 whitespace-nowrap">{location || "—"}</td>
                  <td className="px-4 py-3 text-[#2B2725]/70 max-w-[200px] truncate" title={lead.what_they_bought || ""}>
                    {lead.what_they_bought || "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Badge className={`text-xs ${sourceColors[lead.source] || "bg-gray-100 text-gray-600"}`}>
                      {sourceLabels[lead.source] || lead.source || "—"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {getInviteStatusBadge(lead)}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-[#2B2725]/50 hover:text-[#2B2725] hover:bg-[#E4D9C4]/50 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Move this person back to Leads? This only changes their classification — nothing else is affected.")) {
                          unmarkClientMutation.mutate(lead.id);
                        }
                      }}
                      title="Move back to Leads"
                    >
                      <UserMinus size={13} className="mr-1" />
                      Unmark
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredClients.length === 0 && (
          <div className="py-12 text-center text-[#2B2725]/60 text-sm">
            {clientLeads.length === 0
              ? "No clients yet. Use \"Mark as Client\" in the Leads section to classify someone as a client."
              : "No clients match your search."}
          </div>
        )}
      </div>

      <div className="text-center text-sm text-[#2B2725]/60">
        Showing {filteredClients.length} of {clientLeads.length} client{clientLeads.length !== 1 ? "s" : ""}
      </div>

      {/* Lead Details Dialog */}
      {selectedLead && (
        <LeadDetailsDialog
          open={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
          lead={selectedLead}
        />
      )}

      {/* Person Detail Panel */}
      {selectedPerson && (
        <PersonDetailPanel
          open={personPanelOpen}
          onOpenChange={setPersonPanelOpen}
          email={selectedPerson.email}
          name={selectedPerson.name}
        />
      )}

      {/* Email Dialog */}
      {emailTarget && (
        <SendIndividualEmailDialog
          open={emailDialogOpen}
          onOpenChange={setEmailDialogOpen}
          recipientEmail={emailTarget.email}
          recipientName={emailTarget.name}
        />
      )}
    </div>
  );
}