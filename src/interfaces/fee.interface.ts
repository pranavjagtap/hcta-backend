// Fee Module API Contracts
// This file defines the request/response interfaces for Fee API endpoints

import { Request, Response } from "express";

// ============================================================================
// REQUEST INTERFACES
// ============================================================================

export interface CreateFeeRequest {
  studentId: string;
  batchId: string;
  monthYear: string;
  amountDue: number;
  amountPaid?: number;
  paymentStatus?: "paid" | "partial" | "unpaid";
  paymentMode?: string;
  paymentDate?: string | Date;
  receiptNumber?: string;
  isLocked?: boolean;
}

export interface UpdateFeeRequest {
  studentId?: string;
  batchId?: string;
  monthYear?: string;
  amountDue?: number;
  amountPaid?: number;
  paymentStatus?: "paid" | "partial" | "unpaid";
  paymentMode?: string;
  paymentDate?: string | Date;
  receiptNumber?: string;
  isLocked?: boolean;
}

export interface FeeQueryRequest {
  studentId?: string;
  batchId?: string;
  monthYear?: string;
  paymentStatus?: "paid" | "partial" | "unpaid";
  isLocked?: boolean;
  page?: number;
  limit?: number;
  search?: string;
}

export interface FeePaymentRequest {
  feeId: string;
  amount: number;
  paymentMode: string;
  receiptNumber?: string;
  paymentDate?: string | Date;
}

export interface BulkFeeRequest {
  studentIds: string[];
  batchId: string;
  monthYear: string;
  amountDue: number;
}

export interface FeeStatsQueryRequest {
  batchId?: string;
  monthYear?: string;
  startDate?: string;
  endDate?: string;
}

export interface FeeReportQueryRequest {
  period?: "month" | "quarter" | "year";
  batchId?: string;
  startDate?: string;
  endDate?: string;
}

export interface FeeSummaryQueryRequest {
  studentId?: string;
  batchId?: string;
  includeOutstanding?: boolean;
}

export interface ToggleLockRequest {
  isLocked: boolean;
}

// ============================================================================
// RESPONSE INTERFACES
// ============================================================================

export interface StudentInfo {
  _id: string;
  name: string;
  rollNumber?: string;
}

export interface BatchInfo {
  _id: string;
  name: string;
  academicYear?: string;
}

export interface UserInfo {
  _id: string;
  name: string;
}

export interface FeeResponse {
  _id: string;
  studentId: StudentInfo;
  batchId: BatchInfo;
  monthYear: string;
  amountDue: number;
  amountPaid: number;
  paymentStatus: "paid" | "partial" | "unpaid";
  paymentMode?: string;
  paymentDate?: Date;
  receiptNumber?: string;
  isLocked: boolean;
  isDeleted?: boolean;
  createdBy: UserInfo;
  updatedBy: UserInfo;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeeListResponse {
  fees: FeeResponse[];
  pagination: {
    current: number;
    pages: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface FeeStatsResponse {
  totalFees: number;
  totalAmountDue: number;
  totalAmountPaid: number;
  totalOutstanding: number;
  paidCount: number;
  partialCount: number;
  unpaidCount: number;
  paymentRate: number;
}

export interface FeeSummaryResponse {
  studentId: string;
  studentName: string;
  batchId: string;
  batchName: string;
  totalFees: number;
  totalPaid: number;
  totalOutstanding: number;
  lastPaymentDate?: Date;
  paymentStatus: "paid" | "partial" | "unpaid";
}

export interface FeeReportResponse {
  period: string;
  totalStudents: number;
  totalAmountDue: number;
  totalAmountPaid: number;
  totalOutstanding: number;
  paymentRate: number;
  monthlyBreakdown: Array<{
    month: string;
    amountDue: number;
    amountPaid: number;
    outstanding: number;
  }>;
  statusBreakdown: Array<{
    status: string;
    count: number;
    amount: number;
  }>;
}

export interface BulkFeeResponse {
  created: number;
  failed: number;
  fees: FeeResponse[];
  errors?: Array<{
    studentId: string;
    error: string;
  }>;
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

export type CreateFeeResponse = ApiResponse<FeeResponse>;
export type GetFeeResponse = ApiResponse<FeeResponse>;
export type GetFeesResponse = ApiResponse<FeeListResponse>;
export type UpdateFeeResponse = ApiResponse<FeeResponse>;
export type DeleteFeeResponse = ApiResponse<{ message: string }>;
export type ProcessPaymentResponse = ApiResponse<FeeResponse>;
export type ToggleLockResponse = ApiResponse<FeeResponse>;
export type CreateBulkFeeResponse = ApiResponse<BulkFeeResponse>;
export type GetFeeStatsResponse = ApiResponse<FeeStatsResponse>;
export type GetFeeSummaryResponse = ApiResponse<FeeSummaryResponse[]>;
export type GenerateFeeReportResponse = ApiResponse<FeeReportResponse>;
export type GetFeesByStudentResponse = ApiResponse<FeeResponse[]>;
export type GetFeesByBatchResponse = ApiResponse<FeeResponse[]>;

// ============================================================================
// CONTROLLER INTERFACES (for internal use)
// ============================================================================

export interface IFeeController {
  create(req: Request<{}, {}, CreateFeeRequest>, res: Response): Promise<void>;
  getAll(req: Request<{}, {}, {}, FeeQueryRequest>, res: Response): Promise<void>;
  getById(req: Request<{ id: string }>, res: Response): Promise<void>;
  update(req: Request<{ id: string }, {}, UpdateFeeRequest>, res: Response): Promise<void>;
  softDelete(req: Request<{ id: string }>, res: Response): Promise<void>;
  processPayment(req: Request<{}, {}, FeePaymentRequest>, res: Response): Promise<void>;
  toggleLock(req: Request<{ id: string }, {}, ToggleLockRequest>, res: Response): Promise<void>;
  createBulk(req: Request<{}, {}, BulkFeeRequest>, res: Response): Promise<void>;
  getStats(req: Request<{}, {}, {}, FeeStatsQueryRequest>, res: Response): Promise<void>;
  getSummary(req: Request<{}, {}, {}, FeeSummaryQueryRequest>, res: Response): Promise<void>;
  generateReport(req: Request<{}, {}, {}, FeeReportQueryRequest>, res: Response): Promise<void>;
  getByStudent(req: Request<{ studentId: string }>, res: Response): Promise<void>;
  getByBatch(req: Request<{ batchId: string }>, res: Response): Promise<void>;
}
