import { z } from "zod";

export const createUserSchema = z.object({
  uid: z.string().min(1, "UID is required"),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  mobile: z.string().optional(),
  profileImageUrl: z.string().url("Valid URL required").optional(),
  role: z.string().min(1, "Role ID is required"), // Now accepts ObjectId string
  preferredLanguage: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  isActive: z.boolean().optional(),
  firebaseToken: z.string().optional(),
  registeredAt: z.union([z.string(), z.date()]).optional(),
});

export const updateUserSchema = createUserSchema.partial();

// Schema for role-based user creation (when creating with role name)
export const createUserWithRoleSchema = z.object({
  uid: z.string().min(1, "UID is required"),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  mobile: z.string().optional(),
  profileImageUrl: z.string().url("Valid URL required").optional(),
  roleName: z.enum(["tutor", "student", "parent", "admin"], {
    errorMap: () => ({ message: "Role must be one of: tutor, student, parent, admin" })
  }),
  preferredLanguage: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  isActive: z.boolean().optional(),
  firebaseToken: z.string().optional(),
  registeredAt: z.union([z.string(), z.date()]).optional(),
});

// Schema for user search and filtering
export const userQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(1, "Page must be at least 1")).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(1, "Limit must be at least 1").max(100, "Limit cannot exceed 100")).optional(),
  search: z.string().min(1, "Search term cannot be empty").optional(),
  role: z.string().min(1, "Role ID cannot be empty").optional(),
  isActive: z.string().transform(val => val === "true").optional(),
  city: z.string().min(1, "City cannot be empty").optional(),
});

// Schema for password change
export const changePasswordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters long"),
});

// Schema for user status toggle
export const toggleStatusSchema = z.object({
  isActive: z.boolean().optional(),
});
