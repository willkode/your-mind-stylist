import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, ChevronLeft, ChevronRight, Video, Mail, Phone, Clock, DollarSign, ExternalLink, AlertCircle, MapPin } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isToday } from "date-fns";
import ManagerBookingActions from "@/components/manager/ManagerBookingActions";
import CalendarSourcesPanel from "@/components/calendar/CalendarSourcesPanel";
import CalendarFilters from "@/components/calendar/CalendarFilters";
import CalendarItemBadge, { getSourceInfo } from "@/components/calendar/CalendarItemBadge";
import CalendarItemDetail from "@/components/calendar/CalendarItemDetail";
import CreateManualBookingDialog from "@/components/manager/CreateManualBookingDialog";
import PersonDetailPanel from "@/components/clients/PersonDetailPanel";
import { Plus } from "lucide-react";

function BookingDetailContent({ selectedBooking, appointmentTypes, getStatusColor, formatAmount, onSuccess, onViewPerson }) {
  const apptType = appointmentTypes.find(a => a.id === selectedBooking.appointment_type_id);
  const apptName = (apptType?.name || selectedBooking.service_type || "").toLowerCase();
  const isPhone = !apptType?.zoom_enabled && (apptName.includes('phone') || apptName.includes('call'));
  const isZoom = apptType?.zoom_enabled || selectedBooking.zoom_status === 'created';

  return (
    <div className="space-y-6">
      {/* Status + Meeting type badges */}
      <div className="flex items-center gap-3 flex-wrap">
        <Badge className={getStatusColor(selectedBooking.booking_status)}>
          {selectedBooking.booking_status?.replace(/_/g, " ").toUpperCase()}
        </Badge>
        <Badge className={getStatusColor(selectedBooking.payment_status)}>
          Payment: {selectedBooking.payment_status?.toUpperCase()}
        </Badge>
        {selectedBooking.booking_source === "manual_manager" && (
          <Badge className="bg-[#6E4F7D]/10 text-[#6E4F7D]">Manual</Badge>
        )}
        {isZoom ? (
          <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
            <Video size={11} /> Virtual (Zoom)
          </span>
        ) : isPhone ? (
          <span className="flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
            <Phone size={11} /> Phone Call
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs bg-[#A6B7A3]/30 text-[#1E3A32] px-2 py-1 rounded-full font-medium">
            <MapPin size={11} /> In-Person
          </span>
        )}
      </div>

      {/* Client Info */}
      <div className="bg-[#F9F5EF] p-4">
        <h3 className="font-medium text-[#1E3A32] mb-3">Client Information</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-[#2B2725]/60 w-24">Name:</span>
            <button
              onClick={() => onViewPerson?.({ email: selectedBooking.user_email, name: selectedBooking.user_name })}
              className="text-[#1E3A32] font-medium hover:text-[#6E4F7D] hover:underline transition-colors"
            >
              {selectedBooking.user_name}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Mail size={14} className="text-[#D8B46B]" />
            <a href={`mailto:${selectedBooking.user_email}`} className="text-[#1E3A32] hover:text-[#D8B46B]">
              {selectedBooking.user_email}
            </a>
          </div>
          {selectedBooking.client_phone && (
            <div className="flex items-center gap-2">
              <Phone size={14} className={isPhone ? "text-purple-600" : "text-[#A6B7A3]"} />
              <a href={`tel:${selectedBooking.client_phone}`} className={`${isPhone ? "text-purple-700 font-semibold" : "text-[#1E3A32]"} hover:underline`}>
                {selectedBooking.client_phone}
              </a>
              {isPhone && <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">Call this number</span>}
            </div>
          )}
          {isPhone && !selectedBooking.client_phone && (
            <div className="flex items-center gap-2">
              <Phone size={14} className="text-purple-600" />
              <span className="text-purple-600 italic text-xs">No phone number on file</span>
            </div>
          )}
        </div>
      </div>

      {/* Booking Details */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Clock size={16} className="text-[#A6B7A3]" />
          <div>
            <div className="text-sm text-[#2B2725]/60">Scheduled</div>
            <div className="font-medium text-[#1E3A32]">
              {selectedBooking.scheduled_date
                ? format(new Date(selectedBooking.scheduled_date), "EEEE, MMMM d, yyyy 'at' h:mm a")
                : "Not scheduled yet"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <DollarSign size={16} className="text-[#D8B46B]" />
          <div>
            <div className="text-sm text-[#2B2725]/60">Amount</div>
            <div className="font-medium text-[#1E3A32]">{formatAmount(selectedBooking.amount)}</div>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="text-sm text-[#2B2725]/60 w-24">Service:</span>
          <span className="text-[#1E3A32] font-medium">
            {apptType?.name || selectedBooking.service_type?.replace(/_/g, " ").toUpperCase()}
          </span>
        </div>
        {selectedBooking.location && (
          <div className="flex items-start gap-3">
            <span className="text-sm text-[#2B2725]/60 w-24">Location:</span>
            <span className="text-[#1E3A32] font-medium">{selectedBooking.location}</span>
          </div>
        )}
        {selectedBooking.session_count > 1 && (
          <div className="flex items-start gap-3">
            <span className="text-sm text-[#2B2725]/60 w-24">Sessions:</span>
            <span className="text-[#1E3A32]">{selectedBooking.session_count}</span>
          </div>
        )}
      </div>

      {/* Zoom Meeting Info */}
      {selectedBooking.zoom_status === "created" && (
        <div className="bg-[#E8F4FD] p-4 border border-[#2D8CFF]">
          <div className="flex items-center gap-2 mb-3">
            <Video size={18} className="text-[#2D8CFF]" />
            <h3 className="font-medium text-[#1E3A32]">Zoom Meeting</h3>
          </div>
          <div className="space-y-2">
            {selectedBooking.zoom_start_url && (
              <div>
                <div className="text-xs text-[#2B2725]/60 mb-1">Host Start URL:</div>
                <a href={selectedBooking.zoom_start_url} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-[#2D8CFF] hover:underline flex items-center gap-1">
                  Start Meeting <ExternalLink size={12} />
                </a>
              </div>
            )}
            {selectedBooking.zoom_join_url && (
              <div>
                <div className="text-xs text-[#2B2725]/60 mb-1">Client Join URL:</div>
                <a href={selectedBooking.zoom_join_url} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-[#2D8CFF] hover:underline flex items-center gap-1">
                  Join Meeting <ExternalLink size={12} />
                </a>
              </div>
            )}
            {selectedBooking.zoom_password && (
              <div>
                <div className="text-xs text-[#2B2725]/60 mb-1">Password:</div>
                <code className="text-sm bg-white px-2 py-1 font-mono">{selectedBooking.zoom_password}</code>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedBooking.notes && (
        <div className="bg-[#FFF9F0] p-4 border-l-4 border-[#D8B46B]">
          <div className="text-sm text-[#2B2725]/60 mb-2">Client Notes:</div>
          <p className="text-[#2B2725]">{selectedBooking.notes}</p>
        </div>
      )}
      {selectedBooking.manager_notes && (
        <div className="bg-[#FFF9F0] p-4 border-l-4 border-[#D8B46B]">
          <div className="text-sm text-[#2B2725]/60 mb-2">Manager Notes (Private):</div>
          <p className="text-[#2B2725]">{selectedBooking.manager_notes}</p>
        </div>
      )}
      {selectedBooking.session_notes && (
        <div className="bg-[#F0F9FF] p-4 border-l-4 border-[#2D8CFF]">
          <div className="text-sm text-[#2B2725]/60 mb-2">Session Notes:</div>
          <p className="text-[#2B2725]">{selectedBooking.session_notes}</p>
        </div>
      )}

      <ManagerBookingActions booking={selectedBooking} onSuccess={onSuccess} />

      <div className="text-xs text-[#2B2725]/50 space-y-1 pt-4 border-t border-[#E4D9C4]">
        <div>Booking ID: {selectedBooking.id}</div>
        <div>Created: {format(new Date(selectedBooking.created_date), "PPpp")}</div>
        {selectedBooking.stripe_checkout_session_id && (
          <div>Stripe Session: {selectedBooking.stripe_checkout_session_id}</div>
        )}
      </div>
    </div>
  );
}

export default function ManagerCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [createBookingOpen, setCreateBookingOpen] = useState(false);
  const [personPanelOpen, setPersonPanelOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [filters, setFilters] = useState({
    booking: true,
    manual: true,
    available: false,
  });
  const queryClient = useQueryClient();

  const { data: appointmentTypes = [] } = useQuery({
    queryKey: ["appointment-types"],
    queryFn: () => base44.entities.AppointmentType.filter({ active: true }),
  });

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["bookings"],
    queryFn: async () => {
      const allBookings = await base44.entities.Booking.list("-scheduled_date");
      // Filter to only show bookings with scheduled dates
      return allBookings.filter(b => b.scheduled_date);
    },
  });

  const { data: blockedTimes = [] } = useQuery({
    queryKey: ["blockedTimes"],
    queryFn: () => base44.entities.AvailabilityRule.filter({ rule_type: "blocked", active: true }),
  });

  const { data: availableRules = [] } = useQuery({
    queryKey: ["availableRules"],
    queryFn: () => base44.entities.AvailabilityRule.filter({ rule_type: "available", active: true }),
    enabled: filters.available,
  });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Discover unique Google Calendar names from synced data
  const calendarNames = useMemo(() => {
    const names = new Set();
    blockedTimes.forEach(r => {
      if (r.source === 'calendar_sync' && r.calendar_name) {
        names.add(r.calendar_name);
      }
    });
    // Also include items without calendar_name as "Google Calendar" (legacy)
    const hasLegacy = blockedTimes.some(r => r.source === 'calendar_sync' && !r.calendar_name);
    if (hasLegacy) names.add('_legacy');
    return Array.from(names).sort();
  }, [blockedTimes]);

  // Auto-enable new calendar filters when they appear
  const [filtersInitialized, setFiltersInitialized] = useState(false);
  React.useEffect(() => {
    if (calendarNames.length > 0 && !filtersInitialized) {
      const calFilters = {};
      calendarNames.forEach(name => { calFilters[`cal_${name}`] = true; });
      setFilters(prev => ({ ...prev, ...calFilters }));
      setFiltersInitialized(true);
    }
  }, [calendarNames, filtersInitialized]);

  // Compute counts for filters
  const filterCounts = useMemo(() => {
    const manualCount = blockedTimes.filter(r => r.source !== 'calendar_sync').length;
    const bookingCount = bookings.length;
    const counts = { manual: manualCount, booking: bookingCount };
    // Per-calendar counts
    calendarNames.forEach(name => {
      if (name === '_legacy') {
        counts[`cal__legacy`] = blockedTimes.filter(r => r.source === 'calendar_sync' && !r.calendar_name).length;
      } else {
        counts[`cal_${name}`] = blockedTimes.filter(r => r.source === 'calendar_sync' && r.calendar_name === name).length;
      }
    });
    return counts;
  }, [bookings, blockedTimes, calendarNames]);

  const bookingsByDate = useMemo(() => {
    const map = {};
    
    if (filters.booking) {
      bookings.forEach((booking) => {
        if (booking.scheduled_date) {
          const dateKey = format(new Date(booking.scheduled_date), "yyyy-MM-dd");
          if (!map[dateKey]) map[dateKey] = [];
          map[dateKey].push({ type: 'booking', ...booking });
        }
      });
    }
    
    // Add blocked times to the map (filtered by source)
    blockedTimes.forEach((rule) => {
      if (rule.specific_date) {
        const isGoogle = rule.source === 'calendar_sync';
        if (isGoogle) {
          // Check per-calendar filter
          const calKey = rule.calendar_name ? `cal_${rule.calendar_name}` : 'cal__legacy';
          if (!filters[calKey]) return;
        }
        if (!isGoogle && !filters.manual) return;
        
        const dateKey = rule.specific_date;
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push({ type: 'blocked', ...rule });
      }
    });

    // Add available hours if toggled on
    if (filters.available) {
      availableRules.forEach((rule) => {
        if (rule.specific_date) {
          const dateKey = rule.specific_date;
          if (!map[dateKey]) map[dateKey] = [];
          map[dateKey].push({ type: 'available', ...rule });
        }
      });
    }
    
    return map;
  }, [bookings, blockedTimes, availableRules, filters]);

  const getStatusColor = (status) => {
    const colors = {
      pending_payment: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-green-100 text-green-800",
      scheduled: "bg-blue-100 text-blue-800",
      completed: "bg-gray-100 text-gray-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const formatTime24to12 = (time24) => {
    if (!time24) return '';
    const [h, m] = time24.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${period}`;
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount / 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A32] mx-auto mb-4"></div>
          <p className="text-[#2B2725]/70">Loading calendar...</p>
        </div>
      </div>
    );
  }

  // Calculate stats
  const upcomingBookings = bookings.filter(b => b.scheduled_date && new Date(b.scheduled_date) > new Date());
  const thisMonthBookings = bookings.filter(b => {
    if (!b.scheduled_date) return false;
    const bookingDate = new Date(b.scheduled_date);
    return bookingDate.getMonth() === currentDate.getMonth() && bookingDate.getFullYear() === currentDate.getFullYear();
  });
  const todayBookings = bookings.filter(b => {
    if (!b.scheduled_date) return false;
    return isToday(new Date(b.scheduled_date));
  });

  return (
    <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div>
            <h1 className="font-serif text-4xl text-[#1E3A32] mb-2">Booking Calendar</h1>
            <p className="text-[#2B2725]/70">View and manage all scheduled appointments</p>
          </div>
          
          {/* Actions + Quick Stats */}
          <div className="flex items-center gap-4 flex-wrap">
            <Button
              onClick={() => setCreateBookingOpen(true)}
              className="bg-[#1E3A32] hover:bg-[#2B2725] text-white"
            >
              <Plus size={16} className="mr-2" />
              Create Appointment
            </Button>
          </div>
          <div className="flex gap-4">
            <div className="bg-white px-4 py-3 shadow-sm">
              <div className="text-2xl font-serif text-[#1E3A32]">{todayBookings.length}</div>
              <div className="text-xs text-[#2B2725]/60">Today</div>
            </div>
            <div className="bg-white px-4 py-3 shadow-sm">
              <div className="text-2xl font-serif text-[#1E3A32]">{thisMonthBookings.length}</div>
              <div className="text-xs text-[#2B2725]/60">This Month</div>
            </div>
            <div className="bg-white px-4 py-3 shadow-sm">
              <div className="text-2xl font-serif text-[#1E3A32]">{upcomingBookings.length}</div>
              <div className="text-xs text-[#2B2725]/60">Upcoming</div>
            </div>
          </div>
        </div>

        {/* Calendar Sources Panel */}
        <CalendarSourcesPanel />

        {/* Source Filters */}
        <CalendarFilters filters={filters} onFilterChange={setFilters} counts={filterCounts} calendarNames={calendarNames} />

        {/* Calendar (Desktop Only) */}
        <div className="hidden lg:block bg-white shadow-md mb-6">
          <div className="flex items-center justify-between p-6 border-b border-[#E4D9C4]">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              >
                <ChevronLeft size={18} />
              </Button>
              <h2 className="font-serif text-2xl text-[#1E3A32] min-w-[200px] text-center">
                {format(currentDate, "MMMM yyyy")}
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              >
                <ChevronRight size={18} />
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={() => setCurrentDate(new Date())}
              className="text-sm"
            >
              Today
            </Button>
          </div>
          
          <div className="p-6">
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day Headers */}
            {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => (
              <div key={day} className="text-center font-semibold text-[#1E3A32] text-sm py-3 bg-[#F9F5EF]">
                {day}
              </div>
            ))}

            {/* Calendar Days */}
            {calendarDays.map((day) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayBookings = bookingsByDate[dateKey] || [];
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isCurrentDay = isToday(day);

              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[140px] p-3 border transition-all ${
                    isCurrentMonth ? "bg-white" : "bg-[#F9F5EF]/50"
                  } ${isCurrentDay ? "ring-2 ring-[#D8B46B] bg-[#FFF9F0]" : "border-[#E4D9C4]"} ${
                    dayBookings.length > 0 ? "hover:shadow-md cursor-pointer" : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={`text-sm font-semibold ${
                        isCurrentMonth ? "text-[#1E3A32]" : "text-[#2B2725]/30"
                      } ${isCurrentDay ? "bg-[#D8B46B] text-white w-7 h-7 rounded-full flex items-center justify-center" : ""}`}
                    >
                      {format(day, "d")}
                    </div>
                    {dayBookings.length > 0 && (
                      <span
                        className="text-xs bg-[#1E3A32] text-white px-2 py-0.5 rounded-full cursor-pointer hover:bg-[#D8B46B] transition-colors"
                        onClick={() => setSelectedDay({ day, items: dayBookings })}
                      >
                        {dayBookings.length}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    {dayBookings.slice(0, 3).map((item) => {
                      const sourceInfo = getSourceInfo(item);
                      
                      if (item.type === 'available') {
                        return (
                          <div
                            key={item.id}
                            className="w-full text-left px-2 py-1.5 rounded bg-[#D8B46B]/10 border border-[#D8B46B]/30 text-xs"
                          >
                            <div className="font-medium truncate flex items-center gap-1 text-[#1E3A32]/70">
                              <Clock size={10} className="flex-shrink-0" />
                              <span>{formatTime24to12(item.start_time)} - {formatTime24to12(item.end_time)}</span>
                            </div>
                            <div className="text-[10px] truncate text-[#2B2725]/50 mt-0.5">Available</div>
                          </div>
                        );
                      }
                      
                      if (item.type === 'blocked') {
                        return (
                          <div
                            key={item.id}
                            className={`w-full text-left px-2 py-1.5 rounded border text-xs relative group ${sourceInfo.bgClass} ${sourceInfo.borderClass}`}
                            onMouseEnter={() => setHoveredItem(item.id)}
                            onMouseLeave={() => setHoveredItem(null)}
                          >
                            <div className="flex items-center gap-1">
                              <CalendarItemBadge item={item} size="xs" />
                              <span className="font-medium truncate flex-1">
                                {formatTime24to12(item.start_time)} - {formatTime24to12(item.end_time)}
                              </span>
                            </div>
                            <div className={`text-[10px] truncate mt-0.5 ${sourceInfo.textClass}`}>
                              {item.reason || 'Blocked'}
                            </div>
                            {hoveredItem === item.id && (
                              <div className="absolute z-50 top-full left-0 mt-1">
                                <CalendarItemDetail item={item} onClose={() => setHoveredItem(null)} />
                              </div>
                            )}
                          </div>
                        );
                      }
                      
                      return (
                        <button
                          key={item.id}
                          onClick={() => setSelectedBooking(item)}
                          onMouseEnter={() => setHoveredItem(item.id)}
                          onMouseLeave={() => setHoveredItem(null)}
                          className="w-full text-left px-2 py-1.5 rounded transition-all text-xs bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 relative group"
                        >
                          <div className="flex items-center gap-1">
                            <CalendarItemBadge item={item} size="xs" />
                            <span className="font-medium truncate flex-1">
                              {item.scheduled_date && format(new Date(item.scheduled_date), "h:mm a")}
                            </span>
                            {item.zoom_status === 'created' && (
                              <Video size={10} className="text-blue-600 flex-shrink-0" />
                            )}
                            {item.zoom_status === 'failed' && (
                              <AlertCircle size={10} className="text-red-500 flex-shrink-0" />
                            )}
                          </div>
                          <div className="text-[10px] truncate font-medium mt-0.5 text-emerald-700">
                            {item.user_name}
                          </div>
                          {hoveredItem === item.id && (
                            <div className="absolute z-50 top-full left-0 mt-1" onClick={(e) => e.stopPropagation()}>
                              <CalendarItemDetail item={item} onClose={() => setHoveredItem(null)} />
                            </div>
                          )}
                        </button>
                      );
                    })}
                    {dayBookings.length > 3 && (
                      <button
                        onClick={() => setSelectedDay({ day, items: dayBookings })}
                        className="text-xs text-[#1E3A32] hover:text-[#D8B46B] text-center py-1 w-full font-medium transition-colors"
                      >
                        +{dayBookings.length - 3} more
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          </div>
        </div>

        {/* Day View Modal */}
        <Dialog open={!!selectedDay} onOpenChange={() => setSelectedDay(null)}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedDay && format(selectedDay.day, "EEEE, MMMM d, yyyy")}
              </DialogTitle>
            </DialogHeader>
            {selectedDay && (
              <div className="space-y-2 mt-2">
                {selectedDay.items
                  .sort((a, b) => {
                    const timeA = a.type === 'booking' ? (a.scheduled_date || '') : `${a.specific_date}T${a.start_time}`;
                    const timeB = b.type === 'booking' ? (b.scheduled_date || '') : `${b.specific_date}T${b.start_time}`;
                    return timeA.localeCompare(timeB);
                  })
                  .map((item) => {
                    const sourceInfo = getSourceInfo(item);
                    
                    if (item.type === 'available') {
                      return (
                        <div key={item.id} className="flex items-start gap-3 p-3 bg-[#D8B46B]/10 border border-[#D8B46B]/30 rounded">
                          <Clock size={14} className="text-[#D8B46B] mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-[#1E3A32]/70">{formatTime24to12(item.start_time)} – {formatTime24to12(item.end_time)}</div>
                            <div className="text-xs text-[#2B2725]/50 mt-0.5">Available for booking</div>
                          </div>
                        </div>
                      );
                    }
                    
                    if (item.type === 'blocked') {
                      return (
                        <div key={item.id} className={`flex items-start gap-3 p-3 ${sourceInfo.bgClass} border ${sourceInfo.borderClass} rounded`}>
                          <Clock size={14} className={`${sourceInfo.textClass} mt-0.5 flex-shrink-0`} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <CalendarItemBadge item={item} size="sm" />
                            </div>
                            <div className={`text-sm font-medium ${sourceInfo.textClass}`}>{formatTime24to12(item.start_time)} – {formatTime24to12(item.end_time)}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{item.reason || 'Blocked'}</div>
                            {item.updated_date && (
                              <div className="text-[10px] text-gray-400 mt-1">Updated: {format(new Date(item.updated_date), "MMM d, h:mm a")}</div>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return (
                      <button
                        key={item.id}
                        onClick={() => { setSelectedDay(null); setSelectedBooking(item); }}
                        className="w-full text-left flex items-start gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100 transition-colors"
                      >
                        <Clock size={14} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CalendarItemBadge item={item} size="sm" />
                          </div>
                          <div className="text-sm font-medium text-[#1E3A32]">
                            {item.scheduled_date && format(new Date(item.scheduled_date), "h:mm a")} — {item.user_name}
                          </div>
                          <div className="text-xs text-[#2B2725]/60 mt-0.5">{item.service_type?.replace(/_/g, " ")}</div>
                        </div>
                        {item.zoom_status === 'created' && <Video size={12} className="text-blue-500 ml-auto mt-1" />}
                      </button>
                    );
                  })}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Booking Details Modal */}
        <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Booking Details</DialogTitle>
            </DialogHeader>
            {selectedBooking && <BookingDetailContent
              selectedBooking={selectedBooking}
              appointmentTypes={appointmentTypes}
              getStatusColor={getStatusColor}
              formatAmount={formatAmount}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ["bookings"] });
                setSelectedBooking(null);
              }}
              onViewPerson={(person) => {
                setSelectedPerson(person);
                setPersonPanelOpen(true);
              }}
            />}
            </DialogContent>
            </Dialog>

        {/* Upcoming Bookings List */}
        <div className="bg-white shadow-md">
          <div className="p-6 border-b border-[#E4D9C4]">
            <h2 className="font-serif text-2xl text-[#1E3A32]">Upcoming Sessions</h2>
          </div>
          <div className="divide-y divide-[#E4D9C4]">
            {upcomingBookings.slice(0, 10).map((booking) => (
              <button
                key={booking.id}
                onClick={() => setSelectedBooking(booking)}
                className="w-full text-left p-6 hover:bg-[#F9F5EF] transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPerson({ email: booking.user_email, name: booking.user_name });
                          setPersonPanelOpen(true);
                        }}
                        className="font-serif text-lg text-[#1E3A32] hover:text-[#6E4F7D] hover:underline transition-colors"
                      >
                        {booking.user_name}
                      </button>
                      {booking.zoom_status === "created" && (
                        <div className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          <Video size={12} />
                          <span>Zoom Ready</span>
                        </div>
                      )}
                      {booking.booking_source === "manual_manager" && (
                        <Badge className="bg-[#6E4F7D]/10 text-[#6E4F7D] text-[10px]">Manual</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#2B2725]/70 mb-1">
                      <Clock size={14} />
                      <span>{format(new Date(booking.scheduled_date), "EEEE, MMMM d 'at' h:mm a")}</span>
                    </div>
                    <div className="text-xs text-[#2B2725]/60">
                      {booking.service_type?.replace(/_/g, " ")}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={getStatusColor(booking.booking_status)}>
                      {booking.booking_status?.replace(/_/g, " ")}
                    </Badge>
                    <div className="text-sm font-medium text-[#1E3A32]">
                      {formatAmount(booking.amount)}
                    </div>
                  </div>
                </div>
              </button>
            ))}
            {upcomingBookings.length === 0 && (
              <div className="text-center py-12 text-[#2B2725]/50">
                <Calendar size={48} className="mx-auto mb-4 opacity-30" />
                <p>No upcoming bookings scheduled</p>
              </div>
            )}
          </div>
        </div>

      {/* Create Manual Booking Dialog */}
      <CreateManualBookingDialog
        open={createBookingOpen}
        onOpenChange={setCreateBookingOpen}
      />

      {/* Person Detail Panel */}
      {selectedPerson && (
        <PersonDetailPanel
          open={personPanelOpen}
          onOpenChange={setPersonPanelOpen}
          email={selectedPerson.email}
          name={selectedPerson.name}
        />
      )}
      </div>
    </div>
  );
}