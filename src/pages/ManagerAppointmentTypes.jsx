import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Clock, DollarSign, Video, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";

export default function ManagerAppointmentTypes() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    service_type: "private_sessions",
    duration: 60,
    session_count: 1,
    price: 0,
    currency: "usd",
    zoom_enabled: true,
    zoom_settings: {
      host_video: true,
      participant_video: true,
      waiting_room: true,
      mute_upon_entry: false,
    },
    active: true,
    display_order: 0,
  });

  const { data: appointmentTypes = [], isLoading } = useQuery({
    queryKey: ["appointmentTypes"],
    queryFn: () => base44.entities.AppointmentType.list("display_order"),
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const appointmentType = await base44.entities.AppointmentType.create(data);
      
      // Auto-sync with Stripe
      try {
        const syncResult = await base44.functions.invoke('syncAppointmentTypeStripe', {
          appointment_type_id: appointmentType.id,
          name: data.name,
          description: data.description,
          price: data.price,
          currency: data.currency,
        });

        if (syncResult.data.success) {
          // Update with Stripe IDs
          await base44.entities.AppointmentType.update(appointmentType.id, {
            stripe_product_id: syncResult.data.product_id,
            stripe_price_id: syncResult.data.price_id,
          });
          toast.success('Appointment type created and synced with Stripe');
        }
      } catch (error) {
        console.error('Stripe sync failed:', error);
        toast.error('Created but failed to sync with Stripe');
      }
      
      return appointmentType;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointmentTypes"] });
      handleCloseDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const updated = await base44.entities.AppointmentType.update(id, data);
      
      // Auto-sync with Stripe if name, description, or price changed
      try {
        const syncResult = await base44.functions.invoke('syncAppointmentTypeStripe', {
          appointment_type_id: id,
          name: data.name,
          description: data.description,
          price: data.price,
          currency: data.currency,
        });

        if (syncResult.data.success) {
          // Update with Stripe IDs if changed
          await base44.entities.AppointmentType.update(id, {
            stripe_product_id: syncResult.data.product_id,
            stripe_price_id: syncResult.data.price_id,
          });
          toast.success('Updated and synced with Stripe');
        }
      } catch (error) {
        console.error('Stripe sync failed:', error);
        toast.error('Updated but failed to sync with Stripe');
      }
      
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointmentTypes"] });
      handleCloseDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AppointmentType.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointmentTypes"] });
    },
  });

  const handleOpenDialog = (type = null) => {
    if (type) {
      setEditingType(type);
      setFormData(type);
    } else {
      setEditingType(null);
      setFormData({
        name: "",
        description: "",
        service_type: "private_sessions",
        duration: 60,
        session_count: 1,
        price: 0,
        currency: "usd",
        zoom_enabled: true,
        zoom_settings: {
          host_video: true,
          participant_video: true,
          waiting_room: true,
          mute_upon_entry: false,
        },
        active: true,
        display_order: appointmentTypes.length,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingType(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingType) {
      updateMutation.mutate({ id: editingType.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this appointment type? This cannot be undone.")) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleActive = (type) => {
    updateMutation.mutate({
      id: type.id,
      data: { ...type, active: !type.active },
    });
  };

  const handleSyncAll = async () => {
    setSyncingAll(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const type of appointmentTypes) {
        try {
          const syncResult = await base44.functions.invoke('syncAppointmentTypeStripe', {
            appointment_type_id: type.id,
            name: type.name,
            description: type.description,
            price: type.price,
            currency: type.currency,
          });

          if (syncResult.data.success) {
            await base44.entities.AppointmentType.update(type.id, {
              stripe_product_id: syncResult.data.product_id,
              stripe_price_id: syncResult.data.price_id,
            });
            successCount++;
          }
        } catch (error) {
          console.error(`Failed to sync ${type.name}:`, error);
          errorCount++;
        }
      }

      if (errorCount === 0) {
        toast.success(`✓ Synced all ${successCount} appointment types with Stripe`);
      } else {
        toast.error(`Synced ${successCount}, failed ${errorCount}`);
      }

      queryClient.invalidateQueries({ queryKey: ["appointmentTypes"] });
    } finally {
      setSyncingAll(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="font-serif text-4xl text-[#1E3A32] mb-2">
              Appointment Types
            </h1>
            <p className="text-[#2B2725]/70">
              Manage your service offerings and pricing
            </p>
          </div>
          <div className="flex gap-3">
            {appointmentTypes.length > 0 && (
              <Button
                onClick={handleSyncAll}
                disabled={syncingAll}
                variant="outline"
                className="border-[#D8B46B] text-[#1E3A32]"
              >
                <RefreshCw size={18} className={`mr-2 ${syncingAll ? 'animate-spin' : ''}`} />
                {syncingAll ? 'Syncing...' : 'Sync All with Stripe'}
              </Button>
            )}
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-[#1E3A32] hover:bg-[#2B2725]"
            >
              <Plus size={18} className="mr-2" />
              New Appointment Type
            </Button>
          </div>
        </div>

        {/* Appointment Types Grid */}
        {isLoading ? (
          <p className="text-center py-12 text-[#2B2725]/60">Loading...</p>
        ) : appointmentTypes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Clock size={48} className="mx-auto text-[#D8B46B] mb-4" />
              <h3 className="font-serif text-xl text-[#1E3A32] mb-2">
                No Appointment Types Yet
              </h3>
              <p className="text-[#2B2725]/70 mb-6">
                Create your first appointment type to start accepting bookings
              </p>
              <Button
                onClick={() => handleOpenDialog()}
                className="bg-[#1E3A32] hover:bg-[#2B2725]"
              >
                <Plus size={18} className="mr-2" />
                Create Appointment Type
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {appointmentTypes.map((type) => (
              <motion.div
                key={type.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className={!type.active ? "opacity-60" : ""}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{type.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={type.active}
                          onCheckedChange={() => handleToggleActive(type)}
                        />
                        <span className="text-xs text-[#2B2725]/60">
                          {type.active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-[#2B2725]/70 mb-4 line-clamp-2">
                      {type.description}
                    </p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock size={16} className="text-[#D8B46B]" />
                        <span>{type.duration} minutes</span>
                        {type.session_count > 1 && (
                          <Badge variant="secondary">
                            {type.session_count} sessions
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign size={16} className="text-[#A6B7A3]" />
                        <span>
                          ${(type.price / 100).toFixed(2)} {type.currency.toUpperCase()}
                        </span>
                      </div>

                      {type.zoom_enabled && (
                        <div className="flex items-center gap-2 text-sm">
                          <Video size={16} className="text-[#6E4F7D]" />
                          <span>Zoom enabled</span>
                        </div>
                      )}

                      <Badge
                        variant="outline"
                        className="text-xs"
                      >
                        {type.service_type?.replace(/_/g, " ")}
                      </Badge>

                      {type.stripe_product_id && (
                        <div className="flex items-center gap-1 text-xs text-[#A6B7A3] mt-2">
                          <RefreshCw size={12} />
                          <span>Synced with Stripe</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDialog(type)}
                        className="flex-1"
                      >
                        <Edit size={14} className="mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(type.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingType ? "Edit Appointment Type" : "New Appointment Type"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <Label>Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., 60-Minute Private Session"
                    required
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Describe what this appointment includes..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Service Type *</Label>
                  <Select
                    value={formData.service_type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, service_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private_sessions">Private Sessions</SelectItem>
                      <SelectItem value="consultation">Consultation</SelectItem>
                      <SelectItem value="certification">Certification</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Duration & Sessions */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Duration (minutes) *</Label>
                  <Input
                    type="number"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        duration: parseInt(e.target.value),
                      })
                    }
                    min={15}
                    step={15}
                    required
                  />
                </div>

                <div>
                  <Label>Session Count</Label>
                  <Input
                    type="number"
                    value={formData.session_count}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        session_count: parseInt(e.target.value),
                      })
                    }
                    min={1}
                  />
                  <p className="text-xs text-[#2B2725]/60 mt-1">
                    For packages with multiple sessions
                  </p>
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Price (in cents) *</Label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: parseInt(e.target.value),
                      })
                    }
                    min={0}
                    step={100}
                    required
                  />
                  <p className="text-xs text-[#2B2725]/60 mt-1">
                    ${(formData.price / 100).toFixed(2)}
                  </p>
                </div>

                <div>
                  <Label>Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) =>
                      setFormData({ ...formData, currency: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usd">USD</SelectItem>
                      <SelectItem value="eur">EUR</SelectItem>
                      <SelectItem value="gbp">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Zoom Settings */}
              <div className="space-y-3 border border-[#E4D9C4] rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Zoom Meetings</Label>
                  <Switch
                    checked={formData.zoom_enabled}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, zoom_enabled: checked })
                    }
                  />
                </div>

                {formData.zoom_enabled && (
                  <div className="space-y-2 pl-4 border-l-2 border-[#D8B46B]">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Host Video On</span>
                      <Switch
                        checked={formData.zoom_settings.host_video}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            zoom_settings: {
                              ...formData.zoom_settings,
                              host_video: checked,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Participant Video On</span>
                      <Switch
                        checked={formData.zoom_settings.participant_video}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            zoom_settings: {
                              ...formData.zoom_settings,
                              participant_video: checked,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Waiting Room</span>
                      <Switch
                        checked={formData.zoom_settings.waiting_room}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            zoom_settings: {
                              ...formData.zoom_settings,
                              waiting_room: checked,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Mute Upon Entry</span>
                      <Switch
                        checked={formData.zoom_settings.mute_upon_entry}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            zoom_settings: {
                              ...formData.zoom_settings,
                              mute_upon_entry: checked,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Status & Order */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label>Active</Label>
                  <Switch
                    checked={formData.active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, active: checked })
                    }
                  />
                </div>

                <div>
                  <Label>Display Order</Label>
                  <Input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        display_order: parseInt(e.target.value) || 0,
                      })
                    }
                    min={0}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#1E3A32] hover:bg-[#2B2725]"
                >
                  {editingType ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}