// Student Module API Contracts
// This file defines the request/response interfaces for Student API endpoints

import { Request, Response } from "express";

// ============================================================================
// REQUEST INTERFACES
// ============================================================================

export interface CreateStudentRequest {
  name: string;
  parentName?: string;
  parentPhone?: string;
  whatsappNumber?: string;
  schoolName?: string;
  board?: string;
  classLevel?: string;
  batchId?: string;
  weaknesses?: string[];
  rollNumber?: string;
  admissionDate?: string | Date;
}

export interface UpdateStudentRequest {
  name?: string;
  parentName?: string;
  parentPhone?: string;
  whatsappNumber?: string;
  schoolName?: string;
  board?: string;
  classLevel?: string;
  batchId?: string;
  weaknesses?: string[];
  rollNumber?: string;
  admissionDate?: string | Date;
}

export interface StudentQueryRequest {
  page?: number;
  limit?: number;
  search?: string;
  batchId?: string;
  board?: string;
  classLevel?: string;
}

export interface AddWeaknessRequest {
  weakness: string;
}

export interface RemoveWeaknessRequest {
  weakness: string;
}

// ============================================================================
// RESPONSE INTERFACES
// ============================================================================

export interface BatchInfo {
  _id: string;
  name: string;
  academicYear?: string;
}

export interface StudentResponse {
  _id: string;
  name: string;
  parentName?: string;
  parentPhone?: string;
  whatsappNumber?: string;
  schoolName?: string;
  board?: string;
  classLevel?: string;
  batchId?: BatchInfo;
  weaknesses: string[];
  rollNumber?: string;
  admissionDate?: Date;
  isDeleted?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentListResponse {
  students: StudentResponse[];
  pagination: {
    current: number;
    pages: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface StudentStatsResponse {
  totalStudents: number;
  assignedStudents: number;
  unassignedStudents: number;
  studentsByBoard: Array<{
    board: string;
    count: number;
  }>;
  studentsByClassLevel: Array<{
    classLevel: string;
    count: number;
  }>;
  recentAdmissions: number;
}

export interface UnassignedStudentsResponse {
  students: Array<{
    _id: string;
    name: string;
    parentName?: string;
    schoolName?: string;
    board?: string;
    classLevel?: string;
    rollNumber?: string;
    admissionDate?: Date;
  }>;
  total: number;
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

export type CreateStudentResponse = ApiResponse<StudentResponse>;
export type GetStudentResponse = ApiResponse<StudentResponse>;
export type GetStudentsResponse = ApiResponse<StudentListResponse>;
export type UpdateStudentResponse = ApiResponse<StudentResponse>;
export type DeleteStudentResponse = ApiResponse<{ message: string }>;
export type AddWeaknessResponse = ApiResponse<StudentResponse>;
export type RemoveWeaknessResponse = ApiResponse<StudentResponse>;
export type GetStudentStatsResponse = ApiResponse<StudentStatsResponse>;
export type GetUnassignedStudentsResponse = ApiResponse<UnassignedStudentsResponse>;

// ============================================================================
// CONTROLLER INTERFACES (for internal use)
// ============================================================================

export interface IStudentController {
  createStudentController(req: Request<{}, {}, CreateStudentRequest>, res: Response): Promise<void>;
  getTutorStudentsController(req: Request<{}, {}, {}, StudentQueryRequest>, res: Response): Promise<void>;
  getStudentByIdController(req: Request<{ id: string }>, res: Response): Promise<void>;
  updateStudentController(req: Request<{ id: string }, {}, UpdateStudentRequest>, res: Response): Promise<void>;
  addWeaknessController(req: Request<{ id: string }, {}, AddWeaknessRequest>, res: Response): Promise<void>;
  removeWeaknessController(req: Request<{ id: string }, {}, RemoveWeaknessRequest>, res: Response): Promise<void>;
  deleteStudent(req: Request<{ id: string }>, res: Response): Promise<void>;
  getStudentStatsController(req: Request, res: Response): Promise<void>;
  getUnassignedStudentsController(req: Request, res: Response): Promise<void>;
}
