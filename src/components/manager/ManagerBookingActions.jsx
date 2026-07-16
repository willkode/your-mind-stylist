import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Calendar, XCircle, StickyNote, Video, RefreshCw, AlertCircle, ArrowRightLeft, Phone, MapPin } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

export default function ManagerBookingActions({ booking, onSuccess }) {
  const [dialogOpen, setDialogOpen] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    session_notes: "",
    manager_notes: "",
    new_date: "",
    reason: "",
    new_appointment_type_id: ""
  });

  const { data: appointmentTypes = [] } = useQuery({
    queryKey: ["appointment-types"],
    queryFn: () => base44.entities.AppointmentType.filter({ active: true }),
  });

  const handleAction = async (action) => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('managerBookingAction', {
        booking_id: booking.id,
        action: action,
        data: formData
      });

      if (response.data.success) {
        alert(response.data.message);
        setDialogOpen(null);
        setFormData({ session_notes: "", manager_notes: "", new_date: "", reason: "", new_appointment_type_id: "" });
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRetryZoom = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('retryZoomCreation', {
        booking_id: booking.id
      });

      if (response.data.success) {
        alert('Zoom meeting created successfully!');
        if (onSuccess) onSuccess();
      } else {
        alert(response.data.error || 'Failed to create Zoom meeting');
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to retry Zoom creation');
    } finally {
      setLoading(false);
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  };

  // Determine meeting modality from appointment type
  const currentAppointmentType = appointmentTypes.find(a => a.id === booking.appointment_type_id);
  const appointmentTypeName = (currentAppointmentType?.name || booking.service_type || "").toLowerCase();
  const isPhone = !currentAppointmentType?.zoom_enabled && (
    appointmentTypeName.includes('phone') || appointmentTypeName.includes('call')
  );
  const isZoom = currentAppointmentType?.zoom_enabled || booking.zoom_status === 'created';
  const isInPerson = !isZoom && !isPhone;

  const getMeetingModality = () => {
    if (isZoom) return { label: 'Virtual Meeting (Zoom)', icon: <Video size={16} className="text-[#2D8CFF]" />, color: 'text-[#2D8CFF]', bg: 'bg-[#E8F4FD] border-[#2D8CFF]' };
    if (isPhone) return { label: 'Phone Call', icon: <Phone size={16} className="text-purple-600" />, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' };
    return { label: 'In-Person Meeting', icon: <MapPin size={16} className="text-[#1E3A32]" />, color: 'text-[#1E3A32]', bg: 'bg-[#F9F5EF] border-[#A6B7A3]' };
  };

  const modality = getMeetingModality();

  return (
    <div className="space-y-4">
      {/* Meeting Type + Zoom Status Section */}
      {booking.scheduled_date && (
        <div className="pt-4 border-t border-[#E4D9C4]">
          {/* Meeting modality badge */}
          <div className={`flex items-center justify-between p-3 rounded border mb-3 ${modality.bg}`}>
            <div className="flex items-center gap-2">
              {modality.icon}
              <span className={`text-sm font-medium ${modality.color}`}>{modality.label}</span>
            </div>
            {isZoom && (
              <Badge className={{
                created: 'bg-green-100 text-green-800',
                pending: 'bg-yellow-100 text-yellow-800',
                failed: 'bg-red-100 text-red-800'
              }[booking.zoom_status || 'pending']}>
                Zoom: {booking.zoom_status || 'pending'}
              </Badge>
            )}
          </div>

          {/* Phone: show client phone number */}
          {isPhone && (
            <div className="bg-purple-50 border border-purple-200 p-3 rounded flex items-start gap-2 mb-2">
              <Phone size={16} className="text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-purple-700 font-medium mb-0.5">Client Phone Number</p>
                {booking.client_phone ? (
                  <a href={`tel:${booking.client_phone}`} className="text-sm text-purple-900 font-semibold hover:underline">
                    {booking.client_phone}
                  </a>
                ) : (
                  <p className="text-sm text-purple-600 italic">No phone number provided</p>
                )}
              </div>
            </div>
          )}

          {/* Zoom: show status and actions */}
          {isZoom && booking.zoom_status === 'failed' && (
            <div className="bg-red-50 border border-red-200 p-3 rounded flex items-start gap-2 mb-2">
              <AlertCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-red-800 mb-2">Zoom meeting creation failed</p>
                <Button size="sm" onClick={handleRetryZoom} disabled={loading} variant="outline">
                  <RefreshCw size={14} className="mr-2" />
                  {loading ? 'Retrying...' : 'Retry Zoom Creation'}
                </Button>
              </div>
            </div>
          )}
          
          {isZoom && booking.zoom_status === 'pending' && (
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded flex items-start gap-2 mb-2">
              <AlertCircle size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-yellow-800 mb-2">Zoom meeting not created yet</p>
                <Button size="sm" onClick={handleRetryZoom} disabled={loading} variant="outline">
                  <Video size={14} className="mr-2" />
                  {loading ? 'Creating...' : 'Create Zoom Meeting'}
                </Button>
              </div>
            </div>
          )}

          {/* In-Person: informational */}
          {isInPerson && (
            <div className="bg-[#F9F5EF] border border-[#A6B7A3] p-3 rounded flex items-start gap-2 mb-2">
              <MapPin size={16} className="text-[#1E3A32] mt-0.5 flex-shrink-0" />
              <p className="text-sm text-[#1E3A32]">This is an in-person session at Roberta's office.</p>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 pt-4 border-t border-[#E4D9C4]">
      {/* Complete Session */}
      {['confirmed', 'scheduled'].includes(booking.booking_status) && (
        <Dialog open={dialogOpen === 'complete'} onOpenChange={(open) => setDialogOpen(open ? 'complete' : null)}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-[#A6B7A3] hover:bg-[#8DA08A] text-white">
              <CheckCircle size={14} className="mr-2" />
              Mark Complete
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Mark Session as Complete</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Session Notes (Optional)</Label>
                <Textarea
                  value={formData.session_notes}
                  onChange={(e) => setFormData({ ...formData, session_notes: e.target.value })}
                  placeholder="Add any notes about the session..."
                  rows={4}
                />
                <p className="text-xs text-[#2B2725]/60 mt-1">
                  These will be shared with the client
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setDialogOpen(null)} disabled={loading} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={() => handleAction('complete')} disabled={loading} className="flex-1 bg-[#A6B7A3] hover:bg-[#8DA08A]">
                  {loading ? 'Completing...' : 'Mark Complete'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Manager Notes */}
      <Dialog open={dialogOpen === 'notes'} onOpenChange={(open) => setDialogOpen(open ? 'notes' : null)}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline">
            <StickyNote size={14} className="mr-2" />
            Add Notes
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manager Notes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {booking.manager_notes && (
              <div className="bg-[#F9F5EF] p-3 rounded">
                <p className="text-xs text-[#2B2725]/60 mb-1">Current Notes:</p>
                <p className="text-sm text-[#2B2725]">{booking.manager_notes}</p>
              </div>
            )}
            <div>
              <Label>Notes</Label>
              <Textarea
                value={formData.manager_notes}
                onChange={(e) => setFormData({ ...formData, manager_notes: e.target.value })}
                placeholder="Private notes about this booking..."
                rows={4}
              />
              <p className="text-xs text-[#2B2725]/60 mt-1">
                These are private and won't be shared with the client
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setDialogOpen(null)} disabled={loading} className="flex-1">
                Cancel
              </Button>
              <Button onClick={() => handleAction('add_notes')} disabled={loading} className="flex-1">
                {loading ? 'Saving...' : 'Save Notes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reschedule */}
      {!['cancelled', 'completed', 'expired'].includes(booking.booking_status) && (
        <Dialog open={dialogOpen === 'reschedule'} onOpenChange={(open) => setDialogOpen(open ? 'reschedule' : null)}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Calendar size={14} className="mr-2" />
              Reschedule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Reschedule Session</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>New Date & Time *</Label>
                <Input
                  type="datetime-local"
                  value={formData.new_date}
                  onChange={(e) => setFormData({ ...formData, new_date: e.target.value })}
                  min={getMinDateTime()}
                  required
                />
              </div>
              <div>
                <Label>Change Appointment Type (Optional)</Label>
                <select
                  value={formData.new_appointment_type_id}
                  onChange={(e) => setFormData({ ...formData, new_appointment_type_id: e.target.value })}
                  className="w-full border border-input rounded-md px-3 py-2 text-sm mt-1"
                >
                  <option value="">Keep current type</option>
                  {appointmentTypes.map(at => (
                    <option key={at.id} value={at.id}>
                      {at.name} {at.zoom_enabled ? '(Zoom)' : '(In-Person)'}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-[#2B2725]/60 mt-1">
                  If switching to a Zoom-enabled type, a new Zoom link will be created.
                </p>
              </div>
              <div>
                <Label>Reason (Optional)</Label>
                <Textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Reason for rescheduling..."
                  rows={2}
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setDialogOpen(null)} disabled={loading} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={() => handleAction('reschedule')} disabled={!formData.new_date || loading} className="flex-1">
                  {loading ? 'Rescheduling...' : 'Reschedule'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Change Appointment Type */}
      {!['cancelled', 'completed', 'expired'].includes(booking.booking_status) && (
        <Dialog open={dialogOpen === 'change_type'} onOpenChange={(open) => setDialogOpen(open ? 'change_type' : null)}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <ArrowRightLeft size={14} className="mr-2" />
              Change Type
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Change Appointment Type</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-[#2B2725]/70">
                Current type: <strong>{appointmentTypes.find(a => a.id === booking.appointment_type_id)?.name || booking.service_type}</strong>
              </p>
              <div>
                <Label>New Appointment Type *</Label>
                <select
                  value={formData.new_appointment_type_id}
                  onChange={(e) => setFormData({ ...formData, new_appointment_type_id: e.target.value })}
                  className="w-full border border-input rounded-md px-3 py-2 text-sm mt-1"
                >
                  <option value="">Select new type...</option>
                  {appointmentTypes.filter(at => at.id !== booking.appointment_type_id).map(at => (
                    <option key={at.id} value={at.id}>
                      {at.name} {at.zoom_enabled ? '(Zoom ✓)' : '(In-Person)'}
                    </option>
                  ))}
                </select>
              </div>
              {formData.new_appointment_type_id && appointmentTypes.find(a => a.id === formData.new_appointment_type_id)?.zoom_enabled && (
                <div className="bg-blue-50 border border-blue-200 p-3 rounded text-sm text-blue-800">
                  A new Zoom meeting link will be created automatically.
                </div>
              )}
              <div>
                <Label>Reason (Optional)</Label>
                <Textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Reason for changing type..."
                  rows={2}
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setDialogOpen(null)} disabled={loading} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={() => handleAction('change_type')} disabled={!formData.new_appointment_type_id || loading} className="flex-1">
                  {loading ? 'Updating...' : 'Change Type'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Cancel */}
      {!['cancelled', 'completed', 'expired'].includes(booking.booking_status) && (
        <Dialog open={dialogOpen === 'cancel'} onOpenChange={(open) => setDialogOpen(open ? 'cancel' : null)}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
              <XCircle size={14} className="mr-2" />
              Cancel
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Cancel Session</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Reason *</Label>
                <Textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Reason for cancellation..."
                  rows={3}
                  required
                />
                <p className="text-xs text-[#2B2725]/60 mt-1">
                  This will be shared with the client
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setDialogOpen(null)} disabled={loading} className="flex-1">
                  Keep Session
                </Button>
                <Button onClick={() => handleAction('cancel')} disabled={loading} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                  {loading ? 'Cancelling...' : 'Cancel Session'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete (for cancelled bookings) */}
      {booking.booking_status === 'cancelled' && (
        <Dialog open={dialogOpen === 'delete'} onOpenChange={(open) => setDialogOpen(open ? 'delete' : null)}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
              <XCircle size={14} className="mr-2" />
              Delete
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Booking</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-[#2B2725]">
                Are you sure you want to permanently delete this booking? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setDialogOpen(null)} disabled={loading} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={() => handleAction('delete')} disabled={loading} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                  {loading ? 'Deleting...' : 'Delete Permanently'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
    </div>
  );
}