import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { motion } from "framer-motion";
import { Calendar, MessageSquare, FileText, AlertCircle, CheckCircle, Clock, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ManagerDashboardNow({ user, bookings = [], messages = [], consultationIntakes = [] }) {
  const [upcomingSession, setUpcomingSession] = useState(null);

  useEffect(() => {
    // Find next upcoming session within next X hours
    const now = new Date();
    const nextHour = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours buffer
    
    const upcoming = bookings
      .filter(b => b.booking_status === 'confirmed' && new Date(b.scheduled_date) >= now && new Date(b.scheduled_date) <= nextHour)
      .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date))[0];
    
    setUpcomingSession(upcoming);
  }, [bookings]);

  const todayBookings = bookings.filter(b => {
    const bookingDate = new Date(b.scheduled_date).toDateString();
    const today = new Date().toDateString();
    return bookingDate === today && b.booking_status === 'confirmed';
  });

  const intakeBadge = consultationIntakes.length > 0 
    ? { count: consultationIntakes.length, color: 'bg-amber-100 text-amber-800' }
    : { count: 0, color: 'bg-green-100 text-green-800' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="mb-12"
    >
      <div className="space-y-4">
        {/* Header */}
        <h2 className="font-serif text-2xl text-[#1E3A32] px-6 pt-6">Now</h2>
        
        {/* Quick status grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 px-6">
          {/* Today's Bookings */}
          <Link
            to={createPageUrl("ManagerBookings")}
            className="bg-white p-4 hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs text-[#2B2725]/60 mb-1 uppercase tracking-wide">Today's Bookings</p>
                <p className="text-3xl font-serif text-[#D8B46B]">{todayBookings.length}</p>
              </div>
              <Calendar size={24} className="text-[#2B2725]/40 group-hover:text-[#D8B46B] transition-colors" />
            </div>
          </Link>

          {/* Messages */}
          <Link
            to={createPageUrl("MessagesManager")}
            className="bg-white p-4 hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs text-[#2B2725]/60 mb-1 uppercase tracking-wide">Messages</p>
                <p className="text-3xl font-serif text-[#6E4F7D]">{messages.length}</p>
              </div>
              <MessageSquare size={24} className="text-[#2B2725]/40 group-hover:text-[#6E4F7D] transition-colors" />
            </div>
          </Link>

          {/* Pending Intakes */}
          <Link
            to={createPageUrl("ManagerIntakeReview")}
            className="bg-white p-4 hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs text-[#2B2725]/60 mb-1 uppercase tracking-wide">Intakes</p>
                <div className="flex items-end gap-2">
                  <p className="text-3xl font-serif text-[#A6B7A3]">{intakeBadge.count}</p>
                  {intakeBadge.count > 0 && (
                    <span className={`text-xs px-2 py-1 rounded ${intakeBadge.color} mb-1`}>
                      waiting
                    </span>
                  )}
                </div>
              </div>
              <FileText size={24} className="text-[#2B2725]/40 group-hover:text-[#A6B7A3] transition-colors" />
            </div>
          </Link>

          {/* Next Session */}
          <div className="bg-white p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs text-[#2B2725]/60 mb-1 uppercase tracking-wide">Next Session</p>
                {upcomingSession ? (
                  <div>
                    <p className="text-sm font-medium text-[#1E3A32] mb-2">{upcomingSession.user_name}</p>
                    <Button
                      size="sm"
                      className="bg-[#1E3A32] hover:bg-[#2B4A40] text-white w-full"
                    >
                      <Play size={14} className="mr-1" />
                      Join Now
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-[#2B2725]/60">No sessions in next 2 hours</p>
                )}
              </div>
              <Clock size={24} className="text-[#2B2725]/40 flex-shrink-0" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}