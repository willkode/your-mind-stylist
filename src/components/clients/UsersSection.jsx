import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Mail, Calendar, Plus, SendHorizonal, Info, MoreVertical, UserX, Archive, CheckCircle, Trash2 } from "lucide-react";
import SendIndividualEmailDialog from "./SendIndividualEmailDialog";
import PersonDetailPanel from "./PersonDetailPanel";
import { format } from "date-fns";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import CreateUserModal from "./CreateUserModal.jsx";
import ManualEnrollmentModal from "../manager/ManualEnrollmentModal";
import DeactivateUserDialog from "./DeactivateUserDialog";
import SafeDeleteUserDialog from "./SafeDeleteUserDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function UsersSection({ users, isLoading, leads = [], currentUser }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [enrollmentModalOpen, setEnrollmentModalOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailTarget, setEmailTarget] = useState(null);
  const [personPanelOpen, setPersonPanelOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [deactivateAction, setDeactivateAction] = useState("deactivate");
  const [safeDeleteTarget, setSafeDeleteTarget] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const queryClient = useQueryClient();

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }) => {
      const response = await base44.functions.invoke("updateUserRole", { userId, role: newRole });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-all-users"] });
      toast.success("User role updated");
    },
    onError: (error) => {
      toast.error(`Failed to update role: ${error.message}`);
    },
  });

  // Build email→lead lookup for extra details
  const leadByEmail = React.useMemo(() => {
    const map = {};
    leads.forEach((l) => {
      if (l.email) map[l.email.toLowerCase()] = l;
    });
    return map;
  }, [leads]);

  const getLeadForUser = (user) => leadByEmail[user.email?.toLowerCase()] || null;

  const filteredUsers = users.filter((user) => {
    const lead = getLeadForUser(user);
    const term = searchTerm.toLowerCase();
    // Build a combined searchable name from all available name fields
    const derivedName = [user.first_name, user.last_name].filter(Boolean).join(" ");
    const leadDerivedName = [lead?.first_name, lead?.last_name].filter(Boolean).join(" ");
    const matchesSearch =
      user.full_name?.toLowerCase().includes(term) ||
      derivedName.toLowerCase().includes(term) ||
      user.username?.toLowerCase().includes(term) ||
      user.email?.toLowerCase().includes(term) ||
      lead?.full_name?.toLowerCase().includes(term) ||
      leadDerivedName.toLowerCase().includes(term) ||
      lead?.phone?.includes(searchTerm) ||
      lead?.city?.toLowerCase().includes(term);
    const userRole = user.custom_role || user.role;
    const matchesRole = roleFilter === "all" || userRole === roleFilter;
    const userStatus = user.account_status || "active";
    const matchesStatus = statusFilter === "all" || userStatus === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 bg-[#A6B7A3]/15 border border-[#A6B7A3]/30 rounded-lg">
        <Info size={18} className="text-[#1E3A32] mt-0.5 flex-shrink-0" />
        <p className="text-sm text-[#2B2725]/80">
          <strong>Users</strong> have platform accounts — they can log in, access courses, and use the client portal. 
          Use <strong>"Create User"</strong> to invite someone new, then <strong>"Enroll User in Course"</strong> to grant them course access (e.g., gifting LENS™).
          <span className="block mt-1 text-[#2B2725]/60"><strong>Note:</strong> New users must accept their email invitation and set up a password before their account is fully active. Course enrollment works best after they've accepted.</span>
        </p>
      </div>

      {/* Top Actions */}
      <div className="flex gap-3 flex-wrap">
        <Button
          onClick={() => setCreateUserOpen(true)}
          className="bg-[#1E3A32] hover:bg-[#2B2725] text-[#F9F5EF]"
        >
          <Plus size={16} className="mr-2" />
          Create User
        </Button>
        <Button
          onClick={() => setEnrollmentModalOpen(true)}
          className="bg-[#6E4F7D] hover:bg-[#5A3F69] text-[#F9F5EF]"
        >
          <Plus size={16} className="mr-2" />
          Enroll User in Course
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-white">
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[300px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2B2725]/40" size={16} />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="w-48">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                  <SelectItem value="deleted">Deleted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="bg-white overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-[#2B2725]/60">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-[#2B2725]/60">No users found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F9F5EF]">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-[#2B2725]">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-[#2B2725]">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-[#2B2725]">Phone</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-[#2B2725]">Location</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-[#2B2725]">What They Bought</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-[#2B2725]">Role</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-[#2B2725]">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-[#2B2725]">Joined</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-[#2B2725]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4D9C4]">
                  {filteredUsers.map((user) => {
                    const lead = getLeadForUser(user);
                    const phone = user.phone || lead?.phone || "";
                    const location = [lead?.city, lead?.state].filter(Boolean).join(", ");
                    const purchased = lead?.what_they_bought || 
                      (user.purchased_product_ids?.length ? `${user.purchased_product_ids.length} product${user.purchased_product_ids.length > 1 ? "s" : ""} purchased` : "");

                    // Derive display name: prefer first_name+last_name, fallback to full_name, then lead
                    const derivedName = user.first_name
                      ? `${user.first_name} ${user.last_name || ""}`.trim()
                      : user.full_name || (lead?.first_name ? `${lead.first_name} ${lead.last_name || ""}`.trim() : lead?.full_name || "");
                    const displayUsername = user.username || (user.email ? user.email.split("@")[0] : "—");

                    const acctStatus = user.account_status || "active";
                    const isBlocked = ["inactive", "archived", "deleted"].includes(acctStatus);
                    const isSelf = currentUser && (user.id === currentUser.id || user.email === currentUser.email);
                    const targetRole = user.custom_role || user.role;
                    const isProtectedRole = targetRole === "admin" || targetRole === "manager";
                    const showMenu = !isSelf && !isProtectedRole && acctStatus !== "deleted";

                    return (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`hover:bg-[#F9F5EF]/50 ${isBlocked ? "opacity-60" : ""}`}
                    >
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setSelectedPerson({ email: user.email, name: derivedName || user.full_name });
                            setPersonPanelOpen(true);
                          }}
                          className="text-left group"
                        >
                          <span className="font-medium text-[#1E3A32] group-hover:text-[#6E4F7D] group-hover:underline transition-colors block">
                            {derivedName || <span className="italic text-[#2B2725]/40">Name not set</span>}
                          </span>
                          <span className="text-xs text-[#2B2725]/50 block mt-0.5">
                            @{displayUsername}
                          </span>
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail size={14} className="text-[#2B2725]/40" />
                          <button
                            onClick={() => {
                              setSelectedPerson({ email: user.email, name: user.full_name });
                              setPersonPanelOpen(true);
                            }}
                            className="text-[#2B2725]/70 hover:text-[#6E4F7D] hover:underline transition-colors"
                          >
                            {user.email}
                          </button>
                          {user.email && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEmailTarget({ email: user.email, name: user.full_name });
                                setEmailDialogOpen(true);
                              }}
                              className="p-1 rounded hover:bg-[#D8B46B]/20 text-[#6E4F7D] hover:text-[#1E3A32] transition-colors flex-shrink-0"
                              title={`Send email to ${user.email}`}
                            >
                              <SendHorizonal size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#2B2725]/70 whitespace-nowrap">
                        {phone || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#2B2725]/70 whitespace-nowrap">
                        {location || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#2B2725]/70 max-w-[200px] truncate" title={purchased}>
                        {purchased || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-3 py-1 text-xs uppercase tracking-wide rounded ${
                            (user.custom_role || user.role) === "admin"
                              ? "bg-[#6E4F7D]/20 text-[#6E4F7D]"
                              : (user.custom_role || user.role) === "manager"
                              ? "bg-[#D8B46B]/20 text-[#D8B46B]"
                              : "bg-[#A6B7A3]/20 text-[#1E3A32]"
                          }`}
                        >
                          {user.custom_role || user.role}
                        </span>
                      </td>
                      {/* Status Badge */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full ${
                          acctStatus === "active" ? "bg-green-100 text-green-700" :
                          acctStatus === "inactive" ? "bg-amber-100 text-amber-700" :
                          acctStatus === "archived" ? "bg-gray-100 text-gray-600" :
                          acctStatus === "deleted" ? "bg-red-100 text-red-700" :
                          "bg-green-100 text-green-700"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            acctStatus === "active" ? "bg-green-500" :
                            acctStatus === "inactive" ? "bg-amber-500" :
                            acctStatus === "archived" ? "bg-gray-400" :
                            acctStatus === "deleted" ? "bg-red-500" :
                            "bg-green-500"
                          }`} />
                          {acctStatus === "active" ? "Active" :
                           acctStatus === "inactive" ? "Paused" :
                           acctStatus === "archived" ? "Archived" :
                           acctStatus === "deleted" ? "Deleted" : "Active"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#2B2725]/70">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} />
                          {format(new Date(user.created_date), "MMM d, yyyy")}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Select
                            value={user.custom_role || user.role}
                            onValueChange={(newRole) =>
                              updateRoleMutation.mutate({ userId: user.id, newRole })
                            }
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="user">User</SelectItem>
                            </SelectContent>
                          </Select>
                          {showMenu && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="p-1.5 rounded hover:bg-[#E4D9C4]/50 text-[#2B2725]/40 hover:text-[#2B2725]">
                                  <MoreVertical size={16} />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {acctStatus === "active" && (
                                  <>
                                    <DropdownMenuItem onClick={() => { setDeactivateTarget(user); setDeactivateAction("deactivate"); }}>
                                      <UserX size={14} className="mr-2 text-amber-600" /> Deactivate
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => { setDeactivateTarget(user); setDeactivateAction("archive"); }}>
                                      <Archive size={14} className="mr-2 text-[#2B2725]/60" /> Archive
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {acctStatus === "inactive" && (
                                  <>
                                    <DropdownMenuItem onClick={() => { setDeactivateTarget(user); setDeactivateAction("reactivate"); }}>
                                      <CheckCircle size={14} className="mr-2 text-green-600" /> Reactivate
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => { setDeactivateTarget(user); setDeactivateAction("archive"); }}>
                                      <Archive size={14} className="mr-2 text-[#2B2725]/60" /> Archive
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSafeDeleteTarget(user)} className="text-red-600">
                                      <Trash2 size={14} className="mr-2" /> Permanent Delete
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {acctStatus === "archived" && (
                                  <>
                                    <DropdownMenuItem onClick={() => { setDeactivateTarget(user); setDeactivateAction("reactivate"); }}>
                                      <CheckCircle size={14} className="mr-2 text-green-600" /> Reactivate
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSafeDeleteTarget(user)} className="text-red-600">
                                      <Trash2 size={14} className="mr-2" /> Permanent Delete
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                          {isSelf && (
                            <span className="text-[10px] text-[#2B2725]/30 italic">You</span>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="text-center text-sm text-[#2B2725]/60">
        Showing {filteredUsers.length} of {users.length} users
      </div>

      {/* Create User Modal */}
      <CreateUserModal
        open={createUserOpen}
        onOpenChange={setCreateUserOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["admin-all-users"] });
          setCreateUserOpen(false);
        }}
      />

      {/* Enrollment Modal */}
      <ManualEnrollmentModal
        open={enrollmentModalOpen}
        onOpenChange={setEnrollmentModalOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["admin-all-users"] });
        }}
      />

      {/* Individual Email Dialog */}
      {emailTarget && (
        <SendIndividualEmailDialog
          open={emailDialogOpen}
          onOpenChange={setEmailDialogOpen}
          recipientEmail={emailTarget.email}
          recipientName={emailTarget.name}
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

      {/* Deactivate/Archive/Reactivate Dialog */}
      {deactivateTarget && (
        <DeactivateUserDialog
          open={!!deactivateTarget}
          onOpenChange={(v) => { if (!v) setDeactivateTarget(null); }}
          user={deactivateTarget}
          action={deactivateAction}
        />
      )}

      {/* Safe Delete Dialog */}
      {safeDeleteTarget && (
        <SafeDeleteUserDialog
          open={!!safeDeleteTarget}
          onOpenChange={(v) => { if (!v) setSafeDeleteTarget(null); }}
          user={safeDeleteTarget}
        />
      )}
    </div>
  );
}