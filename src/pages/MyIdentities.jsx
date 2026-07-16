import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, Trash2, Plus, Check, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function MyIdentities() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const { data: identities = [], isLoading } = useQuery({
    queryKey: ["identity-wardrobe"],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.IdentityWardrobe.filter({ created_by: user.email });
    }
  });

  // Fetch check-ins to count usage per identity
  const { data: checkIns = [] } = useQuery({
    queryKey: ["daily-style-checks"],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.DailyStyleCheck.filter({ created_by: user.email });
    }
  });

  const usageMap = {};
  checkIns.forEach(ci => {
    if (ci.identity_name) usageMap[ci.identity_name] = (usageMap[ci.identity_name] || 0) + 1;
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.IdentityWardrobe.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["identity-wardrobe"] });
      setEditingId(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.IdentityWardrobe.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["identity-wardrobe"] })
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.IdentityWardrobe.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["identity-wardrobe"] });
      setShowAdd(false);
      setNewName("");
      setNewDesc("");
    }
  });

  const startEdit = (identity) => {
    setEditingId(identity.id);
    setEditName(identity.name);
    setEditDesc(identity.description || "");
  };

  const starters = identities.filter(i => i.is_default);
  const custom = identities.filter(i => !i.is_default);

  return (
    <div className="min-h-screen bg-[#F9F5EF] pt-24 pb-16 px-4">
      <div className="max-w-xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-[#1E3A32]/60 hover:text-[#1E3A32] mb-4 transition-colors"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <h1 className="font-serif text-3xl text-[#1E3A32] mb-1">My Identities</h1>
          <p className="text-sm text-[#2B2725]/60">The outfits you wear — manage them here.</p>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-[#2B2725]/40">Loading...</div>
        ) : (
          <div className="space-y-6">
            {/* Starter Identities */}
            <div>
              <h2 className="text-xs font-medium text-[#2B2725]/50 tracking-widest uppercase mb-3">Starter Identities</h2>
              <div className="space-y-2">
                {starters.map(identity => (
                  <IdentityRow
                    key={identity.id}
                    identity={identity}
                    usage={usageMap[identity.name] || 0}
                    isEditing={editingId === identity.id}
                    editName={editName}
                    editDesc={editDesc}
                    onEditNameChange={setEditName}
                    onEditDescChange={setEditDesc}
                    onStartEdit={() => startEdit(identity)}
                    onSave={() => updateMutation.mutate({ id: identity.id, data: { name: editName, description: editDesc } })}
                    onCancel={() => setEditingId(null)}
                    canDelete={false}
                  />
                ))}
              </div>
            </div>

            {/* Custom Identities */}
            <div>
              <h2 className="text-xs font-medium text-[#2B2725]/50 tracking-widest uppercase mb-3">Your Custom Identities</h2>
              {custom.length === 0 && !showAdd ? (
                <p className="text-sm text-[#2B2725]/40 mb-3">None yet — add one below.</p>
              ) : (
                <div className="space-y-2 mb-3">
                  {custom.map(identity => (
                    <IdentityRow
                      key={identity.id}
                      identity={identity}
                      usage={usageMap[identity.name] || 0}
                      isEditing={editingId === identity.id}
                      editName={editName}
                      editDesc={editDesc}
                      onEditNameChange={setEditName}
                      onEditDescChange={setEditDesc}
                      onStartEdit={() => startEdit(identity)}
                      onSave={() => updateMutation.mutate({ id: identity.id, data: { name: editName, description: editDesc } })}
                      onCancel={() => setEditingId(null)}
                      canDelete={true}
                      onDelete={() => deleteMutation.mutate(identity.id)}
                    />
                  ))}
                </div>
              )}

              {/* Add new */}
              {!showAdd ? (
                <button
                  onClick={() => setShowAdd(true)}
                  className="flex items-center gap-2 text-sm text-[#1E3A32] hover:text-[#D8B46B] transition-colors font-medium"
                >
                  <Plus size={15} /> Add new identity
                </button>
              ) : (
                <div className="p-4 bg-white rounded-xl border border-[#E4D9C4] space-y-3">
                  <input
                    type="text"
                    placeholder="Identity name"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-[#E4D9C4] rounded focus:outline-none focus:border-[#D8B46B]"
                    autoFocus
                  />
                  <input
                    type="text"
                    placeholder="Short description (optional)"
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-[#E4D9C4] rounded focus:outline-none focus:border-[#D8B46B]"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={!newName.trim() || createMutation.isPending}
                      onClick={() => createMutation.mutate({ name: newName.trim(), description: newDesc.trim(), is_default: false })}
                      className="bg-[#1E3A32] hover:bg-[#2B2725] flex-1 text-xs"
                    >
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setShowAdd(false); setNewName(""); setNewDesc(""); }} className="text-xs">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function IdentityRow({ identity, usage, isEditing, editName, editDesc, onEditNameChange, onEditDescChange, onStartEdit, onSave, onCancel, canDelete, onDelete }) {
  if (isEditing) {
    return (
      <div className="p-4 bg-white rounded-xl border-2 border-[#D8B46B] space-y-2">
        <input
          value={editName}
          onChange={e => onEditNameChange(e.target.value)}
          className="w-full text-sm font-medium px-3 py-2 border border-[#E4D9C4] rounded focus:outline-none focus:border-[#D8B46B]"
          autoFocus
        />
        <input
          value={editDesc}
          onChange={e => onEditDescChange(e.target.value)}
          className="w-full text-sm px-3 py-2 border border-[#E4D9C4] rounded focus:outline-none focus:border-[#D8B46B]"
          placeholder="Description"
        />
        <div className="flex gap-2">
          <button onClick={onSave} className="flex items-center gap-1 text-xs text-[#1E3A32] font-medium hover:text-[#D8B46B] transition-colors">
            <Check size={13} /> Save
          </button>
          <button onClick={onCancel} className="flex items-center gap-1 text-xs text-[#2B2725]/50 hover:text-[#2B2725] transition-colors">
            <X size={13} /> Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-xl border border-[#E4D9C4] flex items-start gap-3">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-[#1E3A32]">{identity.name}</div>
        {identity.description && <div className="text-xs text-[#2B2725]/60 mt-0.5">{identity.description}</div>}
        {usage > 0 && <div className="text-[10px] text-[#D8B46B] mt-1">Worn {usage}×</div>}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button onClick={onStartEdit} className="p-1.5 text-[#2B2725]/40 hover:text-[#1E3A32] transition-colors rounded">
          <Pencil size={13} />
        </button>
        {canDelete && (
          <button onClick={onDelete} className="p-1.5 text-[#2B2725]/40 hover:text-red-500 transition-colors rounded">
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  );
}