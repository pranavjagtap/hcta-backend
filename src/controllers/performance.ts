import { Request, Response, NextFunction } from 'express';
import { PerformanceService } from '../services/performance';
import { AppError } from '../utils/appError';
import { sendResponse } from '../utils/response';
import { logger } from '../utils/logger';
import {
  createPerformanceSchema,
  updatePerformanceSchema,
  performanceQuerySchema,
  performanceIdSchema,
  createAttendanceSchema,
  updateAttendanceSchema,
  attendanceQuerySchema,
  attendanceIdSchema,
  bulkAttendanceSchema,
  createPerformanceAnalyticsSchema,
  updatePerformanceAnalyticsSchema,
  performanceAnalyticsQuerySchema,
  performanceAnalyticsIdSchema,
  createPerformanceReportSchema,
  updatePerformanceReportSchema,
  performanceReportQuerySchema,
  performanceReportIdSchema,
  createPerformanceAlertSchema,
  updatePerformanceAlertSchema,
  performanceAlertQuerySchema,
  performanceAlertIdSchema,
  recordPerformanceRequestSchema,
  recordAttendanceRequestSchema,
  generateReportRequestSchema,
  sendAlertRequestSchema,
  bulkPerformanceUploadSchema,
  bulkAttendanceUploadSchema,
  performanceStatsQuerySchema,
  attendanceStatsQuerySchema,
  analyticsStatsQuerySchema,
  alertStatsQuerySchema
} from '../validators/performance';

/**
 * Performance Records Controllers
 */
export const createPerformanceController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = createPerformanceSchema.parse({
      ...req.body,
      createdBy: (req as any).user?._id,
      updatedBy: (req as any).user?._id
    });

    const performance = await PerformanceService.createPerformance(validatedData);
    
    sendResponse(res, performance, 'Performance record created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const getPerformancesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedQuery = performanceQuerySchema.parse(req.query);
    const performances = await PerformanceService.getPerformances(validatedQuery);
    
    sendResponse(res, performances, 'Performances retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

export const getPerformanceByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = performanceIdSchema.parse(req.params);
    const performance = await PerformanceService.getPerformanceById(id);
    
    sendResponse(res, performance, 'Performance record retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

export const updatePerformanceController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = performanceIdSchema.parse(req.params);
    const validatedData = updatePerformanceSchema.parse({
      ...req.body,
      updatedBy: (req as any).user?._id
    });

    const performance = await PerformanceService.updatePerformance(id, validatedData);
    
    sendResponse(res, performance, 'Performance record updated successfully', 200);
  } catch (error) {
    next(error);
  }
};

export const deletePerformanceController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = performanceIdSchema.parse(req.params);
    await PerformanceService.deletePerformance(id);
    
    sendResponse(res, null, 'Performance record deleted successfully', 200);
  } catch (error) {
    next(error);
  }
};

export const recordPerformanceController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = recordPerformanceRequestSchema.parse(req.body);
    
    // Convert string dates to Date objects
    const performanceData = {
      ...validatedData,
      assessmentDate: new Date(validatedData.assessmentDate),
      submittedDate: validatedData.submittedDate ? new Date(validatedData.submittedDate) : undefined,
      createdBy: (req as any).user?._id,
      updatedBy: (req as any).user?._id
    };

    const performance = await PerformanceService.createPerformance(performanceData as any);
    
    sendResponse(res, performance, 'Performance recorded successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const bulkUploadPerformancesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = bulkPerformanceUploadSchema.parse(req.body);
    const results = [];

    for (const performanceData of validatedData.performances) {
      try {
        const data = {
          ...performanceData,
          assessmentDate: new Date(performanceData.assessmentDate),
          submittedDate: performanceData.submittedDate ? new Date(performanceData.submittedDate) : undefined,
          createdBy: (req as any).user?._id,
          updatedBy: (req as any).user?._id
        };

        const performance = await PerformanceService.createPerformance(data as any);
        results.push({ success: true, data: performance });
      } catch (error) {
        results.push({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error',
          data: performanceData
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    sendResponse(res, {
      results,
      summary: { successCount, failureCount, total: results.length }
    }, `Bulk upload completed. ${successCount} successful, ${failureCount} failed`, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Attendance Controllers
 */
export const createAttendanceController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = createAttendanceSchema.parse({
      ...req.body,
      markedBy: (req as any).user?._id
    });

    const attendance = await PerformanceService.createAttendance(validatedData);
    
    sendResponse(res, attendance, 'Attendance recorded successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const getAttendanceController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedQuery = attendanceQuerySchema.parse(req.query);
    const attendance = await PerformanceService.getAttendance(validatedQuery);
    
    sendResponse(res, attendance, 'Attendance records retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

export const getAttendanceByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = attendanceIdSchema.parse(req.params);
    const attendance = await (PerformanceService as any).getAttendanceById?.(id);
    
    sendResponse(res, attendance, 'Attendance record retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

export const updateAttendanceController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = attendanceIdSchema.parse(req.params);
    const validatedData = updateAttendanceSchema.parse(req.body);

    const attendance = await (PerformanceService as any).updateAttendance?.(id, validatedData);
    
    sendResponse(res, attendance, 'Attendance record updated successfully', 200);
  } catch (error) {
    next(error);
  }
};

export const deleteAttendanceController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = attendanceIdSchema.parse(req.params);
    await (PerformanceService as any).deleteAttendance?.(id);
    
    sendResponse(res, null, 'Attendance record deleted successfully', 200);
  } catch (error) {
    next(error);
  }
};

export const recordAttendanceController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = recordAttendanceRequestSchema.parse(req.body);
    
    const attendanceData = {
      ...validatedData,
      date: new Date(validatedData.date),
      markedBy: (req as any).user?._id
    };

    const attendance = await PerformanceService.createAttendance(attendanceData);
    
    sendResponse(res, attendance, 'Attendance recorded successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const bulkCreateAttendanceController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = bulkAttendanceSchema.parse(req.body);
    const attendance = await PerformanceService.bulkCreateAttendance(validatedData);
    
    sendResponse(res, attendance, 'Bulk attendance recorded successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const bulkUploadAttendanceController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = bulkAttendanceUploadSchema.parse(req.body);
    const results = [];

    for (const attendanceData of validatedData.attendance) {
      try {
        const data = {
          ...attendanceData,
          date: new Date(attendanceData.date),
          markedBy: (req as any).user?._id
        };

        const attendance = await PerformanceService.createAttendance(data);
        results.push({ success: true, data: attendance });
      } catch (error) {
        results.push({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error',
          data: attendanceData
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    sendResponse(res, {
      results,
      summary: { successCount, failureCount, total: results.length }
    }, `Bulk attendance upload completed. ${successCount} successful, ${failureCount} failed`, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Performance Analytics Controllers
 */
export const createPerformanceAnalyticsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = createPerformanceAnalyticsSchema.parse({
      ...req.body,
      createdBy: (req as any).user?._id,
      updatedBy: (req as any).user?._id
    });

    const analytics = await PerformanceService.createPerformanceAnalytics(validatedData);
    
    sendResponse(res, analytics, 'Performance analytics created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const getPerformanceAnalyticsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedQuery = performanceAnalyticsQuerySchema.parse(req.query);
    const analytics = await PerformanceService.getPerformanceAnalytics(validatedQuery);
    
    sendResponse(res, analytics, 'Performance analytics retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

export const getPerformanceAnalyticsByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = performanceAnalyticsIdSchema.parse(req.params);
    const analytics = await (PerformanceService as any).getPerformanceAnalyticsById?.(id);
    
    sendResponse(res, analytics, 'Performance analytics retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

export const updatePerformanceAnalyticsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = performanceAnalyticsIdSchema.parse(req.params);
    const validatedData = updatePerformanceAnalyticsSchema.parse({
      ...req.body,
      updatedBy: (req as any).user?._id
    });

    const analytics = await (PerformanceService as any).updatePerformanceAnalytics?.(id, validatedData);
    
    sendResponse(res, analytics, 'Performance analytics updated successfully', 200);
  } catch (error) {
    next(error);
  }
};

export const deletePerformanceAnalyticsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = performanceAnalyticsIdSchema.parse(req.params);
    await (PerformanceService as any).deletePerformanceAnalytics?.(id);
    
    sendResponse(res, null, 'Performance analytics deleted successfully', 200);
  } catch (error) {
    next(error);
  }
};

export const updateStudentAnalyticsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { studentId, academicYear } = req.params;
    
    if (!studentId || !academicYear) {
      throw new AppError('Student ID and Academic Year are required', 400);
    }

    await PerformanceService.updateStudentAnalytics(studentId, academicYear);
    
    sendResponse(res, 200, 'Student analytics updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Performance Reports Controllers
 */
export const generatePerformanceReportController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = generateReportRequestSchema.parse(req.body);
    const report = await PerformanceService.generatePerformanceReport(validatedData);
    
    sendResponse(res, report, 'Performance report generation started successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const getPerformanceReportsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedQuery = performanceReportQuerySchema.parse(req.query);
    const reports = await PerformanceService.getPerformanceReports(validatedQuery);
    
    sendResponse(res, reports, 'Performance reports retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

export const getPerformanceReportByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = performanceReportIdSchema.parse(req.params);
    const report = await (PerformanceService as any).getPerformanceReportById?.(id);
    
    sendResponse(res, report, 'Performance report retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

export const updatePerformanceReportController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = performanceReportIdSchema.parse(req.params);
    const validatedData = updatePerformanceReportSchema.parse(req.body);

    const report = await (PerformanceService as any).updatePerformanceReport?.(id, validatedData);
    
    sendResponse(res, report, 'Performance report updated successfully', 200);
  } catch (error) {
    next(error);
  }
};

export const deletePerformanceReportController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = performanceReportIdSchema.parse(req.params);
    await (PerformanceService as any).deletePerformanceReport?.(id);
    
    sendResponse(res, null, 'Performance report deleted successfully', 200);
  } catch (error) {
    next(error);
  }
};

export const retryReportGenerationController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = performanceReportIdSchema.parse(req.params);
    const report = await (PerformanceService as any).retryReportGeneration?.(id);
    
    sendResponse(res, report, 'Report generation retry initiated successfully', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Performance Alerts Controllers
 */
export const createPerformanceAlertController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = createPerformanceAlertSchema.parse({
      ...req.body,
      createdBy: (req as any).user?._id
    });

    const alert = await PerformanceService.createPerformanceAlert(validatedData);
    
    sendResponse(res, alert, 'Performance alert created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const getPerformanceAlertsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedQuery = performanceAlertQuerySchema.parse(req.query);
    const alerts = await PerformanceService.getPerformanceAlerts(validatedQuery);
    
    sendResponse(res, alerts, 'Performance alerts retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

export const getPerformanceAlertByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = performanceAlertIdSchema.parse(req.params);
    const alert = await (PerformanceService as any).getPerformanceAlertById?.(id);
    
    sendResponse(res, alert, 'Performance alert retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

export const updatePerformanceAlertController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = performanceAlertIdSchema.parse(req.params);
    const validatedData = updatePerformanceAlertSchema.parse(req.body);

    const alert = await (PerformanceService as any).updatePerformanceAlert?.(id, validatedData);
    
    sendResponse(res, alert, 'Performance alert updated successfully', 200);
  } catch (error) {
    next(error);
  }
};

export const deletePerformanceAlertController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = performanceAlertIdSchema.parse(req.params);
    await (PerformanceService as any).deletePerformanceAlert?.(id);
    
    sendResponse(res, null, 'Performance alert deleted successfully', 200);
  } catch (error) {
    next(error);
  }
};

export const sendAlertController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = sendAlertRequestSchema.parse(req.body);
    const alert = await (PerformanceService as any).sendAlert?.(validatedData);
    
    sendResponse(res, alert, 'Alert sent successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const markAlertAsReadController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = performanceAlertIdSchema.parse(req.params);
    const alert = await (PerformanceService as any).markAlertAsRead?.(id, (req as any).user?._id);
    
    sendResponse(res, alert, 'Alert marked as read successfully', 200);
  } catch (error) {
    next(error);
  }
};

export const acknowledgeAlertController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = performanceAlertIdSchema.parse(req.params);
    const alert = await (PerformanceService as any).acknowledgeAlert?.(id, (req as any).user?._id);
    
    sendResponse(res, alert, 'Alert acknowledged successfully', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Statistics Controllers
 */
export const getPerformanceStatsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedQuery = performanceStatsQuerySchema.parse(req.query);
    const stats = await PerformanceService.getPerformanceStats(validatedQuery);
    
    sendResponse(res, stats, 'Performance statistics retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

export const getAttendanceStatsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedQuery = attendanceStatsQuerySchema.parse(req.query);
    const stats = await PerformanceService.getAttendanceStats(validatedQuery);
    
    sendResponse(res, stats, 'Attendance statistics retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

export const getAnalyticsStatsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedQuery = analyticsStatsQuerySchema.parse(req.query);
    const stats = await (PerformanceService as any).getAnalyticsStats?.(validatedQuery);
    
    sendResponse(res, stats, 'Analytics statistics retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

export const getAlertStatsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedQuery = alertStatsQuerySchema.parse(req.query);
    const stats = await (PerformanceService as any).getAlertStats?.(validatedQuery);
    
    sendResponse(res, stats, 'Alert statistics retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Dashboard Controllers
 */
export const getPerformanceDashboardController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { studentId, academicYear } = req.query;
    
    if (!studentId || !academicYear) {
      throw new AppError('Student ID and Academic Year are required', 400);
    }

    const dashboard = await (PerformanceService as any).getPerformanceDashboard?.(
      studentId as string,
      academicYear as string
    );
    
    sendResponse(res, dashboard, 'Performance dashboard retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

export const getClassPerformanceController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { classId, academicYear } = req.query;
    
    if (!classId || !academicYear) {
      throw new AppError('Class ID and Academic Year are required', 400);
    }

    const classPerformance = await (PerformanceService as any).getClassPerformance?.(
      classId as string,
      academicYear as string
    );
    
    sendResponse(res, classPerformance, 'Class performance retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

export const getBatchPerformanceController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { batchId, academicYear } = req.query;
    
    if (!batchId || !academicYear) {
      throw new AppError('Batch ID and Academic Year are required', 400);
    }

    const batchPerformance = await (PerformanceService as any).getBatchPerformance?.(
      batchId as string,
      academicYear as string
    );
    
    sendResponse(res, batchPerformance, 'Batch performance retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};
