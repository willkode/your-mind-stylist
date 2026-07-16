import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, GripVertical, Loader2, Save, ChevronDown, ChevronUp } from "lucide-react";
import toast from "react-hot-toast";

export default function QuizQuestionsEditor({ quizId }) {
  const [expandedId, setExpandedId] = useState(null);
  const [saving, setSaving] = useState(null);
  const [adding, setAdding] = useState(false);
  const queryClient = useQueryClient();

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ["quiz-questions-editor", quizId],
    queryFn: async () => {
      const qs = await base44.entities.QuizQuestion.filter({ quiz_id: quizId }, 'order');
      return qs;
    },
    enabled: !!quizId,
  });

  const [editForms, setEditForms] = useState({});

  const getForm = (q) => editForms[q.id] || {
    question_text: q.question_text,
    options: q.options || [],
    order: q.order,
  };

  const updateForm = (qId, field, value) => {
    setEditForms(prev => ({
      ...prev,
      [qId]: { ...getFormById(qId), [field]: value }
    }));
  };

  const getFormById = (qId) => {
    const q = questions.find(x => x.id === qId);
    return editForms[qId] || {
      question_text: q?.question_text || "",
      options: q?.options || [],
      order: q?.order || 0,
    };
  };

  const updateOption = (qId, optIdx, field, value) => {
    const form = getFormById(qId);
    const newOptions = [...form.options];
    newOptions[optIdx] = { ...newOptions[optIdx], [field]: value };
    updateForm(qId, "options", newOptions);
  };

  const addOption = (qId) => {
    const form = getFormById(qId);
    updateForm(qId, "options", [...form.options, { text: "", archetype: "" }]);
  };

  const removeOption = (qId, optIdx) => {
    const form = getFormById(qId);
    updateForm(qId, "options", form.options.filter((_, i) => i !== optIdx));
  };

  const handleSave = async (qId) => {
    setSaving(qId);
    const form = getFormById(qId);
    await base44.entities.QuizQuestion.update(qId, {
      question_text: form.question_text,
      options: form.options,
      order: form.order,
    });
    queryClient.invalidateQueries({ queryKey: ["quiz-questions-editor", quizId] });
    setSaving(null);
    toast.success("Question saved!");
  };

  const handleAddQuestion = async () => {
    setAdding(true);
    const nextOrder = questions.length > 0 ? Math.max(...questions.map(q => q.order || 0)) + 1 : 1;
    const newQ = await base44.entities.QuizQuestion.create({
      quiz_id: quizId,
      question_text: "New question",
      question_type: "multiple_choice",
      order: nextOrder,
      options: [
        { text: "Option A", archetype: "" },
        { text: "Option B", archetype: "" },
        { text: "Option C", archetype: "" },
        { text: "Option D", archetype: "" },
      ],
    });
    queryClient.invalidateQueries({ queryKey: ["quiz-questions-editor", quizId] });
    setExpandedId(newQ.id);
    setAdding(false);
    toast.success("Question added!");
  };

  const handleDelete = async (qId) => {
    if (!confirm("Delete this question?")) return;
    await base44.entities.QuizQuestion.delete(qId);
    queryClient.invalidateQueries({ queryKey: ["quiz-questions-editor", quizId] });
    if (expandedId === qId) setExpandedId(null);
    toast.success("Question deleted");
  };

  const moveQuestion = async (qId, direction) => {
    const idx = questions.findIndex(q => q.id === qId);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= questions.length) return;
    
    const q1 = questions[idx];
    const q2 = questions[swapIdx];
    await Promise.all([
      base44.entities.QuizQuestion.update(q1.id, { order: q2.order }),
      base44.entities.QuizQuestion.update(q2.id, { order: q1.order }),
    ]);
    queryClient.invalidateQueries({ queryKey: ["quiz-questions-editor", quizId] });
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[#D8B46B]" size={24} /></div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[#2B2725]/60">{questions.length} question{questions.length !== 1 ? 's' : ''}</p>
        <Button onClick={handleAddQuestion} disabled={adding} className="bg-[#1E3A32] hover:bg-[#2B2725] text-white">
          {adding ? <Loader2 size={16} className="animate-spin mr-2" /> : <Plus size={16} className="mr-2" />}
          Add Question
        </Button>
      </div>

      {questions.map((q, idx) => {
        const isExpanded = expandedId === q.id;
        const form = getForm(q);
        
        return (
          <div key={q.id} className="bg-white border border-[#E4D9C4]">
            <div
              className="flex items-center gap-3 p-4 cursor-pointer hover:bg-[#F9F5EF]/50"
              onClick={() => setExpandedId(isExpanded ? null : q.id)}
            >
              <div className="flex flex-col gap-0.5">
                <button onClick={e => { e.stopPropagation(); moveQuestion(q.id, "up"); }} disabled={idx === 0} className="text-[#2B2725]/30 hover:text-[#1E3A32] disabled:opacity-20">
                  <ChevronUp size={14} />
                </button>
                <button onClick={e => { e.stopPropagation(); moveQuestion(q.id, "down"); }} disabled={idx === questions.length - 1} className="text-[#2B2725]/30 hover:text-[#1E3A32] disabled:opacity-20">
                  <ChevronDown size={14} />
                </button>
              </div>
              <span className="text-xs text-[#D8B46B] font-medium w-6">{idx + 1}</span>
              <span className="flex-1 text-sm text-[#1E3A32] truncate">{q.question_text}</span>
              <span className="text-xs text-[#2B2725]/40">{q.options?.length || 0} options</span>
              {isExpanded ? <ChevronUp size={16} className="text-[#2B2725]/40" /> : <ChevronDown size={16} className="text-[#2B2725]/40" />}
            </div>

            {isExpanded && (
              <div className="border-t border-[#E4D9C4] p-4 space-y-4">
                <div>
                  <label className="text-sm text-[#2B2725]/70 mb-1 block">Question Text</label>
                  <Input
                    value={form.question_text}
                    onChange={e => updateForm(q.id, "question_text", e.target.value)}
                    className="border-[#E4D9C4]"
                  />
                </div>

                <div>
                  <label className="text-sm text-[#2B2725]/70 mb-2 block">Answer Options</label>
                  <div className="space-y-2">
                    {form.options.map((opt, optIdx) => (
                      <div key={optIdx} className="flex items-center gap-2">
                        <span className="text-xs text-[#D8B46B] font-medium w-6">{String.fromCharCode(65 + optIdx)}</span>
                        <Input
                          value={opt.text}
                          onChange={e => updateOption(q.id, optIdx, "text", e.target.value)}
                          placeholder="Answer text"
                          className="border-[#E4D9C4] flex-1"
                        />
                        <Input
                          value={opt.archetype || ""}
                          onChange={e => updateOption(q.id, optIdx, "archetype", e.target.value)}
                          placeholder="archetype key"
                          className="border-[#E4D9C4] w-36"
                        />
                        <button onClick={() => removeOption(q.id, optIdx)} className="text-red-400 hover:text-red-600 p-1">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => addOption(q.id)} className="mt-2 text-[#D8B46B]">
                    <Plus size={14} className="mr-1" /> Add Option
                  </Button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#E4D9C4]">
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(q.id)} className="text-red-500 hover:text-red-700">
                    <Trash2 size={14} className="mr-1" /> Delete Question
                  </Button>
                  <Button onClick={() => handleSave(q.id)} disabled={saving === q.id} className="bg-[#1E3A32] hover:bg-[#2B2725] text-white">
                    {saving === q.id ? <Loader2 size={14} className="animate-spin mr-1" /> : <Save size={14} className="mr-1" />}
                    Save
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