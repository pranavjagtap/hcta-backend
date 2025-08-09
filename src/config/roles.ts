// config/roles.ts

import { UserRole } from "./constants";

export const RolePermissionsMap = {
  [UserRole.ADMIN]: [
    "manage_users",
    "view_all_batches",
    "configure_payments",
    "manage_notes",
    "view_reports",
  ],
  [UserRole.TUTOR]: [
    "manage_own_batches",
    "create_assignments",
    "take_attendance",
    "upload_notes",
  ],
  [UserRole.STUDENT]: ["view_assignments", "submit_assignments", "view_notes"],
  [UserRole.PARENT]: ["view_progress", "view_fees"],
};
