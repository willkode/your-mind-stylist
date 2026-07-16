import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, DollarSign, Clock, Video, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ManagerAppointments() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [syncing, setSyncing] = useState(false);
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
    mutationFn: (data) => base44.entities.AppointmentType.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointmentTypes"] });
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AppointmentType.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointmentTypes"] });
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AppointmentType.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointmentTypes"] });
    },
  });

  const resetForm = () => {
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
      display_order: 0,
    });
    setEditingItem(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setSyncing(true);
    try {
      let updatedData = { ...formData };

      // Only sync with Stripe if price > 0
      if (formData.price > 0) {
        const response = await base44.functions.invoke('syncAppointmentTypeStripe', {
          appointment_type_id: editingItem?.id,
          name: formData.name,
          description: formData.description,
          price: formData.price,
          currency: formData.currency,
        });

        updatedData = {
          ...formData,
          stripe_product_id: response.data.product_id,
          stripe_price_id: response.data.price_id,
        };
      }

      if (editingItem) {
        updateMutation.mutate({ id: editingItem.id, data: updatedData });
      } else {
        createMutation.mutate(updatedData);
      }
    } catch (error) {
      console.error('Failed to save appointment type:', error);
      alert('Failed to save appointment type. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData(item);
    setIsDialogOpen(true);
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Delete "${name}"? This cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  const formatPrice = (cents) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A32] mx-auto mb-4"></div>
          <p className="text-[#2B2725]/70">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-serif text-4xl text-[#1E3A32] mb-2">Appointment Types</h1>
            <p className="text-[#2B2725]/70">Configure services, pricing, and Zoom settings</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#1E3A32] hover:bg-[#2B2725] text-[#F9F5EF]" onClick={resetForm}>
                <Plus size={20} className="mr-2" />
                Add Appointment Type
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingItem ? "Edit" : "Create"} Appointment Type</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="font-medium text-[#1E3A32]">Basic Information</h3>
                  <div>
                    <Label>Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Private Mind Styling Session"
                      required
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe what's included in this service"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Service Type</Label>
                      <Select
                        value={formData.service_type}
                        onValueChange={(v) => setFormData({ ...formData, service_type: v })}
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
                    <div>
                      <Label>Display Order</Label>
                      <Input
                        type="number"
                        value={formData.display_order}
                        onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>

                {/* Session Details */}
                <div className="space-y-4 pt-4 border-t border-[#E4D9C4]">
                  <h3 className="font-medium text-[#1E3A32]">Session Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Duration (minutes)</Label>
                      <Input
                        type="number"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                        required
                      />
                    </div>
                    <div>
                      <Label>Sessions in Package</Label>
                      <Input
                        type="number"
                        value={formData.session_count}
                        onChange={(e) => setFormData({ ...formData, session_count: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="space-y-4 pt-4 border-t border-[#E4D9C4]">
                  <h3 className="font-medium text-[#1E3A32]">Pricing</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Price (USD)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.price / 100}
                        onChange={(e) => setFormData({ ...formData, price: Math.round(parseFloat(e.target.value) * 100) })}
                        placeholder="0.00"
                      />
                      <p className="text-xs text-[#2B2725]/60 mt-1">
                        Amount in dollars (e.g., 150.00). Use 0 for free consultations.
                      </p>
                    </div>
                    <div>
                      <Label>Currency</Label>
                      <Select
                        value={formData.currency}
                        onValueChange={(v) => setFormData({ ...formData, currency: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="usd">USD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Zoom Settings */}
                <div className="space-y-4 pt-4 border-t border-[#E4D9C4]">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-medium text-[#1E3A32] flex items-center gap-2">
                        <Video size={20} className="text-[#2D8CFF]" />
                        Zoom Meeting Settings
                      </h3>
                      <p className="text-xs text-[#2B2725]/60 mt-1">
                        Auto-create virtual meeting links for bookings
                      </p>
                    </div>
                    <Switch
                      checked={formData.zoom_enabled}
                      onCheckedChange={(v) => setFormData({ ...formData, zoom_enabled: v })}
                    />
                  </div>
                  {formData.zoom_enabled && (
                    <div className="space-y-3 pl-4 border-l-2 border-[#E4D9C4]">
                      <div className="flex items-center justify-between">
                        <Label>Host video on</Label>
                      <Switch
                        checked={formData.zoom_settings.host_video}
                        onCheckedChange={(v) =>
                          setFormData({
                            ...formData,
                            zoom_settings: { ...formData.zoom_settings, host_video: v },
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Participant video on</Label>
                      <Switch
                        checked={formData.zoom_settings.participant_video}
                        onCheckedChange={(v) =>
                          setFormData({
                            ...formData,
                            zoom_settings: { ...formData.zoom_settings, participant_video: v },
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Enable waiting room</Label>
                      <Switch
                        checked={formData.zoom_settings.waiting_room}
                        onCheckedChange={(v) =>
                          setFormData({
                            ...formData,
                            zoom_settings: { ...formData.zoom_settings, waiting_room: v },
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Mute upon entry</Label>
                      <Switch
                        checked={formData.zoom_settings.mute_upon_entry}
                        onCheckedChange={(v) =>
                          setFormData({
                            ...formData,
                            zoom_settings: { ...formData.zoom_settings, mute_upon_entry: v },
                          })
                        }
                      />
                    </div>
                  </div>
                  )}
                </div>

                {/* Active Status */}
                <div className="flex items-center justify-between pt-4 border-t border-[#E4D9C4]">
                  <div>
                    <Label>Active</Label>
                    <p className="text-xs text-[#2B2725]/60">Allow clients to book this service</p>
                  </div>
                  <Switch
                    checked={formData.active}
                    onCheckedChange={(v) => setFormData({ ...formData, active: v })}
                  />
                </div>

                <Button type="submit" disabled={syncing} className="w-full">
                  {syncing ? "Saving..." : editingItem ? "Update Appointment Type" : "Create Appointment Type"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Appointment Types List */}
        <div className="grid gap-6">
          {appointmentTypes.length === 0 ? (
            <div className="bg-white p-12 text-center">
              <p className="text-[#2B2725]/50 mb-4">No appointment types yet</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus size={16} className="mr-2" />
                Create Your First Appointment Type
              </Button>
            </div>
          ) : (
            appointmentTypes.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-serif text-2xl text-[#1E3A32]">{item.name}</h3>
                      <Badge variant={item.active ? "default" : "secondary"}>
                        {item.active ? (
                          <><CheckCircle size={12} className="mr-1" /> Active</>
                        ) : (
                          <><XCircle size={12} className="mr-1" /> Inactive</>
                        )}
                      </Badge>
                    </div>
                    {item.description && (
                      <p className="text-[#2B2725]/70 mb-3">{item.description}</p>
                    )}
                    <div className="flex gap-6 text-sm text-[#2B2725]/80">
                      <div className="flex items-center gap-2">
                        <DollarSign size={16} className="text-[#D8B46B]" />
                        {formatPrice(item.price)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-[#A6B7A3]" />
                        {item.duration} min
                      </div>
                      {item.session_count > 1 && (
                        <span>
                          {item.session_count} sessions
                        </span>
                      )}
                      <div className="flex items-center gap-2">
                        <Video size={16} className={item.zoom_enabled ? "text-[#2D8CFF]" : "text-[#2B2725]/30"} />
                        {item.zoom_enabled ? "Zoom enabled" : "Zoom disabled"}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => handleEdit(item)}>
                      <Edit size={16} />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(item.id, item.name)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>

                {item.stripe_product_id && (
                  <div className="bg-[#F9F5EF] p-3 text-xs text-[#2B2725]/60">
                    <div className="flex items-center gap-4">
                      <span>Stripe Product: {item.stripe_product_id}</span>
                      {item.stripe_price_id && (
                        <span>Price: {item.stripe_price_id}</span>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}