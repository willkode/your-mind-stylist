import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, startOfWeek, eachWeekOfInterval, subWeeks } from "date-fns";

export default function MasterclassConversionChart({ signups }) {
  // Group by week
  const weeks = eachWeekOfInterval({
    start: subWeeks(new Date(), 11),
    end: new Date()
  });

  const chartData = weeks.map(weekStart => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    const weekSignups = signups.filter(s => {
      const signupDate = new Date(s.signup_date || s.created_date);
      return signupDate >= weekStart && signupDate < weekEnd;
    });

    const watched = weekSignups.filter(s => s.watched).length;
    const converted = weekSignups.filter(s => s.converted_to).length;

    return {
      week: format(weekStart, "MMM d"),
      signups: weekSignups.length,
      watched: watched,
      converted: converted
    };
  });

  return (
    <div className="bg-white p-6 shadow-md">
      <h3 className="font-serif text-xl text-[#1E3A32] mb-6">Funnel Performance</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E4D9C4" />
          <XAxis 
            dataKey="week" 
            stroke="#2B2725"
            style={{ fontSize: '12px' }}
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
          <Legend />
          <Bar dataKey="signups" fill="#6E4F7D" name="Signups" />
          <Bar dataKey="watched" fill="#2D8CFF" name="Watched" />
          <Bar dataKey="converted" fill="#A6B7A3" name="Converted" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}