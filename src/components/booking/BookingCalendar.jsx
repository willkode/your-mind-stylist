import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Mail, AlertCircle, Repeat } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import RecurringBookingModal from "./RecurringBookingModal";

export default function BookingCalendar({ appointmentType, onSlotSelected }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [availableDates, setAvailableDates] = useState(new Set());
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showRecurringModal, setShowRecurringModal] = useState(false);

  useEffect(() => {
    loadAvailableSlots();
  }, [currentMonth, appointmentType]);

  const loadAvailableSlots = async () => {
    setLoading(true);
    try {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);

      const response = await base44.functions.invoke('getAvailableSlots', {
        appointment_type_id: appointmentType.id,
        start_date: monthStart.toISOString(),
        end_date: monthEnd.toISOString()
      });

      setAvailableSlots(response.data.slots || []);
      
      // Only mark a date as available if it actually has slots for this appointment type
      const dates = new Set(response.data.slots.map(slot => slot.date));
      setAvailableDates(dates);
    } catch (error) {
      console.error('Error loading slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    if (availableDates.has(dateStr)) {
      setSelectedDate(date);
    }
  };

  const handleSlotSelect = (slot, recurring = false) => {
    if (recurring) {
      setSelectedSlot(slot);
      setShowRecurringModal(true);
    } else {
      onSlotSelected(slot, false);
    }
  };

  const handleRecurringConfirm = async (recurringData) => {
    setShowRecurringModal(false);
    onSlotSelected(selectedSlot, true, recurringData);
  };

  const monthDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end: endOfWeek(endOfMonth(currentMonth))
  });

  const selectedDateSlots = selectedDate
    ? availableSlots.filter(slot => slot.date === format(selectedDate, 'yyyy-MM-dd'))
    : [];

  const hasAnyAvailability = availableDates.size > 0;

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Calendar */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft size={20} />
          </Button>
          <h3 className="font-serif text-xl text-[#1E3A32]">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight size={20} />
          </Button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs text-[#2B2725]/60 font-medium">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">
          {monthDays.map((day, idx) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const isAvailable = availableDates.has(dateStr);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, currentMonth);

            let dayClass = 'aspect-square p-2 text-sm rounded transition-all ';
            if (!isCurrentMonth) {
              dayClass += 'text-[#2B2725]/20 cursor-not-allowed ';
            } else if (isSelected) {
              dayClass += 'bg-[#1E3A32] text-[#F9F5EF] cursor-pointer ';
            } else if (isAvailable) {
              dayClass += 'bg-[#D8B46B]/20 text-[#1E3A32] hover:bg-[#D8B46B]/40 cursor-pointer font-medium ';
            } else {
              dayClass += 'text-[#2B2725]/30 cursor-not-allowed ';
            }

            return (
              <button
                key={idx}
                onClick={() => handleDateClick(day)}
                disabled={!isAvailable || !isCurrentMonth}
                className={dayClass}
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex items-center gap-4 text-xs text-[#2B2725]/70">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#D8B46B]/20 rounded"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#1E3A32] rounded"></div>
            <span>Selected</span>
          </div>
        </div>
      </Card>

      {/* Time slots */}
      <Card className="p-6">
        <h3 className="font-serif text-xl text-[#1E3A32] mb-4 flex items-center gap-2">
          <Clock size={20} className="text-[#D8B46B]" />
          {selectedDate ? format(selectedDate, 'EEEE, MMMM d') : 'Select a date'}
        </h3>

        {loading ? (
          <div className="text-center py-8 text-[#2B2725]/60">Loading available times...</div>
        ) : !hasAnyAvailability ? (
          <div className="bg-[#FFF9F0] border border-[#D8B46B]/30 p-6 text-center">
            <AlertCircle size={40} className="text-[#D8B46B] mx-auto mb-4" />
            <h4 className="font-medium text-[#1E3A32] mb-2">No Availability This Month</h4>
            <p className="text-sm text-[#2B2725]/70 mb-6">
              There are no available time slots for {format(currentMonth, 'MMMM yyyy')}. 
              Try selecting a different month or reach out directly.
            </p>
            <div className="flex flex-col gap-3">
              <Button
                variant="outline"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="w-full"
              >
                Check Next Month
              </Button>
              <Link to={createPageUrl('Contact')}>
                <Button className="w-full bg-[#1E3A32] hover:bg-[#2B4A40]">
                  <Mail size={16} className="mr-2" />
                  Contact Roberta Directly
                </Button>
              </Link>
            </div>
          </div>
        ) : !selectedDate ? (
          <div className="text-center py-8 text-[#2B2725]/60">
            Select a date to see available times
          </div>
        ) : selectedDateSlots.length === 0 ? (
          <div className="text-center py-8 text-[#2B2725]/60">
            No available times on this date
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto mb-4">
              {selectedDateSlots.map((slot, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  onClick={() => handleSlotSelect(slot)}
                  className="justify-start hover:bg-[#D8B46B]/10 hover:border-[#D8B46B]"
                >
                  {format(new Date(slot.start), 'h:mm a')}
                </Button>
              ))}
            </div>
            
            {selectedDateSlots.length > 0 && (
              <div className="pt-4 border-t border-[#E4D9C4]">
                <p className="text-xs text-[#2B2725]/70 mb-2">Need multiple sessions?</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSlotSelect(selectedDateSlots[0], true)}
                  className="w-full"
                >
                  <Repeat size={14} className="mr-2" />
                  Book Recurring Sessions
                </Button>
              </div>
            )}
          </>
        )}
      </Card>

      {showRecurringModal && selectedSlot && (
        <RecurringBookingModal
          isOpen={showRecurringModal}
          onClose={() => setShowRecurringModal(false)}
          appointmentType={appointmentType}
          selectedSlot={selectedSlot}
          onConfirm={handleRecurringConfirm}
        />
      )}
    </div>
  );
}