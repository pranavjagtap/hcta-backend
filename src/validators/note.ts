import { z } from "zod";

export const createNoteSchema = z.object({
  batchId: z.string().min(1, "Batch ID is required"),
  topic: z.string().min(1, "Topic is required").max(200, "Topic must be less than 200 characters"),
  fileURL: z.string().url("Invalid file URL").optional(),
  subjectId: z.string().min(1, "Valid subject ID required").optional(),
  noteType: z.enum(["handwritten", "typed", "video", "image"]).default("handwritten"),
  isPublic: z.boolean().default(false),
  approved: z.boolean().default(false),
});

export const updateNoteSchema = createNoteSchema.partial();

export const noteQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(1, "Page must be at least 1")).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(1, "Limit must be at least 1").max(100, "Limit cannot exceed 100")).optional(),
  batchId: z.string().optional(),
  subjectId: z.string().optional(),
  noteType: z.enum(["handwritten", "typed", "video", "image"]).optional(),
  isPublic: z.string().transform(val => val === "true").optional(),
  approved: z.string().transform(val => val === "true").optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  search: z.string().optional(),
});

export const togglePublicSchema = z.object({
  isPublic: z.boolean(),
});

export const approveNoteSchema = z.object({
  approved: z.boolean(),
  remarks: z.string().optional(),
});

export const getBatchNotesSchema = z.object({
  batchId: z.string().min(1, "Batch ID is required"),
  noteType: z.enum(["handwritten", "typed", "video", "image"]).optional(),
  isPublic: z.string().transform(val => val === "true").optional(),
  approved: z.string().transform(val => val === "true").optional(),
});

export const searchNotesSchema = z.object({
  query: z.string().min(1, "Search query is required"),
  batchId: z.string().optional(),
  subjectId: z.string().optional(),
  noteType: z.enum(["handwritten", "typed", "video", "image"]).optional(),
  isPublic: z.string().transform(val => val === "true").optional(),
  approved: z.string().transform(val => val === "true").optional(),
});

export const bulkUpdateNotesSchema = z.object({
  noteIds: z.array(z.string().min(1, "Valid note ID required")).min(1, "At least one note ID is required"),
  updates: z.object({
    isPublic: z.boolean().optional(),
    approved: z.boolean().optional(),
    noteType: z.enum(["handwritten", "typed", "video", "image"]).optional(),
  }).optional(),
});
