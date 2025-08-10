import { z } from "zod";

export const createAssignmentSchema = z.object({
  batchId: z.string().min(1, "Batch ID is required"),
  topic: z.string().min(1, "Topic is required").max(200, "Topic must be less than 200 characters"),
  subjectId: z.string().min(1, "Valid subject ID required").optional(),
  type: z.enum(["homework", "quiz", "test", "practice"]).default("homework"),
  dueDate: z.union([z.string().datetime(), z.date()]).optional(),
  fileUrl: z.string().url("Invalid file URL").optional(),
  isOptional: z.boolean().default(false),
  maxMarks: z.number().positive("Maximum marks must be a positive number").optional(),
  approved: z.boolean().default(false),
  isLocked: z.boolean().default(false),
});

export const updateAssignmentSchema = createAssignmentSchema.partial();

export const assignmentQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  batchId: z.string().optional(),
  subjectId: z.string().optional(),
  type: z.enum(["homework", "quiz", "test", "practice"]).optional(),
  status: z.enum(["pending", "approved", "locked"]).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  topic: z.string().optional(),
  search: z.string().optional(),
});

export const toggleLockSchema = z.object({
  isLocked: z.boolean(),
});

export const getUpcomingAssignmentsSchema = z.object({
  days: z.string().regex(/^\d+$/).transform(Number).optional(),
  batchId: z.string().optional(),
});

export const getBatchAssignmentStatsSchema = z.object({
  batchId: z.string().min(1, "Batch ID is required"),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});
