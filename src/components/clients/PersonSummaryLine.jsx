import React from "react";

const STATUS_LABELS = {
  active_user: "Active client",
  enrolled: "Enrolled",
  invite_pending: "Invite sent — waiting for setup",
  lead: "Lead",
};

export default function PersonSummaryLine({ personStatus, bookings = [], whatBought, purchasedProducts = [] }) {
  const statusLabel = STATUS_LABELS[personStatus] || "Lead";

  // Purchase state — prefer actual product records, fallback to lead text
  let purchaseState;
  if (purchasedProducts.length > 0) {
    purchaseState = `${purchasedProducts.length} purchase${purchasedProducts.length > 1 ? "s" : ""}`;
  } else if (whatBought) {
    purchaseState = `Purchased ${whatBought.split(",")[0].trim()}`;
  } else {
    purchaseState = "No purchases yet";
  }

  // Booking state
  const now = new Date();
  const upcoming = bookings.filter(
    (b) => b.scheduled_date && new Date(b.scheduled_date) > now && b.booking_status !== "cancelled"
  );
  const completed = bookings.filter((b) => b.booking_status === "completed");

  let bookingState;
  if (bookings.length === 0) {
    bookingState = "No bookings yet";
  } else if (upcoming.length > 0) {
    bookingState = `${upcoming.length} upcoming session${upcoming.length > 1 ? "s" : ""}`;
  } else if (completed.length > 0) {
    bookingState = `${completed.length} completed session${completed.length > 1 ? "s" : ""}`;
  } else {
    bookingState = `${bookings.length} booking${bookings.length > 1 ? "s" : ""}`;
  }

  return (
    <p className="text-sm text-[#2B2725]/70 mt-1.5">
      {statusLabel} <span className="text-[#2B2725]/30 mx-1">•</span> {purchaseState} <span className="text-[#2B2725]/30 mx-1">•</span> {bookingState}
    </p>
  );
}