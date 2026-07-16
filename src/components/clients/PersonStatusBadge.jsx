import React from "react";
import { Badge } from "@/components/ui/badge";
import { UserCheck, Mail, Clock, UserPlus, GraduationCap, UserX, Archive } from "lucide-react";

const STATUS_CONFIG = {
  active_user: {
    label: "Active Client",
    icon: UserCheck,
    className: "bg-green-100 text-green-800",
  },
  enrolled: {
    label: "Enrolled",
    icon: GraduationCap,
    className: "bg-emerald-100 text-emerald-800",
  },
  inactive: {
    label: "Inactive",
    icon: UserX,
    className: "bg-gray-200 text-gray-600",
  },
  archived: {
    label: "Archived",
    icon: Archive,
    className: "bg-gray-100 text-gray-500",
  },
  invite_pending: {
    label: "Invited Customer — Awaiting Setup",
    icon: Clock,
    className: "bg-amber-100 text-amber-800",
  },
  lead: {
    label: "Lead",
    icon: UserPlus,
    className: "bg-purple-100 text-purple-800",
  },
};

/**
 * Determines person status:
 * - active_user: has a User record (accepted invite, account active)
 * - enrolled: active user with enrollments
 * - invite_pending: lead was converted/invited but has NOT created account yet
 * - lead: CRM contact only, no invite sent
 */
export function getPersonStatus({ user, lead, enrollments }) {
  if (user?.account_status === "archived") return "archived";
  if (user?.account_status === "inactive") return "inactive";
  if (user && enrollments && enrollments.length > 0) return "enrolled";
  if (user) return "active_user";
  // Use invite_status if available, fallback to legacy converted_to_client check
  if (lead?.invite_status === "invited" || lead?.converted_to_client || lead?.user_id) return "invite_pending";
  return "lead";
}

export default function PersonStatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.lead;
  const Icon = config.icon;

  return (
    <Badge className={`${config.className} gap-1.5 font-medium text-xs px-2.5 py-1`}>
      <Icon size={13} />
      {config.label}
    </Badge>
  );
}