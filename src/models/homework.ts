import mongoose, { Document, Schema } from 'mongoose';

// Question interface
export interface IQuestion {
  questionText: string;
  questionType: 'multiple_choice' | 'fill_blank' | 'short_answer' | 'long_form' | 'true_false';
  options?: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  subTopic?: string;
  marks: number;
  timeEstimate: number; // in minutes
  aiGenerated: boolean;
  metadata?: {
    bloomTaxonomy?: string;
    curriculumStandard?: string;
    keywords?: string[];
  };
}

// Homework interface
export interface IHomework extends Document {
  title: string;
  description?: string;
  subject: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionTypes: Array<'multiple_choice' | 'fill_blank' | 'short_answer' | 'long_form' | 'true_false'>;
  totalQuestions: number;
  totalMarks: number;
  estimatedTime: number; // in minutes
  dueDate?: Date;
  isPublished: boolean;
  isPersonalized: boolean;
  targetAudience: 'individual' | 'class' | 'batch';
  targetStudents?: mongoose.Types.ObjectId[];
  targetClass?: mongoose.Types.ObjectId;
  targetBatch?: mongoose.Types.ObjectId;
  questions: IQuestion[];
  aiGenerationData?: {
    prompt: string;
    model: string;
    generationTime: number;
    personalizationFactors?: {
      weakTopics?: string[];
      strongTopics?: string[];
      performanceLevel?: string;
      learningStyle?: string;
    };
  };
  analytics?: {
    totalAssigned: number;
    totalSubmitted: number;
    averageScore: number;
    completionRate: number;
    averageTimeSpent: number;
    questionAccuracy: Array<{
      questionIndex: number;
      correctAnswers: number;
      totalAttempts: number;
      accuracy: number;
    }>;
  };
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Homework Submission interface
export interface IHomeworkSubmission extends Document {
  homeworkId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  answers: Array<{
    questionIndex: number;
    answer: string;
    isCorrect: boolean;
    score: number;
    timeSpent: number; // in seconds
    submittedAt: Date;
  }>;
  totalScore: number;
  maxScore: number;
  percentage: number;
  timeSpent: number; // total time in seconds
  status: 'in_progress' | 'submitted' | 'late' | 'graded';
  submittedAt?: Date;
  gradedAt?: Date;
  gradedBy?: mongoose.Types.ObjectId;
  feedback?: string;
  aiFeedback?: {
    overallFeedback: string;
    improvementSuggestions: string[];
    strengths: string[];
    weaknesses: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

// Question schema
const questionSchema = new Schema<IQuestion>({
  questionText: {
    type: String,
    required: true,
    trim: true
  },
  questionType: {
    type: String,
    enum: ['multiple_choice', 'fill_blank', 'short_answer', 'long_form', 'true_false'],
    required: true
  },
  options: [{
    type: String,
    trim: true
  }],
  correctAnswer: {
    type: String,
    required: true,
    trim: true
  },
  explanation: {
    type: String,
    required: true,
    trim: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  topic: {
    type: String,
    required: true,
    trim: true
  },
  subTopic: {
    type: String,
    trim: true
  },
  marks: {
    type: Number,
    required: true,
    min: 1
  },
  timeEstimate: {
    type: Number,
    required: true,
    min: 1
  },
  aiGenerated: {
    type: Boolean,
    default: true
  },
  metadata: {
    bloomTaxonomy: String,
    curriculumStandard: String,
    keywords: [String]
  }
});

// Homework schema
const homeworkSchema = new Schema<IHomework>({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  topic: {
    type: String,
    required: true,
    trim: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  questionTypes: [{
    type: String,
    enum: ['multiple_choice', 'fill_blank', 'short_answer', 'long_form', 'true_false'],
    required: true
  }],
  totalQuestions: {
    type: Number,
    required: true,
    min: 1
  },
  totalMarks: {
    type: Number,
    required: true,
    min: 1
  },
  estimatedTime: {
    type: Number,
    required: true,
    min: 1
  },
  dueDate: {
    type: Date
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  isPersonalized: {
    type: Boolean,
    default: false
  },
  targetAudience: {
    type: String,
    enum: ['individual', 'class', 'batch'],
    required: true
  },
  targetStudents: [{
    type: Schema.Types.ObjectId,
    ref: 'Student'
  }],
  targetClass: {
    type: Schema.Types.ObjectId,
    ref: 'Class'
  },
  targetBatch: {
    type: Schema.Types.ObjectId,
    ref: 'Batch'
  },
  questions: [questionSchema],
  aiGenerationData: {
    prompt: String,
    model: String,
    generationTime: Number,
    personalizationFactors: {
      weakTopics: [String],
      strongTopics: [String],
      performanceLevel: String,
      learningStyle: String
    }
  },
  analytics: {
    totalAssigned: {
      type: Number,
      default: 0
    },
    totalSubmitted: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      default: 0
    },
    completionRate: {
      type: Number,
      default: 0
    },
    averageTimeSpent: {
      type: Number,
      default: 0
    },
    questionAccuracy: [{
      questionIndex: Number,
      correctAnswers: Number,
      totalAttempts: Number,
      accuracy: Number
    }]
  },
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

// Homework Submission schema
const homeworkSubmissionSchema = new Schema<IHomeworkSubmission>({
  homeworkId: {
    type: Schema.Types.ObjectId,
    ref: 'Homework',
    required: true
  },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  answers: [{
    questionIndex: {
      type: Number,
      required: true
    },
    answer: {
      type: String,
      required: true,
      trim: true
    },
    isCorrect: {
      type: Boolean,
      required: true
    },
    score: {
      type: Number,
      required: true,
      min: 0
    },
    timeSpent: {
      type: Number,
      required: true,
      min: 0
    },
    submittedAt: {
      type: Date,
      default: Date.now
    }
  }],
  totalScore: {
    type: Number,
    required: true,
    min: 0
  },
  maxScore: {
    type: Number,
    required: true,
    min: 1
  },
  percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  timeSpent: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['in_progress', 'submitted', 'late', 'graded'],
    default: 'in_progress'
  },
  submittedAt: {
    type: Date
  },
  gradedAt: {
    type: Date
  },
  gradedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  feedback: {
    type: String,
    trim: true
  },
  aiFeedback: {
    overallFeedback: String,
    improvementSuggestions: [String],
    strengths: [String],
    weaknesses: [String]
  }
}, {
  timestamps: true
});

// Indexes for performance
homeworkSchema.index({ subject: 1, topic: 1 });
homeworkSchema.index({ createdBy: 1, createdAt: -1 });
homeworkSchema.index({ targetAudience: 1, targetClass: 1 });
homeworkSchema.index({ targetAudience: 1, targetBatch: 1 });
homeworkSchema.index({ isPublished: 1, dueDate: 1 });

homeworkSubmissionSchema.index({ homeworkId: 1, studentId: 1 }, { unique: true });
homeworkSubmissionSchema.index({ studentId: 1, submittedAt: -1 });
homeworkSubmissionSchema.index({ homeworkId: 1, status: 1 });

// Virtuals
homeworkSchema.virtual('completionRatePercentage').get(function() {
  if (this.analytics?.totalAssigned === 0) return 0;
  return ((this.analytics?.totalSubmitted || 0) / (this.analytics?.totalAssigned || 1)) * 100;
});

homeworkSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate) return false;
  return new Date() > this.dueDate;
});

homeworkSubmissionSchema.virtual('isLate').get(function() {
  if (!this.submittedAt || !this.homeworkId) return false;
  // This would need to be populated with homework due date
  return false;
});

// Export models
export const Homework = mongoose.model<IHomework>('Homework', homeworkSchema);
export const HomeworkSubmission = mongoose.model<IHomeworkSubmission>('HomeworkSubmission', homeworkSubmissionSchema);
