import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Shield, Users as UsersIcon, UserCog } from "lucide-react";
import { format } from "date-fns";

export default function StudioRoles() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["studio-all-users"],
    queryFn: () => base44.entities.User.list("-created_date"),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }) => base44.entities.User.update(id, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studio-all-users"] });
    },
  });

  const filteredUsers = users.filter((user) =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const managers = users.filter(u => u.role === "manager").length;
  const regularUsers = users.filter(u => u.role === "user").length;
  const admins = users.filter(u => u.role === "admin").length;

  const handleRoleChange = (userId, newRole) => {
    if (newRole === "admin") {
      alert("App Admin role cannot be set via UI for security. Contact platform admin.");
      return;
    }
    updateRoleMutation.mutate({ id: userId, role: newRole });
  };

  return (
    <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="font-serif text-4xl text-[#1E3A32] mb-2">Roles & Access</h1>
          <p className="text-[#2B2725]/70">Manage app-level roles and permissions</p>
        </div>

        {/* Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6">
            <div className="flex items-center gap-3 mb-2">
              <UserCog size={24} className="text-[#D8B46B]" />
              <span className="text-3xl font-serif text-[#1E3A32]">{managers}</span>
            </div>
            <p className="text-[#2B2725]/70 text-sm">Managers</p>
          </div>
          <div className="bg-white p-6">
            <div className="flex items-center gap-3 mb-2">
              <UsersIcon size={24} className="text-[#A6B7A3]" />
              <span className="text-3xl font-serif text-[#1E3A32]">{regularUsers}</span>
            </div>
            <p className="text-[#2B2725]/70 text-sm">Users</p>
          </div>
          <div className="bg-white p-6">
            <div className="flex items-center gap-3 mb-2">
              <Shield size={24} className="text-[#6E4F7D]" />
              <span className="text-3xl font-serif text-[#1E3A32]">{admins}</span>
            </div>
            <p className="text-[#2B2725]/70 text-sm">App Admins</p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2B2725]/40" size={20} />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-[#2B2725]/60">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-[#2B2725]/60">No users found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F9F5EF]">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-[#2B2725]">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-[#2B2725]">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-[#2B2725]">
                      Current Role
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-[#2B2725]">
                      Joined
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-[#2B2725]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4D9C4]">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-[#F9F5EF]/50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-[#1E3A32]">{user.full_name || "—"}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#2B2725]/70">
                        {user.email}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-3 py-1 text-xs uppercase tracking-wide ${
                            user.role === "admin"
                              ? "bg-[#6E4F7D]/20 text-[#6E4F7D]"
                              : user.role === "manager"
                              ? "bg-[#D8B46B]/20 text-[#2B2725]"
                              : "bg-[#A6B7A3]/20 text-[#1E3A32]"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#2B2725]/70">
                        {format(new Date(user.created_date), "MMM d, yyyy")}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end">
                          {user.role !== "admin" && (
                            <Select
                              value={user.role}
                              onValueChange={(newRole) => handleRoleChange(user.id, newRole)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                          {user.role === "admin" && (
                            <span className="text-xs text-[#2B2725]/60">Protected</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6 bg-[#D8B46B]/10 p-4 text-sm text-[#2B2725]/80">
          <strong>Note:</strong> App Admin role cannot be set via this UI for security. Only platform administrators can assign App Admin access.
        </div>
      </div>
    </div>
  );
}