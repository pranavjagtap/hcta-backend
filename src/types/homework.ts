import { Document } from 'mongoose';

// Base interfaces
export interface QuestionBase {
  questionText: string;
  questionType: 'multiple_choice' | 'fill_blank' | 'short_answer' | 'long_form' | 'true_false';
  options?: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  subTopic?: string;
  marks: number;
  timeEstimate: number;
  aiGenerated: boolean;
  metadata?: {
    bloomTaxonomy?: string;
    curriculumStandard?: string;
    keywords?: string[];
  };
}

export interface HomeworkBase {
  title: string;
  description?: string;
  subject: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionTypes: Array<'multiple_choice' | 'fill_blank' | 'short_answer' | 'long_form' | 'true_false'>;
  totalQuestions: number;
  totalMarks: number;
  estimatedTime: number;
  dueDate?: Date;
  isPublished: boolean;
  isPersonalized: boolean;
  targetAudience: 'individual' | 'class' | 'batch';
  targetStudents?: string[];
  targetClass?: string;
  targetBatch?: string;
  questions: QuestionBase[];
}

export interface HomeworkSubmissionBase {
  homeworkId: string;
  studentId: string;
  answers: Array<{
    questionIndex: number;
    answer: string;
    isCorrect: boolean;
    score: number;
    timeSpent: number;
    submittedAt: Date;
  }>;
  totalScore: number;
  maxScore: number;
  percentage: number;
  timeSpent: number;
  status: 'in_progress' | 'submitted' | 'late' | 'graded';
  submittedAt?: Date;
  gradedAt?: Date;
  gradedBy?: string;
  feedback?: string;
  aiFeedback?: {
    overallFeedback: string;
    improvementSuggestions: string[];
    strengths: string[];
    weaknesses: string[];
  };
}

// Create interfaces
export interface CreateHomeworkRequest extends Omit<HomeworkBase, 'questions' | 'isPublished'> {
  aiGenerationRequest?: {
    prompt?: string;
    personalizationFactors?: {
      weakTopics?: string[];
      strongTopics?: string[];
      performanceLevel?: string;
      learningStyle?: string;
    };
  };
}

export interface CreateHomeworkSubmissionRequest {
  homeworkId: string;
  studentId: string;
  answers: Array<{
    questionIndex: number;
    answer: string;
    timeSpent: number;
  }>;
}

// Update interfaces
export interface UpdateHomeworkRequest {
  title?: string;
  description?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  dueDate?: Date;
  isPublished?: boolean;
  questions?: QuestionBase[];
}

export interface UpdateHomeworkSubmissionRequest {
  answers?: Array<{
    questionIndex: number;
    answer: string;
    timeSpent: number;
  }>;
  status?: 'in_progress' | 'submitted' | 'late' | 'graded';
  feedback?: string;
}

// Document interfaces
export interface HomeworkDocument extends HomeworkBase, Document {
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
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface HomeworkSubmissionDocument extends HomeworkSubmissionBase, Document {
  createdAt: Date;
  updatedAt: Date;
}

// Response interfaces
export interface HomeworkResponse {
  id: string;
  title: string;
  description?: string;
  subject: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionTypes: Array<'multiple_choice' | 'fill_blank' | 'short_answer' | 'long_form' | 'true_false'>;
  totalQuestions: number;
  totalMarks: number;
  estimatedTime: number;
  dueDate?: Date;
  isPublished: boolean;
  isPersonalized: boolean;
  targetAudience: 'individual' | 'class' | 'batch';
  targetStudents?: Array<{
    id: string;
    name: string;
    rollNumber: string;
  }>;
  targetClass?: {
    id: string;
    name: string;
  };
  targetBatch?: {
    id: string;
    name: string;
  };
  questions: Array<QuestionBase & { id?: string }>;
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
  createdBy: {
    id: string;
    name: string;
  };
  updatedBy: {
    id: string;
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface HomeworkSubmissionResponse {
  id: string;
  homeworkId: string;
  studentId: string;
  answers: Array<{
    questionIndex: number;
    answer: string;
    isCorrect: boolean;
    score: number;
    timeSpent: number;
    submittedAt: Date;
  }>;
  totalScore: number;
  maxScore: number;
  percentage: number;
  timeSpent: number;
  status: 'in_progress' | 'submitted' | 'late' | 'graded';
  submittedAt?: Date;
  gradedAt?: Date;
  gradedBy?: {
    id: string;
    name: string;
  };
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

// Query interfaces
export interface HomeworkQuery {
  subject?: string;
  topic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  targetAudience?: 'individual' | 'class' | 'batch';
  targetClass?: string;
  targetBatch?: string;
  targetStudent?: string;
  isPublished?: boolean;
  isPersonalized?: boolean;
  createdBy?: string;
  dueDateFrom?: Date;
  dueDateTo?: Date;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface HomeworkSubmissionQuery {
  homeworkId?: string;
  studentId?: string;
  status?: 'in_progress' | 'submitted' | 'late' | 'graded';
  submittedFrom?: Date;
  submittedTo?: Date;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// List response interfaces
export interface HomeworkListResponse {
  homeworks: HomeworkResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface HomeworkSubmissionListResponse {
  submissions: HomeworkSubmissionResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// AI Generation interfaces
export interface AIGenerateHomeworkRequest {
  subject: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionTypes: Array<'multiple_choice' | 'fill_blank' | 'short_answer' | 'long_form' | 'true_false'>;
  totalQuestions: number;
  curriculumStandard?: string;
  personalizationFactors?: {
    weakTopics?: string[];
    strongTopics?: string[];
    performanceLevel?: string;
    learningStyle?: string;
    studentId?: string;
  };
  customPrompt?: string;
}

export interface AIGenerateHomeworkResponse {
  success: boolean;
  data: {
    questions: QuestionBase[];
    totalMarks: number;
    estimatedTime: number;
    generationTime: number;
    model: string;
    prompt: string;
  };
  error?: string;
}

export interface AIRegenerateQuestionRequest {
  questionContext: string;
  questionType: 'multiple_choice' | 'fill_blank' | 'short_answer' | 'long_form' | 'true_false';
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  constraints?: {
    avoidTopics?: string[];
    focusTopics?: string[];
    maxOptions?: number;
  };
}

export interface AIRegenerateQuestionResponse {
  success: boolean;
  data: QuestionBase;
  error?: string;
}

// Export interfaces
export interface ExportHomeworkRequest {
  homeworkId: string;
  format: 'pdf' | 'word';
  includeAnswers?: boolean;
  includeExplanations?: boolean;
  customHeader?: string;
  customFooter?: string;
}

export interface ExportHomeworkResponse {
  success: boolean;
  data: {
    downloadUrl: string;
    fileName: string;
    fileSize: number;
    format: 'pdf' | 'word';
  };
  error?: string;
}

// Analytics interfaces
export interface HomeworkAnalytics {
  totalHomeworks: number;
  totalSubmissions: number;
  averageCompletionRate: number;
  averageScore: number;
  averageTimeSpent: number;
  subjectBreakdown: Array<{
    subject: string;
    count: number;
    averageScore: number;
  }>;
  difficultyBreakdown: Array<{
    difficulty: string;
    count: number;
    averageScore: number;
  }>;
  recentActivity: Array<{
    date: string;
    homeworksCreated: number;
    submissionsReceived: number;
  }>;
}

export interface HomeworkStats {
  totalHomeworks: number;
  publishedHomeworks: number;
  totalSubmissions: number;
  averageCompletionRate: number;
  averageScore: number;
  overdueHomeworks: number;
  pendingSubmissions: number;
}

// Notification interfaces
export interface HomeworkNotificationRequest {
  homeworkId: string;
  notificationType: 'assignment_created' | 'assignment_due' | 'assignment_overdue' | 'submission_received';
  channels: Array<'email' | 'sms' | 'whatsapp' | 'in_app'>;
  customMessage?: string;
}

export interface HomeworkNotificationResponse {
  success: boolean;
  data: {
    notificationsSent: number;
    channels: string[];
  };
  error?: string;
}

// Bulk operations interfaces
export interface BulkGenerateHomeworkRequest {
  requests: Array<{
    subject: string;
    topic: string;
    difficulty: 'easy' | 'medium' | 'hard';
    questionTypes: Array<'multiple_choice' | 'fill_blank' | 'short_answer' | 'long_form' | 'true_false'>;
    totalQuestions: number;
    targetAudience: 'individual' | 'class' | 'batch';
    targetStudents?: string[];
    targetClass?: string;
    targetBatch?: string;
    personalizationFactors?: {
      weakTopics?: string[];
      strongTopics?: string[];
      performanceLevel?: string;
      learningStyle?: string;
    };
  }>;
}

export interface BulkGenerateHomeworkResponse {
  success: boolean;
  data: {
    generated: number;
    failed: number;
    homeworks: Array<{
      id: string;
      title: string;
      status: 'success' | 'failed';
      error?: string;
    }>;
  };
  error?: string;
}

// Review interfaces
export interface ReviewHomeworkRequest {
  homeworkId: string;
  action: 'approve' | 'reject' | 'request_changes';
  feedback?: string;
  changes?: {
    questionsToRegenerate?: number[];
    questionsToEdit?: Array<{
      questionIndex: number;
      newQuestion: Partial<QuestionBase>;
    }>;
  };
}

export interface ReviewHomeworkResponse {
  success: boolean;
  data: {
    status: 'approved' | 'rejected' | 'changes_requested';
    feedback?: string;
    regeneratedQuestions?: QuestionBase[];
  };
  error?: string;
}
