import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import {
  // Performance Records Controllers
  createPerformanceController,
  getPerformancesController,
  getPerformanceByIdController,
  updatePerformanceController,
  deletePerformanceController,
  recordPerformanceController,
  bulkUploadPerformancesController,
  
  // Attendance Controllers
  createAttendanceController,
  getAttendanceController,
  getAttendanceByIdController,
  updateAttendanceController,
  deleteAttendanceController,
  recordAttendanceController,
  bulkCreateAttendanceController,
  bulkUploadAttendanceController,
  
  // Performance Analytics Controllers
  createPerformanceAnalyticsController,
  getPerformanceAnalyticsController,
  getPerformanceAnalyticsByIdController,
  updatePerformanceAnalyticsController,
  deletePerformanceAnalyticsController,
  updateStudentAnalyticsController,
  
  // Performance Reports Controllers
  generatePerformanceReportController,
  getPerformanceReportsController,
  getPerformanceReportByIdController,
  updatePerformanceReportController,
  deletePerformanceReportController,
  retryReportGenerationController,
  
  // Performance Alerts Controllers
  createPerformanceAlertController,
  getPerformanceAlertsController,
  getPerformanceAlertByIdController,
  updatePerformanceAlertController,
  deletePerformanceAlertController,
  sendAlertController,
  markAlertAsReadController,
  acknowledgeAlertController,
  
  // Statistics Controllers
  getPerformanceStatsController,
  getAttendanceStatsController,
  getAnalyticsStatsController,
  getAlertStatsController,
  
  // Dashboard Controllers
  getPerformanceDashboardController,
  getClassPerformanceController,
  getBatchPerformanceController
} from '../controllers/performance';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * Performance Records Routes
 */
router.post(
  '/record',
  authorize(['manage_performance', 'view_performance']),
  recordPerformanceController
);

router.post(
  '/',
  authorize(['manage_performance']),
  createPerformanceController
);

router.get(
  '/',
  authorize(['view_performance']),
  getPerformancesController
);

router.get(
  '/:id',
  authorize(['view_performance']),
  getPerformanceByIdController
);

router.put(
  '/:id',
  authorize(['manage_performance']),
  updatePerformanceController
);

router.delete(
  '/:id',
  authorize(['manage_performance']),
  deletePerformanceController
);

router.post(
  '/bulk-upload',
  authorize(['manage_performance']),
  bulkUploadPerformancesController
);

/**
 * Attendance Routes
 */
router.post(
  '/attendance/record',
  authorize(['manage_attendance', 'view_attendance']),
  recordAttendanceController
);

router.post(
  '/attendance',
  authorize(['manage_attendance']),
  createAttendanceController
);

router.get(
  '/attendance',
  authorize(['view_attendance']),
  getAttendanceController
);

router.get(
  '/attendance/:id',
  authorize(['view_attendance']),
  getAttendanceByIdController
);

router.put(
  '/attendance/:id',
  authorize(['manage_attendance']),
  updateAttendanceController
);

router.delete(
  '/attendance/:id',
  authorize(['manage_attendance']),
  deleteAttendanceController
);

router.post(
  '/attendance/bulk',
  authorize(['manage_attendance']),
  bulkCreateAttendanceController
);

router.post(
  '/attendance/bulk-upload',
  authorize(['manage_attendance']),
  bulkUploadAttendanceController
);

/**
 * Performance Analytics Routes
 */
router.post(
  '/analytics',
  authorize(['manage_analytics']),
  createPerformanceAnalyticsController
);

router.get(
  '/analytics',
  authorize(['view_analytics']),
  getPerformanceAnalyticsController
);

router.get(
  '/analytics/:id',
  authorize(['view_analytics']),
  getPerformanceAnalyticsByIdController
);

router.put(
  '/analytics/:id',
  authorize(['manage_analytics']),
  updatePerformanceAnalyticsController
);

router.delete(
  '/analytics/:id',
  authorize(['manage_analytics']),
  deletePerformanceAnalyticsController
);

router.post(
  '/analytics/update/:studentId/:academicYear',
  authorize(['manage_analytics']),
  updateStudentAnalyticsController
);

/**
 * Performance Reports Routes
 */
router.post(
  '/reports/generate',
  authorize(['manage_reports', 'view_reports']),
  generatePerformanceReportController
);

router.get(
  '/reports',
  authorize(['view_reports']),
  getPerformanceReportsController
);

router.get(
  '/reports/:id',
  authorize(['view_reports']),
  getPerformanceReportByIdController
);

router.put(
  '/reports/:id',
  authorize(['manage_reports']),
  updatePerformanceReportController
);

router.delete(
  '/reports/:id',
  authorize(['manage_reports']),
  deletePerformanceReportController
);

router.post(
  '/reports/:id/retry',
  authorize(['manage_reports']),
  retryReportGenerationController
);

/**
 * Performance Alerts Routes
 */
router.post(
  '/alerts',
  authorize(['manage_alerts']),
  createPerformanceAlertController
);

router.get(
  '/alerts',
  authorize(['view_alerts']),
  getPerformanceAlertsController
);

router.get(
  '/alerts/:id',
  authorize(['view_alerts']),
  getPerformanceAlertByIdController
);

router.put(
  '/alerts/:id',
  authorize(['manage_alerts']),
  updatePerformanceAlertController
);

router.delete(
  '/alerts/:id',
  authorize(['manage_alerts']),
  deletePerformanceAlertController
);

router.post(
  '/alerts/send',
  authorize(['manage_alerts']),
  sendAlertController
);

router.put(
  '/alerts/:id/read',
  authorize(['view_alerts']),
  markAlertAsReadController
);

router.put(
  '/alerts/:id/acknowledge',
  authorize(['manage_alerts']),
  acknowledgeAlertController
);

/**
 * Statistics Routes
 */
router.get(
  '/stats/performance',
  authorize(['view_performance']),
  getPerformanceStatsController
);

router.get(
  '/stats/attendance',
  authorize(['view_attendance']),
  getAttendanceStatsController
);

router.get(
  '/stats/analytics',
  authorize(['view_analytics']),
  getAnalyticsStatsController
);

router.get(
  '/stats/alerts',
  authorize(['view_alerts']),
  getAlertStatsController
);

/**
 * Dashboard Routes
 */
router.get(
  '/dashboard/student',
  authorize(['view_performance', 'view_analytics']),
  getPerformanceDashboardController
);

router.get(
  '/dashboard/class',
  authorize(['view_performance', 'view_analytics']),
  getClassPerformanceController
);

router.get(
  '/dashboard/batch',
  authorize(['view_performance', 'view_analytics']),
  getBatchPerformanceController
);

export default router;
