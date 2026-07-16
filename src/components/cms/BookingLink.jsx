import React, { useState } from "react";
import { useBookingUrl } from "./useBookingUrl";
import { useEditMode } from "./EditModeProvider";
import { useCmsText } from "./useCmsText";
import InlineEditor from "./InlineEditor";
import { Pencil } from "lucide-react";

/**
 * Wraps an <a> tag that links to the centralized booking URL (site.booking_url).
 * In CMS edit mode, shows a pencil icon to edit the URL.
 * Children are rendered as the link content (button text, etc.).
 */
export default function BookingLink({ children, className = "", ...props }) {
  const bookingUrl = useBookingUrl();
  const { isEditMode, isManager } = useEditMode();
  const { content, block } = useCmsText("site.booking_url", "https://koalendar.com/u/roberta");
  const [isEditing, setIsEditing] = useState(false);

  return (
    <>
      <span className="relative inline-flex group">
        <a
          href={bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={className}
          {...props}
        >
          {children}
        </a>
        {isManager && isEditMode && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsEditing(true);
            }}
            className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-[#D8B46B] text-white p-1 rounded shadow-lg"
            title="Edit booking URL"
          >
            <Pencil size={10} />
          </button>
        )}
      </span>
      {isEditing && (
        <InlineEditor
          contentKey="site.booking_url"
          blockTitle="Booking URL (e.g. Koalendar link)"
          page="Global"
          initialContent={content}
          contentType="short_text"
          block={block}
          onClose={() => setIsEditing(false)}
        />
      )}
    </>
  );
}