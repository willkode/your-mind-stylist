import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Mail, Calendar, Upload } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import toast from "react-hot-toast";

export default function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-all-users"],
    queryFn: async () => {
      const res = await base44.functions.invoke("getAllUsers");
      return res.data?.users || [];
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }) => {
      const response = await base44.functions.invoke('updateUserRole', { 
        userId, 
        role: newRole 
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-all-users"] });
      toast.success("User role updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update role: ${error.message}`);
    },
  });

  const handleRoleChange = (userId, newRole) => {
    if (window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      updateRoleMutation.mutate({ userId, newRole });
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const userRole = user.custom_role || user.role;
    const matchesRole = roleFilter === "all" || userRole === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-serif text-4xl text-[#1E3A32] mb-2">User Management</h1>
            <p className="text-[#2B2725]/70">View and manage all platform users</p>
          </div>
          <Link to={createPageUrl("KajabiImport")}>
            <Button className="bg-[#D8B46B] hover:bg-[#c9a55c] text-[#1E3A32] font-medium">
              <Upload size={16} className="mr-2" /> Import from Kajabi
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[300px]">
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
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-[#2B2725]">
                      Joined
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-[#2B2725]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4D9C4]">
                  {filteredUsers.map((user) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-[#F9F5EF]/50"
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-[#1E3A32]">
                          {user.full_name || "—"}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-[#2B2725]/70">
                          <Mail size={14} />
                          {user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-3 py-1 text-xs uppercase tracking-wide ${
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
                      <td className="px-6 py-4 text-sm text-[#2B2725]/70">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} />
                          {format(new Date(user.created_date), "MMM d, yyyy")}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Select
                          value={user.custom_role || user.role}
                          onValueChange={(newRole) => handleRoleChange(user.id, newRole)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="user">User</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6 text-center text-sm text-[#2B2725]/60">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      </div>
    </div>
  );
}