import React from "react";
import { motion } from "framer-motion";
import { Calendar, Video, Clock, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import BookingActions from "./BookingActions";

export default function UpcomingSessions({ bookings, onRefresh }) {
  if (!bookings || bookings.length === 0) {
    return (
      <div className="bg-white p-8 text-center">
        <Calendar size={48} className="text-[#2B2725]/20 mx-auto mb-4" />
        <p className="text-[#2B2725]/60">No upcoming sessions scheduled</p>
      </div>
    );
  }

  const getStatusColor = (status) => {
    const colors = {
      confirmed: 'bg-[#A6B7A3]/30 text-[#1E3A32]',
      scheduled: 'bg-blue-100 text-blue-800',
      pending_payment: 'bg-[#D8B46B]/30 text-[#1E3A32]',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <motion.div
          key={booking.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-serif text-xl text-[#1E3A32] mb-2">
                {booking.service_type?.replace(/_/g, ' ').toUpperCase()}
              </h3>
              <div className="flex items-center gap-2 text-sm text-[#2B2725]/70">
                <Calendar size={14} />
                {booking.scheduled_date 
                  ? format(new Date(booking.scheduled_date), 'EEEE, MMMM d, yyyy')
                  : 'Date to be scheduled'}
              </div>
              {booking.scheduled_date && (
                <div className="flex items-center gap-2 text-sm text-[#2B2725]/70 mt-1">
                  <Clock size={14} />
                  {format(new Date(booking.scheduled_date), 'h:mm a')}
                </div>
              )}
            </div>
            <Badge className={getStatusColor(booking.booking_status)}>
              {booking.booking_status?.replace(/_/g, ' ')}
            </Badge>
          </div>

          {booking.zoom_join_url && booking.booking_status === 'confirmed' && (
            <div className="bg-[#E8F4FD] p-4 rounded flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Video size={20} className="text-[#2D8CFF]" />
                <div>
                  <p className="text-sm font-medium text-[#1E3A32]">Virtual Session Ready</p>
                  <p className="text-xs text-[#2B2725]/60">Join via Zoom when it's time</p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => window.open(booking.zoom_join_url, '_blank')}
                className="bg-[#2D8CFF] hover:bg-[#1E7BE8] text-white"
              >
                <ExternalLink size={14} className="mr-2" />
                Join Meeting
              </Button>
            </div>
          )}

          {booking.notes && (
            <div className="mt-4 pt-4 border-t border-[#E4D9C4]">
              <p className="text-sm text-[#2B2725]/70">
                <strong className="text-[#1E3A32]">Your Notes:</strong> {booking.notes}
              </p>
            </div>
          )}

          <BookingActions booking={booking} onSuccess={onRefresh} />
        </motion.div>
      ))}
    </div>
  );
}