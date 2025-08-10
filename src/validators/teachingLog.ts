import { z } from "zod";

export const createTeachingLogSchema = z.object({
  batchId: z.string().min(1, "Batch ID is required"),
  topic: z.string().min(1, "Topic is required").max(200, "Topic must be less than 200 characters"),
  subjectId: z.string().min(1, "Valid subject ID required").optional(),
  date: z.union([z.string().datetime(), z.date()]).optional(),
  durationMinutes: z.number().positive("Duration must be a positive number").optional(),
  teachingMethod: z.string().optional(),
  status: z.enum(["pending", "completed", "cancelled"]).default("pending"),
});

export const updateTeachingLogSchema = createTeachingLogSchema.partial();

export const teachingLogQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(1).max(1000)).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(1).max(100)).optional(),
  batchId: z.string().min(1, "Valid batch ID required").optional(),
  subjectId: z.string().min(1, "Valid subject ID required").optional(),
  status: z.enum(["pending", "completed", "cancelled"]).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  topic: z.string().min(1, "Topic search term must not be empty").optional(),
  search: z.string().min(1, "Search term must not be empty").optional(),
});

export const markCompletedSchema = z.object({
  status: z.enum(["completed", "cancelled"]),
  remarks: z.string().optional(),
});

export const getBatchTeachingStatsSchema = z.object({
  batchId: z.string().min(1, "Batch ID is required"),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const getDailyScheduleSchema = z.object({
  date: z.string().datetime().optional(),
  batchId: z.string().min(1, "Valid batch ID required").optional(),
});
