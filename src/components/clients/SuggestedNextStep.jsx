import React from "react";
import { Lightbulb } from "lucide-react";

export default function SuggestedNextStep({ personStatus, userData, bookings = [], whatBought, enrollments = [] }) {
  let suggestion = null;

  if (!userData && personStatus !== "invite_pending") {
    suggestion = "Send invite so they can create their account";
  } else if (personStatus === "invite_pending") {
    suggestion = "Invite sent — waiting for them to set up their account. You can resend if needed.";
  } else if (userData && bookings.length === 0) {
    suggestion = "Schedule first session";
  } else if (userData && whatBought && enrollments.length === 0) {
    suggestion = "Enroll in purchased program";
  } else if (userData && !whatBought && bookings.length > 0) {
    suggestion = "Follow up about programs or products";
  }

  if (!suggestion) return null;

  return (
    <div className="bg-[#D8B46B]/10 border border-[#D8B46B]/30 rounded-lg p-3 flex items-start gap-2.5">
      <Lightbulb size={15} className="text-[#D8B46B] flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-xs font-semibold text-[#2B2725]/60 uppercase tracking-wider mb-0.5">Suggested next step</p>
        <p className="text-sm text-[#1E3A32]">{suggestion}</p>
      </div>
    </div>
  );
}