import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldCheck, Search, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import RoleBadge from "@/components/admin/RoleBadge";
import { getEffectiveRole, ROLE_LABELS } from "@/lib/permissions";

const PERMISSION_MATRIX = [
  { role: "owner", desc: "Full access — manages roles and permissions, all admin areas, logs, notes, settings, and records." },
  { role: "admin", desc: "Manages records and operational workflows, views logs, leaves internal notes. Cannot change owner accounts." },
  { role: "manager", desc: "Manages day-to-day operational records, content, and clients. Leaves internal notes. No role management or sensitive settings." },
  { role: "support_staff", desc: "Access to support-related records only (bookings, appointments, waiting list, intake). Can leave internal notes. No admin controls." },
];

export default function AdminRoles() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: me } = useQuery({
    queryKey: ["current-user"],
    queryFn: () => base44.auth.me(),
  });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-roles-users"],
    queryFn: () => base44.entities.User.list("-created_date", 500),
  });

  const myRole = getEffectiveRole(me);
  const ownerExists = users.some((u) => u.custom_role === "owner");
  const canAssignOwner = myRole === "owner" || !ownerExists;

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }) =>
      base44.functions.invoke("updateUserRole", { userId, role }),
    onSuccess: () => {
      toast.success("Role updated");
      queryClient.invalidateQueries({ queryKey: ["admin-roles-users"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || error.message);
    },
  });

  const filtered = users.filter(
    (u) =>
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F9F5EF] p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck size={28} className="text-[#1E3A32]" />
          <h1 className="font-serif text-3xl md:text-4xl text-[#1E3A32]">Roles &amp; Permissions</h1>
        </div>
        <p className="text-[#2B2725]/70 mb-8">
          Assign staff roles. Every change is recorded in the activity log.
        </p>

        {/* Permission matrix */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {PERMISSION_MATRIX.map(({ role, desc }) => (
            <Card key={role} className="p-4">
              <RoleBadge role={role} className="mb-2" />
              <p className="text-sm text-[#2B2725]/70 leading-relaxed">{desc}</p>
            </Card>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-4 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2B2725]/40" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="pl-9"
          />
        </div>

        {/* Users */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={28} className="animate-spin text-[#D8B46B]" />
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((u) => {
              const userRole = getEffectiveRole(u);
              const isSelf = u.id === me?.id;
              const isOwnerAccount = userRole === "owner";
              const locked = isSelf || (isOwnerAccount && myRole !== "owner");
              return (
                <Card key={u.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-[#1E3A32] truncate">
                        {u.full_name || u.email}
                      </p>
                      <RoleBadge role={userRole} />
                      {isSelf && <span className="text-[10px] text-[#2B2725]/40">(you)</span>}
                    </div>
                    <p className="text-xs text-[#2B2725]/50">{u.email}</p>
                  </div>
                  <Select
                    value={userRole}
                    disabled={locked || roleMutation.isPending}
                    onValueChange={(role) => roleMutation.mutate({ userId: u.id, role })}
                  >
                    <SelectTrigger className="w-[170px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["owner", "admin", "manager", "support_staff", "user"].map((r) => (
                        <SelectItem key={r} value={r} disabled={r === "owner" && !canAssignOwner}>
                          {ROLE_LABELS[r]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Card>
              );
            })}
            {filtered.length === 0 && (
              <Card className="p-8 text-center text-[#2B2725]/50 text-sm">No users match your search.</Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}