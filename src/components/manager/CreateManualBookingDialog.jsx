import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle2, Calendar, User, MapPin, Mail, Phone } from "lucide-react";
import ClientSearchInput from "./ClientSearchInput";

export default function CreateManualBookingDialog({ open, onOpenChange, prefillDate }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  // Form state
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [appointmentTypeId, setAppointmentTypeId] = useState("");
  const [scheduledDate, setScheduledDate] = useState(prefillDate || "");
  const [timeHour, setTimeHour] = useState("");
  const [timeMinute, setTimeMinute] = useState("");
  const [timePeriod, setTimePeriod] = useState("AM");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [locationType, setLocationType] = useState("in_person");
  const [customLocation, setCustomLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [managerNotes, setManagerNotes] = useState("");
  const [sendConfirmation, setSendConfirmation] = useState(true);
  const [syncToCalendar, setSyncToCalendar] = useState(true);

  // Build 24-hour time string from the 12-hour selects
  const scheduledTime = useMemo(() => {
    if (!timeHour || !timeMinute) return "";
    let h = parseInt(timeHour);
    if (timePeriod === "AM" && h === 12) h = 0;
    if (timePeriod === "PM" && h !== 12) h += 12;
    return `${String(h).padStart(2, "0")}:${timeMinute}`;
  }, [timeHour, timeMinute, timePeriod]);

  // Display-friendly time string
  const displayTime = useMemo(() => {
    if (!timeHour || !timeMinute) return "";
    return `${timeHour}:${timeMinute} ${timePeriod}`;
  }, [timeHour, timeMinute, timePeriod]);

  // Fetch appointment types
  const { data: appointmentTypes = [] } = useQuery({
    queryKey: ["appointment-types"],
    queryFn: () => base44.entities.AppointmentType.list(),
  });

  const selectedAppointmentType = useMemo(() => {
    return appointmentTypes.find(t => t.id === appointmentTypeId);
  }, [appointmentTypeId, appointmentTypes]);

  // When appointment type changes, set default duration and location
  const handleAppointmentTypeChange = (typeId) => {
    setAppointmentTypeId(typeId);
    const type = appointmentTypes.find(t => t.id === typeId);
    if (type) {
      setDurationMinutes(String(type.duration || 60));
      if (type.zoom_enabled) {
        setLocationType("online");
      } else {
        setLocationType("in_person");
      }
    }
  };

  const handleClientSelect = (client) => {
    setClientName(client.name || client.full_name || "");
    setClientEmail(client.email || "");
    setClientPhone(client.phone || client.client_phone || "");
  };

  const handleSubmit = async () => {
    if (!clientName || !clientEmail || !scheduledDate || !scheduledTime) return;

    setSubmitting(true);
    try {
      // Send the bare Pacific date+time string — the backend will handle
      // timezone conversion using the canonical 'America/Los_Angeles' timezone.
      // Do NOT convert to UTC here — that caused a double-offset bug.
      const pacificDateTimeStr = `${scheduledDate}T${scheduledTime}:00`;

      const response = await base44.functions.invoke("createManualBooking", {
        client_name: clientName,
        client_email: clientEmail,
        client_phone: clientPhone,
        appointment_type_id: appointmentTypeId || null,
        scheduled_date: pacificDateTimeStr,
        scheduled_timezone: 'America/Los_Angeles',
        duration_minutes: parseInt(durationMinutes) || 60,
        location_type: locationType,
        custom_location: customLocation,
        notes,
        manager_notes: managerNotes,
        send_confirmation_email: sendConfirmation,
        sync_to_google_calendar: syncToCalendar,
      });

      setResult(response.data);
      setStep(3);

      // Invalidate queries so calendar/bookings refresh
      queryClient.invalidateQueries({ queryKey: ["manager-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["availability-rules"] });
    } catch (error) {
      setResult({ error: error.response?.data?.error || error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setStep(1);
    setResult(null);
    setClientName("");
    setClientEmail("");
    setClientPhone("");
    setAppointmentTypeId("");
    setScheduledDate(prefillDate || "");
    setTimeHour("");
    setTimeMinute("");
    setTimePeriod("AM");
    setDurationMinutes("");
    setLocationType("in_person");
    setCustomLocation("");
    setNotes("");
    setManagerNotes("");
    setSendConfirmation(true);
    setSyncToCalendar(true);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-[#1E3A32] flex items-center gap-2">
            <Calendar size={22} className="text-[#D8B46B]" />
            Create Manual Appointment
          </DialogTitle>
          <DialogDescription>
            {step === 1 && "Enter client and appointment details"}
            {step === 2 && "Review and confirm"}
            {step === 3 && "Appointment created"}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Enter Details */}
        {step === 1 && (
          <div className="space-y-5">
            {/* Client Section */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-[#1E3A32] flex items-center gap-2">
                <User size={14} className="text-[#D8B46B]" />
                Client Information
              </p>
              
              <ClientSearchInput onSelect={handleClientSelect} />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-[#2B2725]/70">Name *</Label>
                  <Input
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Client name"
                  />
                </div>
                <div>
                  <Label className="text-xs text-[#2B2725]/70">Email *</Label>
                  <Input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="client@email.com"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-[#2B2725]/70">Phone</Label>
                <Input
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            {/* Appointment Section */}
            <div className="space-y-3 pt-3 border-t border-[#E4D9C4]">
              <p className="text-sm font-medium text-[#1E3A32] flex items-center gap-2">
                <Calendar size={14} className="text-[#D8B46B]" />
                Appointment Details
              </p>

              <div>
                <Label className="text-xs text-[#2B2725]/70">Appointment Type</Label>
                <Select value={appointmentTypeId} onValueChange={handleAppointmentTypeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {appointmentTypes.filter(t => t.active).map(type => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name} ({type.duration}min)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-[#2B2725]/70">Date *</Label>
                  <Input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs text-[#2B2725]/70">Duration (min)</Label>
                  <Input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    placeholder="60"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-[#2B2725]/70">Time (Pacific) *</Label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  <Select value={timeHour} onValueChange={setTimeHour}>
                    <SelectTrigger>
                      <SelectValue placeholder="Hour" />
                    </SelectTrigger>
                    <SelectContent>
                      {["12","1","2","3","4","5","6","7","8","9","10","11"].map(h => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={timeMinute} onValueChange={setTimeMinute}>
                    <SelectTrigger>
                      <SelectValue placeholder="Min" />
                    </SelectTrigger>
                    <SelectContent>
                      {["00","15","30","45"].map(m => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={timePeriod} onValueChange={setTimePeriod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AM">AM</SelectItem>
                      <SelectItem value="PM">PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Location Section */}
            <div className="space-y-3 pt-3 border-t border-[#E4D9C4]">
              <p className="text-sm font-medium text-[#1E3A32] flex items-center gap-2">
                <MapPin size={14} className="text-[#D8B46B]" />
                Location
              </p>

              <Select value={locationType} onValueChange={setLocationType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_person">In-Person (Office)</SelectItem>
                  <SelectItem value="online">Online (Zoom)</SelectItem>
                  <SelectItem value="phone">Phone Call</SelectItem>
                  <SelectItem value="custom">Custom Location</SelectItem>
                </SelectContent>
              </Select>

              {(locationType === "custom" || locationType === "in_person") && (
                <Input
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  placeholder={locationType === "in_person" ? "8724 Spanish Ridge Ave #B, Las Vegas, NV 89148" : "Enter address or location details"}
                />
              )}
            </div>

            {/* Notes Section */}
            <div className="space-y-3 pt-3 border-t border-[#E4D9C4]">
              <div>
                <Label className="text-xs text-[#2B2725]/70">Client Notes (visible to client)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any preparation notes for the client..."
                  rows={2}
                />
              </div>
              <div>
                <Label className="text-xs text-[#2B2725]/70">Manager Notes (private)</Label>
                <Textarea
                  value={managerNotes}
                  onChange={(e) => setManagerNotes(e.target.value)}
                  placeholder="Internal notes about this appointment..."
                  rows={2}
                />
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3 pt-3 border-t border-[#E4D9C4]">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="send-confirmation"
                  checked={sendConfirmation}
                  onCheckedChange={setSendConfirmation}
                />
                <Label htmlFor="send-confirmation" className="text-sm cursor-pointer">
                  Send confirmation email to client
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox
                  id="sync-calendar"
                  checked={syncToCalendar}
                  onCheckedChange={setSyncToCalendar}
                />
                <Label htmlFor="sync-calendar" className="text-sm cursor-pointer">
                  Add to Google Calendar
                </Label>
              </div>
            </div>

            <div className="flex justify-between items-end pt-4">
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <div className="flex flex-col items-end gap-1.5">
                {(!clientName || !clientEmail || !scheduledDate || !scheduledTime) && (
                  <p className="text-xs text-red-500">
                    {!clientName ? "Name is required" : !clientEmail ? "Email is required" : !scheduledDate ? "Date is required" : "Time is required"}
                  </p>
                )}
                <Button
                  onClick={() => setStep(2)}
                  disabled={!clientName || !clientEmail || !scheduledDate || !scheduledTime}
                  className="bg-[#1E3A32] hover:bg-[#2B2725] text-white"
                >
                  Review Appointment
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Review */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-[#F9F5EF] p-4 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#2B2725]/70">Client</span>
                <span className="text-sm font-medium text-[#1E3A32]">{clientName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#2B2725]/70">Email</span>
                <span className="text-sm text-[#1E3A32]">{clientEmail}</span>
              </div>
              {clientPhone && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#2B2725]/70">Phone</span>
                  <span className="text-sm text-[#1E3A32]">{clientPhone}</span>
                </div>
              )}
              <div className="border-t border-[#E4D9C4] pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#2B2725]/70">Type</span>
                  <span className="text-sm font-medium text-[#1E3A32]">
                    {selectedAppointmentType?.name || "Custom Appointment"}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#2B2725]/70">Date & Time</span>
                <span className="text-sm font-medium text-[#1E3A32]">
                  {new Date(`${scheduledDate}T${scheduledTime}`).toLocaleDateString('en-US', {
                    weekday: 'short', month: 'short', day: 'numeric'
                  })} at {displayTime} PT
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#2B2725]/70">Duration</span>
                <span className="text-sm text-[#1E3A32]">{durationMinutes || "60"} minutes</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#2B2725]/70">Location</span>
                <span className="text-sm text-[#1E3A32]">
                  {locationType === "in_person" ? "In-Person" : locationType === "online" ? "Online (Zoom)" : locationType === "phone" ? "Phone" : "Custom"}
                </span>
              </div>
              <div className="border-t border-[#E4D9C4] pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#2B2725]/70">Send confirmation</span>
                  <span className="text-sm text-[#1E3A32]">{sendConfirmation ? "Yes" : "No"}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm text-[#2B2725]/70">Sync to Google Calendar</span>
                  <span className="text-sm text-[#1E3A32]">{syncToCalendar ? "Yes" : "No"}</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-[#2B2725]/60">
              Payment status will be set to "Not Required." The client will receive reminders 24h and 1h before the session automatically.
            </p>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-[#1E3A32] hover:bg-[#2B2725] text-white"
              >
                {submitting ? (
                  <><Loader2 size={16} className="animate-spin mr-2" /> Creating...</>
                ) : (
                  "Confirm & Create"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Result */}
        {step === 3 && result && (
          <div className="space-y-4">
            {result.error ? (
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <p className="text-red-800 font-medium">Failed to create appointment</p>
                <p className="text-sm text-red-600 mt-1">{result.error}</p>
              </div>
            ) : (
              <>
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900">Appointment Created</p>
                    <p className="text-sm text-green-700 mt-1">{result.message}</p>
                  </div>
                </div>

                <div className="bg-[#F9F5EF] p-4 rounded-lg space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-[#2B2725]/50" />
                    <span>Client email: {result.emails_sent?.client ? "✓ Sent" : "Not sent"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-[#2B2725]/50" />
                    <span>Manager notification: {result.emails_sent?.manager ? "✓ Sent" : "Not sent"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-[#2B2725]/50" />
                    <span>Google Calendar: {result.calendar_synced ? "✓ Synced" : "Not synced"}</span>
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-end pt-4">
              <Button onClick={handleClose} className="bg-[#1E3A32] hover:bg-[#2B2725] text-white">
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}