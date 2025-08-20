// Fee Module Interface
// This file defines the public interface for the Fee module

import { 
  FeeBase,
  FeeDocument,
  FeeUpdate,
  FeeQuery,
  FeeStats,
  FeeSummary,
  FeePayment,
  FeeBulkOperation,
  FeeReport,
} from './types/fee';
import { Request, Response } from 'express';

export interface IFeeService {
  // Core CRUD operations
  createFee(data: FeeBase): Promise<FeeDocument>;
  getFeeById(id: string, populate?: boolean): Promise<FeeDocument | null>;
  getAllFees(filters?: any, options?: any): Promise<{ fees: FeeDocument[], pagination: any }>;
  updateFee(id: string, data: FeeUpdate, populate?: boolean): Promise<FeeDocument | null>;
  softDeleteFee(id: string): Promise<FeeDocument | null>;
  
  // Payment operations
  processFeePayment(paymentData: FeePayment): Promise<FeeDocument>;
  toggleFeeLock(id: string, isLocked: boolean, updatedBy: string): Promise<FeeDocument | null>;
  
  // Bulk operations
  createBulkFees(bulkData: FeeBulkOperation): Promise<FeeDocument[]>;
  
  // Analytics and reporting
  getFeeStats(filters?: any): Promise<FeeStats>;
  getFeeSummary(filters?: any): Promise<FeeSummary[]>;
  generateFeeReport(filters?: any): Promise<FeeReport>;
  
  // Filtered queries
  getFeesByStudent(studentId: string, populate?: boolean): Promise<FeeDocument[]>;
  getFeesByBatch(batchId: string, populate?: boolean): Promise<FeeDocument[]>;
  checkFeeExists(studentId: string, batchId: string, monthYear: string): Promise<FeeDocument | null>;
}

export interface IFeeController {
  // CRUD endpoints
  create(req: Request, res: Response): Promise<void>;
  getAll(req: Request, res: Response): Promise<void>;
  getById(req: Request, res: Response): Promise<void>;
  update(req: Request, res: Response): Promise<void>;
  softDelete(req: Request, res: Response): Promise<void>;
  
  // Payment endpoints
  processPayment(req: Request, res: Response): Promise<void>;
  toggleLock(req: Request, res: Response): Promise<void>;
  
  // Bulk operations
  createBulk(req: Request, res: Response): Promise<void>;
  
  // Analytics and reports
  getStats(req: Request, res: Response): Promise<void>;
  getSummary(req: Request, res: Response): Promise<void>;
  generateReport(req: Request, res: Response): Promise<void>;
  
  // Filtered queries
  getByStudent(req: Request, res: Response): Promise<void>;
  getByBatch(req: Request, res: Response): Promise<void>;
}

// Re-export types for convenience
export type {
  FeeBase,
  FeeDocument,
  FeeUpdate,
  FeeQuery,
  FeeStats,
  FeeSummary,
  FeePayment,
  FeeBulkOperation,
  FeeReport,
} from './types/fee';

// Re-export schemas for validation
export {
  createFeeSchema,
  updateFeeSchema,
  feeQuerySchema,
  feePaymentSchema,
  bulkFeeSchema,
  feeStatsQuerySchema,
  feeReportQuerySchema,
  feeSummaryQuerySchema,
  feeDataSchema,
  feeStatsSchema,
  feeSummarySchema,
} from './validators/fee';
