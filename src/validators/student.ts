import { z } from "zod";

export const createStudentSchema = z.object({
  name: z.string().min(1, "Student name is required").max(100, "Student name must be less than 100 characters"),
  rollNumber: z.string().min(1, "Roll number is required").max(50, "Roll number must be less than 50 characters"),
  classId: z.string().min(1, "Class ID is required").optional(),
  batchId: z.string().min(1, "Batch ID is required").optional(),
  parentName: z.string().optional(),
  parentPhone: z.string().optional(),
  whatsappNumber: z.string().optional(),
  guardianInfo: z.object({
    name: z.string().min(1, "Guardian name is required"),
    relationship: z.string().min(1, "Relationship is required"),
    phone: z.string().min(1, "Guardian phone is required"),
    email: z.string().email("Invalid email format").optional(),
    address: z.string().optional(),
  }).optional(),
  schoolName: z.string().optional(),
  board: z.string().optional(),
  classLevel: z.string().optional(),
  weaknesses: z.array(z.string()).default([]),
  admissionDate: z.string().transform((val) => new Date(val)).optional(),
});

export const updateStudentSchema = z.object({
  name: z.string().min(1, "Student name is required").max(100, "Student name must be less than 100 characters").optional(),
  rollNumber: z.string().min(1, "Roll number is required").max(50, "Roll number must be less than 50 characters").optional(),
  classId: z.string().min(1, "Class ID is required").optional(),
  batchId: z.string().min(1, "Batch ID is required").optional(),
  parentName: z.string().optional(),
  parentPhone: z.string().optional(),
  whatsappNumber: z.string().optional(),
  guardianInfo: z.object({
    name: z.string().min(1, "Guardian name is required"),
    relationship: z.string().min(1, "Relationship is required"),
    phone: z.string().min(1, "Guardian phone is required"),
    email: z.string().email("Invalid email format").optional(),
    address: z.string().optional(),
  }).optional(),
  schoolName: z.string().optional(),
  board: z.string().optional(),
  classLevel: z.string().optional(),
  weaknesses: z.array(z.string()).optional(),
  admissionDate: z.string().transform((val) => new Date(val)).optional(),
});

export const studentQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).default("1"),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).default("10"),
  search: z.string().optional(),
  classId: z.string().optional(),
  batchId: z.string().optional(),
  board: z.string().optional(),
  classLevel: z.string().optional(),
});

export const bulkUploadSchema = z.object({
  students: z.array(createStudentSchema),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type StudentQueryInput = z.infer<typeof studentQuerySchema>;
export type BulkUploadInput = z.infer<typeof bulkUploadSchema>;
