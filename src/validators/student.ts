import { z } from "zod";

export const createStudentSchema = z.object({
  name: z.string().min(1, "Student name is required").max(100, "Student name must be less than 100 characters"),
  parentName: z.string().optional(),
  parentPhone: z.string().optional(),
  whatsappNumber: z.string().optional(),
  schoolName: z.string().optional(),
  board: z.string().optional(),
  classLevel: z.string().optional(),
  batchId: z.string().min(1, "Valid batch ID required").optional(),
  weaknesses: z.array(z.string()).default([]),
  rollNumber: z.string().optional(),
  admissionDate: z.union([z.string().datetime(), z.date()]).optional(),
});

export const updateStudentSchema = createStudentSchema.partial();

export const studentQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(1, "Page must be at least 1")).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(1, "Limit must be at least 1").max(100, "Limit cannot exceed 100")).optional(),
  search: z.string().min(1, "Search term cannot be empty").optional(),
  batchId: z.string().min(1, "Batch ID cannot be empty").optional(),
  board: z.string().min(1, "Board cannot be empty").optional(),
  classLevel: z.string().min(1, "Class level cannot be empty").optional(),
});

export const addWeaknessSchema = z.object({
  weakness: z.string().min(1, "Weakness description is required"),
});

export const removeWeaknessSchema = z.object({
  weakness: z.string().min(1, "Weakness description is required"),
});
