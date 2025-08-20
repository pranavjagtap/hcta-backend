import { z } from 'zod';

// Question validation schemas
export const questionBaseSchema = z.object({
  questionText: z.string().min(1, 'Question text is required').max(1000, 'Question text too long'),
  questionType: z.enum(['multiple_choice', 'fill_blank', 'short_answer', 'long_form', 'true_false']),
  options: z.array(z.string().min(1, 'Option cannot be empty')).optional(),
  correctAnswer: z.string().min(1, 'Correct answer is required'),
  explanation: z.string().min(1, 'Explanation is required').max(2000, 'Explanation too long'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  topic: z.string().min(1, 'Topic is required'),
  subTopic: z.string().optional(),
  marks: z.number().int().min(1, 'Marks must be at least 1'),
  timeEstimate: z.number().int().min(1, 'Time estimate must be at least 1 minute'),
  aiGenerated: z.boolean().default(true),
  metadata: z.object({
    bloomTaxonomy: z.string().optional(),
    curriculumStandard: z.string().optional(),
    keywords: z.array(z.string()).optional()
  }).optional()
});

export const createQuestionSchema = questionBaseSchema;

export const updateQuestionSchema = questionBaseSchema.partial();

// Homework validation schemas
export const homeworkBaseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  subject: z.string().min(1, 'Subject is required'),
  topic: z.string().min(1, 'Topic is required'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  questionTypes: z.array(z.enum(['multiple_choice', 'fill_blank', 'short_answer', 'long_form', 'true_false'])).min(1, 'At least one question type is required'),
  totalQuestions: z.number().int().min(1, 'Total questions must be at least 1'),
  totalMarks: z.number().int().min(1, 'Total marks must be at least 1'),
  estimatedTime: z.number().int().min(1, 'Estimated time must be at least 1 minute'),
  dueDate: z.date().optional(),
  isPublished: z.boolean().default(false),
  isPersonalized: z.boolean().default(false),
  targetAudience: z.enum(['individual', 'class', 'batch']),
  targetStudents: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid student ID')).optional(),
  targetClass: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid class ID').optional(),
  targetBatch: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid batch ID').optional(),
  questions: z.array(questionBaseSchema).min(1, 'At least one question is required')
});

export const createHomeworkSchema = homeworkBaseSchema.omit({ questions: true, isPublished: true }).extend({
  aiGenerationRequest: z.object({
    prompt: z.string().optional(),
    personalizationFactors: z.object({
      weakTopics: z.array(z.string()).optional(),
      strongTopics: z.array(z.string()).optional(),
      performanceLevel: z.string().optional(),
      learningStyle: z.string().optional()
    }).optional()
  }).optional()
});

export const updateHomeworkSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  dueDate: z.date().optional(),
  isPublished: z.boolean().optional(),
  questions: z.array(questionBaseSchema).min(1, 'At least one question is required').optional()
});

export const homeworkQuerySchema = z.object({
  subject: z.string().optional(),
  topic: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  targetAudience: z.enum(['individual', 'class', 'batch']).optional(),
  targetClass: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid class ID').optional(),
  targetBatch: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid batch ID').optional(),
  targetStudent: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid student ID').optional(),
  isPublished: z.boolean().optional(),
  isPersonalized: z.boolean().optional(),
  createdBy: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID').optional(),
  dueDateFrom: z.string().datetime().optional(),
  dueDateTo: z.string().datetime().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export const homeworkIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid homework ID')
});

// Homework Submission validation schemas
export const homeworkSubmissionBaseSchema = z.object({
  homeworkId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid homework ID'),
  studentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid student ID'),
  answers: z.array(z.object({
    questionIndex: z.number().int().min(0, 'Question index must be non-negative'),
    answer: z.string().min(1, 'Answer is required'),
    isCorrect: z.boolean(),
    score: z.number().min(0, 'Score must be non-negative'),
    timeSpent: z.number().min(0, 'Time spent must be non-negative'),
    submittedAt: z.date()
  })),
  totalScore: z.number().min(0, 'Total score must be non-negative'),
  maxScore: z.number().min(1, 'Max score must be at least 1'),
  percentage: z.number().min(0).max(100, 'Percentage must be between 0 and 100'),
  timeSpent: z.number().min(0, 'Total time spent must be non-negative'),
  status: z.enum(['in_progress', 'submitted', 'late', 'graded']).default('in_progress'),
  submittedAt: z.date().optional(),
  gradedAt: z.date().optional(),
  gradedBy: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID').optional(),
  feedback: z.string().max(2000, 'Feedback too long').optional(),
  aiFeedback: z.object({
    overallFeedback: z.string(),
    improvementSuggestions: z.array(z.string()),
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string())
  }).optional()
});

export const createHomeworkSubmissionSchema = z.object({
  homeworkId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid homework ID'),
  studentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid student ID'),
  answers: z.array(z.object({
    questionIndex: z.number().int().min(0, 'Question index must be non-negative'),
    answer: z.string().min(1, 'Answer is required'),
    timeSpent: z.number().min(0, 'Time spent must be non-negative')
  })).min(1, 'At least one answer is required')
});

export const updateHomeworkSubmissionSchema = z.object({
  answers: z.array(z.object({
    questionIndex: z.number().int().min(0, 'Question index must be non-negative'),
    answer: z.string().min(1, 'Answer is required'),
    timeSpent: z.number().min(0, 'Time spent must be non-negative')
  })).optional(),
  status: z.enum(['in_progress', 'submitted', 'late', 'graded']).optional(),
  feedback: z.string().max(2000, 'Feedback too long').optional()
});

export const homeworkSubmissionQuerySchema = z.object({
  homeworkId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid homework ID').optional(),
  studentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid student ID').optional(),
  status: z.enum(['in_progress', 'submitted', 'late', 'graded']).optional(),
  submittedFrom: z.string().datetime().optional(),
  submittedTo: z.string().datetime().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export const homeworkSubmissionIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid submission ID')
});

// AI Generation validation schemas
export const aiGenerateHomeworkSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  topic: z.string().min(1, 'Topic is required'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  questionTypes: z.array(z.enum(['multiple_choice', 'fill_blank', 'short_answer', 'long_form', 'true_false'])).min(1, 'At least one question type is required'),
  totalQuestions: z.number().int().min(1, 'Total questions must be at least 1').max(50, 'Maximum 50 questions allowed'),
  curriculumStandard: z.string().optional(),
  personalizationFactors: z.object({
    weakTopics: z.array(z.string()).optional(),
    strongTopics: z.array(z.string()).optional(),
    performanceLevel: z.string().optional(),
    learningStyle: z.string().optional(),
    studentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid student ID').optional()
  }).optional(),
  customPrompt: z.string().max(2000, 'Custom prompt too long').optional()
});

export const aiRegenerateQuestionSchema = z.object({
  questionContext: z.string().min(1, 'Question context is required'),
  questionType: z.enum(['multiple_choice', 'fill_blank', 'short_answer', 'long_form', 'true_false']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  topic: z.string().min(1, 'Topic is required'),
  constraints: z.object({
    avoidTopics: z.array(z.string()).optional(),
    focusTopics: z.array(z.string()).optional(),
    maxOptions: z.number().int().min(2).max(6).optional()
  }).optional()
});

// Export validation schemas
export const exportHomeworkSchema = z.object({
  homeworkId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid homework ID'),
  format: z.enum(['pdf', 'word']),
  includeAnswers: z.boolean().default(false),
  includeExplanations: z.boolean().default(false),
  customHeader: z.string().max(500, 'Custom header too long').optional(),
  customFooter: z.string().max(500, 'Custom footer too long').optional()
});

// Notification validation schemas
export const homeworkNotificationSchema = z.object({
  homeworkId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid homework ID'),
  notificationType: z.enum(['assignment_created', 'assignment_due', 'assignment_overdue', 'submission_received']),
  channels: z.array(z.enum(['email', 'sms', 'whatsapp', 'in_app'])).min(1, 'At least one channel is required'),
  customMessage: z.string().max(1000, 'Custom message too long').optional()
});

// Bulk operations validation schemas
export const bulkGenerateHomeworkSchema = z.object({
  requests: z.array(z.object({
    subject: z.string().min(1, 'Subject is required'),
    topic: z.string().min(1, 'Topic is required'),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    questionTypes: z.array(z.enum(['multiple_choice', 'fill_blank', 'short_answer', 'long_form', 'true_false'])).min(1, 'At least one question type is required'),
    totalQuestions: z.number().int().min(1, 'Total questions must be at least 1').max(50, 'Maximum 50 questions allowed'),
    targetAudience: z.enum(['individual', 'class', 'batch']),
    targetStudents: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid student ID')).optional(),
    targetClass: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid class ID').optional(),
    targetBatch: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid batch ID').optional(),
    personalizationFactors: z.object({
      weakTopics: z.array(z.string()).optional(),
      strongTopics: z.array(z.string()).optional(),
      performanceLevel: z.string().optional(),
      learningStyle: z.string().optional()
    }).optional()
  })).min(1, 'At least one request is required').max(10, 'Maximum 10 requests allowed')
});

// Review validation schemas
export const reviewHomeworkSchema = z.object({
  homeworkId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid homework ID'),
  action: z.enum(['approve', 'reject', 'request_changes']),
  feedback: z.string().max(2000, 'Feedback too long').optional(),
  changes: z.object({
    questionsToRegenerate: z.array(z.number().int().min(0, 'Question index must be non-negative')).optional(),
    questionsToEdit: z.array(z.object({
      questionIndex: z.number().int().min(0, 'Question index must be non-negative'),
      newQuestion: questionBaseSchema.partial()
    })).optional()
  }).optional()
});

// Analytics validation schemas
export const homeworkAnalyticsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  subject: z.string().optional(),
  targetAudience: z.enum(['individual', 'class', 'batch']).optional(),
  createdBy: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID').optional()
});

export const homeworkStatsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  subject: z.string().optional(),
  targetAudience: z.enum(['individual', 'class', 'batch']).optional()
});

// Student-specific validation schemas
export const studentHomeworkQuerySchema = z.object({
  studentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid student ID'),
  status: z.enum(['assigned', 'in_progress', 'submitted', 'overdue']).optional(),
  subject: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10)
});

export const classHomeworkQuerySchema = z.object({
  classId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid class ID'),
  status: z.enum(['assigned', 'in_progress', 'submitted', 'overdue']).optional(),
  subject: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10)
});

// Grading validation schemas
export const gradeHomeworkSubmissionSchema = z.object({
  submissionId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid submission ID'),
  grades: z.array(z.object({
    questionIndex: z.number().int().min(0, 'Question index must be non-negative'),
    score: z.number().min(0, 'Score must be non-negative'),
    feedback: z.string().max(500, 'Feedback too long').optional()
  })).min(1, 'At least one grade is required'),
  overallFeedback: z.string().max(2000, 'Overall feedback too long').optional(),
  generateAIFeedback: z.boolean().default(false)
});

// Search validation schemas
export const searchHomeworkSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(100, 'Search query too long'),
  filters: z.object({
    subject: z.string().optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    questionTypes: z.array(z.enum(['multiple_choice', 'fill_blank', 'short_answer', 'long_form', 'true_false'])).optional(),
    targetAudience: z.enum(['individual', 'class', 'batch']).optional(),
    isPublished: z.boolean().optional()
  }).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10)
});
