import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, Plus, Mail, Send, Loader2, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import toast from "react-hot-toast";
import LeadsSection from "../components/clients/LeadsSection.jsx";
import ClientsSection from "../components/clients/ClientsSection";
import UsersSection from "../components/clients/UsersSection.jsx";
import PendingInvitesSection from "../components/clients/PendingInvitesSection";
import ConvertLeadsDialog from "../components/clients/ConvertLeadsDialog.jsx";
import MassEmailDialog from "../components/crm/MassEmailDialog";
import CampaignHistory from "../components/crm/CampaignHistory";
import GroupManagementPanel from "../components/crm/GroupManagementPanel";
import BulkAssignGroupDialog from "../components/crm/BulkAssignGroupDialog";
import EmailTemplateManager from "../components/crm/EmailTemplateManager";
import ClientsHubSidebar, { SECTIONS } from "../components/clients/ClientsHubSidebar";
import EmailSequencesSection from "../components/clients/EmailSequencesSection";
import EmailAnalyticsSection from "../components/clients/EmailAnalyticsSection";

export default function ClientsHub() {
  const queryClient = useQueryClient();
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [massEmailDialogOpen, setMassEmailDialogOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [bulkGroupDialogOpen, setBulkGroupDialogOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("leads");
  const [currentUser, setCurrentUser] = useState(null);

  // Get current user for self-protection checks
  React.useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  // Fetch leads
  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: () => base44.entities.Lead.list("-created_date", 500),
  });

  // Fetch users
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["admin-all-users"],
    queryFn: async () => {
      const res = await base44.functions.invoke("getAllUsers");
      return res.data?.users || [];
    },
  });

  // Build user email set for cross-referencing
  const userEmails = new Set(users.map((u) => u.email?.toLowerCase()));

  // Calculate stats — exclude leads who already have a User account or are archived
  const allActiveLeads = leads.filter((l) => !userEmails.has(l.email?.toLowerCase()) && l.lead_status !== "archived");
  // Leads = prospects (not yet clients)
  const prospectLeads = allActiveLeads.filter((l) => !l.converted_to_client);
  const totalLeads = prospectLeads.length;
  // Clients = converted_to_client but not yet app Users
  const clientLeads = allActiveLeads.filter((l) => l.converted_to_client);
  const clientCount = clientLeads.length;
  const conversionRate = allActiveLeads.length > 0 ? ((clientCount / allActiveLeads.length) * 100).toFixed(1) : 0;

  // Calculate pending invites count — only leads with a confirmed invite
  const pendingInvites = leads.filter((l) => {
    if (l.invite_status !== "invited") return false;
    return !userEmails.has(l.email?.toLowerCase());
  });
  const pendingCount = pendingInvites.length;

  const renderContent = () => {
    switch (activeSection) {
      case "leads":
        return <LeadsSection leads={leads} users={users} isLoading={leadsLoading} />;
      case "clients":
        return <ClientsSection leads={leads} users={users} isLoading={leadsLoading} />;
      case "pending_invites":
        return <PendingInvitesSection leads={leads} users={users} />;
      case "users":
        return <UsersSection users={users} isLoading={usersLoading} leads={leads} currentUser={currentUser} />;
      case "sequences":
        return <EmailSequencesSection />;
      case "templates":
        return (
          <div className="bg-white rounded-lg border border-[#E4D9C4] p-6">
            <div className="mb-6">
              <h2 className="font-serif text-xl text-[#1E3A32]">Email Templates</h2>
              <p className="text-sm text-[#2B2725]/60 mt-1">Create and manage reusable email templates for your campaigns</p>
            </div>
            <EmailTemplateManager />
          </div>
        );
      case "campaigns":
        return (
          <div className="bg-white rounded-lg border border-[#E4D9C4] p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-serif text-xl text-[#1E3A32]">Sent Campaigns</h2>
                <p className="text-sm text-[#2B2725]/60 mt-1">Email campaigns sent via MailerLite with open/click tracking</p>
              </div>
              <Button onClick={() => setMassEmailDialogOpen(true)} className="bg-[#D8B46B] hover:bg-[#C9A557] text-[#1E3A32]">
                <Mail size={16} className="mr-2" /> New Campaign
              </Button>
            </div>
            <CampaignHistory />
          </div>
        );
      case "groups":
        return (
          <div className="bg-white rounded-lg border border-[#E4D9C4] p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-serif text-xl text-[#1E3A32]">MailerLite Groups</h2>
                <p className="text-sm text-[#2B2725]/60 mt-1">Organize your contacts into groups for targeted campaigns</p>
              </div>
              <Button onClick={() => setBulkGroupDialogOpen(true)} className="bg-[#6E4F7D] hover:bg-[#5A3F69] text-white">
                <Users size={16} className="mr-2" /> Bulk Add to Group
              </Button>
            </div>
            <GroupManagementPanel />
          </div>
        );
      case "analytics":
        return <EmailAnalyticsSection />;
      default:
        return <LeadsSection leads={leads} users={users} isLoading={leadsLoading} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start flex-wrap gap-4">
          <div className="flex items-start gap-3">
            <div>
              <h1 className="font-serif text-4xl text-[#1E3A32] mb-2">Clients Hub</h1>
              <p className="text-[#2B2725]/70">Manage leads, users, and email marketing in one place</p>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="mt-2 p-2 text-[#2B2725]/60 hover:text-[#1E3A32] transition-colors">
                    <HelpCircle size={20} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-sm bg-[#1E3A32] text-[#F9F5EF] border-0">
                  <div className="space-y-2 text-sm">
                   <p className="font-semibold">How It Works</p>
                   <ol className="list-decimal list-inside space-y-1">
                     <li><span className="font-medium">Leads</span> — Prospects and inquiries not yet classified as clients</li>
                     <li><span className="font-medium">Clients</span> — People you have a client relationship with (may not have app accounts)</li>
                     <li><span className="font-medium">Invited — Pending Setup</span> — People who received an invitation and haven't created their account yet</li>
                     <li><span className="font-medium">Active App Users</span> — People who have created their password and can access the platform</li>
                   </ol>
                   <p className="text-xs text-[#F9F5EF]/80 pt-2 border-t border-[#F9F5EF]/20">"Client" means a business relationship — it does not create an app account. Use "Invite to Platform" to send a login invitation.</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Context-sensitive header actions */}
          <div className="flex gap-3 flex-wrap">
            {(activeSection === "leads" || activeSection === "clients") && (
              <>
                <Button onClick={() => setBulkGroupDialogOpen(true)} variant="outline" className="border-[#6E4F7D] text-[#6E4F7D]">
                  <Users size={16} className="mr-2" /> Add to Group
                </Button>
                <Button onClick={() => setMassEmailDialogOpen(true)} className="bg-[#D8B46B] hover:bg-[#C9A557] text-[#1E3A32]">
                  <Mail size={16} className="mr-2" /> Mass Email
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
                  {syncing ? "Syncing..." : "Sync MailerLite"}
                </Button>
                <Button onClick={() => setConvertDialogOpen(true)} className="bg-[#6E4F7D] hover:bg-[#5A3F69] text-[#F9F5EF]">
                  <Plus size={16} className="mr-2" /> Invite to Platform
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Stats - visible on people sections */}
        {(activeSection === "leads" || activeSection === "users" || activeSection === "pending_invites" || activeSection === "clients") && (
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg border border-[#E4D9C4] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#2B2725]/60">Leads (Prospects)</p>
                  <p className="text-3xl font-bold text-[#1E3A32] mt-2">{totalLeads}</p>
                </div>
                <Users size={40} className="text-[#D8B46B]" />
              </div>
            </div>
            <div className="bg-white rounded-lg border border-[#E4D9C4] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#2B2725]/60">Clients</p>
                  <p className="text-3xl font-bold text-[#1E3A32] mt-2">{clientCount}</p>
                </div>
                <Users size={40} className="text-emerald-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg border border-[#E4D9C4] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#2B2725]/60">Active App Users</p>
                  <p className="text-3xl font-bold text-[#1E3A32] mt-2">{users.length}</p>
                </div>
                <Users size={40} className="text-[#6E4F7D]" />
              </div>
            </div>
            <div className="bg-white rounded-lg border border-[#E4D9C4] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#2B2725]/60">Lead → Client Rate</p>
                  <p className="text-3xl font-bold text-[#1E3A32] mt-2">{conversionRate}%</p>
                </div>
                <TrendingUp size={40} className="text-green-600" />
              </div>
            </div>
          </div>
        )}

        {/* Mobile section picker */}
        <div className="lg:hidden mb-6">
          <Select value={activeSection} onValueChange={setActiveSection}>
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SECTIONS.map((group) => (
                <React.Fragment key={group.group}>
                  <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-[#2B2725]/40 font-semibold">{group.group}</div>
                  {group.items.map((item) => (
                    <SelectItem key={item.key} value={item.key}>{item.label}</SelectItem>
                  ))}
                </React.Fragment>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sidebar + Content */}
        <div className="flex gap-8">
          <ClientsHubSidebar
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            counts={{ leads: totalLeads, clients: clientCount, pending_invites: pendingCount, users: users.length }}
          />
          <div className="flex-1 min-w-0">
            {renderContent()}
          </div>
        </div>

        {/* Dialogs */}
        <ConvertLeadsDialog
          open={convertDialogOpen}
          onOpenChange={setConvertDialogOpen}
          leads={leads}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["admin-all-users"] });
            queryClient.invalidateQueries({ queryKey: ["leads"] });
            setConvertDialogOpen(false);
          }}
        />
        <MassEmailDialog
          open={massEmailDialogOpen}
          onOpenChange={setMassEmailDialogOpen}
          leads={leads}
        />
        <BulkAssignGroupDialog
          open={bulkGroupDialogOpen}
          onOpenChange={setBulkGroupDialogOpen}
          leads={leads}
        />
      </div>
    </div>
  );
}