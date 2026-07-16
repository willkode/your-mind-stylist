import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, TrendingUp, DollarSign, Users, CheckCircle, XCircle } from "lucide-react";
import RevenueChart from "@/components/analytics/RevenueChart";
import PopularServices from "@/components/analytics/PopularServices";
import BookingStatusOverview from "@/components/analytics/BookingStatusOverview";
import ClientMetrics from "@/components/analytics/ClientMetrics";

export default function ManagerAnalytics() {
  const [timeRange, setTimeRange] = useState("30"); // days

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["bookings"],
    queryFn: () => base44.entities.Booking.list("-created_date"),
  });

  const { data: appointmentTypes = [] } = useQuery({
    queryKey: ["appointmentTypes"],
    queryFn: () => base44.entities.AppointmentType.list(),
  });

  // Filter bookings by time range
  const filteredBookings = bookings.filter((booking) => {
    const daysAgo = parseInt(timeRange);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
    return new Date(booking.created_date) >= cutoffDate;
  });

  // Calculate key metrics
  const totalRevenue = filteredBookings
    .filter(b => b.payment_status === 'paid')
    .reduce((sum, b) => sum + (b.amount || 0), 0);

  const totalBookings = filteredBookings.length;
  
  const completedBookings = filteredBookings.filter(
    b => b.booking_status === 'completed'
  ).length;

  const cancelledBookings = filteredBookings.filter(
    b => b.booking_status === 'cancelled'
  ).length;

  const conversionRate = totalBookings > 0 
    ? ((filteredBookings.filter(b => b.payment_status === 'paid').length / totalBookings) * 100).toFixed(1)
    : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A32] mx-auto mb-4"></div>
          <p className="text-[#2B2725]/70">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-serif text-4xl text-[#1E3A32] mb-2">Booking Analytics</h1>
            <p className="text-[#2B2725]/70">Track performance and revenue insights</p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
              <SelectItem value="99999">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 shadow-md"
          >
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="w-8 h-8 text-[#D8B46B]" />
              <span className="text-xs text-[#2B2725]/60 uppercase tracking-wide">Revenue</span>
            </div>
            <div className="font-serif text-3xl text-[#1E3A32] mb-1">
              ${(totalRevenue / 100).toLocaleString()}
            </div>
            <p className="text-sm text-[#2B2725]/60">Total collected</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 shadow-md"
          >
            <div className="flex items-center justify-between mb-4">
              <Calendar className="w-8 h-8 text-[#A6B7A3]" />
              <span className="text-xs text-[#2B2725]/60 uppercase tracking-wide">Bookings</span>
            </div>
            <div className="font-serif text-3xl text-[#1E3A32] mb-1">
              {totalBookings}
            </div>
            <p className="text-sm text-[#2B2725]/60">Total bookings</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 shadow-md"
          >
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8 text-[#6E4F7D]" />
              <span className="text-xs text-[#2B2725]/60 uppercase tracking-wide">Conversion</span>
            </div>
            <div className="font-serif text-3xl text-[#1E3A32] mb-1">
              {conversionRate}%
            </div>
            <p className="text-sm text-[#2B2725]/60">Payment success rate</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 shadow-md"
          >
            <div className="flex items-center justify-between mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <span className="text-xs text-[#2B2725]/60 uppercase tracking-wide">Completed</span>
            </div>
            <div className="font-serif text-3xl text-[#1E3A32] mb-1">
              {completedBookings}
            </div>
            <p className="text-sm text-[#2B2725]/60">
              {cancelledBookings} cancelled
            </p>
          </motion.div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <RevenueChart bookings={filteredBookings} />
          <PopularServices bookings={filteredBookings} appointmentTypes={appointmentTypes} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BookingStatusOverview bookings={filteredBookings} />
          <ClientMetrics bookings={filteredBookings} />
        </div>
      </div>
    </div>
  );
}