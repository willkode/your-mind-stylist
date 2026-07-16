import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit2, Trash2, GripVertical, Clock, Mail, Plus, SendHorizonal, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import toast from "react-hot-toast";

export default function SequenceTimeline({ steps, onReorder, onEditStep, onDeleteStep, onAddStep }) {
  const [testingStepId, setTestingStepId] = useState(null);
  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState(false);

  const handleQuickTest = async (step) => {
    if (!testEmail?.trim()) {
      toast.error("Enter your email first");
      return;
    }
    setSendingTest(true);
    try {
      const res = await base44.functions.invoke("sendTestSequenceEmail", {
        to_email: testEmail.trim(),
        subject: step.subject,
        body_html: step.body_html,
        cta_text: step.cta_text,
        cta_url: step.cta_url,
      });
      toast.success(res.data.message || "Test sent!");
      setTestingStepId(null);
    } catch (err) {
      toast.error("Failed: " + (err.message || "Unknown error"));
    } finally {
      setSendingTest(false);
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = Array.from(steps);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    onReorder(reordered);
  };

  if (steps.length === 0) {
    return (
      <div className="text-center py-8 border-2 border-dashed border-[#E4D9C4] rounded-lg">
        <Mail size={32} className="mx-auto text-[#2B2725]/20 mb-3" />
        <p className="text-sm text-[#2B2725]/50 mb-3">No emails in this sequence yet</p>
        <Button size="sm" onClick={onAddStep} className="bg-[#1E3A32] hover:bg-[#2B2725] text-white">
          <Plus size={14} className="mr-1" /> Add First Email
        </Button>
      </div>
    );
  }

  return (
    <div>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="steps">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-1">
              {steps.map((step, index) => (
                <Draggable key={step.id} draggableId={step.id} index={index}>
                  {(prov, snapshot) => (
                    <div
                      ref={prov.innerRef}
                      {...prov.draggableProps}
                      className={`flex items-stretch gap-3 ${snapshot.isDragging ? "opacity-80" : ""}`}
                    >
                      {/* Timeline line */}
                      <div className="flex flex-col items-center w-8 flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          step.active !== false ? "bg-[#1E3A32] text-white" : "bg-gray-300 text-gray-600"
                        }`}>
                          {index + 1}
                        </div>
                        {index < steps.length - 1 && (
                          <div className="w-px flex-1 bg-[#E4D9C4] min-h-[20px]" />
                        )}
                      </div>

                      {/* Step card */}
                      <div className={`flex-1 border rounded-lg p-4 mb-2 transition-shadow ${
                        snapshot.isDragging ? "shadow-lg border-[#D8B46B]" : "border-[#E4D9C4] hover:shadow-sm"
                      } bg-white`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div {...prov.dragHandleProps} className="mt-0.5 cursor-grab text-[#2B2725]/30 hover:text-[#2B2725]/60">
                              <GripVertical size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-[#1E3A32] truncate">{step.subject}</p>
                              {step.preview_text && (
                                <p className="text-xs text-[#2B2725]/50 truncate mt-0.5">{step.preview_text}</p>
                              )}
                              <div className="flex items-center gap-3 mt-2 text-xs text-[#2B2725]/60">
                                <span className="flex items-center gap-1">
                                  <Clock size={11} />
                                  {step.delay_days === 0 && (step.delay_hours || 0) === 0
                                    ? "Immediately"
                                    : `${step.delay_days}d ${step.delay_hours || 0}h after previous`}
                                </span>
                                {(step.sent_count || 0) > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Mail size={11} />
                                    {step.sent_count} sent
                                  </span>
                                )}
                              </div>
                              {/* Mini stats */}
                              {(step.open_rate > 0 || step.click_rate > 0) && (
                                <div className="flex gap-3 mt-2">
                                  <Badge variant="outline" className="text-[10px]">
                                    {step.open_rate || 0}% opens
                                  </Badge>
                                  <Badge variant="outline" className="text-[10px]">
                                    {step.click_rate || 0}% clicks
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1 flex-shrink-0 ml-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-[#6E4F7D] hover:text-[#5A3F69]"
                              onClick={() => setTestingStepId(testingStepId === step.id ? null : step.id)}
                              title="Send test email"
                            >
                              <SendHorizonal size={13} />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onEditStep(step)}>
                              <Edit2 size={13} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-red-400 hover:text-red-600"
                              onClick={() => {
                                if (confirm("Delete this email step?")) onDeleteStep(step.id);
                              }}
                            >
                              <Trash2 size={13} />
                            </Button>
                          </div>
                        </div>
                        {/* Quick test inline */}
                        {testingStepId === step.id && (
                          <div className="mt-2 pt-2 border-t border-[#E4D9C4]/60 flex gap-2 items-center">
                            <Input
                              type="email"
                              value={testEmail}
                              onChange={(e) => setTestEmail(e.target.value)}
                              placeholder="your@email.com"
                              className="h-7 text-xs flex-1"
                            />
                            <Button
                              size="sm"
                              className="h-7 text-xs bg-[#6E4F7D] hover:bg-[#5A3F69] text-white px-3"
                              onClick={() => handleQuickTest(step)}
                              disabled={sendingTest || !testEmail?.trim()}
                            >
                              {sendingTest ? <Loader2 size={12} className="animate-spin" /> : "Send"}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <Button
        size="sm"
        variant="outline"
        className="mt-3 ml-11"
        onClick={onAddStep}
      >
        <Plus size={14} className="mr-1" /> Add Email
      </Button>
    </div>
  );
}