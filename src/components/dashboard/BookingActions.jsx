import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { XCircle, Calendar, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function BookingActions({ booking, onSuccess }) {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [newDate, setNewDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canModify = ['confirmed', 'scheduled', 'pending_payment'].includes(booking.booking_status);

  const handleCancel = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await base44.functions.invoke('cancelBooking', {
        booking_id: booking.id,
        reason: cancelReason
      });

      if (response.data.success) {
        alert(response.data.message);
        setCancelDialogOpen(false);
        if (onSuccess) onSuccess();
      } else {
        setError(response.data.error || 'Failed to cancel booking');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (!newDate) {
      setError('Please select a new date and time');
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await base44.functions.invoke('rescheduleBooking', {
        booking_id: booking.id,
        new_date: newDate,
        reason: rescheduleReason
      });

      if (response.data.success) {
        alert(response.data.message);
        setRescheduleDialogOpen(false);
        if (onSuccess) onSuccess();
      } else {
        setError(response.data.error || 'Failed to reschedule booking');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!canModify) {
    return null;
  }

  const getMinDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 2); // Minimum 2 hours from now
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="flex gap-2 mt-4 pt-4 border-t border-[#E4D9C4]">
      {/* Reschedule Dialog */}
      <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="flex-1">
            <Calendar size={14} className="mr-2" />
            Reschedule
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reschedule Booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 p-3 rounded flex items-start gap-2">
                <AlertCircle size={16} className="text-red-600 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
            
            <div>
              <Label>New Date & Time *</Label>
              <Input
                type="datetime-local"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                min={getMinDateTime()}
                required
              />
              <p className="text-xs text-[#2B2725]/60 mt-1">
                Select a new date and time for your session
              </p>
            </div>

            <div>
              <Label>Reason for Rescheduling (Optional)</Label>
              <Textarea
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                placeholder="Let us know why you need to reschedule..."
                rows={3}
              />
            </div>

            <div className="bg-[#F9F5EF] p-3 rounded">
              <p className="text-xs text-[#2B2725]/70">
                <strong>Note:</strong> Your Zoom meeting link will be updated for the new date and time.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setRescheduleDialogOpen(false)}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReschedule}
                disabled={loading}
                className="flex-1 bg-[#1E3A32] hover:bg-[#2B2725]"
              >
                {loading ? 'Rescheduling...' : 'Confirm Reschedule'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="flex-1 text-red-600 hover:text-red-700">
            <XCircle size={14} className="mr-2" />
            Cancel
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 p-3 rounded flex items-start gap-2">
                <AlertCircle size={16} className="text-red-600 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="bg-[#FFF9F0] border border-[#D8B46B] p-4 rounded">
              <p className="text-sm text-[#2B2725] mb-3">
                <strong>Refund Policy:</strong>
              </p>
              <ul className="text-xs text-[#2B2725]/80 space-y-1 ml-4 list-disc">
                <li>Cancel 24+ hours before: <strong>Full refund</strong></li>
                <li>Cancel less than 24 hours before: <strong>50% refund</strong></li>
                <li>No-show: <strong>No refund</strong></li>
              </ul>
            </div>

            <div>
              <Label>Reason for Cancellation (Optional)</Label>
              <Textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Help us improve by sharing your reason..."
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setCancelDialogOpen(false)}
                disabled={loading}
                className="flex-1"
              >
                Keep Booking
              </Button>
              <Button
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {loading ? 'Cancelling...' : 'Confirm Cancellation'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}