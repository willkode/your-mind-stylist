import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StickyNote, Pencil, Trash2, Loader2, Lock } from "lucide-react";
import { format } from "date-fns";
import RoleBadge from "./RoleBadge";

export default function InternalNotesPanel({ entityType, recordId }) {
  const queryClient = useQueryClient();
  const [newNote, setNewNote] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");

  const queryKey = ["internal-notes", entityType, recordId];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await base44.functions.invoke("adminNotes", {
        action: "list",
        entity_type: entityType,
        record_id: recordId,
      });
      return res.data;
    },
    enabled: !!entityType && !!recordId,
  });

  const notes = data?.notes || [];
  const viewerRole = data?.viewer_role || "user";
  const isAdmin = viewerRole === "admin" || viewerRole === "owner";

  const { data: me } = useQuery({
    queryKey: ["current-user-email"],
    queryFn: () => base44.auth.me(),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey });

  const createMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke("adminNotes", {
        action: "create",
        entity_type: entityType,
        record_id: recordId,
        content: newNote,
      }),
    onSuccess: () => {
      setNewNote("");
      refresh();
    },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke("adminNotes", {
        action: "update",
        note_id: editingId,
        content: editContent,
      }),
    onSuccess: () => {
      setEditingId(null);
      refresh();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (noteId) =>
      base44.functions.invoke("adminNotes", { action: "delete", note_id: noteId }),
    onSuccess: refresh,
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-[10px] text-[#2B2725]/40 uppercase tracking-wider">
        <Lock size={10} />
        Visible to staff only
      </div>

      {isLoading ? (
        <Loader2 size={16} className="animate-spin text-[#D8B46B]" />
      ) : notes.length === 0 ? (
        <p className="text-sm text-[#2B2725]/40 italic">No internal notes yet</p>
      ) : (
        <div className="space-y-2">
          {notes.map((note) => (
            <div key={note.id} className="p-3 bg-[#F9F5EF] rounded-lg border border-[#E4D9C4]/60">
              {editingId === note.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-[70px] text-sm bg-white"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => updateMutation.mutate()}
                      disabled={updateMutation.isPending || !editContent.trim()}
                      className="bg-[#1E3A32] hover:bg-[#2B2725] h-7 text-xs"
                    >
                      {updateMutation.isPending ? "Saving..." : "Save"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-7 text-xs">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-[#2B2725] whitespace-pre-line">{note.content}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2 text-[10px] text-[#2B2725]/50">
                      <StickyNote size={10} className="text-[#D8B46B]" />
                      <span className="font-medium">{note.author_name}</span>
                      {note.author_role && <RoleBadge role={note.author_role} />}
                      <span>{format(new Date(note.created_date), "MMM d, yyyy h:mm a")}</span>
                      {note.edited && <span className="italic">(edited)</span>}
                    </div>
                    <div className="flex gap-1">
                      {(isAdmin || note.author_email === me?.email) && (
                        <button
                          onClick={() => {
                            setEditingId(note.id);
                            setEditContent(note.content);
                          }}
                          className="p-1 text-[#2B2725]/40 hover:text-[#1E3A32]"
                          aria-label="Edit note"
                        >
                          <Pencil size={12} />
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => {
                            if (confirm("Delete this note?")) deleteMutation.mutate(note.id);
                          }}
                          className="p-1 text-[#2B2725]/40 hover:text-red-500"
                          aria-label="Delete note"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <Textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add an internal note..."
          className="min-h-[70px] text-sm border-[#E4D9C4]"
        />
        <Button
          size="sm"
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending || !newNote.trim()}
          className="bg-[#1E3A32] hover:bg-[#2B2725]"
        >
          {createMutation.isPending ? (
            <Loader2 size={14} className="mr-2 animate-spin" />
          ) : (
            <StickyNote size={14} className="mr-2" />
          )}
          Add Note
        </Button>
      </div>
    </div>
  );
}