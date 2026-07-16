import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, Edit2, Plus, GripVertical, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function ConsultationFormEditor() {
  const queryClient = useQueryClient();
  const [editingField, setEditingField] = useState(null);
  const [activeStep, setActiveStep] = useState(1);
  const [showNewFieldForm, setShowNewFieldForm] = useState(false);

  // Fetch form configuration
  const { data: formFields = [], isLoading } = useQuery({
    queryKey: ['consultationForm'],
    queryFn: () => base44.entities.ConsultationForm.list(),
  });

  // Update field mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ConsultationForm.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultationForm'] });
      setEditingField(null);
    },
  });

  // Create field mutation
  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ConsultationForm.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultationForm'] });
      setShowNewFieldForm(false);
    },
  });

  // Delete field mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ConsultationForm.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultationForm'] });
    },
  });

  // Handle drag end
  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const stepFields = [...(fieldsByStep[activeStep] || [])];
    const [reorderedItem] = stepFields.splice(result.source.index, 1);
    stepFields.splice(result.destination.index, 0, reorderedItem);

    // Update order for all fields in this step
    const updates = stepFields.map((field, index) => 
      base44.entities.ConsultationForm.update(field.id, { order: index + 1 })
    );

    await Promise.all(updates);
    queryClient.invalidateQueries({ queryKey: ['consultationForm'] });
  };

  const fieldsByStep = React.useMemo(() => {
    const grouped = {};
    formFields.forEach(field => {
      if (!grouped[field.step]) grouped[field.step] = [];
      grouped[field.step].push(field);
    });
    return grouped;
  }, [formFields]);

  const steps = [
    { number: 1, title: "Personal Information" },
    { number: 2, title: "Reason for Consultation" },
    { number: 3, title: "Medical & Mental Health History" },
    { number: 4, title: "Goals & Expectations" },
    { number: 5, title: "Consent & Acknowledgment" }
  ];

  if (isLoading) {
    return <div className="p-8 text-center">Loading form configuration...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F9F5EF] pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="font-serif text-4xl text-[#1E3A32] mb-2">Consultation Form Editor</h1>
          <p className="text-[#2B2725]/70">Edit form fields, labels, and help text without rebuilding the form</p>
        </div>

        <Tabs value={`step-${activeStep}`} onValueChange={(val) => setActiveStep(parseInt(val.split('-')[1]))} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            {steps.map(step => (
              <TabsTrigger key={step.number} value={`step-${step.number}`} className="text-xs">
                Step {step.number}
              </TabsTrigger>
            ))}
          </TabsList>

          {steps.map(step => (
            <TabsContent key={step.number} value={`step-${step.number}`}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-serif text-2xl text-[#1E3A32]">
                      {step.title}
                    </CardTitle>
                    <Button
                      onClick={() => setShowNewFieldForm(true)}
                      className="bg-[#D8B46B] hover:bg-[#F9F5EF] text-[#1E3A32]"
                    >
                      <Plus size={16} className="mr-2" />
                      Add Field
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {showNewFieldForm && (
                    <Card className="bg-[#F9F5EF] border-2 border-[#D8B46B]">
                      <CardContent className="pt-6">
                        <NewFieldForm
                          step={activeStep}
                          onSave={(data) => createMutation.mutate(data)}
                          onCancel={() => setShowNewFieldForm(false)}
                        />
                      </CardContent>
                    </Card>
                  )}
                  {(fieldsByStep[step.number] || []).length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-[#D8B46B]/30 rounded-lg">
                      <p className="text-[#2B2725]/60 mb-2">No fields configured for this step yet</p>
                      <p className="text-sm text-[#2B2725]/40">
                        Click "Add Field" to create your first field
                      </p>
                    </div>
                  ) : (
                    <DragDropContext onDragEnd={handleDragEnd}>
                      <Droppable droppableId="fields">
                        {(provided) => (
                          <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                            {(fieldsByStep[step.number] || []).sort((a, b) => a.order - b.order).map((field, idx) => (
                              <Draggable key={field.id} draggableId={field.id} index={idx}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`border border-[#E4D9C4] p-4 rounded-lg transition-colors ${
                                      snapshot.isDragging ? 'shadow-lg bg-white' : 'hover:border-[#D8B46B]'
                                    }`}
                                  >
                                    {editingField?.id === field.id ? (
                                     <FormFieldEditor
                                       field={field}
                                       onSave={(data) => {
                                         updateMutation.mutate({ id: field.id, data });
                                       }}
                                       onCancel={() => setEditingField(null)}
                                       onDelete={async () => {
                                         if (confirm('Are you sure you want to delete this field? This cannot be undone.')) {
                                           try {
                                             await base44.entities.ConsultationForm.delete(field.id);
                                             queryClient.invalidateQueries({ queryKey: ['consultationForm'] });
                                             setEditingField(null);
                                           } catch (error) {
                                             alert('Failed to delete field: ' + error.message);
                                           }
                                         }
                                       }}
                                     />
                                    ) : (
                                     <div className="flex items-start gap-3">
                                       <div {...provided.dragHandleProps} className="mt-1 cursor-grab active:cursor-grabbing">
                                         <GripVertical size={20} className="text-[#2B2725]/40" />
                                       </div>
                                       <div className="flex-1">
                                         <FormFieldPreview
                                           field={field}
                                           onEdit={() => setEditingField(field)}
                                           onDelete={async () => {
                                             if (confirm('Are you sure you want to delete this field? This cannot be undone.')) {
                                               try {
                                                 await base44.entities.ConsultationForm.delete(field.id);
                                                 queryClient.invalidateQueries({ queryKey: ['consultationForm'] });
                                               } catch (error) {
                                                 alert('Failed to delete field: ' + error.message);
                                               }
                                             }
                                           }}
                                         />
                                       </div>
                                     </div>
                                    )}
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}

function FormFieldPreview({ field, onEdit, onDelete }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="text-xs text-[#2B2725]/60 mb-1">Field: {field.field_name}</p>
          <h3 className="font-medium text-[#1E3A32] text-lg">{field.label}</h3>
          {field.required && <span className="text-red-500 text-sm ml-1">* Required</span>}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="border-[#D8B46B] text-[#1E3A32] hover:bg-[#D8B46B]/10"
          >
            <Edit2 size={16} className="mr-1" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="border-red-200 text-red-600 hover:bg-red-50"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>
      {field.help_text && (
        <p className="text-sm text-[#2B2725]/70 italic bg-[#F9F5EF] p-2 rounded border-l-2 border-[#D8B46B]">{field.help_text}</p>
      )}
      <div className="flex items-center gap-4 text-sm text-[#2B2725]/60">
        <span>Type: <span className="font-mono font-semibold text-[#1E3A32]">{field.field_type}</span></span>
      </div>
    </div>
  );
}

function FormFieldEditor({ field, onSave, onCancel, onDelete }) {
  const [formData, setFormData] = useState(field);

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label className="text-sm">Field Name (database key)</Label>
          <Input
            value={formData.field_name}
            onChange={(e) => setFormData({ ...formData, field_name: e.target.value.replace(/\s+/g, '_').toLowerCase() })}
            className="mt-1"
            placeholder="e.g., phone_number"
          />
        </div>
        <div>
          <Label className="text-sm">Label Text</Label>
          <Input
            value={formData.label}
            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
            className="mt-1"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label className="text-sm">Field Type</Label>
          <Select value={formData.field_type} onValueChange={(value) => setFormData({ ...formData, field_type: value })}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text Input</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="tel">Phone</SelectItem>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="number">Number</SelectItem>
              <SelectItem value="textarea">Text Area</SelectItem>
              <SelectItem value="radio">Radio Group</SelectItem>
              <SelectItem value="checkbox">Checkbox</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 mt-6">
          <Checkbox
            id="required"
            checked={formData.required}
            onCheckedChange={(checked) => setFormData({ ...formData, required: checked })}
          />
          <Label htmlFor="required" className="cursor-pointer">Required field</Label>
        </div>
      </div>

      <div>
        <Label className="text-sm">Help Text / Placeholder</Label>
        <Textarea
          value={formData.help_text || ""}
          onChange={(e) => setFormData({ ...formData, help_text: e.target.value })}
          className="mt-1 min-h-[80px]"
        />
      </div>

      {(formData.field_type === 'radio' || formData.field_type === 'checkbox') && (
        <div>
          <Label className="text-sm">Options (comma-separated)</Label>
          <Input
            value={formData.options?.join(', ') || ''}
            onChange={(e) => setFormData({ ...formData, options: e.target.value.split(',').map(o => o.trim()).filter(o => o) })}
            className="mt-1"
            placeholder="yes, no"
          />
        </div>
      )}

      <div className="flex gap-2 justify-between">
        <div className="flex gap-2">
          <Button
            onClick={() => onSave(formData)}
            className="bg-[#1E3A32] hover:bg-[#2B2725] text-[#F9F5EF]"
          >
            <Save size={16} className="mr-2" />
            Save Changes
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
        {onDelete && (
          <Button
            variant="outline"
            onClick={onDelete}
            className="border-red-200 text-red-600 hover:bg-red-50"
          >
            <Trash2 size={16} className="mr-2" />
            Delete Field
          </Button>
        )}
      </div>
    </div>
  );
}

function NewFieldForm({ step, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    step: step,
    field_name: '',
    label: '',
    field_type: 'text',
    help_text: '',
    required: false,
    order: 999
  });

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-[#1E3A32]">Add New Field</h3>
      
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label className="text-sm">Field Name (database key)</Label>
          <Input
            value={formData.field_name}
            onChange={(e) => setFormData({ ...formData, field_name: e.target.value.replace(/\s+/g, '_').toLowerCase() })}
            className="mt-1"
            placeholder="e.g., phone_number"
          />
        </div>
        <div>
          <Label className="text-sm">Label Text</Label>
          <Input
            value={formData.label}
            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
            className="mt-1"
            placeholder="What users see"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label className="text-sm">Field Type</Label>
          <Select value={formData.field_type} onValueChange={(value) => setFormData({ ...formData, field_type: value })}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text Input</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="tel">Phone</SelectItem>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="number">Number</SelectItem>
              <SelectItem value="textarea">Text Area</SelectItem>
              <SelectItem value="radio">Radio Group</SelectItem>
              <SelectItem value="checkbox">Checkbox</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 mt-6">
          <Checkbox
            id="new-required"
            checked={formData.required}
            onCheckedChange={(checked) => setFormData({ ...formData, required: checked })}
          />
          <Label htmlFor="new-required" className="cursor-pointer">Required field</Label>
        </div>
      </div>

      <div>
        <Label className="text-sm">Help Text / Placeholder</Label>
        <Textarea
          value={formData.help_text}
          onChange={(e) => setFormData({ ...formData, help_text: e.target.value })}
          className="mt-1 min-h-[80px]"
        />
      </div>

      {(formData.field_type === 'radio' || formData.field_type === 'checkbox') && (
        <div>
          <Label className="text-sm">Options (comma-separated)</Label>
          <Input
            value={formData.options?.join(', ') || ''}
            onChange={(e) => setFormData({ ...formData, options: e.target.value.split(',').map(o => o.trim()).filter(o => o) })}
            className="mt-1"
            placeholder="yes, no"
          />
        </div>
      )}

      <div className="flex gap-2">
        <Button
          onClick={() => onSave(formData)}
          disabled={!formData.field_name || !formData.label}
          className="bg-[#1E3A32] hover:bg-[#2B2725] text-[#F9F5EF]"
        >
          <Plus size={16} className="mr-2" />
          Create Field
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}