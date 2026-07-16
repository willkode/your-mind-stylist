import React from "react";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, CreditCard, XCircle, Video } from "lucide-react";
import { format } from "date-fns";

const STATUS_LABELS = {
  pending_payment: "Pending Payment",
  confirmed: "Confirmed",
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
  expired: "Expired",
};

const STATUS_COLORS = {
  confirmed: "bg-green-100 text-green-800",
  scheduled: "bg-blue-100 text-blue-800",
  completed: "bg-gray-100 text-gray-700",
  cancelled: "bg-red-100 text-red-700",
  pending_payment: "bg-yellow-100 text-yellow-800",
  expired: "bg-gray-100 text-gray-500",
};

const PAYMENT_LABELS = {
  paid: "Paid",
  pending: "Pending",
  failed: "Failed",
  refunded: "Refunded",
  not_required: "N/A",
};

function formatServiceType(type) {
  if (!type) return "Session";
  return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

function BookingRow({ booking }) {
  const isCancelled = booking.booking_status === "cancelled";
  const hasZoom = !!booking.zoom_join_url;

  return (
    <div className={`p-2.5 rounded-lg ${isCancelled ? "bg-red-50/50" : "bg-[#F9F5EF]"}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-medium text-[#1E3A32] truncate">
              {formatServiceType(booking.service_type)}
            </p>
            {hasZoom && <Video size={12} className="text-blue-500 flex-shrink-0" />}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-[#2B2725]/50 mt-0.5">
            <span>
              {booking.scheduled_date
                ? format(new Date(booking.scheduled_date), "MMM d, yyyy 'at' h:mm a")
                : format(new Date(booking.created_date), "MMM d, yyyy")}
            </span>
            {booking.payment_status && booking.payment_status !== "not_required" && (
              <>
                <span>·</span>
                <span className={booking.payment_status === "paid" ? "text-green-600" : booking.payment_status === "failed" ? "text-red-600" : ""}>
                  {PAYMENT_LABELS[booking.payment_status] || booking.payment_status}
                </span>
              </>
            )}
          </div>
        </div>
        <Badge className={`text-[10px] flex-shrink-0 ${STATUS_COLORS[booking.booking_status] || "bg-gray-100 text-gray-600"}`}>
          {STATUS_LABELS[booking.booking_status] || booking.booking_status}
        </Badge>
      </div>
      {isCancelled && booking.cancellation_reason && (
        <div className="flex items-start gap-1.5 mt-1.5 ml-0.5">
          <XCircle size={11} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-red-600/70 leading-tight">{booking.cancellation_reason}</p>
        </div>
      )}
    </div>
  );
}

function GroupLabel({ icon: Icon, label, count, className }) {
  return (
    <div className={`flex items-center gap-2 mb-1.5 ${className || ""}`}>
      <Icon size={13} className="flex-shrink-0" />
      <span className="text-[11px] font-semibold uppercase tracking-[0.1em]">{label}</span>
      <span className="text-[10px] text-[#2B2725]/40">({count})</span>
    </div>
  );
}

export default function PersonBookingHistory({ bookings = [] }) {
  if (bookings.length === 0) {
    return <p className="text-sm text-[#2B2725]/40 italic">No bookings yet</p>;
  }

  const now = new Date();
  const upcoming = [];
  const past = [];
  const cancelled = [];

  for (const b of bookings) {
    if (b.booking_status === "cancelled" || b.booking_status === "expired") {
      cancelled.push(b);
    } else if (b.scheduled_date && new Date(b.scheduled_date) > now) {
      upcoming.push(b);
    } else {
      past.push(b);
    }
  }

  // Sort upcoming ascending (soonest first), past descending (most recent first)
  upcoming.sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));
  past.sort((a, b) => new Date(b.scheduled_date || b.created_date) - new Date(a.scheduled_date || a.created_date));
  cancelled.sort((a, b) => new Date(b.cancelled_at || b.created_date) - new Date(a.cancelled_at || a.created_date));

  return (
    <div className="space-y-4">
      {upcoming.length > 0 && (
        <div>
          <GroupLabel icon={Calendar} label="Upcoming" count={upcoming.length} className="text-green-700" />
          <div className="space-y-1.5">
            {upcoming.map((b) => <BookingRow key={b.id} booking={b} />)}
          </div>
        </div>
      )}
      {past.length > 0 && (
        <div>
          <GroupLabel icon={Clock} label="Past" count={past.length} className="text-[#2B2725]/60" />
          <div className="space-y-1.5">
            {past.slice(0, 10).map((b) => <BookingRow key={b.id} booking={b} />)}
            {past.length > 10 && (
              <p className="text-xs text-[#2B2725]/40 text-center">+{past.length - 10} more</p>
            )}
          </div>
        </div>
      )}
      {cancelled.length > 0 && (
        <div>
          <GroupLabel icon={XCircle} label="Cancelled" count={cancelled.length} className="text-red-500/70" />
          <div className="space-y-1.5">
            {cancelled.slice(0, 5).map((b) => <BookingRow key={b.id} booking={b} />)}
            {cancelled.length > 5 && (
              <p className="text-xs text-[#2B2725]/40 text-center">+{cancelled.length - 5} more</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}