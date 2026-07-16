import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Loader2, Save, ChevronDown, ChevronUp } from "lucide-react";
import toast from "react-hot-toast";

export default function QuizArchetypesEditor({ quizId }) {
  const [expandedId, setExpandedId] = useState(null);
  const [saving, setSaving] = useState(null);
  const [adding, setAdding] = useState(false);
  const queryClient = useQueryClient();

  const { data: archetypes = [], isLoading } = useQuery({
    queryKey: ["quiz-archetypes-editor", quizId],
    queryFn: async () => {
      const arcs = await base44.entities.QuizArchetype.filter({ quiz_id: quizId }, 'display_order');
      return arcs;
    },
    enabled: !!quizId,
  });

  const [editForms, setEditForms] = useState({});

  const getForm = (a) => editForms[a.id] || {
    key: a.key || "",
    title: a.title || "",
    emoji: a.emoji || "",
    color: a.color || "",
    summary: a.summary || "",
    strengths: a.strengths || [],
    growth: a.growth || "",
    relationships: a.relationships || "",
    stress: a.stress || "",
    restyle: a.restyle || "",
    work_pattern: a.work_pattern || "",
    home_pattern: a.home_pattern || "",
    display_order: a.display_order || 0,
  };

  const updateForm = (aId, field, value) => {
    const a = archetypes.find(x => x.id === aId);
    setEditForms(prev => ({
      ...prev,
      [aId]: { ...(prev[aId] || getForm(a)), [field]: value }
    }));
  };

  const handleSave = async (aId) => {
    setSaving(aId);
    const a = archetypes.find(x => x.id === aId);
    const form = editForms[aId] || getForm(a);
    await base44.entities.QuizArchetype.update(aId, form);
    queryClient.invalidateQueries({ queryKey: ["quiz-archetypes-editor", quizId] });
    setSaving(null);
    toast.success("Archetype saved!");
  };

  const handleAdd = async () => {
    setAdding(true);
    const nextOrder = archetypes.length > 0 ? Math.max(...archetypes.map(a => a.display_order || 0)) + 1 : 1;
    await base44.entities.QuizArchetype.create({
      quiz_id: quizId,
      key: "new-archetype",
      title: "New Archetype",
      emoji: "🐕",
      summary: "",
      strengths: [],
      display_order: nextOrder,
    });
    queryClient.invalidateQueries({ queryKey: ["quiz-archetypes-editor", quizId] });
    setAdding(false);
    toast.success("Archetype added!");
  };

  const handleDelete = async (aId) => {
    if (!confirm("Delete this archetype?")) return;
    await base44.entities.QuizArchetype.delete(aId);
    queryClient.invalidateQueries({ queryKey: ["quiz-archetypes-editor", quizId] });
    if (expandedId === aId) setExpandedId(null);
    toast.success("Archetype deleted");
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[#D8B46B]" size={24} /></div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-[#2B2725]/60">{archetypes.length} archetype{archetypes.length !== 1 ? 's' : ''}</p>
          <p className="text-xs text-[#2B2725]/40 mt-0.5">The archetype "key" must match the archetype values in your question options.</p>
        </div>
        <Button onClick={handleAdd} disabled={adding} className="bg-[#1E3A32] hover:bg-[#2B2725] text-white">
          {adding ? <Loader2 size={16} className="animate-spin mr-2" /> : <Plus size={16} className="mr-2" />}
          Add Archetype
        </Button>
      </div>

      {archetypes.map(a => {
        const isExpanded = expandedId === a.id;
        const form = getForm(a);

        return (
          <div key={a.id} className="bg-white border border-[#E4D9C4]">
            <div
              className="flex items-center gap-3 p-4 cursor-pointer hover:bg-[#F9F5EF]/50"
              onClick={() => setExpandedId(isExpanded ? null : a.id)}
            >
              <span className="text-2xl">{a.emoji}</span>
              <div className="flex-1">
                <span className="text-sm font-medium text-[#1E3A32]">{a.title}</span>
                <span className="text-xs text-[#2B2725]/40 ml-2">key: {a.key}</span>
              </div>
              {a.color && <div className="w-4 h-4 rounded-full" style={{ backgroundColor: a.color }} />}
              {isExpanded ? <ChevronUp size={16} className="text-[#2B2725]/40" /> : <ChevronDown size={16} className="text-[#2B2725]/40" />}
            </div>

            {isExpanded && (
              <div className="border-t border-[#E4D9C4] p-4 space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-[#2B2725]/70 mb-1 block">Key (internal)</label>
                    <Input value={form.key} onChange={e => updateForm(a.id, "key", e.target.value)} className="border-[#E4D9C4]" placeholder="e.g., leader" />
                  </div>
                  <div>
                    <label className="text-sm text-[#2B2725]/70 mb-1 block">Title (headline)</label>
                    <Input value={form.title} onChange={e => updateForm(a.id, "title", e.target.value)} className="border-[#E4D9C4]" placeholder="e.g., The Dog That Moves First" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-sm text-[#2B2725]/70 mb-1 block">Emoji</label>
                      <Input value={form.emoji} onChange={e => updateForm(a.id, "emoji", e.target.value)} className="border-[#E4D9C4]" />
                    </div>
                    <div>
                      <label className="text-sm text-[#2B2725]/70 mb-1 block">Color</label>
                      <Input type="color" value={form.color || "#D8B46B"} onChange={e => updateForm(a.id, "color", e.target.value)} className="border-[#E4D9C4] h-10" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-[#2B2725]/70 mb-1 block">Core Insight / Summary</label>
                  <Textarea value={form.summary} onChange={e => updateForm(a.id, "summary", e.target.value)} rows={2} className="border-[#E4D9C4]" />
                </div>

                <div>
                  <label className="text-sm text-[#2B2725]/70 mb-1 block">Strengths (one per line)</label>
                  <Textarea
                    value={(form.strengths || []).join("\n")}
                    onChange={e => updateForm(a.id, "strengths", e.target.value.split("\n").filter(s => s.trim()))}
                    rows={3}
                    className="border-[#E4D9C4]"
                    placeholder="Creates momentum&#10;Takes decisive action"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-[#2B2725]/70 mb-1 block">Growth Edge</label>
                    <Textarea value={form.growth} onChange={e => updateForm(a.id, "growth", e.target.value)} rows={2} className="border-[#E4D9C4]" />
                  </div>
                  <div>
                    <label className="text-sm text-[#2B2725]/70 mb-1 block">Restyle Prompt</label>
                    <Input value={form.restyle} onChange={e => updateForm(a.id, "restyle", e.target.value)} className="border-[#E4D9C4]" placeholder="e.g., Is this a moment for action… or presence?" />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-[#2B2725]/70 mb-1 block">In Relationships</label>
                    <Textarea value={form.relationships} onChange={e => updateForm(a.id, "relationships", e.target.value)} rows={2} className="border-[#E4D9C4]" />
                  </div>
                  <div>
                    <label className="text-sm text-[#2B2725]/70 mb-1 block">Under Stress</label>
                    <Textarea value={form.stress} onChange={e => updateForm(a.id, "stress", e.target.value)} rows={2} className="border-[#E4D9C4]" />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-[#2B2725]/70 mb-1 block">Work Pattern</label>
                    <Textarea value={form.work_pattern} onChange={e => updateForm(a.id, "work_pattern", e.target.value)} rows={2} className="border-[#E4D9C4]" />
                  </div>
                  <div>
                    <label className="text-sm text-[#2B2725]/70 mb-1 block">Home Pattern</label>
                    <Textarea value={form.home_pattern} onChange={e => updateForm(a.id, "home_pattern", e.target.value)} rows={2} className="border-[#E4D9C4]" />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#E4D9C4]">
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(a.id)} className="text-red-500 hover:text-red-700">
                    <Trash2 size={14} className="mr-1" /> Delete
                  </Button>
                  <Button onClick={() => handleSave(a.id)} disabled={saving === a.id} className="bg-[#1E3A32] hover:bg-[#2B2725] text-white">
                    {saving === a.id ? <Loader2 size={14} className="animate-spin mr-1" /> : <Save size={14} className="mr-1" />}
                    Save Archetype
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}