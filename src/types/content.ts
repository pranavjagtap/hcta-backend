import { IContent } from '../models/content';
import { IContentAccess } from '../models/contentAccess';

// ============================================================================
// BASE TYPES
// ============================================================================

export interface ContentBase {
  title: string;
  description?: string;
  type: 'video' | 'pdf' | 'ppt' | 'doc' | 'image' | 'quiz' | 'audio' | 'other';
  subjectId: string;
  topic?: string;
  subtopic?: string;
  grade?: string;
  tags: string[];
  isPublic: boolean;
  assignedTo?: string[];
  sharedWith?: string[];
  metadata: {
    thumbnailUrl?: string;
    language: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimatedDuration?: number;
    wordCount?: number;
    pageCount?: number;
  };
  quizData?: {
    questions: Array<{
      question: string;
      options: string[];
      correctAnswer: number;
      explanation?: string;
    }>;
    timeLimit?: number;
    passingScore?: number;
  };
}

export interface ContentCreate extends ContentBase {
  file: Express.Multer.File;
}

export interface ContentUpdate extends Partial<ContentBase> {
  file?: Express.Multer.File;
  // Populated during update when a new file is uploaded
  fileUrl?: string;
  fileKey?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  duration?: number;
}

export interface ContentQuery {
  page?: number;
  limit?: number;
  search?: string;
  subjectId?: string;
  type?: string;
  authorId?: string;
  uploadedBy?: string;
  status?: string;
  isPublic?: boolean;
  tags?: string[];
  grade?: string;
  difficulty?: string;
  language?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ContentAccessQuery {
  contentId?: string;
  userId?: string;
  userType?: string;
  isFavorited?: boolean;
  isCompleted?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface ContentResponse {
  _id: string;
  title: string;
  description?: string;
  type: string;
  fileUrl: string;
  fileKey?: string;
  fileName: string;
  fileSize: number;
  formattedFileSize: string;
  mimeType: string;
  duration?: number;
  formattedDuration?: string;
  
  subject: {
    _id: string;
    name: string;
  };
  topic?: string;
  subtopic?: string;
  grade?: string;
  tags: string[];
  
  author: {
    _id: string;
    name: string;
    email: string;
  };
  uploadedBy: {
    _id: string;
    name: string;
    email: string;
  };
  
  isPublic: boolean;
  sharedWith: Array<{
    _id: string;
    name: string;
    email: string;
  }>;
  assignedTo: Array<{
    _id: string;
    name: string;
  }>;
  
  version: number;
  isLatestVersion: boolean;
  
  quizData?: {
    questions: Array<{
      question: string;
      options: string[];
      correctAnswer: number;
      explanation?: string;
    }>;
    timeLimit?: number;
    passingScore?: number;
  };
  
  metadata: {
    thumbnailUrl?: string;
    language: string;
    difficulty: string;
    estimatedDuration?: number;
    wordCount?: number;
    pageCount?: number;
  };
  
  stats: {
    views: number;
    downloads: number;
    favorites: number;
    averageRating: number;
    totalRatings: number;
  };
  
  status: string;
  reviewNotes?: string;
  reviewedBy?: {
    _id: string;
    name: string;
  };
  reviewedAt?: string;
  
  userAccess?: {
    isFavorited: boolean;
    rating?: number;
    progress: {
      currentTime: number;
      totalTime: number;
      percentage: number;
      isCompleted: boolean;
      completedAt?: string;
    };
    lastAccessed: string;
    accessCount: number;
  };
  
  formattedDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContentAccessResponse {
  _id: string;
  content: ContentResponse;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  userType: string;
  lastAccessed: string;
  accessCount: number;
  progress: {
    currentTime: number;
    totalTime: number;
    percentage: number;
    isCompleted: boolean;
    completedAt?: string;
    formattedTimeSpent: string;
    formattedTotalTime: string;
  };
  isFavorited: boolean;
  rating?: number;
  review?: string;
  reviewDate?: string;
  downloadCount: number;
  lastDownloaded?: string;
  quizResults?: {
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    timeTaken: number;
    completedAt: string;
    answers: Array<{
      questionIndex: number;
      selectedAnswer: number;
      isCorrect: boolean;
      timeSpent: number;
    }>;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ContentListResponse {
  contents: ContentResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    applied: Record<string, any>;
    available: {
      subjects: Array<{ _id: string; name: string }>;
      types: string[];
      difficulties: string[];
      languages: string[];
      grades: string[];
      tags: string[];
    };
  };
}

export interface ContentStatsResponse {
  totalContents: number;
  totalViews: number;
  totalDownloads: number;
  totalFavorites: number;
  averageRating: number;
  contentsByType: Record<string, number>;
  contentsBySubject: Array<{
    subject: string;
    count: number;
  }>;
  topContents: ContentResponse[];
  recentUploads: ContentResponse[];
  storageUsage: {
    total: number;
    byType: Record<string, number>;
  };
}

// ============================================================================
// UPLOAD TYPES
// ============================================================================

export interface FileUploadResponse {
  fileUrl: string;
  fileKey: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  duration?: number;
}

export interface ContentUploadRequest {
  title: string;
  description?: string;
  type: string;
  subjectId: string;
  topic?: string;
  subtopic?: string;
  grade?: string;
  tags?: string[];
  isPublic?: boolean;
  assignedTo?: string[];
  sharedWith?: string[];
  metadata?: {
    thumbnailUrl?: string;
    language?: string;
    difficulty?: string;
    estimatedDuration?: number;
    wordCount?: number;
    pageCount?: number;
  };
  quizData?: {
    questions: Array<{
      question: string;
      options: string[];
      correctAnswer: number;
      explanation?: string;
    }>;
    timeLimit?: number;
    passingScore?: number;
  };
}

// ============================================================================
// ACCESS CONTROL TYPES
// ============================================================================

export interface ContentAccessRequest {
  contentId: string;
  action: 'view' | 'download' | 'favorite' | 'unfavorite' | 'rate' | 'review' | 'progress';
  data?: {
    rating?: number;
    review?: string;
    progress?: {
      currentTime: number;
      totalTime: number;
    };
    quizResults?: {
      score: number;
      totalQuestions: number;
      correctAnswers: number;
      timeTaken: number;
      answers: Array<{
        questionIndex: number;
        selectedAnswer: number;
        isCorrect: boolean;
        timeSpent: number;
      }>;
    };
  };
}

export interface ContentAssignmentRequest {
  contentId: string;
  batchIds: string[];
  action: 'assign' | 'unassign';
}

export interface ContentSharingRequest {
  contentId: string;
  teacherIds: string[];
  action: 'share' | 'unshare';
}

// ============================================================================
// SEARCH TYPES
// ============================================================================

export interface ContentSearchRequest {
  query: string;
  filters?: {
    subjectId?: string;
    type?: string;
    difficulty?: string;
    language?: string;
    grade?: string;
    tags?: string[];
    dateFrom?: string;
    dateTo?: string;
  };
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ContentSearchResponse {
  results: ContentResponse[];
  suggestions: string[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

export interface ContentAnalyticsRequest {
  contentId?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  groupBy?: 'day' | 'week' | 'month';
}

export interface ContentAnalyticsResponse {
  views: Array<{
    date: string;
    count: number;
  }>;
  downloads: Array<{
    date: string;
    count: number;
  }>;
  engagement: {
    averageTimeSpent: number;
    completionRate: number;
    favoriteRate: number;
    averageRating: number;
  };
  userTypes: {
    students: number;
    teachers: number;
    admins: number;
  };
  topUsers: Array<{
    user: {
      _id: string;
      name: string;
      email: string;
    };
    views: number;
    downloads: number;
    timeSpent: number;
  }>;
}

// ============================================================================
// BULK OPERATION TYPES
// ============================================================================

export interface BulkOperationRequest {
  ids: string[];
  action?: 'status' | 'delete';
  status?: string;
}
