import React, { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

const IDENTITY_COLORS = {
  "The Grounded One": { bg: "bg-[#A6B7A3]", hex: "#A6B7A3", label: "Grounded" },
  "The Performer":    { bg: "bg-[#D8B46B]", hex: "#D8B46B", label: "Performer" },
  "The Old Pattern":  { bg: "bg-[#B0AAA4]", hex: "#B0AAA4", label: "Old Pattern" },
};
const CUSTOM_COLOR = { bg: "bg-[#6E4F7D]", hex: "#6E4F7D", label: "Custom" };

function getColorForCheckIn(checkIn) {
  if (!checkIn) return null;
  if (checkIn.identity_name && IDENTITY_COLORS[checkIn.identity_name]) {
    return IDENTITY_COLORS[checkIn.identity_name];
  }
  if (checkIn.identity_name) return CUSTOM_COLOR;
  return { bg: "bg-[#E4D9C4]", hex: "#E4D9C4", label: "No identity" };
}

export default function StyleCalendar({ checkIns, identities }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tooltip, setTooltip] = useState(null);

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const startPad = getDay(startOfMonth(currentMonth)); // 0=Sun

  // Map check-ins by date string
  const checkInMap = {};
  checkIns.forEach(ci => {
    const key = format(new Date(ci.created_date), "yyyy-MM-dd");
    if (!checkInMap[key]) checkInMap[key] = ci;
  });

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))} className="p-1 rounded hover:bg-[#F9F5EF] transition-colors">
          <ChevronLeft size={18} />
        </button>
        <span className="font-serif text-[#1E3A32] font-medium">{format(currentMonth, "MMMM yyyy")}</span>
        <button onClick={() => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))} className="p-1 rounded hover:bg-[#F9F5EF] transition-colors">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-2">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
          <div key={d} className="text-center text-[10px] text-[#2B2725]/40 font-medium py-1">{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
        {days.map(day => {
          const key = format(day, "yyyy-MM-dd");
          const ci = checkInMap[key];
          const color = getColorForCheckIn(ci);
          return (
            <div
              key={key}
              className="relative flex items-center justify-center aspect-square rounded-lg cursor-pointer"
              onMouseEnter={() => ci && setTooltip({ day, ci })}
              onMouseLeave={() => setTooltip(null)}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all ${
                color ? `${color.bg} text-white font-medium` : "text-[#2B2725]/40 hover:bg-[#F9F5EF]"
              }`}>
                {format(day, "d")}
              </div>
              {/* Tooltip */}
              {tooltip && isSameDay(tooltip.day, day) && (
                <div className="absolute z-10 bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#1E3A32] text-white text-xs rounded-lg p-2 whitespace-nowrap shadow-lg">
                  <div className="font-medium">{tooltip.ci.identity_name || "No outfit"}</div>
                  {tooltip.ci.voice_tone && <div className="opacity-70 capitalize">{tooltip.ci.voice_tone} voice</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-[#E4D9C4] flex flex-wrap gap-3">
        {Object.entries(IDENTITY_COLORS).map(([name, color]) => (
          <div key={name} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-full ${color.bg}`} />
            <span className="text-[10px] text-[#2B2725]/60">{name}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#6E4F7D]" />
          <span className="text-[10px] text-[#2B2725]/60">Custom identity</span>
        </div>
      </div>
    </div>
  );
}