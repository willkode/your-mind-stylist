import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, CheckCircle, XCircle, Clock, Filter, RefreshCw, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";

export default function BookingHistory({ bookings }) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [dateRangeFilter, setDateRangeFilter] = useState("all");
  const [expandedBooking, setExpandedBooking] = useState(null);

  if (!bookings || bookings.length === 0) {
    return (
      <div className="bg-white p-8 text-center shadow-md">
        <Calendar size={48} className="text-[#2B2725]/20 mx-auto mb-4" />
        <p className="text-[#2B2725]/60">No booking history yet</p>
      </div>
    );
  }

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

    // Date range filter
    if (dateRangeFilter !== "all") {
      const bookingDate = new Date(booking.scheduled_date || booking.created_date);
      const now = new Date();
      const daysAgo = parseInt(dateRangeFilter);
      const cutoffDate = new Date(now.setDate(now.getDate() - daysAgo));
      if (bookingDate < cutoffDate) {
        return false;
      }
    }

    return true;
  });

  const handleRebook = (booking) => {
    // Navigate to booking page with pre-selected service
    window.location.href = createPageUrl(`Bookings?service=${booking.service_type}`);
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'completed':
        return <CheckCircle size={16} className="text-[#A6B7A3]" />;
      case 'cancelled':
        return <XCircle size={16} className="text-red-500" />;
      case 'expired':
        return <Clock size={16} className="text-[#2B2725]/40" />;
      default:
        return <Calendar size={16} className="text-[#2B2725]/60" />;
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: 'bg-[#A6B7A3]/30 text-[#1E3A32]',
      cancelled: 'bg-red-100 text-red-800',
      expired: 'bg-[#2B2725]/10 text-[#2B2725]',
      confirmed: 'bg-blue-100 text-blue-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount / 100);
  };

  return (
    <div className="bg-white shadow-md">
      {/* Filters */}
      <div className="p-6 border-b border-[#E4D9C4]">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={18} className="text-[#D8B46B]" />
          <h3 className="font-medium text-[#1E3A32]">Filter History</h3>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>

          <Select value={serviceFilter} onValueChange={setServiceFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Service Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              {serviceTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
              <SelectItem value="180">Last 6 Months</SelectItem>
              <SelectItem value="365">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {(statusFilter !== "all" || serviceFilter !== "all" || dateRangeFilter !== "all") && (
          <div className="mt-3 text-sm text-[#2B2725]/70">
            Showing {filteredBookings.length} of {bookings.length} bookings
          </div>
        )}
      </div>

      {/* Bookings List */}
      <div className="divide-y divide-[#E4D9C4]">
        <AnimatePresence>
          {filteredBookings.length === 0 ? (
            <div className="p-8 text-center">
              <Calendar size={48} className="text-[#2B2725]/20 mx-auto mb-4" />
              <p className="text-[#2B2725]/60">No bookings match your filters</p>
            </div>
          ) : (
            filteredBookings.map((booking) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-6 hover:bg-[#F9F5EF] transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(booking.booking_status)}
                      <h4 className="font-medium text-[#1E3A32]">
                        {booking.service_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </h4>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-[#2B2725]/70">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {booking.scheduled_date 
                          ? format(new Date(booking.scheduled_date), 'MMM d, yyyy • h:mm a')
                          : format(new Date(booking.created_date), 'MMM d, yyyy')}
                      </span>
                      <span>{formatAmount(booking.amount)}</span>
                      {booking.session_count > 1 && (
                        <span>{booking.session_count} sessions</span>
                      )}
                    </div>
                  </div>
                  <Badge className={getStatusColor(booking.booking_status)}>
                    {booking.booking_status?.replace(/_/g, ' ')}
                  </Badge>
                </div>

                {/* Actions and Details */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {booking.booking_status === 'completed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRebook(booking)}
                        className="text-xs"
                      >
                        <RefreshCw size={14} className="mr-1" />
                        Book Again
                      </Button>
                    )}
                    {(booking.session_notes || booking.notes) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setExpandedBooking(expandedBooking === booking.id ? null : booking.id)}
                        className="text-xs"
                      >
                        <FileText size={14} className="mr-1" />
                        {expandedBooking === booking.id ? 'Hide' : 'View'} Notes
                        {expandedBooking === booking.id ? <ChevronUp size={14} className="ml-1" /> : <ChevronDown size={14} className="ml-1" />}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Expanded Notes Section */}
                <AnimatePresence>
                  {expandedBooking === booking.id && (booking.session_notes || booking.notes) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-4 overflow-hidden"
                    >
                      {booking.session_notes && (
                        <div className="bg-[#F9F5EF] p-4 rounded border-l-4 border-[#A6B7A3] mb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText size={16} className="text-[#A6B7A3]" />
                            <h5 className="font-medium text-[#1E3A32] text-sm">Session Notes</h5>
                          </div>
                          <p className="text-sm text-[#2B2725]/80 whitespace-pre-wrap">{booking.session_notes}</p>
                        </div>
                      )}
                      {booking.notes && (
                        <div className="bg-[#FFF9F0] p-4 rounded border-l-4 border-[#D8B46B]">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText size={16} className="text-[#D8B46B]" />
                            <h5 className="font-medium text-[#1E3A32] text-sm">Your Notes</h5>
                          </div>
                          <p className="text-sm text-[#2B2725]/80 whitespace-pre-wrap">{booking.notes}</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}