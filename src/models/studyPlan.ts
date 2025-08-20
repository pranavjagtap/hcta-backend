import mongoose, { Document, Schema } from 'mongoose';

// Interface for study task
export interface IStudyTask {
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

// Interface for study day
export interface IStudyDay {
  date: string; // YYYY-MM-DD format
  dayOfWeek: string;
  totalStudyTime: number; // in minutes
  tasks: IStudyTask[];
  breaks: number; // number of breaks
  isCompleted: boolean;
  completionPercentage: number;
  actualStudyTime?: number;
  notes?: string;
}

// Interface for study week
export interface IStudyWeek {
  weekNumber: number;
  startDate: string;
  endDate: string;
  totalStudyTime: number; // in minutes
  days: IStudyDay[];
  weeklyGoals: string[];
  isCompleted: boolean;
  completionPercentage: number;
}

// Interface for study plan
export interface IStudyPlan extends Document {
  studentId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  planType: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  targetExamDate?: Date;
  syllabusDeadline?: Date;
  
  // Student preferences and constraints
  preferredStudyHoursPerDay: number;
  preferredStudyDays: string[]; // ['monday', 'tuesday', etc.]
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
  availableTimeSlots: {
    day: string;
    startTime: string;
    endTime: string;
  }[];
  
  // Academic information
  subjects: {
    name: string;
    priority: 'high' | 'medium' | 'low';
    currentLevel: 'beginner' | 'intermediate' | 'advanced';
    targetLevel: 'beginner' | 'intermediate' | 'advanced';
    weakTopics: string[];
    strongTopics: string[];
  }[];
  
  // AI-generated plan structure
  weeks: IStudyWeek[];
  totalStudyHours: number;
  totalTopics: number;
  
  // AI generation metadata
  aiGenerationData: {
    model: string;
    prompt: string;
    generationTime: number;
    personalizationFactors: {
      weakTopicsWeight: number;
      strongTopicsWeight: number;
      learningStyleWeight: number;
      timeConstraintWeight: number;
    };
    recommendations: string[];
  };
  
  // Plan status and tracking
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  isActive: boolean;
  currentWeek: number;
  currentDay: number;
  
  // Analytics and progress
  overallProgress: number;
  subjectsProgress: {
    subject: string;
    progress: number;
    completedTopics: number;
    totalTopics: number;
  }[];
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
}

// Interface for study plan progress tracking
export interface IStudyPlanProgress extends Document {
  studyPlanId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  date: Date;
  
  // Daily progress
  plannedTasks: number;
  completedTasks: number;
  plannedStudyTime: number; // in minutes
  actualStudyTime: number; // in minutes
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
    confidence: number; // 1-10 scale
    notes?: string;
  }[];
  
  // Performance metrics
  performanceMetrics: {
    focusScore: number; // 1-10 scale
    understandingScore: number; // 1-10 scale
    retentionScore: number; // 1-10 scale
    overallScore: number; // 1-10 scale
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
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Study Task Schema
const StudyTaskSchema = new Schema<IStudyTask>({
  subject: { type: String, required: true },
  topic: { type: String, required: true },
  duration: { type: Number, required: true, min: 15, max: 480 }, // 15 min to 8 hours
  priority: { 
    type: String, 
    required: true, 
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  type: { 
    type: String, 
    required: true, 
    enum: ['learning', 'revision', 'practice', 'assessment'],
    default: 'learning'
  },
  estimatedDifficulty: { 
    type: String, 
    required: true, 
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  learningObjectives: [{ type: String, required: true }],
  resources: [{ type: String }],
  notes: { type: String }
});

// Study Day Schema
const StudyDaySchema = new Schema<IStudyDay>({
  date: { type: String, required: true },
  dayOfWeek: { type: String, required: true },
  totalStudyTime: { type: Number, required: true, min: 0 },
  tasks: [StudyTaskSchema],
  breaks: { type: Number, default: 0 },
  isCompleted: { type: Boolean, default: false },
  completionPercentage: { type: Number, default: 0, min: 0, max: 100 },
  actualStudyTime: { type: Number },
  notes: { type: String }
});

// Study Week Schema
const StudyWeekSchema = new Schema<IStudyWeek>({
  weekNumber: { type: Number, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  totalStudyTime: { type: Number, required: true, min: 0 },
  days: [StudyDaySchema],
  weeklyGoals: [{ type: String }],
  isCompleted: { type: Boolean, default: false },
  completionPercentage: { type: Number, default: 0, min: 0, max: 100 }
});

// Study Plan Schema
const StudyPlanSchema = new Schema<IStudyPlan>({
  studentId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Student', 
    required: true 
  },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  planType: { 
    type: String, 
    required: true, 
    enum: ['daily', 'weekly', 'monthly'],
    default: 'weekly'
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  targetExamDate: { type: Date },
  syllabusDeadline: { type: Date },
  
  // Student preferences and constraints
  preferredStudyHoursPerDay: { 
    type: Number, 
    required: true, 
    min: 0.5, 
    max: 12,
    default: 2
  },
  preferredStudyDays: [{ 
    type: String, 
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  }],
  learningStyle: { 
    type: String, 
    required: true, 
    enum: ['visual', 'auditory', 'kinesthetic', 'mixed'],
    default: 'mixed'
  },
  availableTimeSlots: [{
    day: { type: String, required: true },
    startTime: { type: String, required: true }, // HH:MM format
    endTime: { type: String, required: true }    // HH:MM format
  }],
  
  // Academic information
  subjects: [{
    name: { type: String, required: true },
    priority: { 
      type: String, 
      required: true, 
      enum: ['high', 'medium', 'low'],
      default: 'medium'
    },
    currentLevel: { 
      type: String, 
      required: true, 
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    },
    targetLevel: { 
      type: String, 
      required: true, 
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate'
    },
    weakTopics: [{ type: String }],
    strongTopics: [{ type: String }]
  }],
  
  // AI-generated plan structure
  weeks: [StudyWeekSchema],
  totalStudyHours: { type: Number, default: 0 },
  totalTopics: { type: Number, default: 0 },
  
  // AI generation metadata
  aiGenerationData: {
    model: { type: String, default: 'gpt-3.5-turbo' },
    prompt: { type: String },
    generationTime: { type: Number },
    personalizationFactors: {
      weakTopicsWeight: { type: Number, default: 0.3, min: 0, max: 1 },
      strongTopicsWeight: { type: Number, default: 0.2, min: 0, max: 1 },
      learningStyleWeight: { type: Number, default: 0.2, min: 0, max: 1 },
      timeConstraintWeight: { type: Number, default: 0.3, min: 0, max: 1 }
    },
    recommendations: [{ type: String }]
  },
  
  // Plan status and tracking
  status: { 
    type: String, 
    required: true, 
    enum: ['draft', 'active', 'paused', 'completed', 'archived'],
    default: 'draft'
  },
  isActive: { type: Boolean, default: false },
  currentWeek: { type: Number, default: 1 },
  currentDay: { type: Number, default: 1 },
  
  // Analytics and progress
  overallProgress: { type: Number, default: 0, min: 0, max: 100 },
  subjectsProgress: [{
    subject: { type: String, required: true },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    completedTopics: { type: Number, default: 0 },
    totalTopics: { type: Number, default: 0 }
  }],
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  createdBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  updatedBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }
}, {
  timestamps: true
});

// Study Plan Progress Schema
const StudyPlanProgressSchema = new Schema<IStudyPlanProgress>({
  studyPlanId: { 
    type: Schema.Types.ObjectId, 
    ref: 'StudyPlan', 
    required: true 
  },
  studentId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Student', 
    required: true 
  },
  date: { type: Date, required: true },
  
  // Daily progress
  plannedTasks: { type: Number, required: true, min: 0 },
  completedTasks: { type: Number, required: true, min: 0 },
  plannedStudyTime: { type: Number, required: true, min: 0 },
  actualStudyTime: { type: Number, required: true, min: 0 },
  completionRate: { type: Number, required: true, min: 0, max: 100 },
  
  // Task-level tracking
  taskProgress: [{
    taskId: { type: String, required: true },
    subject: { type: String, required: true },
    topic: { type: String, required: true },
    plannedDuration: { type: Number, required: true },
    actualDuration: { type: Number, required: true },
    isCompleted: { type: Boolean, default: false },
    difficulty: { 
      type: String, 
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
    confidence: { type: Number, min: 1, max: 10, default: 5 },
    notes: { type: String }
  }],
  
  // Performance metrics
  performanceMetrics: {
    focusScore: { type: Number, min: 1, max: 10, default: 5 },
    understandingScore: { type: Number, min: 1, max: 10, default: 5 },
    retentionScore: { type: Number, min: 1, max: 10, default: 5 },
    overallScore: { type: Number, min: 1, max: 10, default: 5 }
  },
  
  // Obstacles and adjustments
  obstacles: [{
    type: { 
      type: String, 
      enum: ['time_constraint', 'difficulty', 'distraction', 'health', 'other'],
      required: true
    },
    description: { type: String, required: true },
    impact: { 
      type: String, 
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    resolved: { type: Boolean, default: false }
  }],
  
  // AI feedback and recommendations
  aiFeedback: {
    suggestions: [{ type: String }],
    adjustments: [{
      type: { 
        type: String, 
        enum: ['schedule', 'difficulty', 'duration', 'topic'],
        required: true
      },
      description: { type: String, required: true },
      priority: { 
        type: String, 
        enum: ['low', 'medium', 'high'],
        default: 'medium'
      }
    }],
    nextDayRecommendations: [{ type: String }]
  },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes for better query performance
StudyPlanSchema.index({ studentId: 1, status: 1 });
StudyPlanSchema.index({ studentId: 1, isActive: 1 });
StudyPlanSchema.index({ startDate: 1, endDate: 1 });
StudyPlanSchema.index({ createdBy: 1, createdAt: -1 });

StudyPlanProgressSchema.index({ studyPlanId: 1, date: 1 });
StudyPlanProgressSchema.index({ studentId: 1, date: 1 });
StudyPlanProgressSchema.index({ studyPlanId: 1, studentId: 1 });

export const StudyPlan = mongoose.model<IStudyPlan>('StudyPlan', StudyPlanSchema);
export const StudyPlanProgress = mongoose.model<IStudyPlanProgress>('StudyPlanProgress', StudyPlanProgressSchema);
