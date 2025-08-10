// Central export file for all API interface contracts and common types

// ===== MODULE INTERFACES =====

// User Module
export * from "./user.interface";

// Batch Module
export * from "./batch.interface";

// Student Module
export * from "./student.interface";

// Subject Module
export * from "./subject.interface";

// Fee Module
export * from "./fee.interface";

// Dashboard Module
export * from "./dashboard.interface";

// Note Module
export * from "./note.interface";

// Assignment Module
export * from "./assignment.interface";

// Submission Module
export * from "./submission.interface";

// Performance Module
export * from "./performance.interface";

// TeachingLog Module
export * from "./teachingLog.interface";

// ===== COMMON TYPES =====

export interface PaginationInfo {
  current: number;
  pages: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: any;
}

export interface QueryFilters {
  page?: number;
  limit?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface SoftDeleteEntity {
  isDeleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserReference {
  _id: string;
  name: string;
  email?: string;
}

export interface BatchReference {
  _id: string;
  name: string;
  academicYear?: string;
}

export interface StudentReference {
  _id: string;
  name: string;
  rollNumber?: string;
}

export interface SubjectReference {
  _id: string;
  name: string;
  board?: string;
  classLevel?: string;
}

// ===== STATUS TYPES =====

export type UserStatus = "active" | "inactive";
export type UserRole = "admin" | "tutor" | "student";
export type BatchStatus = "active" | "inactive";
export type StudentStatus = "active" | "inactive";
export type SubjectStatus = "active" | "inactive";
export type FeeStatus = "pending" | "paid" | "overdue" | "cancelled";
export type NoteStatus = "draft" | "published" | "archived";
export type AssignmentStatus = "pending" | "approved" | "locked";
export type SubmissionStatus = "submitted" | "checked" | "late";

// ===== VALIDATION TYPES =====

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ValidationResponse {
  isValid: boolean;
  errors?: ValidationError[];
}

// ===== AUTHENTICATION TYPES =====

export interface AuthUser {
  _id: string;
  uid: string;
  name?: string;
  email?: string;
  role: string;
  permissions?: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: true;
  data: {
    user: AuthUser;
    token: string;
    refreshToken?: string;
  };
  message: string;
}

export interface LogoutResponse {
  success: true;
  message: string;
}

// ===== ERROR TYPES =====

export interface ApiError {
  success: false;
  error: string;
  details?: any;
  code?: string;
}

export interface NotFoundError extends ApiError {
  error: "Resource not found";
  code: "NOT_FOUND";
}

export interface ValidationErrorResponse extends ApiError {
  error: "Validation failed";
  details: ValidationError[];
  code: "VALIDATION_ERROR";
}

export interface UnauthorizedError extends ApiError {
  error: "Unauthorized";
  code: "UNAUTHORIZED";
}

export interface ForbiddenError extends ApiError {
  error: "Access denied";
  code: "FORBIDDEN";
}

export interface InternalServerError extends ApiError {
  error: "Internal server error";
  code: "INTERNAL_ERROR";
}
