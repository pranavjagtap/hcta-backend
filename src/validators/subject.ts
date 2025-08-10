import { z } from "zod";

export const createSubjectSchema = z.object({
  name: z.string().min(1, "Subject name is required").max(100, "Subject name must be less than 100 characters"),
  board: z.string().optional(),
  classLevel: z.string().optional(),
  topics: z.array(z.string()).default([]),
  syllabusCode: z.string().optional(),
  isElective: z.boolean().default(false),
});

export const updateSubjectSchema = createSubjectSchema.partial();

export const subjectQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  search: z.string().optional(),
  board: z.string().optional(),
  classLevel: z.string().optional(),
  isElective: z.string().transform(val => val === "true").optional(),
});

export const addTopicSchema = z.object({
  topic: z.string().min(1, "Topic name is required"),
});

export const removeTopicSchema = z.object({
  topic: z.string().min(1, "Topic name is required"),
});

export const getSubjectsByBoardAndClassSchema = z.object({
  board: z.string().min(1, "Board is required"),
  classLevel: z.string().min(1, "Class level is required"),
});
