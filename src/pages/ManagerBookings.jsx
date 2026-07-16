import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Calendar, DollarSign, Mail, Phone, User, Clock, CheckCircle, XCircle, AlertCircle, Video, Copy, Filter, Search, Plus } from "lucide-react";
import CreateManualBookingDialog from "../components/manager/CreateManualBookingDialog";
import RecurringSessionManager from "../components/manager/RecurringSessionManager";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import ResponsiveSelect from "@/components/ui/ResponsiveSelect";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PersonDetailPanel from "../components/clients/PersonDetailPanel";

export default function ManagerBookings() {
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [creatingZoom, setCreatingZoom] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRangeFilter, setDateRangeFilter] = useState("all");
  const [createBookingOpen, setCreateBookingOpen] = useState(false);
  const [personPanelOpen, setPersonPanelOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["manager-bookings"],
    queryFn: () => base44.entities.Booking.list("-created_date"),
  });

  // Get unique service types
  const serviceTypes = [...new Set(bookings.map(b => b.service_type))];

  // Filter bookings
  const filteredBookings = bookings.filter(booking => {
    // Status filter
    if (statusFilter !== "all" && booking.booking_status !== statusFilter) {
      return false;
    }

    // Service filter
    if (serviceFilter !== "all" && booking.service_type !== serviceFilter) {
      return false;
    }

    // Search filter (name or email)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const nameMatch = booking.user_name?.toLowerCase().includes(query);
      const emailMatch = booking.user_email?.toLowerCase().includes(query);
      if (!nameMatch && !emailMatch) {
        return false;
      }
    }

    // Date range filter
    if (dateRangeFilter !== "all") {
      const bookingDate = new Date(booking.created_date);
      const now = new Date();
      const daysAgo = parseInt(dateRangeFilter);
      const cutoffDate = new Date(now.setDate(now.getDate() - daysAgo));
      if (bookingDate < cutoffDate) {
        return false;
      }
    }

    return true;
  });

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

  const getPaymentStatusIcon = (status) => {
    switch (status) {
      case "paid":
        return <CheckCircle size={16} className="text-green-600" />;
      case "failed":
        return <XCircle size={16} className="text-red-600" />;
      case "refunded":
        return <AlertCircle size={16} className="text-orange-600" />;
      default:
        return <Clock size={16} className="text-yellow-600" />;
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount / 100);
  };

  const handleCreateZoomMeeting = async (booking) => {
    setCreatingZoom(true);
    try {
      await base44.functions.invoke('createZoomMeeting', {
        booking_id: booking.id
      });
      // Refresh bookings
      window.location.reload();
    } catch (error) {
      console.error('Failed to create Zoom meeting:', error);
      alert('Failed to create Zoom meeting. Please try again.');
    } finally {
      setCreatingZoom(false);
    }
  };

  const handleSyncToCalendar = async (booking) => {
    try {
      const response = await base44.functions.invoke('createGoogleCalendarEvent', {
        booking_id: booking.id,
        booking_data: {
          user_name: booking.user_name,
          user_email: booking.user_email,
          scheduled_date: booking.scheduled_date,
          client_phone: booking.client_phone,
          notes: booking.notes
        }
      });
      
      console.log('Calendar sync response:', response);
      
      if (response.data.success) {
        alert(`✓ Synced to Google Calendar!\nEvent ID: ${response.data.calendar_event_id}`);
      } else {
        alert(response.data.message || 'Sync completed');
      }
    } catch (error) {
      console.error('Failed to sync to calendar:', error);
      alert('Failed to sync to calendar: ' + (error.response?.data?.error || error.message));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A32] mx-auto mb-4"></div>
          <p className="text-[#2B2725]/70">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="font-serif text-4xl text-[#1E3A32] mb-3">
            Bookings & Payments
          </h1>
          <p className="text-[#2B2725]/70 text-lg">
            Manage all private session bookings and payment status
          </p>
          <Button
            onClick={() => setCreateBookingOpen(true)}
            className="bg-[#1E3A32] hover:bg-[#2B2725] text-white mt-4"
          >
            <Plus size={16} className="mr-2" />
            Create Appointment
          </Button>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white shadow-md p-6 mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Filter size={18} className="text-[#D8B46B]" />
            <h3 className="font-medium text-[#1E3A32]">Filter Bookings</h3>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2B2725]/40" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <ResponsiveSelect 
              value={statusFilter} 
              onValueChange={setStatusFilter}
              title="Filter by Status"
              placeholder="Status"
              options={[
                { value: "all", label: "All Statuses" },
                { value: "confirmed", label: "Confirmed" },
                { value: "scheduled", label: "Scheduled" },
                { value: "completed", label: "Completed" },
                { value: "cancelled", label: "Cancelled" },
                { value: "pending_payment", label: "Pending Payment" }
              ]}
            />

            <ResponsiveSelect 
              value={serviceFilter} 
              onValueChange={setServiceFilter}
              title="Filter by Service"
              placeholder="Service Type"
              options={[
                { value: "all", label: "All Services" },
                ...serviceTypes.map(type => ({
                  value: type,
                  label: type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                }))
              ]}
            />

            <ResponsiveSelect 
              value={dateRangeFilter} 
              onValueChange={setDateRangeFilter}
              title="Filter by Date"
              placeholder="Date Range"
              options={[
                { value: "all", label: "All Time" },
                { value: "7", label: "Last 7 Days" },
                { value: "30", label: "Last 30 Days" },
                { value: "90", label: "Last 90 Days" }
              ]}
            />

            <div className="flex items-center text-sm text-[#2B2725]/70">
              Showing {filteredBookings.length} of {bookings.length}
            </div>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="text-[#D8B46B]" size={24} />
              <span className="text-2xl font-serif text-[#1E3A32]">
                {filteredBookings.filter((b) => b.booking_status === "confirmed").length}
              </span>
            </div>
            <p className="text-sm text-[#2B2725]/70">Confirmed Bookings</p>
          </div>

          <div className="bg-white p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="text-[#A6B7A3]" size={24} />
              <span className="text-2xl font-serif text-[#1E3A32]">
                {formatAmount(
                  filteredBookings
                    .filter((b) => b.payment_status === "paid")
                    .reduce((sum, b) => sum + (b.amount || 0), 0)
                )}
              </span>
            </div>
            <p className="text-sm text-[#2B2725]/70">Filtered Revenue</p>
          </div>

          <div className="bg-white p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="text-[#6E4F7D]" size={24} />
              <span className="text-2xl font-serif text-[#1E3A32]">
                {filteredBookings.filter((b) => b.booking_status === "pending_payment").length}
              </span>
            </div>
            <p className="text-sm text-[#2B2725]/70">Pending Payment</p>
          </div>

          <div className="bg-white p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="text-[#1E3A32]" size={24} />
              <span className="text-2xl font-serif text-[#1E3A32]">
                {filteredBookings.filter((b) => b.booking_status === "completed").length}
              </span>
            </div>
            <p className="text-sm text-[#2B2725]/70">Completed</p>
          </div>
        </div>

        {/* Bookings Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white shadow-sm overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F9F5EF] border-b border-[#E4D9C4]">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-[#1E3A32]">
                    Client
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-[#1E3A32]">
                    Service
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-[#1E3A32]">
                    Sessions
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-[#1E3A32]">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-[#1E3A32]">
                    Payment
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-[#1E3A32]">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-[#1E3A32]">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4D9C4]">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-[#2B2725]/50">
                      {bookings.length === 0 ? 'No bookings yet' : 'No bookings match your filters'}
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((booking) => (
                    <tr
                      key={booking.id}
                      onClick={() => setSelectedBooking(booking)}
                      className="hover:bg-[#F9F5EF]/50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPerson({ email: booking.user_email, name: booking.user_name });
                              setPersonPanelOpen(true);
                            }}
                            className="text-sm font-medium text-[#1E3A32] hover:text-[#6E4F7D] hover:underline transition-colors text-left"
                          >
                            {booking.user_name}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPerson({ email: booking.user_email, name: booking.user_name });
                              setPersonPanelOpen(true);
                            }}
                            className="text-xs text-[#2B2725]/60 hover:text-[#6E4F7D] hover:underline transition-colors"
                          >
                            {booking.user_email}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-[#2B2725]">
                          {booking.service_type?.replace("_", " ").toUpperCase()}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-[#2B2725]">{booking.session_count || "N/A"}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-[#1E3A32]">
                          {formatAmount(booking.amount)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getPaymentStatusIcon(booking.payment_status)}
                          <span className="text-sm text-[#2B2725] capitalize">
                            {booking.payment_status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge className={getStatusColor(booking.booking_status)}>
                            {booking.booking_status?.replace("_", " ")}
                          </Badge>
                          {booking.booking_source === "manual_manager" && (
                            <Badge className="bg-[#6E4F7D]/10 text-[#6E4F7D] text-[10px]">Manual</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-[#2B2725]/70">
                          {format(new Date(booking.created_date), "MMM d, yyyy")}
                        </p>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Booking Detail Dialog */}
        <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl text-[#1E3A32]">
                Booking Details
              </DialogTitle>
              <DialogDescription>
                Complete information about this booking
              </DialogDescription>
            </DialogHeader>

            {selectedBooking && (
              <div className="space-y-6">
                {/* Client Info */}
                <div>
                  <h3 className="text-sm font-medium text-[#2B2725] mb-3 flex items-center gap-2">
                    <User size={16} className="text-[#D8B46B]" />
                    Client Information
                  </h3>
                  <div className="bg-[#F9F5EF] p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-[#2B2725]/70">Name:</span>
                      <button
                        onClick={() => {
                          setSelectedPerson({ email: selectedBooking.user_email, name: selectedBooking.user_name });
                          setPersonPanelOpen(true);
                        }}
                        className="text-sm font-medium text-[#1E3A32] hover:text-[#6E4F7D] hover:underline transition-colors"
                      >
                        {selectedBooking.user_name}
                      </button>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-[#2B2725]/70">Email:</span>
                      <span className="text-sm font-medium text-[#1E3A32]">
                        {selectedBooking.user_email}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Booking Details */}
                <div>
                  <h3 className="text-sm font-medium text-[#2B2725] mb-3 flex items-center gap-2">
                    <Calendar size={16} className="text-[#A6B7A3]" />
                    Booking Details
                  </h3>
                  <div className="bg-[#F9F5EF] p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-[#2B2725]/70">Service Type:</span>
                      <span className="text-sm font-medium text-[#1E3A32]">
                        {selectedBooking.service_type?.replace("_", " ").toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-[#2B2725]/70">Sessions:</span>
                      <span className="text-sm font-medium text-[#1E3A32]">
                        {selectedBooking.session_count || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-[#2B2725]/70">Status:</span>
                      <div className="flex items-center gap-1.5">
                        <Badge className={getStatusColor(selectedBooking.booking_status)}>
                          {selectedBooking.booking_status?.replace("_", " ")}
                        </Badge>
                        {selectedBooking.booking_source === "manual_manager" && (
                          <Badge className="bg-[#6E4F7D]/10 text-[#6E4F7D]">Manual</Badge>
                        )}
                      </div>
                    </div>
                    {selectedBooking.location && (
                      <div className="flex justify-between">
                        <span className="text-sm text-[#2B2725]/70">Location:</span>
                        <span className="text-sm font-medium text-[#1E3A32]">
                          {selectedBooking.location}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sm text-[#2B2725]/70">Created:</span>
                      <span className="text-sm font-medium text-[#1E3A32]">
                        {format(new Date(selectedBooking.created_date), "PPpp")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                <div>
                  <h3 className="text-sm font-medium text-[#2B2725] mb-3 flex items-center gap-2">
                    <DollarSign size={16} className="text-[#6E4F7D]" />
                    Payment Information
                  </h3>
                  <div className="bg-[#F9F5EF] p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-[#2B2725]/70">Amount:</span>
                      <span className="text-sm font-medium text-[#1E3A32]">
                        {formatAmount(selectedBooking.amount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-[#2B2725]/70">Payment Status:</span>
                      <div className="flex items-center gap-2">
                        {getPaymentStatusIcon(selectedBooking.payment_status)}
                        <span className="text-sm font-medium text-[#1E3A32] capitalize">
                          {selectedBooking.payment_status}
                        </span>
                      </div>
                    </div>
                    {selectedBooking.stripe_checkout_session_id && (
                      <div className="flex justify-between">
                        <span className="text-sm text-[#2B2725]/70">Stripe Session:</span>
                        <span className="text-xs font-mono text-[#2B2725]/60">
                          {selectedBooking.stripe_checkout_session_id.substring(0, 20)}...
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Zoom Meeting */}
                {selectedBooking.zoom_status === 'created' && selectedBooking.zoom_join_url && (
                  <div>
                    <h3 className="text-sm font-medium text-[#2B2725] mb-3 flex items-center gap-2">
                      <Video size={16} className="text-[#2D8CFF]" />
                      Zoom Meeting
                    </h3>
                    <div className="bg-[#F9F5EF] p-4 space-y-3">
                      <div>
                        <p className="text-xs text-[#2B2725]/70 mb-1">Client Join URL:</p>
                        <div className="flex items-start gap-2">
                          <a 
                            href={selectedBooking.zoom_join_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-[#2D8CFF] hover:underline break-all flex-1 mt-1"
                          >
                            {selectedBooking.zoom_join_url}
                          </a>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="flex-shrink-0"
                            onClick={() => {
                              navigator.clipboard.writeText(selectedBooking.zoom_join_url);
                            }}
                          >
                            <Copy size={14} />
                          </Button>
                        </div>
                      </div>
                      {selectedBooking.zoom_start_url && (
                        <div>
                          <p className="text-xs text-[#2B2725]/70 mb-1">Host Start URL:</p>
                          <div className="flex items-start gap-2">
                            <a 
                              href={selectedBooking.zoom_start_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-[#2D8CFF] hover:underline break-all flex-1 mt-1"
                            >
                              {selectedBooking.zoom_start_url}
                            </a>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="flex-shrink-0"
                              onClick={() => {
                                navigator.clipboard.writeText(selectedBooking.zoom_start_url);
                              }}
                            >
                              <Copy size={14} />
                            </Button>
                          </div>
                        </div>
                      )}
                      {selectedBooking.zoom_password && (
                        <div>
                          <p className="text-xs text-[#2B2725]/70 mb-1">Meeting Password:</p>
                          <p className="text-sm font-mono text-[#1E3A32]">{selectedBooking.zoom_password}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Zoom Not Created / Failed */}
                {selectedBooking.payment_status === 'paid' && (!selectedBooking.zoom_status || selectedBooking.zoom_status === 'pending' || selectedBooking.zoom_status === 'failed') && (
                  <div>
                    <h3 className="text-sm font-medium text-[#2B2725] mb-3 flex items-center gap-2">
                      <AlertCircle size={16} className="text-yellow-600" />
                      Zoom Meeting Status
                    </h3>
                    <div className="bg-yellow-50 border border-yellow-200 p-4 space-y-3">
                      <p className="text-sm text-[#2B2725]/80">
                        {selectedBooking.zoom_status === 'failed' 
                          ? 'Zoom meeting creation failed. You can retry manually.'
                          : 'No Zoom meeting has been created yet for this booking.'}
                      </p>
                      <Button
                        onClick={() => handleCreateZoomMeeting(selectedBooking)}
                        disabled={creatingZoom}
                        className="w-full bg-[#2D8CFF] hover:bg-[#2D8CFF]/90"
                      >
                        <Video size={16} className="mr-2" />
                        {creatingZoom ? 'Creating Meeting...' : 'Create Zoom Meeting'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Recurring Session Manager */}
                {selectedBooking.is_recurring && (
                  <RecurringSessionManager booking={selectedBooking} />
                )}

                {/* Notes */}
                {selectedBooking.notes && (
                  <div>
                    <h3 className="text-sm font-medium text-[#2B2725] mb-3">Client Notes</h3>
                    <div className="bg-[#F9F5EF] p-4">
                      <p className="text-sm text-[#2B2725]">{selectedBooking.notes}</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col gap-3 pt-4 border-t border-[#E4D9C4]">
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        window.location.href = `mailto:${selectedBooking.user_email}`;
                      }}
                    >
                      <Mail size={16} className="mr-2" />
                      Email Client
                    </Button>
                    {selectedBooking.scheduled_date && (
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleSyncToCalendar(selectedBooking)}
                      >
                        <Calendar size={16} className="mr-2" />
                        Sync to Calendar
                      </Button>
                    )}
                  </div>
                  <Button
                    className="w-full bg-[#1E3A32] hover:bg-[#2B2725]"
                    onClick={() => setSelectedBooking(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
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
  );
}