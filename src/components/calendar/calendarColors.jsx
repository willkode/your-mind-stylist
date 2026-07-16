/**
 * Calendar Color Configuration
 * 
 * Maps Google Calendar names and source types to display colors.
 * Update the CALENDAR_COLORS map when Roberta provides her preferred colors.
 * 
 * Each entry: { bg, text, border, badge, label }
 * - bg: background class for calendar cells
 * - text: text color class
 * - border: border color class  
 * - badge: badge background class (for small indicator dots)
 * - label: display name shown in filters and tooltips
 */

// Per-Google-Calendar color map
// Keys should match the calendar summary names from Google Calendar API
// TODO: Update colors once Roberta provides her preferred color scheme
const CALENDAR_COLORS = {
  "Roberta": {
    bg: "bg-blue-100",
    text: "text-blue-700",
    border: "border-blue-300",
    badge: "bg-blue-500",
    label: "Roberta",
  },
  "yourmindstylist@gmail.com": {
    bg: "bg-indigo-100",
    text: "text-indigo-700",
    border: "border-indigo-300",
    badge: "bg-indigo-500",
    label: "YourMindStylist",
  },
  "farehypnosis@gmail.com": {
    bg: "bg-teal-100",
    text: "text-teal-700",
    border: "border-teal-300",
    badge: "bg-teal-500",
    label: "Fare Hypnosis",
  },
  "Family": {
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-300",
    badge: "bg-amber-500",
    label: "Family",
  },
};

// Default for unknown/new calendars
const DEFAULT_CALENDAR_COLOR = {
  bg: "bg-slate-100",
  text: "text-slate-700",
  border: "border-slate-300",
  badge: "bg-slate-500",
  label: "Google Calendar",
};

// Non-Google source colors (website bookings, manual blocks)
export const SOURCE_COLORS = {
  booking: {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    border: "border-emerald-300",
    badge: "bg-emerald-500",
    label: "Website Booking",
  },
  manual: {
    bg: "bg-purple-100",
    text: "text-purple-700",
    border: "border-purple-300",
    badge: "bg-purple-500",
    label: "Manual Block",
  },
  available: {
    bg: "bg-[#D8B46B]/10",
    text: "text-[#1E3A32]/70",
    border: "border-[#D8B46B]/30",
    badge: "bg-[#D8B46B]",
    label: "Available Hours",
  },
};

/**
 * Get color config for a Google Calendar by name
 */
export function getCalendarColor(calendarName) {
  if (!calendarName) return DEFAULT_CALENDAR_COLOR;
  return CALENDAR_COLORS[calendarName] || DEFAULT_CALENDAR_COLOR;
}

/**
 * Get all known calendar names (for building filter UI)
 */
export function getKnownCalendars() {
  return Object.entries(CALENDAR_COLORS).map(([key, val]) => ({
    key,
    ...val,
  }));
}

export default CALENDAR_COLORS;