import { useCmsText } from "./useCmsText";

const DEFAULT_BOOKING_URL = "https://koalendar.com/u/roberta";

/**
 * Returns the centralized booking URL from CMS (key: site.booking_url).
 * Roberta can edit this via CMS edit mode on any page that shows a booking button.
 * Falls back to the default Koalendar URL if not set.
 */
export function useBookingUrl() {
  const { content } = useCmsText("site.booking_url", DEFAULT_BOOKING_URL);
  // Strip any HTML tags the CMS might wrap around the URL
  const url = content ? content.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").trim() : DEFAULT_BOOKING_URL;
  return url && url.startsWith("http") ? url : DEFAULT_BOOKING_URL;
}