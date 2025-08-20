import { z } from 'zod';

// Performance validation schemas
export const performanceBaseSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  academicYear: z.string().min(1, 'Academic year is required'),
  semester: z.string().optional(),
  subject: z.string().min(1, 'Subject is required'),
  topic: z.string().optional(),
  assessmentType: z.enum(['test', 'assignment', 'project', 'quiz', 'exam'], {
    errorMap: () => ({ message: 'Invalid assessment type' })
  }),
  score: z.number().min(0, 'Score must be non-negative'),
  maxScore: z.number().min(1, 'Maximum score must be at least 1'),
  percentage: z.number().min(0).max(100, 'Percentage must be between 0 and 100'),
  grade: z.string().optional(),
  remarks: z.string().optional(),
  assessmentDate: z.date(),
  submittedDate: z.date().optional(),
  isLate: z.boolean().optional(),
  weightage: z.number().min(0).max(100).optional()
});

export const createPerformanceSchema = performanceBaseSchema.extend({
  createdBy: z.string().min(1, 'Created by is required'),
  updatedBy: z.string().min(1, 'Updated by is required')
});

export const updatePerformanceSchema = z.object({
  score: z.number().min(0).optional(),
  maxScore: z.number().min(1).optional(),
  percentage: z.number().min(0).max(100).optional(),
  grade: z.string().optional(),
  remarks: z.string().optional(),
  submittedDate: z.date().optional(),
  isLate: z.boolean().optional(),
  weightage: z.number().min(0).max(100).optional(),
  updatedBy: z.string().min(1, 'Updated by is required')
});

export const performanceQuerySchema = z.object({
  studentId: z.string().optional(),
  academicYear: z.string().optional(),
  semester: z.string().optional(),
  subject: z.string().optional(),
  assessmentType: z.enum(['test', 'assignment', 'project', 'quiz', 'exam']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
});

export const performanceIdSchema = z.object({
  id: z.string().min(1, 'Performance ID is required')
});

// Attendance validation schemas
export const attendanceBaseSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  classId: z.string().optional(),
  batchId: z.string().optional(),
  date: z.date(),
  status: z.enum(['present', 'absent', 'late', 'half-day'], {
    errorMap: () => ({ message: 'Invalid attendance status' })
  }),
  reason: z.string().optional(),
  remarks: z.string().optional()
});

export const createAttendanceSchema = attendanceBaseSchema.extend({
  markedBy: z.string().min(1, 'Marked by is required')
});

export const updateAttendanceSchema = z.object({
  status: z.enum(['present', 'absent', 'late', 'half-day']).optional(),
  reason: z.string().optional(),
  remarks: z.string().optional()
});

export const attendanceQuerySchema = z.object({
  studentId: z.string().optional(),
  classId: z.string().optional(),
  batchId: z.string().optional(),
  date: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(['present', 'absent', 'late', 'half-day']).optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
});

export const attendanceIdSchema = z.object({
  id: z.string().min(1, 'Attendance ID is required')
});

export const bulkAttendanceSchema = z.object({
  classId: z.string().optional(),
  batchId: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  attendance: z.array(z.object({
    studentId: z.string().min(1, 'Student ID is required'),
    status: z.enum(['present', 'absent', 'late', 'half-day']),
    reason: z.string().optional(),
    remarks: z.string().optional()
  })).min(1, 'At least one attendance record is required')
});

// Performance Analytics validation schemas
export const subjectPerformanceSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  averageScore: z.number().min(0).max(100),
  totalAssessments: z.number().min(0),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string())
});

export const aiRecommendationSchema = z.object({
  type: z.enum(['study_plan', 'weak_topic', 'improvement_tip']),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  priority: z.enum(['low', 'medium', 'high'])
});

export const performanceTrendsSchema = z.object({
  performanceTrend: z.enum(['improving', 'declining', 'stable']),
  attendanceTrend: z.enum(['improving', 'declining', 'stable']),
  engagementTrend: z.enum(['improving', 'declining', 'stable'])
});

export const performanceAnalyticsBaseSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  academicYear: z.string().min(1, 'Academic year is required'),
  semester: z.string().optional(),
  overallPercentage: z.number().min(0).max(100),
  attendancePercentage: z.number().min(0).max(100),
  subjectsPerformance: z.array(subjectPerformanceSchema),
  riskScore: z.number().min(0).max(100),
  predictedGrade: z.string().optional(),
  aiRecommendations: z.array(aiRecommendationSchema),
  trends: performanceTrendsSchema
});

export const createPerformanceAnalyticsSchema = performanceAnalyticsBaseSchema.extend({
  createdBy: z.string().min(1, 'Created by is required'),
  updatedBy: z.string().min(1, 'Updated by is required')
});

export const updatePerformanceAnalyticsSchema = z.object({
  overallPercentage: z.number().min(0).max(100).optional(),
  attendancePercentage: z.number().min(0).max(100).optional(),
  subjectsPerformance: z.array(subjectPerformanceSchema).optional(),
  riskScore: z.number().min(0).max(100).optional(),
  predictedGrade: z.string().optional(),
  aiRecommendations: z.array(aiRecommendationSchema).optional(),
  trends: performanceTrendsSchema.optional(),
  lastUpdated: z.date().optional(),
  updatedBy: z.string().min(1, 'Updated by is required')
});

export const performanceAnalyticsQuerySchema = z.object({
  studentId: z.string().optional(),
  academicYear: z.string().optional(),
  semester: z.string().optional(),
  riskScoreMin: z.number().min(0).max(100).optional(),
  riskScoreMax: z.number().min(0).max(100).optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
});

export const performanceAnalyticsIdSchema = z.object({
  id: z.string().min(1, 'Analytics ID is required')
});

// Performance Report validation schemas
export const performanceSummarySchema = z.object({
  overallPercentage: z.number().min(0).max(100),
  attendancePercentage: z.number().min(0).max(100),
  totalAssessments: z.number().min(0),
  averageScore: z.number().min(0).max(100)
});

export const attendanceBreakdownSchema = z.object({
  totalDays: z.number().min(0),
  presentDays: z.number().min(0),
  absentDays: z.number().min(0),
  lateDays: z.number().min(0),
  attendanceTrend: z.string()
});

export const aiInsightSchema = z.object({
  type: z.string(),
  title: z.string(),
  description: z.string(),
  priority: z.string()
});

export const aiInsightsSchema = z.object({
  riskAssessment: z.string(),
  predictedGrade: z.string(),
  recommendations: z.array(aiInsightSchema)
});

export const reportDataSchema = z.object({
  performanceSummary: performanceSummarySchema,
  subjectBreakdown: z.array(subjectPerformanceSchema),
  attendanceBreakdown: attendanceBreakdownSchema,
  aiInsights: aiInsightsSchema
});

export const performanceReportBaseSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  reportType: z.enum(['individual', 'class', 'batch', 'subject']),
  reportPeriod: z.enum(['weekly', 'monthly', 'quarterly', 'semester', 'annual']),
  startDate: z.date(),
  endDate: z.date(),
  reportData: reportDataSchema,
  isScheduled: z.boolean()
});

export const createPerformanceReportSchema = performanceReportBaseSchema.extend({
  generatedBy: z.string().min(1, 'Generated by is required')
});

export const updatePerformanceReportSchema = z.object({
  pdfUrl: z.string().url().optional(),
  excelUrl: z.string().url().optional(),
  status: z.enum(['generating', 'completed', 'failed']).optional(),
  errorMessage: z.string().optional()
});

export const performanceReportQuerySchema = z.object({
  studentId: z.string().optional(),
  reportType: z.enum(['individual', 'class', 'batch', 'subject']).optional(),
  reportPeriod: z.enum(['weekly', 'monthly', 'quarterly', 'semester', 'annual']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(['generating', 'completed', 'failed']).optional(),
  generatedBy: z.string().optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
});

export const performanceReportIdSchema = z.object({
  id: z.string().min(1, 'Report ID is required')
});

// Performance Alert validation schemas
export const alertDataSchema = z.object({
  currentValue: z.number().optional(),
  thresholdValue: z.number().optional(),
  subject: z.string().optional(),
  assessmentType: z.string().optional(),
  date: z.date().optional()
});

export const performanceAlertBaseSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  alertType: z.enum(['low_attendance', 'performance_drop', 'missed_assignment', 'failed_test', 'academic_risk']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  data: alertDataSchema,
  channels: z.array(z.enum(['email', 'sms', 'whatsapp', 'in_app'])).min(1, 'At least one channel is required')
});

export const createPerformanceAlertSchema = performanceAlertBaseSchema.extend({
  createdBy: z.string().min(1, 'Created by is required')
});

export const updatePerformanceAlertSchema = z.object({
  isSent: z.boolean().optional(),
  sentAt: z.date().optional(),
  isRead: z.boolean().optional(),
  readAt: z.date().optional(),
  acknowledgedBy: z.string().optional(),
  acknowledgedAt: z.date().optional()
});

export const performanceAlertQuerySchema = z.object({
  studentId: z.string().optional(),
  alertType: z.enum(['low_attendance', 'performance_drop', 'missed_assignment', 'failed_test', 'academic_risk']).optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  isSent: z.boolean().optional(),
  isRead: z.boolean().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
});

export const performanceAlertIdSchema = z.object({
  id: z.string().min(1, 'Alert ID is required')
});

// API Request validation schemas
export const recordPerformanceRequestSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  academicYear: z.string().min(1, 'Academic year is required'),
  semester: z.string().optional(),
  subject: z.string().min(1, 'Subject is required'),
  topic: z.string().optional(),
  assessmentType: z.enum(['test', 'assignment', 'project', 'quiz', 'exam']),
  score: z.number().min(0, 'Score must be non-negative'),
  maxScore: z.number().min(1, 'Maximum score must be at least 1'),
  grade: z.string().optional(),
  remarks: z.string().optional(),
  assessmentDate: z.string().min(1, 'Assessment date is required'),
  submittedDate: z.string().optional(),
  isLate: z.boolean().optional(),
  weightage: z.number().min(0).max(100).optional()
});

export const recordAttendanceRequestSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  classId: z.string().optional(),
  batchId: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  status: z.enum(['present', 'absent', 'late', 'half-day']),
  reason: z.string().optional(),
  remarks: z.string().optional()
});

export const generateReportRequestSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  reportType: z.enum(['individual', 'class', 'batch', 'subject']),
  reportPeriod: z.enum(['weekly', 'monthly', 'quarterly', 'semester', 'annual']),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  isScheduled: z.boolean().optional()
});

export const sendAlertRequestSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  alertType: z.enum(['low_attendance', 'performance_drop', 'missed_assignment', 'failed_test', 'academic_risk']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  data: alertDataSchema,
  channels: z.array(z.enum(['email', 'sms', 'whatsapp', 'in_app'])).min(1, 'At least one channel is required')
});

// Bulk operations validation schemas
export const bulkPerformanceUploadSchema = z.object({
  performances: z.array(recordPerformanceRequestSchema).min(1, 'At least one performance record is required')
});

export const bulkAttendanceUploadSchema = z.object({
  attendance: z.array(recordAttendanceRequestSchema).min(1, 'At least one attendance record is required')
});

// Statistics query validation schemas
export const performanceStatsQuerySchema = z.object({
  studentId: z.string().optional(),
  academicYear: z.string().optional(),
  semester: z.string().optional(),
  subject: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
});

export const attendanceStatsQuerySchema = z.object({
  studentId: z.string().optional(),
  classId: z.string().optional(),
  batchId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
});

export const analyticsStatsQuerySchema = z.object({
  academicYear: z.string().optional(),
  semester: z.string().optional(),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']).optional()
});

export const alertStatsQuerySchema = z.object({
  studentId: z.string().optional(),
  alertType: z.enum(['low_attendance', 'performance_drop', 'missed_assignment', 'failed_test', 'academic_risk']).optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
});
