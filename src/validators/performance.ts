import { z } from "zod";

const basePerformanceSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  topic: z.string().min(1, "Topic is required").max(200, "Topic must be less than 200 characters"),
  subjectId: z.string().min(1, "Subject ID is required"),
  score: z.number().min(0, "Score must be non-negative").max(1000, "Score must be reasonable"),
  maxScore: z.number().min(1, "Max score must be at least 1").max(1000, "Max score must be reasonable"),
  remarks: z.string().max(500, "Remarks must be less than 500 characters").optional(),
  assessmentType: z.enum(["test", "oral", "assignment", "project"]),
  date: z.union([z.string().datetime(), z.date()]),
});

export const createPerformanceSchema = basePerformanceSchema.refine((data) => data.score <= data.maxScore, {
  message: "Score cannot exceed max score",
  path: ["score"],
});

export const updatePerformanceSchema = basePerformanceSchema.partial();

export const performanceQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(1).max(1000)).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(1).max(100)).optional(),
  studentId: z.string().min(1, "Valid student ID required").optional(),
  subjectId: z.string().min(1, "Valid subject ID required").optional(),
  assessmentType: z.enum(["test", "oral", "assignment", "project"]).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  minScore: z.string().regex(/^\d+$/).transform(Number).optional(),
  maxScore: z.string().regex(/^\d+$/).transform(Number).optional(),
  search: z.string().optional(),
});

export const getStudentPerformanceSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  subjectId: z.string().optional(),
  assessmentType: z.enum(["test", "oral", "assignment", "project"]).optional(),
});

export const getBatchPerformanceSchema = z.object({
  batchId: z.string().min(1, "Batch ID is required"),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  subjectId: z.string().optional(),
  assessmentType: z.enum(["test", "oral", "assignment", "project"]).optional(),
});

export const performanceComparisonSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  currentStartDate: z.string().datetime(),
  currentEndDate: z.string().datetime(),
  previousStartDate: z.string().datetime(),
  previousEndDate: z.string().datetime(),
});

export const bulkCreatePerformanceSchema = z.object({
  performances: z.array(createPerformanceSchema).min(1, "At least one performance record is required"),
});

export const performanceStatsSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  studentId: z.string().optional(),
  subjectId: z.string().optional(),
  assessmentType: z.enum(["test", "oral", "assignment", "project"]).optional(),
});

export const performanceHeatmapSchema = z.object({
  batchId: z.string().min(1, "Batch ID is required"),
  subjectIds: z.array(z.string()).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});
