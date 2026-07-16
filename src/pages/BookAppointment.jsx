import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Calendar, Clock, ArrowRight, ArrowLeft } from "lucide-react";
import BookingCalendar from "@/components/booking/BookingCalendar";
import ClientIntakeForm from "@/components/booking/ClientIntakeForm";
import { format } from "date-fns";

export default function BookAppointment() {
  const [step, setStep] = useState(1); // 1: Select service, 2: Select time, 3: Intake form, 4: Confirm
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState("weekly");
  const [recurringOccurrences, setRecurringOccurrences] = useState(4);
  const [user, setUser] = useState(null);
  const [intakeData, setIntakeData] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      // User not logged in - will redirect to login at checkout
    }

    // Check for pre-selected appointment type from URL
    const params = new URLSearchParams(window.location.search);
    const typeId = params.get('type');
    if (typeId) {
      // Find and select the appointment type
      const types = await base44.entities.AppointmentType.filter({ id: typeId });
      if (types.length > 0) {
        setSelectedAppointment(types[0]);
        setStep(2); // Jump to time selection
      }
    }
  };

  const { data: appointmentTypes = [], isLoading } = useQuery({
    queryKey: ['appointment-types'],
    queryFn: () => base44.entities.AppointmentType.filter({ active: true }),
  });

  const handleServiceSelect = (appointmentType) => {
    setSelectedAppointment(appointmentType);
    setStep(2);
  };

  const handleSlotSelect = (slot, recurring = false, recurringData = null) => {
    setSelectedSlot(slot);
    if (recurring && recurringData) {
      setIsRecurring(true);
      setRecurringFrequency(recurringData.frequency);
      setRecurringOccurrences(recurringData.occurrences);
    } else {
      setIsRecurring(false);
    }
    setStep(3); // Go to intake form
  };

  const handleIntakeComplete = (data) => {
    setIntakeData(data);
    setStep(4); // Go to confirmation
  };

  const handleConfirmBooking = async () => {
    try {
      let response;
      
      if (isRecurring) {
        response = await base44.functions.invoke('createRecurringBookings', {
          appointment_type_id: selectedAppointment.id,
          start_date: selectedSlot.start,
          frequency: recurringFrequency,
          occurrences: recurringOccurrences,
          staff_id: selectedStaff?.id,
          intake_data: intakeData
        });
      } else {
        response = await base44.functions.invoke('createBookingCheckout', {
          appointment_type_id: selectedAppointment.id,
          scheduled_date: selectedSlot.start,
          staff_id: selectedStaff?.id,
          intake_data: intakeData
        });
      }

      // Redirect to Stripe checkout
      window.location.href = response.data.checkout_url;
    } catch (error) {
      alert('Failed to create booking: ' + error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center">
        <div className="text-[#2B2725]/70">Loading appointment types...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-serif text-4xl text-[#1E3A32] mb-3">Book Your Session</h1>
          <p className="text-[#2B2725]/70 text-lg">
            Choose your service and select your preferred time
          </p>

          {/* Progress steps */}
          <div className="flex items-center gap-2 mt-6">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-[#1E3A32]' : 'text-[#2B2725]/40'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${step >= 1 ? 'bg-[#D8B46B] text-white' : 'bg-[#2B2725]/20'}`}>
                1
              </div>
              <span className="text-xs md:text-sm font-medium hidden md:inline">Service</span>
            </div>
            <div className="flex-1 h-[2px] bg-[#2B2725]/20"></div>
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-[#1E3A32]' : 'text-[#2B2725]/40'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${step >= 2 ? 'bg-[#D8B46B] text-white' : 'bg-[#2B2725]/20'}`}>
                2
              </div>
              <span className="text-xs md:text-sm font-medium hidden md:inline">Time</span>
            </div>
            <div className="flex-1 h-[2px] bg-[#2B2725]/20"></div>
            <div className={`flex items-center gap-2 ${step >= 3 ? 'text-[#1E3A32]' : 'text-[#2B2725]/40'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${step >= 3 ? 'bg-[#D8B46B] text-white' : 'bg-[#2B2725]/20'}`}>
                3
              </div>
              <span className="text-xs md:text-sm font-medium hidden md:inline">Info</span>
            </div>
            <div className="flex-1 h-[2px] bg-[#2B2725]/20"></div>
            <div className={`flex items-center gap-2 ${step >= 4 ? 'text-[#1E3A32]' : 'text-[#2B2725]/40'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${step >= 4 ? 'bg-[#D8B46B] text-white' : 'bg-[#2B2725]/20'}`}>
                4
              </div>
              <span className="text-xs md:text-sm font-medium hidden md:inline">Confirm</span>
            </div>
          </div>
        </motion.div>

        {/* Step 1: Select Service */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid md:grid-cols-2 gap-6"
          >
            {appointmentTypes.map((apt) => (
              <Card key={apt.id} className="p-6 hover:shadow-lg transition-shadow">
                <h3 className="font-serif text-2xl text-[#1E3A32] mb-2">{apt.name}</h3>
                <p className="text-[#2B2725]/70 mb-4">{apt.description}</p>
                
                <div className="flex items-center gap-4 mb-4 text-sm text-[#2B2725]/70">
                  <div className="flex items-center gap-2">
                    <Clock size={16} />
                    <span>{apt.duration} minutes</span>
                  </div>
                  {apt.session_count > 1 && (
                    <div>
                      <span>{apt.session_count} sessions</span>
                    </div>
                  )}
                </div>

                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-3xl font-serif text-[#1E3A32]">
                    ${(apt.price / 100).toFixed(0)}
                  </span>
                  <span className="text-[#2B2725]/60">{apt.currency.toUpperCase()}</span>
                </div>

                <Button onClick={() => handleServiceSelect(apt)} className="w-full">
                  Select This Service
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              </Card>
            ))}
          </motion.div>
        )}

        {/* Step 2: Select Time */}
        {step === 2 && selectedAppointment && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-6 mb-6 bg-[#1E3A32] text-[#F9F5EF]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-xl mb-1">{selectedAppointment.name}</h3>
                  <p className="text-[#F9F5EF]/70">{selectedAppointment.duration} minutes • ${(selectedAppointment.price / 100).toFixed(0)}</p>
                </div>
                <Button variant="outline" onClick={() => setStep(1)} className="text-[#1E3A32]">
                  <ArrowLeft size={16} className="mr-2" />
                  Change Service
                </Button>
              </div>
            </Card>

            <BookingCalendar
              appointmentType={selectedAppointment}
              onSlotSelected={handleSlotSelect}
            />
          </motion.div>
        )}

        {/* Step 3: Intake Form */}
        {step === 3 && selectedAppointment && selectedSlot && (
          <ClientIntakeForm
            onBack={() => setStep(2)}
            onContinue={handleIntakeComplete}
          />
        )}

        {/* Step 4: Confirm */}
        {step === 4 && selectedAppointment && selectedSlot && intakeData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <Card className="p-8">
              <h2 className="font-serif text-2xl text-[#1E3A32] mb-6">Confirm Your Booking</h2>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between pb-3 border-b border-[#E4D9C4]">
                  <span className="text-[#2B2725]/70">Service</span>
                  <span className="font-medium text-[#1E3A32]">{selectedAppointment.name}</span>
                </div>

                <div className="flex justify-between pb-3 border-b border-[#E4D9C4]">
                  <span className="text-[#2B2725]/70">Date & Time</span>
                  <span className="font-medium text-[#1E3A32]">
                    {format(new Date(selectedSlot.start), 'EEEE, MMMM d, yyyy')}
                    <br />
                    {format(new Date(selectedSlot.start), 'h:mm a')} - {format(new Date(selectedSlot.end), 'h:mm a')}
                  </span>
                </div>

                <div className="flex justify-between pb-3 border-b border-[#E4D9C4]">
                  <span className="text-[#2B2725]/70">Duration</span>
                  <span className="font-medium text-[#1E3A32]">{selectedAppointment.duration} minutes</span>
                </div>

                {isRecurring && (
                  <>
                    <div className="flex justify-between pb-3 border-b border-[#E4D9C4]">
                      <span className="text-[#2B2725]/70">Frequency</span>
                      <span className="font-medium text-[#1E3A32] capitalize">{recurringFrequency}</span>
                    </div>
                    
                    <div className="flex justify-between pb-3 border-b border-[#E4D9C4]">
                      <span className="text-[#2B2725]/70">Number of Sessions</span>
                      <span className="font-medium text-[#1E3A32]">{recurringOccurrences}</span>
                    </div>
                  </>
                )}

                <div className="flex justify-between pb-3 border-b border-[#E4D9C4]">
                  <span className="text-[#2B2725]/70">Investment</span>
                  <span className="font-medium text-[#1E3A32] text-xl">
                    ${((isRecurring ? selectedAppointment.price * recurringOccurrences : selectedAppointment.price) / 100).toFixed(0)} {selectedAppointment.currency.toUpperCase()}
                    {isRecurring && (
                      <span className="text-sm font-normal text-[#2B2725]/70 ml-2">
                        ({recurringOccurrences} sessions)
                      </span>
                    )}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                  <ArrowLeft size={16} className="mr-2" />
                  Edit Info
                </Button>
                <Button onClick={handleConfirmBooking} className="flex-1">
                  Proceed to Payment
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}