import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function PopularServices({ bookings, appointmentTypes }) {
  // Count bookings by service type
  const serviceCounts = {};
  
  bookings.forEach((booking) => {
    const serviceType = booking.service_type || 'other';
    if (!serviceCounts[serviceType]) {
      serviceCounts[serviceType] = { count: 0, revenue: 0 };
    }
    serviceCounts[serviceType].count += 1;
    if (booking.payment_status === 'paid') {
      serviceCounts[serviceType].revenue += booking.amount || 0;
    }
  });

  // Get service names from appointment types
  const getServiceName = (serviceType) => {
    const apt = appointmentTypes.find(a => a.service_type === serviceType);
    return apt?.name || serviceType.replace(/_/g, ' ').toUpperCase();
  };

  // Create chart data
  const chartData = Object.entries(serviceCounts)
    .map(([serviceType, data]) => ({
      name: getServiceName(serviceType),
      bookings: data.count,
      revenue: data.revenue / 100
    }))
    .sort((a, b) => b.bookings - a.bookings)
    .slice(0, 5);

  return (
    <div className="bg-white p-6 shadow-md">
      <h3 className="font-serif text-xl text-[#1E3A32] mb-6">Popular Services</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E4D9C4" />
          <XAxis 
            dataKey="name" 
            stroke="#2B2725"
            style={{ fontSize: '11px' }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            stroke="#2B2725"
            style={{ fontSize: '12px' }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#F9F5EF',
              border: '1px solid #E4D9C4',
              borderRadius: '4px'
            }}
          />
          <Bar dataKey="bookings" fill="#A6B7A3" />
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-4 space-y-2">
        {chartData.map((item, idx) => (
          <div key={idx} className="flex justify-between text-sm">
            <span className="text-[#2B2725]/70">{item.name}</span>
            <span className="text-[#1E3A32] font-medium">
              {item.bookings} bookings • ${item.revenue.toFixed(0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}