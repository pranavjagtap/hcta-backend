// Batch Module API Contracts
// This file defines the request/response interfaces for Batch API endpoints

import { Request, Response } from "express";

// ============================================================================
// REQUEST INTERFACES
// ============================================================================

export interface CreateBatchRequest {
  name: string;
  subjectIds?: string[];
  academicYear?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  classDays: string[];
  maxStudents?: number;
  location?: string;
  isActive?: boolean;
}

export interface UpdateBatchRequest {
  name?: string;
  subjectIds?: string[];
  academicYear?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  classDays?: string[];
  maxStudents?: number;
  location?: string;
  isActive?: boolean;
}

export interface BatchQueryRequest {
  page?: number;
  limit?: number;
  search?: string;
  academicYear?: string;
  isActive?: boolean;
}

export interface AddStudentsToBatchRequest {
  studentIds: string[];
}

export interface RemoveStudentFromBatchRequest {
  studentId: string;
}

export interface BatchDashboardQueryRequest {
  batchId: string;
}

// ============================================================================
// RESPONSE INTERFACES
// ============================================================================

export interface SubjectInfo {
  _id: string;
  name: string;
  board?: string;
  classLevel?: string;
}

export interface StudentInfo {
  _id: string;
  name: string;
  rollNumber?: string;
  parentName?: string;
  whatsappNumber?: string;
}

export interface TutorInfo {
  _id: string;
  name: string;
  email: string;
}

export interface UserInfo {
  _id: string;
  name: string;
}

export interface BatchResponse {
  _id: string;
  tutorId: TutorInfo;
  name: string;
  subjectIds: SubjectInfo[];
  studentIds: StudentInfo[];
  academicYear?: string;
  startDate?: Date;
  endDate?: Date;
  classDays: string[];
  maxStudents?: number;
  location?: string;
  isActive: boolean;
  isDeleted?: boolean;
  createdBy: UserInfo;
  updatedBy: UserInfo;
  createdAt: Date;
  updatedAt: Date;
}

export interface BatchListResponse {
  batches: BatchResponse[];
  pagination: {
    current: number;
    pages: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface BatchStatsResponse {
  totalBatches: number;
  activeBatches: number;
  totalStudents: number;
  averageStudentsPerBatch: number;
  batchesByAcademicYear: Array<{
    academicYear: string;
    count: number;
  }>;
}

export interface BatchDashboardResponse {
  batchInfo: {
    _id: string;
    name: string;
    academicYear?: string;
    totalStudents: number;
    maxStudents?: number;
  };
  recentAssignments: Array<{
    _id: string;
    title: string;
    dueDate: Date;
    submissionsCount: number;
  }>;
  recentSubmissions: Array<{
    _id: string;
    assignmentTitle: string;
    studentName: string;
    submittedAt: Date;
    status: string;
  }>;
  attendanceStats: {
    totalSessions: number;
    averageAttendance: number;
    lastSessionDate?: Date;
  };
  performanceStats: {
    averageScore: number;
    totalAssignments: number;
    completedAssignments: number;
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

export type CreateBatchResponse = ApiResponse<BatchResponse>;
export type GetBatchResponse = ApiResponse<BatchResponse>;
export type GetBatchesResponse = ApiResponse<BatchListResponse>;
export type UpdateBatchResponse = ApiResponse<BatchResponse>;
export type DeleteBatchResponse = ApiResponse<{ message: string }>;
export type AddStudentsToBatchResponse = ApiResponse<BatchResponse>;
export type RemoveStudentFromBatchResponse = ApiResponse<BatchResponse>;
export type GetBatchDashboardResponse = ApiResponse<BatchDashboardResponse>;

// ============================================================================
// CONTROLLER INTERFACES (for internal use)
// ============================================================================

export interface IBatchController {
  createBatchController(req: Request<{}, {}, CreateBatchRequest>, res: Response): Promise<void>;
  getTutorBatches(req: Request<{}, {}, {}, BatchQueryRequest>, res: Response): Promise<void>;
  getBatchByIdController(req: Request<{ id: string }>, res: Response): Promise<void>;
  updateBatchController(req: Request<{ id: string }, {}, UpdateBatchRequest>, res: Response): Promise<void>;
  addStudentsToBatchController(req: Request<{ id: string }, {}, AddStudentsToBatchRequest>, res: Response): Promise<void>;
  removeStudentFromBatchController(req: Request<{ id: string; studentId: string }>, res: Response): Promise<void>;
  deleteBatch(req: Request<{ id: string }>, res: Response): Promise<void>;
  getBatchDashboard(req: Request<{ id: string }>, res: Response): Promise<void>;
}
