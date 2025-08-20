import { z } from "zod";

export const createClassSchema = z.object({
  name: z.string().min(1, "Class name is required").max(100, "Class name must be less than 100 characters"),
  gradeLevel: z.string().min(1, "Grade level is required"),
  subjects: z.array(z.string().min(1, "Subject ID is required")).min(1, "At least one subject is required"),
  assignedTeachers: z.array(z.string().min(1, "Teacher ID is required")).min(1, "At least one teacher is required"),
  description: z.string().optional(),
  maxStudents: z.number().min(1, "Maximum students must be at least 1").optional(),
  isActive: z.boolean().default(true),
});

export const updateClassSchema = z.object({
  name: z.string().min(1, "Class name is required").max(100, "Class name must be less than 100 characters").optional(),
  gradeLevel: z.string().min(1, "Grade level is required").optional(),
  subjects: z.array(z.string().min(1, "Subject ID is required")).min(1, "At least one subject is required").optional(),
  assignedTeachers: z.array(z.string().min(1, "Teacher ID is required")).min(1, "At least one teacher is required").optional(),
  description: z.string().optional(),
  maxStudents: z.number().min(1, "Maximum students must be at least 1").optional(),
  isActive: z.boolean().optional(),
});

export const classQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).default("1"),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).default("10"),
  search: z.string().optional(),
  gradeLevel: z.string().optional(),
  isActive: z.string().transform((val) => val === "true").optional(),
  assignedTeacher: z.string().optional(),
});

export type CreateClassInput = z.infer<typeof createClassSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;
export type ClassQueryInput = z.infer<typeof classQuerySchema>;
