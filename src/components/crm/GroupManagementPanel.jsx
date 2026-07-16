import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Plus, Trash2, Loader2, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

export default function GroupManagementPanel() {
  const queryClient = useQueryClient();
  const [newGroupName, setNewGroupName] = useState("");

  const { data: groupsData, isLoading, refetch } = useQuery({
    queryKey: ["mailerlite-groups"],
    queryFn: async () => {
      const res = await base44.functions.invoke("mailerLiteGetGroups", {});
      return res.data;
    },
  });

  const groups = groupsData?.groups || [];

  const createMutation = useMutation({
    mutationFn: async (name) => {
      const res = await base44.functions.invoke("mailerLiteCreateGroup", { name });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Group created!");
      setNewGroupName("");
      queryClient.invalidateQueries({ queryKey: ["mailerlite-groups"] });
    },
    onError: (e) => toast.error("Failed: " + e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (groupId) => {
      const res = await base44.functions.invoke("mailerLiteDeleteGroup", { groupId });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Group deleted");
      queryClient.invalidateQueries({ queryKey: ["mailerlite-groups"] });
    },
    onError: (e) => toast.error("Failed: " + e.message),
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    createMutation.mutate(newGroupName.trim());
  };

  return (
    <div className="space-y-6">
      {/* Create group */}
      <form onSubmit={handleCreate} className="flex gap-3">
        <Input
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          placeholder="New group name (e.g., VIP Clients, Masterclass Leads)..."
          className="flex-1"
        />
        <Button
          type="submit"
          disabled={createMutation.isPending || !newGroupName.trim()}
          className="bg-[#1E3A32] hover:bg-[#2B2725] text-white"
        >
          {createMutation.isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <><Plus size={16} className="mr-1" /> Create</>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => refetch()}
          className="border-[#E4D9C4]"
        >
          <RefreshCw size={16} />
        </Button>
      </form>

      {/* Groups list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-[#D8B46B]" size={24} />
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-12">
          <Users size={48} className="mx-auto text-[#2B2725]/20 mb-4" />
          <p className="text-[#2B2725]/60">No groups yet. Create one to start organizing your contacts.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <div
              key={group.id}
              className="bg-white border border-[#E4D9C4] rounded-lg p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-[#1E3A32] truncate">{group.name}</h3>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-sm text-[#2B2725]/60">
                      <Users size={14} className="inline mr-1" />
                      {group.active_count || 0} subscribers
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-[#2B2725]/30 hover:text-red-600 flex-shrink-0"
                  onClick={() => {
                    if (confirm(`Delete group "${group.name}"? Subscribers won't be deleted.`)) {
                      deleteMutation.mutate(group.id);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}