// Dashboard Module API Contracts
// This file defines the request/response interfaces for Dashboard API endpoints

import { Request, Response } from "express";

// ============================================================================
// REQUEST INTERFACES
// ============================================================================

export interface CreateDashboardRequest {
  tutorId: string;
  batchId?: string;
  period?: "day" | "week" | "month" | "quarter" | "year";
  data: DashboardDataRequest;
  lastUpdated?: string | Date;
}

export interface UpdateDashboardRequest {
  period?: "day" | "week" | "month" | "quarter" | "year";
  data?: DashboardDataRequest;
  lastUpdated?: string | Date;
}

export interface DashboardQueryRequest {
  tutorId?: string;
  batchId?: string;
  period?: "day" | "week" | "month" | "quarter" | "year";
  page?: number;
  limit?: number;
}

export interface AnalyticsQueryRequest {
  period?: "week" | "month" | "quarter" | "year";
  batchId?: string;
}

export interface BatchDashboardQueryRequest {
  batchId: string;
}

// ============================================================================
// REQUEST DATA STRUCTURES
// ============================================================================

export interface DashboardDataRequest {
  overview: {
    totalBatches: number;
    totalStudents: number;
    monthlyAssignments: number;
    monthlyTeachingSessions: number;
    monthlyNotes: number;
  };
  today: {
    totalSessions: number;
    completedSessions: number;
    pendingSessions: number;
    schedule: any[];
  };
  thisWeek: {
    totalSessions: number;
    completedSessions: number;
    completionRate: number;
  };
  upcoming: {
    assignments: any[];
  };
  recent: {
    submissions: any[];
    notes: any[];
  };
  pending: {
    submissions: any[];
  };
  performance: {
    batchOverview: any[];
  };
  batches: any[];
}

// ============================================================================
// RESPONSE INTERFACES
// ============================================================================

export interface TutorInfo {
  _id: string;
  name: string;
  email: string;
}

export interface BatchInfo {
  _id: string;
  name: string;
  academicYear?: string;
}

export interface DashboardResponse {
  _id: string;
  tutorId: TutorInfo;
  batchId?: BatchInfo;
  period: "day" | "week" | "month" | "quarter" | "year";
  data: DashboardDataResponse;
  lastUpdated: Date;
  isDeleted?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardDataResponse {
  overview: {
    totalBatches: number;
    totalStudents: number;
    monthlyAssignments: number;
    monthlyTeachingSessions: number;
    monthlyNotes: number;
  };
  today: {
    totalSessions: number;
    completedSessions: number;
    pendingSessions: number;
    schedule: any[];
  };
  thisWeek: {
    totalSessions: number;
    completedSessions: number;
    completionRate: number;
  };
  upcoming: {
    assignments: any[];
  };
  recent: {
    submissions: any[];
    notes: any[];
  };
  pending: {
    submissions: any[];
  };
  performance: {
    batchOverview: any[];
  };
  batches: any[];
}

export interface DashboardListResponse {
  dashboards: DashboardResponse[];
  pagination: {
    current: number;
    pages: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface TeacherDashboardResponse {
  overview: {
    totalBatches: number;
    totalStudents: number;
    monthlyAssignments: number;
    monthlyTeachingSessions: number;
    monthlyNotes: number;
  };
  today: {
    totalSessions: number;
    completedSessions: number;
    pendingSessions: number;
    schedule: any[];
  };
  thisWeek: {
    totalSessions: number;
    completedSessions: number;
    completionRate: number;
  };
  upcoming: {
    assignments: any[];
  };
  recent: {
    submissions: any[];
    notes: any[];
  };
  pending: {
    submissions: any[];
  };
  performance: {
    batchOverview: any[];
  };
  batches: any[];
}

export interface BatchDashboardResponse {
  batch: {
    _id: string;
    name: string;
    academicYear: string;
    totalStudents: number;
    totalSubjects: number;
    subjects: any[];
    students: any[];
  };
  recent: {
    teachingLogs: any[];
    submissions: any[];
    notes: any[];
  };
  upcoming: {
    assignments: any[];
  };
  performance: {
    stats: {
      totalAssessments: number;
      averageScore: number;
      studentsAssessed: number;
    };
    studentPerformances: any[];
  };
  attendance: {
    totalSessions: number;
    totalDuration: number;
  };
  quickStats: {
    totalTeachingLogs: number;
    totalAssignments: number;
    totalNotes: number;
    recentSubmissions: number;
  };
}

export interface AnalyticsResponse {
  period: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  trends: {
    teaching: any[];
    assignments: any[];
    performance: any[];
  };
  distributions: {
    submissions: any[];
    subjects: any[];
  };
}

// ============================================================================
// API RESPONSE WRAPPERS
// ============================================================================

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: any;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================================================
// SPECIFIC API RESPONSES
// ============================================================================

export type CreateDashboardResponse = ApiResponse<DashboardResponse>;
export type GetDashboardResponse = ApiResponse<DashboardResponse>;
export type GetDashboardsResponse = ApiResponse<DashboardListResponse>;
export type UpdateDashboardResponse = ApiResponse<DashboardResponse>;
export type DeleteDashboardResponse = ApiResponse<{ message: string }>;
export type GetTeacherDashboardResponse = ApiResponse<TeacherDashboardResponse>;
export type GetBatchDashboardResponse = ApiResponse<BatchDashboardResponse>;
export type GetAnalyticsResponse = ApiResponse<AnalyticsResponse>;

// ============================================================================
// CONTROLLER INTERFACES (for internal use)
// ============================================================================

export interface IDashboardController {
  getTeacherDashboard(req: Request, res: Response): Promise<void>;
  getBatchDashboard(req: Request<{ batchId: string }>, res: Response): Promise<void>;
  getAnalytics(req: Request<{}, {}, {}, AnalyticsQueryRequest>, res: Response): Promise<void>;
  createDashboardData(req: Request<{}, {}, CreateDashboardRequest>, res: Response): Promise<void>;
  getDashboardById(req: Request<{ id: string }>, res: Response): Promise<void>;
  updateDashboardData(req: Request<{ id: string }, {}, UpdateDashboardRequest>, res: Response): Promise<void>;
  deleteDashboard(req: Request<{ id: string }>, res: Response): Promise<void>;
  getAllDashboardsData(req: Request<{}, {}, {}, DashboardQueryRequest>, res: Response): Promise<void>;
}
