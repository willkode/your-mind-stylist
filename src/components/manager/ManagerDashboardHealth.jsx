import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { motion } from "framer-motion";
import { DollarSign, TrendingUp, Users, Sparkles, ChevronDown, ChevronUp, BarChart3 } from "lucide-react";
import CalendarConnectionStatus from "./CalendarConnectionStatus";

export default function ManagerDashboardHealth({ courses = [], bookings = [] }) {
  const [expanded, setExpanded] = useState(false);

  // Calculate metrics
  const revenueSnapshot = {
    total: bookings
      .filter(b => b.payment_status === 'paid')
      .reduce((sum, b) => sum + (b.amount || 0), 0),
    bookings: bookings.filter(b => b.payment_status === 'paid').length
  };

  const clientRetention = {
    total: new Set(bookings.map(b => b.user_email)).size,
    returning: bookings
      .reduce((acc, b) => {
        const count = bookings.filter(x => x.user_email === b.user_email).length;
        return { ...acc, [b.user_email]: count };
      }, {})
  };

  const returningCount = Object.values(clientRetention.returning).filter(count => count > 1).length;

  const bookingTrends = {
    confirmed: bookings.filter(b => b.booking_status === 'confirmed').length,
    pending: bookings.filter(b => b.booking_status === 'pending_payment').length,
    completed: bookings.filter(b => b.booking_status === 'completed').length
  };

  const formatCurrency = (cents) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="mb-12"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-6 bg-gradient-to-r from-[#6E4F7D] to-[#8B659B] text-white hover:shadow-lg transition-shadow"
      >
        <div className="text-left">
          <h2 className="font-serif text-2xl">Business Health</h2>
          <p className="text-white/80 text-sm mt-1">Revenue, retention, trends & insights</p>
        </div>
        {expanded ? (
          <ChevronUp size={24} className="text-white" />
        ) : (
          <ChevronDown size={24} className="text-white" />
        )}
      </button>

      {expanded && (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 p-6 bg-white border-t border-[#E4D9C4]">
          {/* Revenue Snapshot */}
          <div className="p-4 bg-[#F9F5EF] rounded">
            <DollarSign size={20} className="text-[#D8B46B] mb-3" />
            <p className="text-xs text-[#2B2725]/60 uppercase tracking-wide mb-2">Revenue</p>
            <p className="text-2xl font-serif text-[#1E3A32] mb-1">{formatCurrency(revenueSnapshot.total)}</p>
            <p className="text-xs text-[#2B2725]/60">{revenueSnapshot.bookings} paid bookings</p>
          </div>

          {/* Client Retention */}
          <div className="p-4 bg-[#F9F5EF] rounded">
            <Users size={20} className="text-[#A6B7A3] mb-3" />
            <p className="text-xs text-[#2B2725]/60 uppercase tracking-wide mb-2">Retention</p>
            <p className="text-2xl font-serif text-[#1E3A32] mb-1">{returningCount}</p>
            <p className="text-xs text-[#2B2725]/60">{clientRetention.total} total clients</p>
          </div>

          {/* Booking Trends */}
          <div className="p-4 bg-[#F9F5EF] rounded">
            <TrendingUp size={20} className="text-[#6E4F7D] mb-3" />
            <p className="text-xs text-[#2B2725]/60 uppercase tracking-wide mb-2">Bookings</p>
            <p className="text-2xl font-serif text-[#1E3A32] mb-1">{bookingTrends.confirmed}</p>
            <p className="text-xs text-[#2B2725]/60">{bookingTrends.completed} completed</p>
          </div>

          {/* View Full Analytics */}
          <Link
            to={createPageUrl("ManagerAnalytics")}
            className="p-4 bg-[#1E3A32] text-white rounded hover:bg-[#2B4A40] transition-colors flex flex-col justify-center"
          >
            <BarChart3 size={20} className="mb-3" />
            <p className="text-sm font-medium mb-2">Full Analytics</p>
            <p className="text-xs text-white/80">Deep dive dashboard →</p>
          </Link>

          {/* Calendar Connection Status — spans full width */}
          <div className="md:col-span-2 lg:col-span-4">
            <CalendarConnectionStatus />
          </div>
        </div>
      )}
    </motion.div>
  );
}