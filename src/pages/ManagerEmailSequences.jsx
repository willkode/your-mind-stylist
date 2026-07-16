import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mail, Plus, Play, Loader2, BarChart3, List } from "lucide-react";
import toast from "react-hot-toast";

import SequenceCard from "../components/sequences/SequenceCard";
import StepEditorDialog from "../components/sequences/StepEditorDialog";
import TriggerConfigPanel from "../components/sequences/TriggerConfigPanel";
import SequenceAnalytics from "../components/sequences/SequenceAnalytics";

export default function ManagerEmailSequences() {
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedSequence, setSelectedSequence] = useState(null);
  const [stepEditorOpen, setStepEditorOpen] = useState(false);
  const [editingStep, setEditingStep] = useState(null);
  const [stepSequenceId, setStepSequenceId] = useState(null);
  const [syncingId, setSyncingId] = useState(null);

  // Form state for create/edit sequence
  const [seqForm, setSeqForm] = useState({
    name: "",
    description: "",
    trigger_type: "manual",
    trigger_conditions: {},
    active: true,
  });

  // Fetch data
  const { data: sequences = [], isLoading } = useQuery({
    queryKey: ["emailSequences"],
    queryFn: () => base44.entities.EmailSequence.list("-created_date"),
  });

  const { data: allSteps = [] } = useQuery({
    queryKey: ["emailSequenceSteps"],
    queryFn: () => base44.entities.EmailSequenceStep.list("-sequence_id", 500),
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ["userEmailSequences"],
    queryFn: () => base44.entities.UserEmailSequence.list("-created_date", 500),
  });

  // Mutations
  const createSequence = useMutation({
    mutationFn: (data) => base44.entities.EmailSequence.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emailSequences"] });
      setCreateDialogOpen(false);
      resetSeqForm();
      toast.success("Sequence created!");
    },
  });

  const updateSequence = useMutation({
    mutationFn: ({ id, data }) => base44.entities.EmailSequence.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emailSequences"] });
      setEditDialogOpen(false);
      setSelectedSequence(null);
      toast.success("Sequence updated!");
    },
  });

  const deleteSequence = useMutation({
    mutationFn: (id) => base44.entities.EmailSequence.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emailSequences"] });
      toast.success("Sequence deleted!");
    },
  });

  const saveStep = useMutation({
    mutationFn: (data) => {
      if (data.id) return base44.entities.EmailSequenceStep.update(data.id, data);
      return base44.entities.EmailSequenceStep.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emailSequenceSteps"] });
      setStepEditorOpen(false);
      setEditingStep(null);
      toast.success("Email step saved!");
    },
  });

  const deleteStep = useMutation({
    mutationFn: (id) => base44.entities.EmailSequenceStep.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emailSequenceSteps"] });
      toast.success("Email step deleted!");
    },
  });

  const processSequences = useMutation({
    mutationFn: () => base44.functions.invoke("processEmailSequences", {}),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["userEmailSequences"] });
      const s = result.data.summary;
      toast.success(`Processed: ${s.processed}, Completed: ${s.completed}, Failed: ${s.failed}`);
    },
  });

  // Helpers
  const resetSeqForm = () => setSeqForm({ name: "", description: "", trigger_type: "manual", trigger_conditions: {}, active: true });

  const getStepsForSequence = (seqId) =>
    allSteps.filter((s) => s.sequence_id === seqId).sort((a, b) => a.step_number - b.step_number);

  const handleReorderSteps = async (seqId, reordered) => {
    // Update step_number for each step
    for (let i = 0; i < reordered.length; i++) {
      if (reordered[i].step_number !== i + 1) {
        await base44.entities.EmailSequenceStep.update(reordered[i].id, { step_number: i + 1 });
      }
    }
    queryClient.invalidateQueries({ queryKey: ["emailSequenceSteps"] });
    toast.success("Steps reordered!");
  };

  const handleSyncMailerLite = async (seqId) => {
    setSyncingId(seqId);
    try {
      const res = await base44.functions.invoke("syncSequenceToMailerLite", { sequence_id: seqId });
      toast.success(res.data.message || "Synced to MailerLite!");
      queryClient.invalidateQueries({ queryKey: ["emailSequences"] });
    } catch (err) {
      toast.error("Sync failed: " + (err.message || "Unknown error"));
    }
    setSyncingId(null);
  };

  const openCreateDialog = () => {
    resetSeqForm();
    setCreateDialogOpen(true);
  };

  const openEditDialog = (seq) => {
    setSelectedSequence(seq);
    setSeqForm({
      name: seq.name,
      description: seq.description || "",
      trigger_type: seq.trigger_type,
      trigger_conditions: seq.trigger_conditions || {},
      active: seq.active,
    });
    setEditDialogOpen(true);
  };

  const openStepEditor = (seqId, step = null) => {
    setStepSequenceId(seqId);
    setEditingStep(step);
    setStepEditorOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-serif text-4xl text-[#1E3A32] mb-2">Email Sequences</h1>
            <p className="text-[#2B2725]/70">Automated email campaigns and nurture sequences</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => processSequences.mutate()}
              disabled={processSequences.isPending}
              variant="outline"
            >
              {processSequences.isPending ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Play size={16} className="mr-2" />}
              Process Now
            </Button>
            <Button onClick={openCreateDialog} className="bg-[#1E3A32] hover:bg-[#2B2725] text-white">
              <Plus size={16} className="mr-2" /> New Sequence
            </Button>
          </div>
        </div>

        {/* Tabs: Sequences / Analytics */}
        <Tabs defaultValue="sequences" className="space-y-6">
          <TabsList>
            <TabsTrigger value="sequences" className="flex items-center gap-1.5">
              <List size={14} /> Sequences
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-1.5">
              <BarChart3 size={14} /> Analytics
            </TabsTrigger>
          </TabsList>

          {/* Sequences tab */}
          <TabsContent value="sequences">
            {isLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="animate-spin text-[#D8B46B]" size={28} />
              </div>
            ) : sequences.length === 0 ? (
              <Card className="border-[#E4D9C4]">
                <CardContent className="py-16 text-center">
                  <Mail size={48} className="mx-auto text-[#2B2725]/20 mb-4" />
                  <p className="text-[#2B2725]/60 mb-4">No sequences yet. Create your first automated email flow.</p>
                  <Button onClick={openCreateDialog} className="bg-[#1E3A32] hover:bg-[#2B2725] text-white">
                    <Plus size={16} className="mr-2" /> Create Your First Sequence
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {sequences.map((seq) => {
                  const steps = getStepsForSequence(seq.id);
                  const seqEnrollments = enrollments.filter((e) => e.sequence_id === seq.id);
                  return (
                    <SequenceCard
                      key={seq.id}
                      sequence={seq}
                      steps={steps}
                      enrollmentCount={seqEnrollments.length}
                      onToggleActive={() => updateSequence.mutate({ id: seq.id, data: { active: !seq.active } })}
                      onEdit={() => openEditDialog(seq)}
                      onDelete={() => deleteSequence.mutate(seq.id)}
                      onReorderSteps={(reordered) => handleReorderSteps(seq.id, reordered)}
                      onEditStep={(step) => openStepEditor(seq.id, step)}
                      onDeleteStep={(stepId) => deleteStep.mutate(stepId)}
                      onAddStep={() => openStepEditor(seq.id, null)}
                      onSyncMailerLite={() => handleSyncMailerLite(seq.id)}
                      syncing={syncingId === seq.id}
                    />
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Analytics tab */}
          <TabsContent value="analytics">
            <SequenceAnalytics
              sequences={sequences}
              allSteps={allSteps}
              enrollments={enrollments}
            />
          </TabsContent>
        </Tabs>

        {/* Create Sequence Dialog */}
        <SequenceFormDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          title="Create Email Sequence"
          form={seqForm}
          setForm={setSeqForm}
          onSave={() => createSequence.mutate(seqForm)}
          saving={createSequence.isPending}
          buttonLabel="Create Sequence"
        />

        {/* Edit Sequence Dialog */}
        <SequenceFormDialog
          open={editDialogOpen}
          onOpenChange={(v) => { if (!v) { setEditDialogOpen(false); setSelectedSequence(null); } }}
          title="Edit Sequence"
          form={seqForm}
          setForm={setSeqForm}
          onSave={() => updateSequence.mutate({ id: selectedSequence.id, data: seqForm })}
          saving={updateSequence.isPending}
          buttonLabel="Save Changes"
        />

        {/* Step Editor Dialog */}
        <StepEditorDialog
          open={stepEditorOpen}
          onOpenChange={(v) => { if (!v) { setStepEditorOpen(false); setEditingStep(null); } }}
          step={editingStep}
          sequenceId={stepSequenceId}
          nextStepNumber={stepSequenceId ? getStepsForSequence(stepSequenceId).length + 1 : 1}
          onSave={(data) => saveStep.mutate(data)}
          saving={saveStep.isPending}
        />
      </div>
    </div>
  );
}

// Extracted dialog for create/edit sequence
function SequenceFormDialog({ open, onOpenChange, title, form, setForm, onSave, saving, buttonLabel }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Sequence Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Masterclass Welcome Series"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Description <span className="text-[#2B2725]/40 font-normal">(optional)</span></Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Internal notes about this sequence..."
              className="mt-1"
            />
          </div>

          {/* Trigger config */}
          <TriggerConfigPanel
            triggerType={form.trigger_type}
            triggerConditions={form.trigger_conditions}
            onTriggerTypeChange={(v) => setForm({ ...form, trigger_type: v, trigger_conditions: {} })}
            onConditionsChange={(c) => setForm({ ...form, trigger_conditions: c })}
          />

          <Button
            onClick={onSave}
            disabled={!form.name?.trim() || saving}
            className="w-full bg-[#1E3A32] hover:bg-[#2B2725] text-white"
          >
            {saving && <Loader2 size={14} className="animate-spin mr-2" />}
            {buttonLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}