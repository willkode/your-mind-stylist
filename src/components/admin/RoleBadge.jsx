import React from "react";
import { ROLE_LABELS, ROLE_BADGE_CLASSES } from "@/lib/permissions";

export default function RoleBadge({ role = "user", className = "" }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${
        ROLE_BADGE_CLASSES[role] || ROLE_BADGE_CLASSES.user
      } ${className}`}
    >
      {ROLE_LABELS[role] || "User"}
    </span>
  );
}