import { z } from "zod";

// Base topic schema
const baseTopicSchema = z.object({
  name: z.string().min(1, "Topic name is required").max(200, "Topic name must be less than 200 characters"),
  subjectId: z.string().min(1, "Subject ID is required"),
  board: z.string().min(1, "Board is required"),
  classLevel: z.string().min(1, "Class level is required"),
  chapterNumber: z.number().min(1, "Chapter number must be at least 1").optional(),
  learningObjectives: z.array(z.string().min(1, "Learning objective cannot be empty")).min(1, "At least one learning objective is required"),
  prerequisites: z.array(z.string()).optional(),
  estimatedHours: z.number().min(0.5, "Estimated hours must be at least 0.5").max(50, "Estimated hours cannot exceed 50"),
  difficultyLevel: z.enum(["easy", "medium", "hard"]).default("medium"),
  bloomTaxonomyLevel: z.enum(["remember", "understand", "apply", "analyze", "evaluate", "create"]).default("understand"),
  keywords: z.array(z.string()).optional(),
});

// Create topic schema
export const createTopicSchema = baseTopicSchema;

// Update topic schema (all fields optional)
export const updateTopicSchema = baseTopicSchema.partial();

// Topic query schema
export const topicQuerySchema = z.object({
  page: z.coerce.number().min(1, "Page must be at least 1").default(1),
  limit: z.coerce.number().min(1, "Limit must be at least 1").max(100, "Limit cannot exceed 100").default(10),
  search: z.string().optional(),
  subjectId: z.string().optional(),
  board: z.string().optional(),
  classLevel: z.string().optional(),
  difficultyLevel: z.enum(["easy", "medium", "hard"]).optional(),
  bloomTaxonomyLevel: z.enum(["remember", "understand", "apply", "analyze", "evaluate", "create"]).optional(),
  chapterNumber: z.coerce.number().min(1).optional(),
});

// Bulk create topics schema
export const bulkCreateTopicsSchema = z.object({
  subjectId: z.string().min(1, "Subject ID is required"),
  topics: z.array(z.object({
    name: z.string().min(1, "Topic name is required").max(200, "Topic name must be less than 200 characters"),
    board: z.string().min(1, "Board is required"),
    classLevel: z.string().min(1, "Class level is required"),
    chapterNumber: z.number().min(1, "Chapter number must be at least 1").optional(),
    learningObjectives: z.array(z.string().min(1, "Learning objective cannot be empty")).min(1, "At least one learning objective is required"),
    prerequisites: z.array(z.string()).optional(),
    estimatedHours: z.number().min(0.5, "Estimated hours must be at least 0.5").max(50, "Estimated hours cannot exceed 50"),
    difficultyLevel: z.enum(["easy", "medium", "hard"]).default("medium"),
    bloomTaxonomyLevel: z.enum(["remember", "understand", "apply", "analyze", "evaluate", "create"]).default("understand"),
    keywords: z.array(z.string()).optional(),
  })).min(1, "At least one topic is required").max(100, "Cannot create more than 100 topics at once"),
});

// Topic progress update schema
export const topicProgressUpdateSchema = z.object({
  status: z.enum(["not_started", "in_progress", "completed", "review_needed"]).optional(),
  completionPercentage: z.number().min(0, "Completion percentage must be at least 0").max(100, "Completion percentage cannot exceed 100").optional(),
  timeSpent: z.number().min(0, "Time spent must be at least 0").optional(),
  notes: z.string().optional(),
});

// Topic search schema
export const topicSearchSchema = z.object({
  keywords: z.string().min(1, "Keywords are required"),
  limit: z.coerce.number().min(1, "Limit must be at least 1").max(50, "Limit cannot exceed 50").default(10),
});

// Topic filter schema
export const topicFilterSchema = z.object({
  subjectId: z.string().optional(),
  board: z.string().optional(),
  classLevel: z.string().optional(),
  difficultyLevel: z.enum(["easy", "medium", "hard"]).optional(),
  bloomTaxonomyLevel: z.enum(["remember", "understand", "apply", "analyze", "evaluate", "create"]).optional(),
  minEstimatedHours: z.coerce.number().min(0).optional(),
  maxEstimatedHours: z.coerce.number().min(0).optional(),
  hasPrerequisites: z.coerce.boolean().optional(),
});

// Topic import schema (for CSV/Excel imports)
export const topicImportSchema = z.object({
  subjectId: z.string().min(1, "Subject ID is required"),
  topics: z.array(z.object({
    name: z.string().min(1, "Topic name is required"),
    board: z.string().min(1, "Board is required"),
    classLevel: z.string().min(1, "Class level is required"),
    chapterNumber: z.coerce.number().min(1).optional(),
    learningObjectives: z.string().min(1, "Learning objectives are required"), // Comma-separated string
    prerequisites: z.string().optional(), // Comma-separated string
    estimatedHours: z.coerce.number().min(0.5).max(50),
    difficultyLevel: z.enum(["easy", "medium", "hard"]).default("medium"),
    bloomTaxonomyLevel: z.enum(["remember", "understand", "apply", "analyze", "evaluate", "create"]).default("understand"),
    keywords: z.string().optional(), // Comma-separated string
  })).min(1, "At least one topic is required"),
});

// Topic export schema
export const topicExportSchema = z.object({
  subjectId: z.string().optional(),
  board: z.string().optional(),
  classLevel: z.string().optional(),
  format: z.enum(["csv", "excel", "pdf"]).default("csv"),
  includeProgress: z.coerce.boolean().default(false),
  batchId: z.string().optional(), // Required if includeProgress is true
});

// Topic validation helpers
export const validateTopicName = (name: string): boolean => {
  return name.length >= 1 && name.length <= 200;
};

export const validateLearningObjectives = (objectives: string[]): boolean => {
  return objectives.length >= 1 && objectives.every(obj => obj.length >= 1);
};

export const validateEstimatedHours = (hours: number): boolean => {
  return hours >= 0.5 && hours <= 50;
};

export const validateChapterNumber = (number: number): boolean => {
  return number >= 1;
};

// Topic constants
export const TOPIC_DIFFICULTY_LEVELS = ["easy", "medium", "hard"] as const;
export const TOPIC_BLOOM_TAXONOMY_LEVELS = ["remember", "understand", "apply", "analyze", "evaluate", "create"] as const;
export const TOPIC_STATUS_LEVELS = ["not_started", "in_progress", "completed", "review_needed"] as const;

// Topic validation messages
export const TOPIC_VALIDATION_MESSAGES = {
  name: {
    required: "Topic name is required",
    tooLong: "Topic name must be less than 200 characters",
  },
  learningObjectives: {
    required: "At least one learning objective is required",
    empty: "Learning objective cannot be empty",
  },
  estimatedHours: {
    tooLow: "Estimated hours must be at least 0.5",
    tooHigh: "Estimated hours cannot exceed 50",
  },
  chapterNumber: {
    tooLow: "Chapter number must be at least 1",
  },
} as const;

