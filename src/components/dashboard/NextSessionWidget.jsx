import React from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, Video, MapPin, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";

export default function NextSessionWidget({ booking }) {
  if (!booking) {
    return (
      <div className="bg-white p-8 shadow-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-[#D8B46B]/10 flex items-center justify-center">
            <Calendar size={20} className="text-[#D8B46B]" />
          </div>
          <h2 className="font-serif text-2xl text-[#1E3A32]">Your Next Session</h2>
        </div>

        <div className="text-center py-8">
          <p className="text-[#2B2725]/70 mb-6">
            You don't have any upcoming sessions scheduled yet.
          </p>
          <a href="https://koalendar.com/u/roberta" target="_blank" rel="noopener noreferrer">
            <Button className="bg-[#1E3A32] hover:bg-[#2B4A40]">
              Book a Session
            </Button>
          </a>
        </div>
      </div>
    );
  }

  const sessionDate = booking.scheduled_date ? new Date(booking.scheduled_date) : null;
  const isScheduled = sessionDate && booking.booking_status === 'confirmed';
  const isPending = booking.booking_status === 'pending_payment' || !sessionDate;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-[#1E3A32] to-[#2B4A40] p-8 shadow-xl text-white relative overflow-hidden"
    >
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#D8B46B] opacity-10 rounded-full -mr-24 -mt-24"></div>
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#D8B46B] flex items-center justify-center">
              <Calendar size={20} className="text-[#1E3A32]" />
            </div>
            <h2 className="font-serif text-2xl">Your Next Session</h2>
          </div>
          
          {isPending && (
            <span className="text-xs bg-yellow-500 text-[#1E3A32] px-3 py-1 rounded-full font-medium">
              Awaiting Schedule
            </span>
          )}
          
          {isScheduled && (
            <span className="text-xs bg-green-500 text-white px-3 py-1 rounded-full font-medium">
              Confirmed
            </span>
          )}
        </div>

        {/* Session Details */}
        <div className="space-y-4 mb-6">
          <div>
            <h3 className="text-xl font-medium mb-1">
              {booking.service_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </h3>
            {booking.session_count > 1 && (
              <p className="text-white/70 text-sm">
                Package: {booking.session_count} sessions
              </p>
            )}
          </div>

          {sessionDate && isScheduled ? (
            <>
              <div className="flex items-center gap-3 text-white/90">
                <Calendar size={18} className="text-[#D8B46B]" />
                <span>{format(sessionDate, 'EEEE, MMMM d, yyyy')}</span>
              </div>
              
              <div className="flex items-center gap-3 text-white/90">
                <Clock size={18} className="text-[#D8B46B]" />
                <span>{format(sessionDate, 'h:mm a')}</span>
              </div>
            </>
          ) : (
            <div className="bg-yellow-500/20 border-l-4 border-yellow-500 p-4">
              <p className="text-sm text-white/90">
                Your session is confirmed! Roberta will reach out within 24-48 hours to schedule a time that works for you.
              </p>
            </div>
          )}

          {booking.zoom_status === 'created' && booking.zoom_join_url && (
            <div className="flex items-start gap-3 text-white/90">
              <Video size={18} className="text-[#D8B46B] flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium mb-1">Virtual Session</p>
                <a
                  href={booking.zoom_join_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#D8B46B] hover:text-[#F9F5EF] text-sm underline"
                >
                  Join Zoom Meeting →
                </a>
                {booking.zoom_password && (
                  <p className="text-xs text-white/60 mt-1">
                    Password: {booking.zoom_password}
                  </p>
                )}
              </div>
            </div>
          )}

          {booking.notes && (
            <div className="bg-white/10 p-4 rounded">
              <p className="text-sm text-white/80 italic">
                "{booking.notes}"
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link to={createPageUrl('ClientBookings')} className="flex-1">
            <Button 
              variant="outline" 
              className="w-full bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              View All Bookings
              <ArrowRight size={16} className="ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}