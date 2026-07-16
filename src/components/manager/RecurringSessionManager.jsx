import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";

export default function RecurringSessionManager({ booking }) {
  const queryClient = useQueryClient();
  const [showDetails, setShowDetails] = useState(false);

  // Fetch all bookings in the recurring series
  const { data: seriesBookings = [] } = useQuery({
    queryKey: ["recurring-series", booking.recurring_series_id],
    queryFn: () => base44.entities.Booking.filter({ 
      recurring_series_id: booking.recurring_series_id 
    }),
    enabled: !!booking.is_recurring && !!booking.recurring_series_id
  });

  // Cancel entire series
  const cancelSeriesMutation = useMutation({
    mutationFn: async () => {
      const cancelPromises = seriesBookings
        .filter(b => b.booking_status !== "cancelled" && b.booking_status !== "completed")
        .map(b => base44.functions.invoke("cancelBooking", { 
          booking_id: b.id,
          reason: "Series cancelled by manager"
        }));
      await Promise.all(cancelPromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-series"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    }
  });

  if (!booking.is_recurring) {
    return null;
  }

  const upcomingSessions = seriesBookings
    .filter(b => new Date(b.scheduled_date) >= new Date() && b.booking_status !== "cancelled")
    .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));

  const completedSessions = seriesBookings.filter(b => b.booking_status === "completed").length;
  const totalSessions = seriesBookings.length;

  return (
    <>
      <Card className="p-6 border-l-4 border-[#6E4F7D]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <RefreshCw size={24} className="text-[#6E4F7D]" />
            <div>
              <h3 className="font-medium text-[#1E3A32]">Recurring Session Series</h3>
              <p className="text-sm text-[#2B2725]/60">
                {booking.recurrence_frequency} • {completedSessions}/{totalSessions} completed
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetails(true)}
          >
            View All Sessions
          </Button>
        </div>

        <div className="space-y-2">
          {upcomingSessions.slice(0, 3).map((session) => (
            <div key={session.id} className="flex items-center justify-between bg-[#F9F5EF] p-3 rounded">
              <div className="flex items-center gap-3">
                <Calendar size={16} className="text-[#D8B46B]" />
                <div>
                  <p className="text-sm font-medium text-[#1E3A32]">
                    {format(new Date(session.scheduled_date), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>
              <Badge variant={
                session.booking_status === "confirmed" ? "default" : "secondary"
              }>
                {session.booking_status}
              </Badge>
            </div>
          ))}
          {upcomingSessions.length > 3 && (
            <p className="text-xs text-[#2B2725]/60 text-center pt-2">
              +{upcomingSessions.length - 3} more sessions
            </p>
          )}
        </div>

        {upcomingSessions.length > 0 && (
          <Button
            variant="outline"
            className="w-full mt-4 text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => {
              if (confirm(`Cancel all ${upcomingSessions.length} upcoming sessions in this series?`)) {
                cancelSeriesMutation.mutate();
              }
            }}
            disabled={cancelSeriesMutation.isPending}
          >
            <XCircle size={16} className="mr-2" />
            Cancel Entire Series
          </Button>
        )}
      </Card>

      {/* All Sessions Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>All Sessions in Series</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3">
            {seriesBookings
              .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date))
              .map((session, index) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 bg-[#F9F5EF] rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#D8B46B]/20 flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-[#1E3A32]">
                      {format(new Date(session.scheduled_date), "EEEE, MMMM d, yyyy")}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-[#2B2725]/70 mt-1">
                      <Clock size={14} />
                      {format(new Date(session.scheduled_date), "h:mm a")}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {session.booking_status === "completed" && (
                    <CheckCircle size={20} className="text-green-600" />
                  )}
                  {session.booking_status === "cancelled" && (
                    <XCircle size={20} className="text-red-600" />
                  )}
                  <Badge variant={
                    session.booking_status === "confirmed" ? "default" :
                    session.booking_status === "completed" ? "secondary" :
                    "outline"
                  }>
                    {session.booking_status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t mt-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-[#1E3A32]">{totalSessions}</p>
                <p className="text-sm text-[#2B2725]/60">Total Sessions</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{completedSessions}</p>
                <p className="text-sm text-[#2B2725]/60">Completed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#D8B46B]">{upcomingSessions.length}</p>
                <p className="text-sm text-[#2B2725]/60">Upcoming</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}