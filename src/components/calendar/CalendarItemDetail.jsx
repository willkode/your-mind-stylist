import React from "react";
import { format } from "date-fns";
import { Clock, Calendar, User, Globe, UserCheck, ExternalLink } from "lucide-react";
import { getSourceInfo } from "./CalendarItemBadge";

export default function CalendarItemDetail({ item, onClose }) {
  const sourceInfo = getSourceInfo(item);
  
  const formatTime24to12 = (time24) => {
    if (!time24) return '';
    const [h, m] = time24.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${period}`;
  };

  return (
    <div className="p-4 bg-white border border-[#E4D9C4] rounded-lg shadow-lg max-w-sm">
      {/* Source Badge */}
      <div className="flex items-center justify-between mb-3">
        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium text-white ${sourceInfo.badgeBg}`}>
          <sourceInfo.icon size={12} />
          {sourceInfo.label}
        </span>
        <button onClick={onClose} className="text-[#2B2725]/40 hover:text-[#2B2725] text-sm">
          ✕
        </button>
      </div>

      {/* Title */}
      <h4 className="font-medium text-[#1E3A32] mb-3">
        {item.type === 'booking' 
          ? item.user_name 
          : item.reason || 'Blocked Time'}
      </h4>

      {/* Details */}
      <div className="space-y-2 text-sm">
        {/* Date/Time */}
        <div className="flex items-center gap-2 text-[#2B2725]/70">
          <Clock size={14} className="text-[#D8B46B]" />
          {item.type === 'booking' && item.scheduled_date ? (
            <span>{format(new Date(item.scheduled_date), "EEEE, MMMM d 'at' h:mm a")}</span>
          ) : item.type === 'blocked' ? (
            <span>
              {item.specific_date && format(new Date(item.specific_date + 'T12:00:00'), "EEEE, MMMM d")}
              {item.start_time && ` • ${formatTime24to12(item.start_time)} – ${formatTime24to12(item.end_time)}`}
            </span>
          ) : null}
        </div>

        {/* Source-specific details */}
        {item.source === 'calendar_sync' && (
          <div className="flex items-center gap-2 text-[#2B2725]/70">
            <Calendar size={14} className="text-slate-500" />
            <span>From Google Calendar{item.calendar_name ? `: ${item.calendar_name}` : ''}</span>
          </div>
        )}

        {item.type === 'booking' && (
          <>
            <div className="flex items-center gap-2 text-[#2B2725]/70">
              <Globe size={14} className="text-emerald-600" />
              <span>Booked via website</span>
            </div>
            {item.user_email && (
              <div className="flex items-center gap-2 text-[#2B2725]/70">
                <User size={14} className="text-[#A6B7A3]" />
                <span>{item.user_email}</span>
              </div>
            )}
          </>
        )}

        {item.type === 'blocked' && item.source !== 'calendar_sync' && (
          <div className="flex items-center gap-2 text-[#2B2725]/70">
            <UserCheck size={14} className="text-purple-600" />
            <span>Manually blocked in dashboard</span>
          </div>
        )}

        {/* Last updated */}
        {item.updated_date && (
          <div className="pt-2 mt-2 border-t border-[#E4D9C4] text-xs text-[#2B2725]/50">
            Last updated: {format(new Date(item.updated_date), "MMM d, h:mm a")}
          </div>
        )}
      </div>
    </div>
  );
}