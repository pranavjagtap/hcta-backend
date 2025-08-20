import { Document } from "mongoose";

export interface TopicProgressBase {
  studentId: string;
  topicId: string;
  batchId: string;
  subjectId: string;
  status: "not_started" | "in_progress" | "completed" | "review_needed";
  completionPercentage: number;
  timeSpent: number; // in minutes
  lastAccessed: Date;
  completedAt?: Date;
  notes?: string;
  isDeleted?: boolean;
  createdBy: string;
  updatedBy: string;
}

export type TopicProgressUpdate = Partial<TopicProgressBase>;

export interface TopicProgressDocument extends Document, TopicProgressBase {
  createdAt: Date;
  updatedAt: Date;
}

// Interface for topic progress statistics
export interface TopicProgressStats {
  totalTopics: number;
  completedTopics: number;
  inProgressTopics: number;
  notStartedTopics: number;
  reviewNeededTopics: number;
  averageCompletionPercentage: number;
  totalTimeSpent: number; // in minutes
  averageTimePerTopic: number;
}

// Interface for topic progress query parameters
export interface TopicProgressQuery {
  page?: number;
  limit?: number;
  studentId?: string;
  batchId?: string;
  subjectId?: string;
  topicId?: string;
  status?: "not_started" | "in_progress" | "completed" | "review_needed";
  minCompletionPercentage?: number;
  maxCompletionPercentage?: number;
}

// Interface for topic progress response
export interface TopicProgressResponse {
  _id: string;
  studentId: {
    _id: string;
    name: string;
    rollNumber: string;
  };
  topicId: {
    _id: string;
    name: string;
    chapterNumber?: number;
    estimatedHours: number;
    difficultyLevel: string;
  };
  batchId: {
    _id: string;
    name: string;
    academicYear: string;
  };
  subjectId: {
    _id: string;
    name: string;
    board: string;
    classLevel: string;
  };
  status: "not_started" | "in_progress" | "completed" | "review_needed";
  completionPercentage: number;
  timeSpent: number;
  lastAccessed: Date;
  completedAt?: Date;
  notes?: string;
  isDeleted?: boolean;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  updatedBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Interface for topic progress list response
export interface TopicProgressListResponse {
  topicProgress: TopicProgressResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Interface for student topic progress summary
export interface StudentTopicProgressSummary {
  studentId: string;
  studentName: string;
  batchId: string;
  batchName: string;
  subjectId: string;
  subjectName: string;
  totalTopics: number;
  completedTopics: number;
  inProgressTopics: number;
  notStartedTopics: number;
  reviewNeededTopics: number;
  averageCompletionPercentage: number;
  totalTimeSpent: number;
  recentProgress: Array<{
    topicName: string;
    status: string;
    completionPercentage: number;
    lastAccessed: Date;
  }>;
}

// Interface for batch topic progress summary
export interface BatchTopicProgressSummary {
  batchId: string;
  batchName: string;
  subjectId: string;
  subjectName: string;
  totalStudents: number;
  totalTopics: number;
  averageCompletionPercentage: number;
  topicProgressBreakdown: Array<{
    topicName: string;
    completedStudents: number;
    inProgressStudents: number;
    notStartedStudents: number;
    averageCompletionPercentage: number;
  }>;
  studentProgress: Array<{
    studentId: string;
    studentName: string;
    completedTopics: number;
    totalTopics: number;
    completionPercentage: number;
  }>;
}

