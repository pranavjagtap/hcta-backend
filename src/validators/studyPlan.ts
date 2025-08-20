import { z } from 'zod';

// Base validation schemas
export const StudyTaskSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  topic: z.string().min(1, "Topic is required"),
  duration: z.number().min(15, "Minimum duration is 15 minutes").max(480, "Maximum duration is 8 hours"),
  priority: z.enum(['high', 'medium', 'low']),
  type: z.enum(['learning', 'revision', 'practice', 'assessment']),
  estimatedDifficulty: z.enum(['easy', 'medium', 'hard']),
  learningObjectives: z.array(z.string().min(1, "Learning objective cannot be empty")),
  resources: z.array(z.string()).optional(),
  notes: z.string().optional()
});

export const SubjectInfoSchema = z.object({
  name: z.string().min(1, "Subject name is required"),
  priority: z.enum(['high', 'medium', 'low']),
  currentLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  targetLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  weakTopics: z.array(z.string()),
  strongTopics: z.array(z.string())
});

export const TimeSlotSchema = z.object({
  day: z.string().min(1, "Day is required"),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)")
});

export const PersonalizationFactorsSchema = z.object({
  weakTopicsWeight: z.number().min(0).max(1),
  strongTopicsWeight: z.number().min(0).max(1),
  learningStyleWeight: z.number().min(0).max(1),
  timeConstraintWeight: z.number().min(0).max(1)
});

// Create Study Plan Schema
export const CreateStudyPlanSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().optional(),
  planType: z.enum(['daily', 'weekly', 'monthly']),
  startDate: z.string().datetime("Invalid start date"),
  endDate: z.string().datetime("Invalid end date"),
  targetExamDate: z.string().datetime("Invalid exam date").optional(),
  syllabusDeadline: z.string().datetime("Invalid syllabus deadline").optional(),
  preferredStudyHoursPerDay: z.number().min(0.5, "Minimum 0.5 hours").max(12, "Maximum 12 hours"),
  preferredStudyDays: z.array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])),
  learningStyle: z.enum(['visual', 'auditory', 'kinesthetic', 'mixed']),
  availableTimeSlots: z.array(TimeSlotSchema),
  subjects: z.array(SubjectInfoSchema).min(1, "At least one subject is required"),
  useAI: z.boolean(),
  personalizationFactors: PersonalizationFactorsSchema.optional()
});

// Update Study Plan Schema
export const UpdateStudyPlanSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long").optional(),
  description: z.string().optional(),
  planType: z.enum(['daily', 'weekly', 'monthly']).optional(),
  startDate: z.string().datetime("Invalid start date").optional(),
  endDate: z.string().datetime("Invalid end date").optional(),
  targetExamDate: z.string().datetime("Invalid exam date").optional(),
  syllabusDeadline: z.string().datetime("Invalid syllabus deadline").optional(),
  preferredStudyHoursPerDay: z.number().min(0.5, "Minimum 0.5 hours").max(12, "Maximum 12 hours").optional(),
  preferredStudyDays: z.array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])).optional(),
  learningStyle: z.enum(['visual', 'auditory', 'kinesthetic', 'mixed']).optional(),
  availableTimeSlots: z.array(TimeSlotSchema).optional(),
  subjects: z.array(SubjectInfoSchema).optional(),
  status: z.enum(['draft', 'active', 'paused', 'completed', 'archived']).optional(),
  isActive: z.boolean().optional()
});

// Study Plan Query Schema
export const StudyPlanQuerySchema = z.object({
  studentId: z.string().optional(),
  status: z.enum(['draft', 'active', 'paused', 'completed', 'archived']).optional(),
  planType: z.enum(['daily', 'weekly', 'monthly']).optional(),
  isActive: z.boolean().optional(),
  startDate: z.string().datetime("Invalid start date").optional(),
  endDate: z.string().datetime("Invalid end date").optional(),
  page: z.number().min(1, "Page must be at least 1").optional(),
  limit: z.number().min(1, "Limit must be at least 1").max(100, "Limit cannot exceed 100").optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
});

// AI Generate Study Plan Schema
export const AIGenerateStudyPlanSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  studentName: z.string().min(1, "Student name is required"),
  grade: z.string().min(1, "Grade is required"),
  subjects: z.array(SubjectInfoSchema).min(1, "At least one subject is required"),
  preferredStudyHoursPerDay: z.number().min(0.5, "Minimum 0.5 hours").max(12, "Maximum 12 hours"),
  preferredStudyDays: z.array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])),
  learningStyle: z.enum(['visual', 'auditory', 'kinesthetic', 'mixed']),
  availableTimeSlots: z.array(TimeSlotSchema),
  startDate: z.string().datetime("Invalid start date"),
  endDate: z.string().datetime("Invalid end date"),
  targetExamDate: z.string().datetime("Invalid exam date").optional(),
  syllabusDeadline: z.string().datetime("Invalid syllabus deadline").optional(),
  planType: z.enum(['daily', 'weekly', 'monthly']),
  personalizationFactors: PersonalizationFactorsSchema.optional(),
  performanceData: z.object({
    weakTopics: z.array(z.string()),
    strongTopics: z.array(z.string()),
    recentScores: z.array(z.object({
      subject: z.string(),
      score: z.number().min(0).max(100),
      date: z.string().datetime("Invalid date")
    }))
  }).optional()
});

// Create Study Plan Progress Schema
export const CreateStudyPlanProgressSchema = z.object({
  studyPlanId: z.string().min(1, "Study plan ID is required"),
  date: z.string().datetime("Invalid date"),
  plannedTasks: z.number().min(0, "Planned tasks cannot be negative"),
  completedTasks: z.number().min(0, "Completed tasks cannot be negative"),
  plannedStudyTime: z.number().min(0, "Planned study time cannot be negative"),
  actualStudyTime: z.number().min(0, "Actual study time cannot be negative"),
  taskProgress: z.array(z.object({
    taskId: z.string().min(1, "Task ID is required"),
    subject: z.string().min(1, "Subject is required"),
    topic: z.string().min(1, "Topic is required"),
    plannedDuration: z.number().min(0, "Planned duration cannot be negative"),
    actualDuration: z.number().min(0, "Actual duration cannot be negative"),
    isCompleted: z.boolean(),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    confidence: z.number().min(1, "Confidence must be at least 1").max(10, "Confidence cannot exceed 10"),
    notes: z.string().optional()
  })),
  performanceMetrics: z.object({
    focusScore: z.number().min(1, "Focus score must be at least 1").max(10, "Focus score cannot exceed 10"),
    understandingScore: z.number().min(1, "Understanding score must be at least 1").max(10, "Understanding score cannot exceed 10"),
    retentionScore: z.number().min(1, "Retention score must be at least 1").max(10, "Retention score cannot exceed 10"),
    overallScore: z.number().min(1, "Overall score must be at least 1").max(10, "Overall score cannot exceed 10")
  }),
  obstacles: z.array(z.object({
    type: z.enum(['time_constraint', 'difficulty', 'distraction', 'health', 'other']),
    description: z.string().min(1, "Description is required"),
    impact: z.enum(['low', 'medium', 'high'])
  })).optional()
});

// Update Study Plan Progress Schema
export const UpdateStudyPlanProgressSchema = z.object({
  completedTasks: z.number().min(0, "Completed tasks cannot be negative").optional(),
  actualStudyTime: z.number().min(0, "Actual study time cannot be negative").optional(),
  taskProgress: z.array(z.object({
    taskId: z.string().min(1, "Task ID is required"),
    subject: z.string().min(1, "Subject is required"),
    topic: z.string().min(1, "Topic is required"),
    plannedDuration: z.number().min(0, "Planned duration cannot be negative"),
    actualDuration: z.number().min(0, "Actual duration cannot be negative"),
    isCompleted: z.boolean(),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    confidence: z.number().min(1, "Confidence must be at least 1").max(10, "Confidence cannot exceed 10"),
    notes: z.string().optional()
  })).optional(),
  performanceMetrics: z.object({
    focusScore: z.number().min(1, "Focus score must be at least 1").max(10, "Focus score cannot exceed 10"),
    understandingScore: z.number().min(1, "Understanding score must be at least 1").max(10, "Understanding score cannot exceed 10"),
    retentionScore: z.number().min(1, "Retention score must be at least 1").max(10, "Retention score cannot exceed 10"),
    overallScore: z.number().min(1, "Overall score must be at least 1").max(10, "Overall score cannot exceed 10")
  }).optional(),
  obstacles: z.array(z.object({
    type: z.enum(['time_constraint', 'difficulty', 'distraction', 'health', 'other']),
    description: z.string().min(1, "Description is required"),
    impact: z.enum(['low', 'medium', 'high']),
    resolved: z.boolean()
  })).optional()
});

// Study Plan Progress Query Schema
export const StudyPlanProgressQuerySchema = z.object({
  studyPlanId: z.string().optional(),
  studentId: z.string().optional(),
  startDate: z.string().datetime("Invalid start date").optional(),
  endDate: z.string().datetime("Invalid end date").optional(),
  page: z.number().min(1, "Page must be at least 1").optional(),
  limit: z.number().min(1, "Limit must be at least 1").max(100, "Limit cannot exceed 100").optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
});

// Study Plan Analytics Query Schema
export const StudyPlanAnalyticsQuerySchema = z.object({
  studyPlanId: z.string().min(1, "Study plan ID is required"),
  startDate: z.string().datetime("Invalid start date").optional(),
  endDate: z.string().datetime("Invalid end date").optional(),
  includeDailyProgress: z.boolean().optional(),
  includeWeeklyProgress: z.boolean().optional(),
  includePerformanceTrends: z.boolean().optional()
});

// Study Plan Stats Query Schema
export const StudyPlanStatsQuerySchema = z.object({
  studentId: z.string().optional(),
  startDate: z.string().datetime("Invalid start date").optional(),
  endDate: z.string().datetime("Invalid end date").optional(),
  status: z.enum(['draft', 'active', 'paused', 'completed', 'archived']).optional()
});
