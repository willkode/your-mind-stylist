import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Repeat, Calendar, DollarSign, AlertCircle } from "lucide-react";
import { format } from "date-fns";

export default function RecurringBookingModal({ 
  isOpen, 
  onClose, 
  appointmentType, 
  selectedSlot,
  onConfirm 
}) {
  const [frequency, setFrequency] = useState("weekly");
  const [occurrences, setOccurrences] = useState(4);

  const totalAmount = appointmentType.price * occurrences;

  const handleConfirm = () => {
    onConfirm({
      frequency,
      occurrences,
      start_date: selectedSlot.start
    });
  };

  const getFrequencyLabel = () => {
    const labels = {
      weekly: "Every week",
      biweekly: "Every 2 weeks",
      monthly: "Every month"
    };
    return labels[frequency];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat size={20} className="text-[#D8B46B]" />
            Book Recurring Sessions
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* First Session */}
          <div className="bg-[#F9F5EF] p-4 rounded-lg">
            <p className="text-sm text-[#2B2725]/70 mb-2">First Session</p>
            <div className="flex items-center gap-2 text-[#1E3A32]">
              <Calendar size={16} />
              <span className="font-medium">
                {format(new Date(selectedSlot.start), 'EEEE, MMMM d, yyyy')}
              </span>
            </div>
            <div className="text-sm text-[#2B2725]/70 mt-1">
              {format(new Date(selectedSlot.start), 'h:mm a')}
            </div>
          </div>

          {/* Frequency */}
          <div>
            <Label>Frequency</Label>
            <RadioGroup value={frequency} onValueChange={setFrequency} className="mt-3 space-y-3">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="weekly" id="weekly" />
                <Label htmlFor="weekly" className="cursor-pointer font-normal">
                  Weekly (same day/time every week)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="biweekly" id="biweekly" />
                <Label htmlFor="biweekly" className="cursor-pointer font-normal">
                  Bi-weekly (every 2 weeks)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="monthly" id="monthly" />
                <Label htmlFor="monthly" className="cursor-pointer font-normal">
                  Monthly (same date each month)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Number of Sessions */}
          <div>
            <Label htmlFor="occurrences">Number of Sessions</Label>
            <Input
              id="occurrences"
              type="number"
              min="2"
              max="52"
              value={occurrences}
              onChange={(e) => setOccurrences(parseInt(e.target.value))}
              className="mt-2"
            />
            <p className="text-xs text-[#2B2725]/60 mt-1">
              {getFrequencyLabel()} for {occurrences} sessions
            </p>
          </div>

          {/* Pricing */}
          <div className="bg-[#D8B46B]/10 p-4 rounded-lg border border-[#D8B46B]/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#2B2725]/70">Price per session</span>
              <span className="text-sm font-medium text-[#1E3A32]">
                ${(appointmentType.price / 100).toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#2B2725]/70">Number of sessions</span>
              <span className="text-sm font-medium text-[#1E3A32]">×{occurrences}</span>
            </div>
            <div className="pt-2 border-t border-[#D8B46B]/30">
              <div className="flex items-center justify-between">
                <span className="font-medium text-[#1E3A32]">Total</span>
                <div className="flex items-center gap-1">
                  <DollarSign size={16} className="text-[#D8B46B]" />
                  <span className="text-xl font-serif text-[#1E3A32]">
                    {(totalAmount / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="flex items-start gap-2 text-xs text-[#2B2725]/70">
            <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
            <p>
              All sessions will be scheduled automatically. You can manage or cancel individual 
              sessions after booking.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            className="flex-1 bg-[#1E3A32] hover:bg-[#2B2725]"
          >
            Book {occurrences} Sessions
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}