import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, startOfDay, eachDayOfInterval, subDays } from "date-fns";

export default function RevenueChart({ bookings }) {
  // Group bookings by day and calculate revenue
  const revenueByDay = {};
  
  bookings
    .filter(b => b.payment_status === 'paid')
    .forEach((booking) => {
      const day = format(startOfDay(new Date(booking.created_date)), "yyyy-MM-dd");
      if (!revenueByDay[day]) {
        revenueByDay[day] = 0;
      }
      revenueByDay[day] += booking.amount || 0;
    });

  // Create chart data for last 30 days
  const days = eachDayOfInterval({
    start: subDays(new Date(), 29),
    end: new Date()
  });

  const chartData = days.map(day => {
    const dateKey = format(day, "yyyy-MM-dd");
    return {
      date: format(day, "MMM d"),
      revenue: (revenueByDay[dateKey] || 0) / 100
    };
  });

  return (
    <div className="bg-white p-6 shadow-md">
      <h3 className="font-serif text-xl text-[#1E3A32] mb-6">Revenue Trend</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E4D9C4" />
          <XAxis 
            dataKey="date" 
            stroke="#2B2725"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#2B2725"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip 
            formatter={(value) => [`$${value.toFixed(2)}`, 'Revenue']}
            contentStyle={{
              backgroundColor: '#F9F5EF',
              border: '1px solid #E4D9C4',
              borderRadius: '4px'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="revenue" 
            stroke="#D8B46B" 
            strokeWidth={2}
            dot={{ fill: '#D8B46B', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}