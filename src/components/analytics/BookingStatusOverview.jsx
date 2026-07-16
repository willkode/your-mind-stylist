import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

export default function BookingStatusOverview({ bookings }) {
  // Count bookings by status
  const statusCounts = {};
  
  bookings.forEach((booking) => {
    const status = booking.booking_status || 'pending';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  const chartData = Object.entries(statusCounts).map(([status, count]) => ({
    name: status.replace(/_/g, ' ').toUpperCase(),
    value: count,
    status: status
  }));

  const COLORS = {
    pending_payment: '#F59E0B',
    confirmed: '#10B981',
    scheduled: '#3B82F6',
    completed: '#6B7280',
    cancelled: '#EF4444',
    expired: '#9CA3AF'
  };

  const upcomingSessions = bookings.filter(
    b => b.scheduled_date && new Date(b.scheduled_date) > new Date() && 
    ['confirmed', 'scheduled'].includes(b.booking_status)
  ).length;

  const completedSessions = bookings.filter(
    b => b.booking_status === 'completed'
  ).length;

  return (
    <div className="bg-white p-6 shadow-md">
      <h3 className="font-serif text-xl text-[#1E3A32] mb-6">Booking Status</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-[#F9F5EF] p-4">
          <div className="text-2xl font-serif text-[#1E3A32] mb-1">{upcomingSessions}</div>
          <div className="text-sm text-[#2B2725]/70">Upcoming Sessions</div>
        </div>
        <div className="bg-[#F9F5EF] p-4">
          <div className="text-2xl font-serif text-[#1E3A32] mb-1">{completedSessions}</div>
          <div className="text-sm text-[#2B2725]/70">Completed Sessions</div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, value }) => `${name}: ${value}`}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.status] || '#A6B7A3'} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{
              backgroundColor: '#F9F5EF',
              border: '1px solid #E4D9C4',
              borderRadius: '4px'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}