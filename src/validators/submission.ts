import { z } from "zod";

export const createSubmissionSchema = z.object({
  assignmentId: z.string().min(1, "Assignment ID is required"),
  studentId: z.string().min(1, "Student ID is required"),
  fileURL: z.string().url("Invalid file URL").optional(),
  submittedAt: z.union([z.string().datetime(), z.date()]).optional(),
  marksAwarded: z.number().positive("Marks must be a positive number").optional(),
  remarks: z.string().optional(),
  status: z.enum(["submitted", "checked", "late"]).default("submitted"),
});

export const updateSubmissionSchema = createSubmissionSchema.partial();

export const submissionQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(1).max(1000)).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(1).max(100)).optional(),
  assignmentId: z.string().min(1, "Valid assignment ID required").optional(),
  studentId: z.string().min(1, "Valid student ID required").optional(),
  status: z.enum(["submitted", "checked", "late"]).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  search: z.string().min(1, "Search term must be at least 1 character").optional(),
});

export const gradeSubmissionSchema = z.object({
  marksAwarded: z.number().positive("Marks must be a positive number"),
  remarks: z.string().optional(),
  status: z.enum(["checked", "late"]).default("checked"),
});

export const getAssignmentSubmissionsSchema = z.object({
  assignmentId: z.string().min(1, "Assignment ID is required"),
});

export const getStudentSubmissionsSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const bulkGradeSubmissionsSchema = z.object({
  submissions: z.array(z.object({
    submissionId: z.string().min(1, "Submission ID is required"),
    marksAwarded: z.number().positive("Marks must be a positive number"),
    remarks: z.string().optional(),
    status: z.enum(["checked", "late"]).default("checked"),
  })).min(1, "At least one submission is required"),
});
