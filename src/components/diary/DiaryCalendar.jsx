import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth } from "date-fns";

const MOOD_COLORS = {
  joyful: "#FFD700",
  content: "#A6B7A3",
  calm: "#6E4F7D",
  neutral: "#D8B46B",
  anxious: "#FFA500",
  sad: "#4169E1",
  frustrated: "#DC143C",
  energized: "#FF6347",
  tired: "#708090",
  grateful: "#DAA520",
};

export default function DiaryCalendar({ entries, onDateSelect }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getEntryForDate = (date) => {
    return entries.find((e) =>
      isSameDay(new Date(e.date), date)
    );
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  return (
    <div className="bg-white p-6 rounded-lg">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-serif text-2xl text-[#1E3A32]">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-[#F9F5EF] rounded transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-[#F9F5EF] rounded transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-center text-sm text-[#2B2725]/60 font-medium">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Empty cells for days before month starts */}
        {Array.from({ length: monthStart.getDay() }).map((_, idx) => (
          <div key={`empty-${idx}`} className="aspect-square" />
        ))}

        {/* Days of month */}
        {daysInMonth.map((date) => {
          const entry = getEntryForDate(date);
          const isToday = isSameDay(date, new Date());

          return (
            <button
              key={date.toISOString()}
              onClick={() => onDateSelect(date)}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center transition-all ${
                isToday ? "ring-2 ring-[#1E3A32]" : ""
              } ${entry ? "hover:scale-105" : "hover:bg-[#F9F5EF]"}`}
              style={{
                backgroundColor: entry ? `${MOOD_COLORS[entry.mood]}20` : "transparent",
              }}
            >
              <span
                className={`text-sm ${
                  isToday ? "font-bold text-[#1E3A32]" : "text-[#2B2725]/70"
                }`}
              >
                {format(date, "d")}
              </span>
              {entry && (
                <div
                  className="w-2 h-2 rounded-full mt-1"
                  style={{ backgroundColor: MOOD_COLORS[entry.mood] }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-6 border-t">
        <p className="text-xs text-[#2B2725]/60 mb-3">Mood Legend</p>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(MOOD_COLORS).slice(0, 6).map(([mood, color]) => (
            <div key={mood} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-xs text-[#2B2725]/70 capitalize">{mood}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}