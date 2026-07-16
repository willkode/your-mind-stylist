import React from "react";
import { Users, UserCheck, UserX, Repeat } from "lucide-react";

export default function ClientMetrics({ bookings }) {
  // Get unique clients
  const uniqueClients = new Set(bookings.map(b => b.user_email)).size;

  // Calculate returning clients (clients with more than 1 booking)
  const clientBookingCounts = {};
  bookings.forEach(booking => {
    const email = booking.user_email;
    clientBookingCounts[email] = (clientBookingCounts[email] || 0) + 1;
  });

  const returningClients = Object.values(clientBookingCounts).filter(count => count > 1).length;
  const retentionRate = uniqueClients > 0 
    ? ((returningClients / uniqueClients) * 100).toFixed(1) 
    : 0;

  // Calculate cancellation metrics
  const totalPaidBookings = bookings.filter(b => b.payment_status === 'paid').length;
  const cancelledBookings = bookings.filter(b => b.booking_status === 'cancelled').length;
  const cancellationRate = totalPaidBookings > 0 
    ? ((cancelledBookings / totalPaidBookings) * 100).toFixed(1) 
    : 0;

  // Get top clients
  const topClients = Object.entries(clientBookingCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="bg-white p-6 shadow-md">
      <h3 className="font-serif text-xl text-[#1E3A32] mb-6">Client Insights</h3>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-[#6E4F7D]" />
          <div>
            <div className="text-2xl font-serif text-[#1E3A32]">{uniqueClients}</div>
            <div className="text-sm text-[#2B2725]/70">Total Clients</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Repeat className="w-8 h-8 text-[#A6B7A3]" />
          <div>
            <div className="text-2xl font-serif text-[#1E3A32]">{returningClients}</div>
            <div className="text-sm text-[#2B2725]/70">Returning</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <UserCheck className="w-8 h-8 text-green-600" />
          <div>
            <div className="text-2xl font-serif text-[#1E3A32]">{retentionRate}%</div>
            <div className="text-sm text-[#2B2725]/70">Retention Rate</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <UserX className="w-8 h-8 text-red-600" />
          <div>
            <div className="text-2xl font-serif text-[#1E3A32]">{cancellationRate}%</div>
            <div className="text-sm text-[#2B2725]/70">Cancellation Rate</div>
          </div>
        </div>
      </div>

      <div className="border-t border-[#E4D9C4] pt-4">
        <h4 className="text-sm font-medium text-[#1E3A32] mb-3">Top Clients</h4>
        <div className="space-y-2">
          {topClients.map(([email, count], idx) => (
            <div key={idx} className="flex justify-between items-center text-sm">
              <span className="text-[#2B2725]/70 truncate flex-1 mr-2">{email}</span>
              <span className="text-[#1E3A32] font-medium">{count} bookings</span>
            </div>
          ))}
          {topClients.length === 0 && (
            <p className="text-sm text-[#2B2725]/50 text-center py-4">No client data yet</p>
          )}
        </div>
      </div>
    </div>
  );
}