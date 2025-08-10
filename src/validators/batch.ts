import { z } from "zod";

export const createBatchSchema = z.object({
  name: z.string().min(1, "Batch name is required").max(100, "Batch name must be less than 100 characters"),
  subjectIds: z.array(z.string().min(1, "Valid subject ID required")).optional(),
  academicYear: z.string().optional(),
  startDate: z.union([z.string().datetime(), z.date()]).optional(),
  endDate: z.union([z.string().datetime(), z.date()]).optional(),
  classDays: z.array(z.string()).default([]),
  maxStudents: z.number().positive("Maximum students must be a positive number").optional(),
  location: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const updateBatchSchema = createBatchSchema.partial();

export const batchQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(1, "Page must be at least 1")).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(1, "Limit must be at least 1").max(100, "Limit cannot exceed 100")).optional(),
  search: z.string().min(1, "Search term cannot be empty").optional(),
  academicYear: z.string().min(1, "Academic year cannot be empty").optional(),
  isActive: z.string().transform(val => val === "true").optional(),
});

export const addStudentsToBatchSchema = z.object({
  studentIds: z.array(z.string().min(1, "Valid student ID required")).min(1, "At least one student ID is required"),
});

export const removeStudentFromBatchSchema = z.object({
  studentId: z.string().min(1, "Valid student ID is required"),
});
