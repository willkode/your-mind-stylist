import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Video, DollarSign, X, RefreshCw, FileText } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ClientBookings() {
  if (typeof window !== 'undefined') {
    window.__USE_AUTH_LAYOUT = true;
  }

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["myBookings", user?.email],
    queryFn: () => base44.entities.Booking.filter({ user_email: user.email }),
    enabled: !!user,
  });

  const upcomingBookings = bookings.filter(
    b => b.scheduled_date && new Date(b.scheduled_date) > new Date() && b.booking_status !== 'cancelled'
  );

  const pastBookings = bookings.filter(
    b => (b.scheduled_date && new Date(b.scheduled_date) <= new Date()) || b.booking_status === 'completed'
  );

  const cancelledBookings = bookings.filter(b => b.booking_status === 'cancelled');

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

  const formatAmount = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount / 100);
  };

  const handleCancelBooking = async () => {
    setCancelling(true);
    try {
      await base44.functions.invoke('cancelBooking', {
        booking_id: selectedBooking.id,
        cancelled_by: user.email,
        cancellation_reason: cancelReason
      });
      queryClient.invalidateQueries({ queryKey: ["myBookings"] });
      setShowCancelDialog(false);
      setSelectedBooking(null);
      setCancelReason("");
    } catch (error) {
      alert("Failed to cancel booking: " + error.message);
    } finally {
      setCancelling(false);
    }
  };

  const BookingCard = ({ booking }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => setSelectedBooking(booking)}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-serif text-xl text-[#1E3A32] mb-1">
            {booking.service_type?.replace(/_/g, " ")}
          </h3>
          <Badge className={getStatusColor(booking.booking_status)}>
            {booking.booking_status?.replace(/_/g, " ")}
          </Badge>
        </div>
        <div className="text-right">
          <div className="text-2xl font-serif text-[#1E3A32]">
            {formatAmount(booking.amount)}
          </div>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        {booking.scheduled_date && (
          <div className="flex items-center gap-2 text-[#2B2725]/70">
            <Calendar size={16} />
            <span>{format(new Date(booking.scheduled_date), "EEEE, MMMM d, yyyy")}</span>
          </div>
        )}
        {booking.scheduled_date && (
          <div className="flex items-center gap-2 text-[#2B2725]/70">
            <Clock size={16} />
            <span>{format(new Date(booking.scheduled_date), "h:mm a")}</span>
          </div>
        )}
        {booking.zoom_status === 'created' && (
          <div className="flex items-center gap-2 text-blue-600">
            <Video size={16} />
            <span>Virtual Session</span>
          </div>
        )}
        {booking.is_recurring && (
          <div className="flex items-center gap-2 text-[#D8B46B]">
            <RefreshCw size={16} />
            <span>Recurring ({booking.recurrence_frequency})</span>
          </div>
        )}
      </div>
    </motion.div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9F5EF] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A32] mx-auto mb-4"></div>
          <p className="text-[#2B2725]/70">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F5EF] py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="font-serif text-4xl text-[#1E3A32] mb-2">My Bookings</h1>
          <p className="text-[#2B2725]/70">Manage your appointments and sessions</p>
        </div>

        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="upcoming">
              Upcoming ({upcomingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past ({pastBookings.length})
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              Cancelled ({cancelledBookings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            {upcomingBookings.length === 0 ? (
              <div className="text-center py-16 bg-white shadow-md">
                <Calendar size={64} className="mx-auto mb-4 text-[#2B2725]/30" />
                <p className="text-[#2B2725]/70 mb-4">No upcoming bookings</p>
                <Button asChild>
                  <a href="https://koalendar.com/u/roberta" target="_blank" rel="noopener noreferrer">Book a Session</a>
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {upcomingBookings.map(booking => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past">
            {pastBookings.length === 0 ? (
              <div className="text-center py-16 bg-white shadow-md">
                <FileText size={64} className="mx-auto mb-4 text-[#2B2725]/30" />
                <p className="text-[#2B2725]/70">No past bookings</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {pastBookings.map(booking => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="cancelled">
            {cancelledBookings.length === 0 ? (
              <div className="text-center py-16 bg-white shadow-md">
                <X size={64} className="mx-auto mb-4 text-[#2B2725]/30" />
                <p className="text-[#2B2725]/70">No cancelled bookings</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {cancelledBookings.map(booking => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Booking Details Dialog */}
        <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Booking Details</DialogTitle>
            </DialogHeader>
            {selectedBooking && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <Badge className={getStatusColor(selectedBooking.booking_status)}>
                    {selectedBooking.booking_status?.replace(/_/g, " ")}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Calendar size={16} className="text-[#D8B46B]" />
                    <div>
                      <div className="text-sm text-[#2B2725]/60">Date & Time</div>
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
                      <div className="text-sm text-[#2B2725]/60">Amount Paid</div>
                      <div className="font-medium text-[#1E3A32]">{formatAmount(selectedBooking.amount)}</div>
                    </div>
                  </div>
                </div>

                {selectedBooking.zoom_status === 'created' && selectedBooking.zoom_join_url && (
                  <div className="bg-[#E8F4FD] p-4 border border-[#2D8CFF]">
                    <div className="flex items-center gap-2 mb-3">
                      <Video size={18} className="text-[#2D8CFF]" />
                      <h3 className="font-medium text-[#1E3A32]">Join Your Session</h3>
                    </div>
                    <Button asChild className="w-full">
                      <a href={selectedBooking.zoom_join_url} target="_blank" rel="noopener noreferrer">
                        Join Zoom Meeting
                      </a>
                    </Button>
                    {selectedBooking.zoom_password && (
                      <p className="text-xs text-center mt-2">
                        Password: <code className="bg-white px-2 py-1">{selectedBooking.zoom_password}</code>
                      </p>
                    )}
                  </div>
                )}

                {selectedBooking.session_notes && (
                  <div className="bg-[#F9F5EF] p-4 border-l-4 border-[#D8B46B]">
                    <div className="text-sm text-[#2B2725]/60 mb-2">Session Notes:</div>
                    <p className="text-[#2B2725]">{selectedBooking.session_notes}</p>
                  </div>
                )}

                {selectedBooking.booking_status === 'confirmed' && selectedBooking.can_cancel && (
                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      variant="destructive"
                      onClick={() => setShowCancelDialog(true)}
                      className="flex-1"
                    >
                      Cancel Booking
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Cancel Confirmation Dialog */}
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel Booking</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-[#2B2725]/70">
                Are you sure you want to cancel this booking? This action cannot be undone.
              </p>
              <div>
                <label className="text-sm text-[#2B2725]/70 mb-2 block">
                  Reason for cancellation (optional)
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full border border-[#E4D9C4] p-3 rounded"
                  rows={3}
                  placeholder="Let us know why you're cancelling..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                Keep Booking
              </Button>
              <Button variant="destructive" onClick={handleCancelBooking} disabled={cancelling}>
                {cancelling ? "Cancelling..." : "Cancel Booking"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}