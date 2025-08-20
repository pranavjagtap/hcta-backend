import { Document } from 'mongoose';

// Base interfaces
export interface PerformanceBase {
  studentId: string;
  academicYear: string;
  semester?: string;
  subject: string;
  topic?: string;
  assessmentType: 'test' | 'assignment' | 'project' | 'quiz' | 'exam';
  score: number;
  maxScore: number;
  percentage: number;
  grade?: string;
  remarks?: string;
  assessmentDate: Date;
  submittedDate?: Date;
  isLate?: boolean;
  weightage?: number;
}

export interface PerformanceCreate extends PerformanceBase {
  createdBy: string;
  updatedBy: string;
}

export interface PerformanceUpdate {
  score?: number;
  maxScore?: number;
  percentage?: number;
  grade?: string;
  remarks?: string;
  submittedDate?: Date;
  isLate?: boolean;
  weightage?: number;
  updatedBy: string;
}

export interface PerformanceDocument extends PerformanceBase, Document {
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PerformanceResponse {
  id: string;
  studentId: string;
  studentName?: string;
  academicYear: string;
  semester?: string;
  subject: string;
  topic?: string;
  assessmentType: string;
  score: number;
  maxScore: number;
  percentage: number;
  grade?: string;
  remarks?: string;
  assessmentDate: string;
  submittedDate?: string;
  isLate: boolean;
  weightage: number;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

// Attendance interfaces
export interface AttendanceBase {
  studentId: string;
  classId?: string;
  batchId?: string;
  date: Date;
  status: 'present' | 'absent' | 'late' | 'half-day';
  reason?: string;
  remarks?: string;
}

export interface AttendanceCreate extends AttendanceBase {
  markedBy: string;
}

export interface AttendanceUpdate {
  status?: 'present' | 'absent' | 'late' | 'half-day';
  reason?: string;
  remarks?: string;
}

export interface AttendanceDocument extends AttendanceBase, Document {
  markedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttendanceResponse {
  id: string;
  studentId: string;
  studentName?: string;
  classId?: string;
  className?: string;
  batchId?: string;
  batchName?: string;
  date: string;
  status: string;
  reason?: string;
  remarks?: string;
  markedBy: string;
  markedByName?: string;
  createdAt: string;
  updatedAt: string;
}

// Performance Analytics interfaces
export interface SubjectPerformance {
  subject: string;
  averageScore: number;
  totalAssessments: number;
  strengths: string[];
  weaknesses: string[];
}

export interface AIRecommendation {
  type: 'study_plan' | 'weak_topic' | 'improvement_tip';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
}

export interface PerformanceTrends {
  performanceTrend: 'improving' | 'declining' | 'stable';
  attendanceTrend: 'improving' | 'declining' | 'stable';
  engagementTrend: 'improving' | 'declining' | 'stable';
}

export interface PerformanceAnalyticsBase {
  studentId: string;
  academicYear: string;
  semester?: string;
  overallPercentage: number;
  attendancePercentage: number;
  subjectsPerformance: SubjectPerformance[];
  riskScore: number;
  predictedGrade?: string;
  aiRecommendations: AIRecommendation[];
  trends: PerformanceTrends;
}

export interface PerformanceAnalyticsCreate extends PerformanceAnalyticsBase {
  createdBy: string;
  updatedBy: string;
}

export interface PerformanceAnalyticsUpdate {
  overallPercentage?: number;
  attendancePercentage?: number;
  subjectsPerformance?: SubjectPerformance[];
  riskScore?: number;
  predictedGrade?: string;
  aiRecommendations?: AIRecommendation[];
  trends?: PerformanceTrends;
  lastUpdated?: Date;
  updatedBy: string;
}

export interface PerformanceAnalyticsDocument extends PerformanceAnalyticsBase, Document {
  lastUpdated: Date;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PerformanceAnalyticsResponse {
  id: string;
  studentId: string;
  studentName?: string;
  academicYear: string;
  semester?: string;
  overallPercentage: number;
  attendancePercentage: number;
  subjectsPerformance: SubjectPerformance[];
  riskScore: number;
  riskLevel: string;
  predictedGrade?: string;
  aiRecommendations: AIRecommendation[];
  trends: PerformanceTrends;
  lastUpdated: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

// Performance Report interfaces
export interface PerformanceSummary {
  overallPercentage: number;
  attendancePercentage: number;
  totalAssessments: number;
  averageScore: number;
}

export interface AttendanceBreakdown {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  attendanceTrend: string;
}

export interface AIInsight {
  type: string;
  title: string;
  description: string;
  priority: string;
}

export interface AIInsights {
  riskAssessment: string;
  predictedGrade: string;
  recommendations: AIInsight[];
}

export interface ReportData {
  performanceSummary: PerformanceSummary;
  subjectBreakdown: SubjectPerformance[];
  attendanceBreakdown: AttendanceBreakdown;
  aiInsights: AIInsights;
}

export interface PerformanceReportBase {
  studentId: string;
  reportType: 'individual' | 'class' | 'batch' | 'subject';
  reportPeriod: 'weekly' | 'monthly' | 'quarterly' | 'semester' | 'annual';
  startDate: Date;
  endDate: Date;
  reportData: ReportData;
  isScheduled: boolean;
}

export interface PerformanceReportCreate extends PerformanceReportBase {
  generatedBy: string;
}

export interface PerformanceReportUpdate {
  pdfUrl?: string;
  excelUrl?: string;
  status?: 'generating' | 'completed' | 'failed';
  errorMessage?: string;
}

export interface PerformanceReportDocument extends PerformanceReportBase, Document {
  pdfUrl?: string;
  excelUrl?: string;
  generatedBy: string;
  status: 'generating' | 'completed' | 'failed';
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PerformanceReportResponse {
  id: string;
  studentId: string;
  studentName?: string;
  reportType: string;
  reportPeriod: string;
  startDate: string;
  endDate: string;
  reportData: ReportData;
  pdfUrl?: string;
  excelUrl?: string;
  generatedBy: string;
  generatedByName?: string;
  isScheduled: boolean;
  status: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

// Performance Alert interfaces
export interface AlertData {
  currentValue?: number;
  thresholdValue?: number;
  subject?: string;
  assessmentType?: string;
  date?: Date;
}

export interface PerformanceAlertBase {
  studentId: string;
  alertType: 'low_attendance' | 'performance_drop' | 'missed_assignment' | 'failed_test' | 'academic_risk';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  data: AlertData;
  channels: Array<'email' | 'sms' | 'whatsapp' | 'in_app'>;
}

export interface PerformanceAlertCreate extends PerformanceAlertBase {
  createdBy: string;
}

export interface PerformanceAlertUpdate {
  isSent?: boolean;
  sentAt?: Date;
  isRead?: boolean;
  readAt?: Date;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

export interface PerformanceAlertDocument extends PerformanceAlertBase, Document {
  isSent: boolean;
  sentAt?: Date;
  isRead: boolean;
  readAt?: Date;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PerformanceAlertResponse {
  id: string;
  studentId: string;
  studentName?: string;
  alertType: string;
  severity: string;
  title: string;
  message: string;
  data: AlertData;
  channels: string[];
  isSent: boolean;
  sentAt?: string;
  isRead: boolean;
  readAt?: string;
  acknowledgedBy?: string;
  acknowledgedByName?: string;
  acknowledgedAt?: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

// Query interfaces
export interface PerformanceQuery {
  studentId?: string;
  academicYear?: string;
  semester?: string;
  subject?: string;
  assessmentType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AttendanceQuery {
  studentId?: string;
  classId?: string;
  batchId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PerformanceAnalyticsQuery {
  studentId?: string;
  academicYear?: string;
  semester?: string;
  riskScoreMin?: number;
  riskScoreMax?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PerformanceReportQuery {
  studentId?: string;
  reportType?: string;
  reportPeriod?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  generatedBy?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PerformanceAlertQuery {
  studentId?: string;
  alertType?: string;
  severity?: string;
  isSent?: boolean;
  isRead?: boolean;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// API Request/Response interfaces
export interface RecordPerformanceRequest {
  studentId: string;
  academicYear: string;
  semester?: string;
  subject: string;
  topic?: string;
  assessmentType: 'test' | 'assignment' | 'project' | 'quiz' | 'exam';
  score: number;
  maxScore: number;
  grade?: string;
  remarks?: string;
  assessmentDate: string;
  submittedDate?: string;
  isLate?: boolean;
  weightage?: number;
}

export interface RecordAttendanceRequest {
  studentId: string;
  classId?: string;
  batchId?: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'half-day';
  reason?: string;
  remarks?: string;
}

export interface BulkAttendanceRequest {
  classId?: string;
  batchId?: string;
  date: string;
  attendance: Array<{
    studentId: string;
    status: 'present' | 'absent' | 'late' | 'half-day';
    reason?: string;
    remarks?: string;
  }>;
}

export interface GenerateReportRequest {
  studentId: string;
  reportType: 'individual' | 'class' | 'batch' | 'subject';
  reportPeriod: 'weekly' | 'monthly' | 'quarterly' | 'semester' | 'annual';
  startDate: string;
  endDate: string;
  isScheduled?: boolean;
}

export interface SendAlertRequest {
  studentId: string;
  alertType: 'low_attendance' | 'performance_drop' | 'missed_assignment' | 'failed_test' | 'academic_risk';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  data: AlertData;
  channels: Array<'email' | 'sms' | 'whatsapp' | 'in_app'>;
}

// List response interfaces
export interface PerformanceListResponse {
  performances: PerformanceResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AttendanceListResponse {
  attendance: AttendanceResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PerformanceAnalyticsListResponse {
  analytics: PerformanceAnalyticsResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PerformanceReportListResponse {
  reports: PerformanceReportResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PerformanceAlertListResponse {
  alerts: PerformanceAlertResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Statistics interfaces
export interface PerformanceStats {
  totalAssessments: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  subjectsCount: number;
  studentsCount: number;
}

export interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  attendancePercentage: number;
  studentsCount: number;
}

export interface AnalyticsStats {
  totalStudents: number;
  highRiskStudents: number;
  mediumRiskStudents: number;
  lowRiskStudents: number;
  averageRiskScore: number;
  improvingStudents: number;
  decliningStudents: number;
}

export interface AlertStats {
  totalAlerts: number;
  sentAlerts: number;
  unreadAlerts: number;
  criticalAlerts: number;
  highPriorityAlerts: number;
  alertsByType: Record<string, number>;
  alertsBySeverity: Record<string, number>;
}

// AI API interfaces
export interface AIPerformancePredictionRequest {
  studentId: string;
  pastScores: Array<{
    subject: string;
    score: number;
    date: string;
  }>;
  attendance: {
    totalDays: number;
    presentDays: number;
    percentage: number;
  };
  currentGrade: string;
  academicYear: string;
}

export interface AIPerformancePredictionResponse {
  predictedGrade: string;
  riskScore: number;
  confidence: number;
  factors: string[];
  recommendations: AIRecommendation[];
}

export interface AIPerformanceRecommendationRequest {
  studentId: string;
  weakTopics: string[];
  currentPerformance: {
    overallPercentage: number;
    subjectsPerformance: SubjectPerformance[];
  };
  learningStyle?: string;
  availableTime?: number; // hours per week
}

export interface AIPerformanceRecommendationResponse {
  studyPlan: {
    title: string;
    description: string;
    duration: string;
    topics: string[];
  };
  recommendations: AIRecommendation[];
  resources: Array<{
    type: 'video' | 'document' | 'practice' | 'assessment';
    title: string;
    description: string;
    url?: string;
  }>;
}

export interface AIPerformanceTrendsRequest {
  studentId: string;
  timeRange: 'week' | 'month' | 'quarter' | 'semester';
  performanceData: Array<{
    date: string;
    score: number;
    subject: string;
  }>;
  attendanceData: Array<{
    date: string;
    status: 'present' | 'absent' | 'late' | 'half-day';
  }>;
}

export interface AIPerformanceTrendsResponse {
  performanceTrend: 'improving' | 'declining' | 'stable';
  attendanceTrend: 'improving' | 'declining' | 'stable';
  engagementTrend: 'improving' | 'declining' | 'stable';
  insights: {
    strengths: string[];
    weaknesses: string[];
    patterns: string[];
    predictions: string[];
  };
  charts: {
    performanceChart: Array<{ date: string; score: number }>;
    attendanceChart: Array<{ date: string; percentage: number }>;
    subjectComparison: Array<{ subject: string; average: number }>;
  };
}

export interface AIReportGenerationRequest {
  studentId: string;
  reportType: 'individual' | 'class' | 'batch' | 'subject';
  reportPeriod: 'weekly' | 'monthly' | 'quarterly' | 'semester' | 'annual';
  startDate: string;
  endDate: string;
  performanceData: {
    summary: PerformanceSummary;
    subjects: SubjectPerformance[];
    attendance: AttendanceBreakdown;
  };
  includeCharts: boolean;
  includeAIInsights: boolean;
}

export interface AIReportGenerationResponse {
  pdfUrl: string;
  excelUrl?: string;
  reportData: ReportData;
  generationTime: number;
  fileSize: number;
}
