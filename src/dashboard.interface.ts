// Dashboard Module Interface
// This file defines the public interface for the Dashboard module

export interface IDashboardService {
  // Core CRUD operations
  createDashboard(data: DashboardBase): Promise<DashboardDocument>;
  getDashboardById(id: string, populate?: boolean): Promise<DashboardDocument | null>;
  getDashboardByTutor(tutorId: string, batchId?: string, period?: string): Promise<DashboardDocument | null>;
  updateDashboard(id: string, data: DashboardUpdate, populate?: boolean): Promise<DashboardDocument | null>;
  softDeleteDashboard(id: string): Promise<DashboardDocument | null>;
  getAllDashboards(filters?: any, options?: any): Promise<{ dashboards: DashboardDocument[], pagination: any }>;
  
  // Data generation methods
  generateTeacherDashboardData(tutorId: string): Promise<DashboardData>;
  generateBatchDashboardData(batchId: string, tutorId: string): Promise<BatchDashboardData>;
  generateAnalyticsData(tutorId: string, period?: string, batchId?: string): Promise<AnalyticsData>;
}

export interface IDashboardController {
  // Dashboard endpoints
  getTeacherDashboard(req: Request, res: Response): Promise<void>;
  getBatchDashboard(req: Request, res: Response): Promise<void>;
  getAnalytics(req: Request, res: Response): Promise<void>;
  
  // Additional CRUD endpoints (if needed)
  createDashboard(req: Request, res: Response): Promise<void>;
  getDashboardById(req: Request, res: Response): Promise<void>;
  updateDashboard(req: Request, res: Response): Promise<void>;
  deleteDashboard(req: Request, res: Response): Promise<void>;
  getAllDashboards(req: Request, res: Response): Promise<void>;
}

// Re-export types for convenience
export type {
  DashboardBase,
  DashboardDocument,
  DashboardUpdate,
  DashboardQuery,
  DashboardData,
  AnalyticsData,
  BatchDashboardData,
} from '../types/dashboard';

// Re-export schemas for validation
export {
  createDashboardSchema,
  updateDashboardSchema,
  dashboardQuerySchema,
  analyticsQuerySchema,
  batchDashboardQuerySchema,
  dashboardDataSchema,
  batchDashboardDataSchema,
  analyticsDataSchema,
} from '../validators/dashboard';
