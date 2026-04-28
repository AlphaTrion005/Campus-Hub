export const ROLES = [
  "Developer",
  "Admin",
  "Sub-admin",
  "Event Manager",
  "Teacher",
  "Class Rep",
  "Club Head",
  "Student",
];

export const ROLE_PERMISSIONS = {
  Developer: ["*"],
  Admin: [
    "manage_users",
    "manage_settings",
    "view_audit_logs",
    "post_campus_announcements",
    "manage_reports",
    "manage_lost_found",
    "manage_club_applications",
    "manage_events",
    "manage_resources",
    "upload_class_resources",
    "manage_own_club",
    "student_access",
  ],
  "Sub-admin": [
    "manage_non_admin_users",
    "bulk_manage_roles",
    "export_users",
    "view_audit_logs",
    "post_campus_announcements",
    "manage_reports",
    "manage_lost_found",
    "manage_club_applications",
    "manage_events",
    "manage_resources",
    "upload_class_resources",
    "manage_own_club",
    "student_access",
  ],
  "Event Manager": ["manage_events", "student_access"],
  Teacher: ["manage_resources", "student_access"],
  "Class Rep": ["upload_class_resources", "student_access"],
  "Club Head": ["manage_own_club", "manage_events", "student_access"],
  Student: ["student_access"],
};

export const canAssignRole = (actorRoles = [], targetRole) => {
  if (actorRoles.includes("Developer")) return ROLES.includes(targetRole);
  if (actorRoles.includes("Admin")) return ROLES.includes(targetRole) && targetRole !== "Developer";
  if (actorRoles.includes("Sub-admin")) return ROLES.includes(targetRole) && !["Developer", "Admin"].includes(targetRole);
  return false;
};

export const hasPermission = (user, permission) => {
  const actorRoles = user?.roles || [];
  return actorRoles.some((role) => {
    const permissions = ROLE_PERMISSIONS[role] || [];
    return permissions.includes("*") || permissions.includes(permission);
  });
};
