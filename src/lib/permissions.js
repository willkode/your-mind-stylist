// ============================================================
// CENTRAL PERMISSION SYSTEM
// Single source of truth for roles, hierarchy, and page access.
// Role hierarchy: owner > admin > manager > support_staff > user
// Effective role = custom_role (if staff) else built-in role.
// ============================================================

export const ROLE_RANKS = {
  owner: 4,
  admin: 3,
  manager: 2,
  support_staff: 1,
  user: 0,
};

export const STAFF_ROLES = ["owner", "admin", "manager", "support_staff"];

export const ROLE_LABELS = {
  owner: "Owner",
  admin: "Admin",
  manager: "Manager",
  support_staff: "Support Staff",
  user: "User",
};

// Literal Tailwind classes (never built dynamically)
export const ROLE_BADGE_CLASSES = {
  owner: "bg-[#6E4F7D] text-white",
  admin: "bg-[#1E3A32] text-white",
  manager: "bg-[#D8B46B] text-[#1E3A32]",
  support_staff: "bg-[#A6B7A3] text-[#1E3A32]",
  user: "bg-[#E4D9C4] text-[#2B2725]",
};

export function getEffectiveRole(user) {
  if (!user) return "user";
  if (STAFF_ROLES.includes(user.custom_role)) return user.custom_role;
  return user.role === "admin" ? "admin" : "user";
}

export function hasMinRole(user, minRole) {
  return ROLE_RANKS[getEffectiveRole(user)] >= (ROLE_RANKS[minRole] ?? 0);
}

export function isStaff(user) {
  return hasMinRole(user, "support_staff");
}

// ------------------------------------------------------------
// Page access map — checked centrally in AuthLayout.
// ------------------------------------------------------------

// Pages that match staff patterns but are actually for regular users
const USER_LEVEL_EXCEPTIONS = ["StudioAudio", "StudioNotes"];

// Support-related record pages accessible to support_staff and above
const SUPPORT_STAFF_PAGES = [
  "ManagerBookings",
  "ManagerAppointments",
  "ManagerWaitingList",
  "ManagerIntakeReview",
  "ManagerCalendar",
];

// Manager-level pages that don't match the naming patterns
const MANAGER_PAGES = [
  "ClientsHub",
  "KajabiImport",
  "ContentStudio",
  "CourseBuilder",
  "CoursePreview",
];

/**
 * Minimum role required to view a page. Returns null for public/user pages.
 */
export function getPageMinRole(pageName) {
  if (!pageName) return null;
  if (USER_LEVEL_EXCEPTIONS.includes(pageName)) return null;
  if (SUPPORT_STAFF_PAGES.includes(pageName)) return "support_staff";
  if (pageName.startsWith("Admin") || pageName.startsWith("Studio")) return "admin";
  if (
    pageName.startsWith("Manager") ||
    pageName.endsWith("Manager") ||
    pageName.endsWith("Editor") ||
    MANAGER_PAGES.includes(pageName)
  ) {
    return "manager";
  }
  return null;
}