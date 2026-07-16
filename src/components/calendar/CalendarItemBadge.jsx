import React from "react";
import { Calendar, Globe, UserCheck } from "lucide-react";
import { getCalendarColor, SOURCE_COLORS } from "./calendarColors";

export function getSourceInfo(item) {
  // Website booking
  if (item.type === 'booking') {
    const c = SOURCE_COLORS.booking;
    return {
      source: 'booking',
      label: c.label,
      icon: Globe,
      bgClass: c.bg,
      textClass: c.text,
      borderClass: c.border,
      badgeBg: c.badge,
    };
  }
  
  // Blocked time
  if (item.type === 'blocked') {
    if (item.source === 'calendar_sync') {
      // Use per-calendar colors if calendar_name is available
      const calName = item.calendar_name;
      const c = getCalendarColor(calName);
      return {
        source: 'google',
        calendarName: calName,
        label: calName || c.label,
        icon: Calendar,
        bgClass: c.bg,
        textClass: c.text,
        borderClass: c.border,
        badgeBg: c.badge,
      };
    }
    const c = SOURCE_COLORS.manual;
    return {
      source: 'manual',
      label: c.label,
      icon: UserCheck,
      bgClass: c.bg,
      textClass: c.text,
      borderClass: c.border,
      badgeBg: c.badge,
    };
  }

  return {
    source: 'unknown',
    label: 'Unknown',
    icon: Calendar,
    bgClass: 'bg-gray-100',
    textClass: 'text-gray-700',
    borderClass: 'border-gray-300',
    badgeBg: 'bg-gray-500',
  };
}

export default function CalendarItemBadge({ item, size = "sm" }) {
  const { label, icon: Icon, badgeBg } = getSourceInfo(item);

  if (size === "xs") {
    return (
      <span className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-medium text-white ${badgeBg}`}>
        <Icon size={8} />
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-white ${badgeBg}`}>
      <Icon size={10} />
      <span>{label}</span>
    </span>
  );
}