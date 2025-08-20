import { z } from 'zod';

// Base types
export interface StudyTask {
  id?: string;
  subject: string;
  topic: string;
  duration: number; // in minutes
  priority: 'high' | 'medium' | 'low';
  type: 'learning' | 'revision' | 'practice' | 'assessment';
  estimatedDifficulty: 'easy' | 'medium' | 'hard';
  learningObjectives: string[];
  resources?: string[];
  notes?: string;
}

export interface StudyDay {
  date: string; // YYYY-MM-DD format
  dayOfWeek: string;
  totalStudyTime: number; // in minutes
  tasks: StudyTask[];
  breaks: number;
  isCompleted: boolean;
  completionPercentage: number;
  actualStudyTime?: number;
  notes?: string;
}

export interface StudyWeek {
  weekNumber: number;
  startDate: string;
  endDate: string;
  totalStudyTime: number; // in minutes
  days: StudyDay[];
  weeklyGoals: string[];
  isCompleted: boolean;
  completionPercentage: number;
}

export interface SubjectInfo {
  name: string;
  priority: 'high' | 'medium' | 'low';
  currentLevel: 'beginner' | 'intermediate' | 'advanced';
  targetLevel: 'beginner' | 'intermediate' | 'advanced';
  weakTopics: string[];
  strongTopics: string[];
}

export interface TimeSlot {
  day: string;
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
}

export interface PersonalizationFactors {
  weakTopicsWeight: number;
  strongTopicsWeight: number;
  learningStyleWeight: number;
  timeConstraintWeight: number;
}

export interface AIGenerationData {
  model: string;
  prompt: string;
  generationTime: number;
  personalizationFactors: PersonalizationFactors;
  recommendations: string[];
}

export interface SubjectProgress {
  subject: string;
  progress: number;
  completedTopics: number;
  totalTopics: number;
}

// Study Plan Response
export interface StudyPlanResponse {
  id: string;
  studentId: string;
  title: string;
  description: string;
  planType: 'daily' | 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
  targetExamDate?: string;
  syllabusDeadline?: string;
  
  // Student preferences and constraints
  preferredStudyHoursPerDay: number;
  preferredStudyDays: string[];
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
  availableTimeSlots: TimeSlot[];
  
  // Academic information
  subjects: SubjectInfo[];
  
  // AI-generated plan structure
  weeks: StudyWeek[];
  totalStudyHours: number;
  totalTopics: number;
  
  // AI generation metadata
  aiGenerationData: AIGenerationData;
  
  // Plan status and tracking
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  isActive: boolean;
  currentWeek: number;
  currentDay: number;
  
  // Analytics and progress
  overallProgress: number;
  subjectsProgress: SubjectProgress[];
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string;
  };
  updatedBy: {
    id: string;
    name: string;
  };
}

// Study Plan List Response
export interface StudyPlanListResponse {
  success: boolean;
  data: {
    studyPlans: StudyPlanResponse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Create Study Plan Request
export interface CreateStudyPlanRequest {
  studentId: string;
  title: string;
  description?: string;
  planType: 'daily' | 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
  targetExamDate?: string;
  syllabusDeadline?: string;
  
  // Student preferences and constraints
  preferredStudyHoursPerDay: number;
  preferredStudyDays: string[];
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
  availableTimeSlots: TimeSlot[];
  
  // Academic information
  subjects: SubjectInfo[];
  
  // AI generation options
  useAI: boolean;
  personalizationFactors?: PersonalizationFactors;
}

// Update Study Plan Request
export interface UpdateStudyPlanRequest {
  title?: string;
  description?: string;
  planType?: 'daily' | 'weekly' | 'monthly';
  startDate?: string;
  endDate?: string;
  targetExamDate?: string;
  syllabusDeadline?: string;
  
  // Student preferences and constraints
  preferredStudyHoursPerDay?: number;
  preferredStudyDays?: string[];
  learningStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
  availableTimeSlots?: TimeSlot[];
  
  // Academic information
  subjects?: SubjectInfo[];
  
  // Plan status
  status?: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  isActive?: boolean;
}

// Study Plan Query
export interface StudyPlanQuery {
  studentId?: string;
  status?: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  planType?: 'daily' | 'weekly' | 'monthly';
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// AI Generate Study Plan Request
export interface AIGenerateStudyPlanRequest {
  studentId: string;
  studentName: string;
  grade: string;
  subjects: SubjectInfo[];
  preferredStudyHoursPerDay: number;
  preferredStudyDays: string[];
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
  availableTimeSlots: TimeSlot[];
  startDate: string;
  endDate: string;
  targetExamDate?: string;
  syllabusDeadline?: string;
  planType: 'daily' | 'weekly' | 'monthly';
  personalizationFactors?: PersonalizationFactors;
  performanceData?: {
    weakTopics: string[];
    strongTopics: string[];
    recentScores: {
      subject: string;
      score: number;
      date: string;
    }[];
  };
}

// AI Generate Study Plan Response
export interface AIGenerateStudyPlanResponse {
  success: boolean;
  data?: {
    weeks: StudyWeek[];
    totalStudyHours: number;
    totalTopics: number;
    generationTime: number;
    model: string;
    prompt: string;
    personalizationFactors: PersonalizationFactors;
    recommendations: string[];
  };
  error?: string;
}

// Study Plan Progress Response
export interface StudyPlanProgressResponse {
  id: string;
  studyPlanId: string;
  studentId: string;
  date: string;
  
  // Daily progress
  plannedTasks: number;
  completedTasks: number;
  plannedStudyTime: number;
  actualStudyTime: number;
  completionRate: number;
  
  // Task-level tracking
  taskProgress: {
    taskId: string;
    subject: string;
    topic: string;
    plannedDuration: number;
    actualDuration: number;
    isCompleted: boolean;
    difficulty: 'easy' | 'medium' | 'hard';
    confidence: number;
    notes?: string;
  }[];
  
  // Performance metrics
  performanceMetrics: {
    focusScore: number;
    understandingScore: number;
    retentionScore: number;
    overallScore: number;
  };
  
  // Obstacles and adjustments
  obstacles: {
    type: 'time_constraint' | 'difficulty' | 'distraction' | 'health' | 'other';
    description: string;
    impact: 'low' | 'medium' | 'high';
    resolved: boolean;
  }[];
  
  // AI feedback and recommendations
  aiFeedback: {
    suggestions: string[];
    adjustments: {
      type: 'schedule' | 'difficulty' | 'duration' | 'topic';
      description: string;
      priority: 'low' | 'medium' | 'high';
    }[];
    nextDayRecommendations: string[];
  };
  
  createdAt: string;
  updatedAt: string;
}

// Create Study Plan Progress Request
export interface CreateStudyPlanProgressRequest {
  studyPlanId: string;
  date: string;
  plannedTasks: number;
  completedTasks: number;
  plannedStudyTime: number;
  actualStudyTime: number;
  taskProgress: {
    taskId: string;
    subject: string;
    topic: string;
    plannedDuration: number;
    actualDuration: number;
    isCompleted: boolean;
    difficulty: 'easy' | 'medium' | 'hard';
    confidence: number;
    notes?: string;
  }[];
  performanceMetrics: {
    focusScore: number;
    understandingScore: number;
    retentionScore: number;
    overallScore: number;
  };
  obstacles?: {
    type: 'time_constraint' | 'difficulty' | 'distraction' | 'health' | 'other';
    description: string;
    impact: 'low' | 'medium' | 'high';
  }[];
}

// Update Study Plan Progress Request
export interface UpdateStudyPlanProgressRequest {
  completedTasks?: number;
  actualStudyTime?: number;
  taskProgress?: {
    taskId: string;
    subject: string;
    topic: string;
    plannedDuration: number;
    actualDuration: number;
    isCompleted: boolean;
    difficulty: 'easy' | 'medium' | 'hard';
    confidence: number;
    notes?: string;
  }[];
  performanceMetrics?: {
    focusScore: number;
    understandingScore: number;
    retentionScore: number;
    overallScore: number;
  };
  obstacles?: {
    type: 'time_constraint' | 'difficulty' | 'distraction' | 'health' | 'other';
    description: string;
    impact: 'low' | 'medium' | 'high';
    resolved: boolean;
  }[];
}

// Study Plan Analytics Response
export interface StudyPlanAnalyticsResponse {
  studyPlanId: string;
  overallProgress: number;
  totalStudyHours: number;
  completedStudyHours: number;
  totalTopics: number;
  completedTopics: number;
  averageDailyCompletion: number;
  subjectsProgress: SubjectProgress[];
  weeklyProgress: {
    weekNumber: number;
    progress: number;
    studyHours: number;
    completedTopics: number;
  }[];
  dailyProgress: {
    date: string;
    progress: number;
    studyHours: number;
    completedTasks: number;
  }[];
  performanceTrends: {
    focusScore: number;
    understandingScore: number;
    retentionScore: number;
    overallScore: number;
  };
  recommendations: string[];
}

// Study Plan Stats Response
export interface StudyPlanStatsResponse {
  totalStudyPlans: number;
  activeStudyPlans: number;
  completedStudyPlans: number;
  averageCompletionRate: number;
  totalStudyHours: number;
  averageStudyHoursPerDay: number;
  mostStudiedSubjects: {
    subject: string;
    hours: number;
    percentage: number;
  }[];
  weeklyTrends: {
    week: string;
    studyHours: number;
    completionRate: number;
  }[];
}

// Zod Schemas for validation
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
  personalizationFactors: z.object({
    weakTopicsWeight: z.number().min(0).max(1),
    strongTopicsWeight: z.number().min(0).max(1),
    learningStyleWeight: z.number().min(0).max(1),
    timeConstraintWeight: z.number().min(0).max(1)
  }).optional()
});

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
