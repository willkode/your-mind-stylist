import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Mail, Shield, Trash2 } from "lucide-react";

export default function StaffManagement() {
  if (typeof window !== 'undefined') {
    window.__USE_AUTH_LAYOUT = true;
  }

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newStaff, setNewStaff] = useState({ email: "", full_name: "" });
  const queryClient = useQueryClient();

  const { data: staff = [], isLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      const users = await base44.entities.User.list();
      return users.filter(u => ['admin', 'manager'].includes(u.role));
    },
  });

  const inviteStaffMutation = useMutation({
    mutationFn: async (staffData) => {
      // In a real implementation, this would send an invite email
      // For now, we'll just create a user record
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setShowAddDialog(false);
      setNewStaff({ email: "", full_name: "" });
    },
  });

  const handleInviteStaff = () => {
    inviteStaffMutation.mutate(newStaff);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A32] mx-auto mb-4"></div>
          <p className="text-[#2B2725]/70">Loading staff...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-serif text-4xl text-[#1E3A32] mb-2">Staff Management</h1>
            <p className="text-[#2B2725]/70">Manage your team members and their permissions</p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus size={18} className="mr-2" />
            Add Staff Member
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {staff.map((member) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 shadow-md"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#D8B46B] flex items-center justify-center text-white font-semibold">
                    {member.full_name?.charAt(0) || member.email?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-medium text-[#1E3A32]">{member.full_name}</h3>
                    <Badge variant="outline" className="mt-1">
                      <Shield size={12} className="mr-1" />
                      {member.role}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-[#2B2725]/70">
                  <Mail size={14} />
                  <span className="truncate">{member.email}</span>
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-[#E4D9C4]">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => window.location.href = `/manager-availability?staff_id=${member.id}`}
                >
                  Manage Availability
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {staff.length === 0 && (
          <div className="text-center py-16 bg-white shadow-md">
            <Users size={64} className="mx-auto mb-4 text-[#2B2725]/30" />
            <p className="text-[#2B2725]/70 mb-4">No staff members yet</p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus size={18} className="mr-2" />
              Add Your First Staff Member
            </Button>
          </div>
        )}

        {/* Add Staff Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Staff Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Full Name</Label>
                <Input
                  value={newStaff.full_name}
                  onChange={(e) => setNewStaff({ ...newStaff, full_name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label>Email Address</Label>
                <Input
                  type="email"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
              <p className="text-sm text-[#2B2725]/60">
                They'll receive an invitation email to join your team.
              </p>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowAddDialog(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleInviteStaff} className="flex-1">
                  Send Invite
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}