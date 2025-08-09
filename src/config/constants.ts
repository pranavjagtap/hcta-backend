// config/constants.ts

export enum UserRole {
  ADMIN = "admin",
  TUTOR = "tutor",
  STUDENT = "student",
  PARENT = "parent",
}

export const VALID_ROLES = Object.values(UserRole);

export const ATTENDANCE_STATUS = [
  "present",
  "absent",
  "late",
  "leave",
] as const;

export const PAYMENT_MODES = [
  "cash",
  "upi",
  "bank",
  "cheque",
  "other",
] as const;

export const ASSIGNMENT_TYPES = [
  "mcq",
  "written",
  "oral",
  "practical",
] as const;

export const GENDERS = ["male", "female", "other"] as const;

export const LANGUAGES = ["english", "hindi", "marathi"] as const;

// For audit metadata enums or statuses
export const STATUS = ["pending", "active", "inactive", "archived"] as const;
