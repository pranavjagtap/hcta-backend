import mongoose from 'mongoose';
import { 
  Performance, 
  Attendance, 
  PerformanceAnalytics, 
  PerformanceReport, 
  PerformanceAlert,
  IPerformance,
  IAttendance,
  IPerformanceAnalytics,
  IPerformanceReport,
  IPerformanceAlert
} from '../models/performance';
import { Student } from '../models/student';
import { User } from '../models/user';
import { AIService } from './aiService';
import { S3Service } from './s3Service';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';
import {
  PerformanceCreate,
  PerformanceUpdate,
  PerformanceResponse,
  PerformanceQuery,
  PerformanceListResponse,
  AttendanceCreate,
  AttendanceUpdate,
  AttendanceResponse,
  AttendanceQuery,
  AttendanceListResponse,
  PerformanceAnalyticsCreate,
  PerformanceAnalyticsUpdate,
  PerformanceAnalyticsResponse,
  PerformanceAnalyticsQuery,
  PerformanceAnalyticsListResponse,
  PerformanceReportCreate,
  PerformanceReportUpdate,
  PerformanceReportResponse,
  PerformanceReportQuery,
  PerformanceReportListResponse,
  PerformanceAlertCreate,
  PerformanceAlertUpdate,
  PerformanceAlertResponse,
  PerformanceAlertQuery,
  PerformanceAlertListResponse,
  RecordPerformanceRequest,
  RecordAttendanceRequest,
  BulkAttendanceRequest,
  GenerateReportRequest,
  SendAlertRequest,
  PerformanceStats,
  AttendanceStats,
  AnalyticsStats,
  AlertStats,
  PerformanceTrends,
  AIPerformancePredictionRequest,
  AIPerformanceRecommendationRequest,
  AIPerformanceTrendsRequest,
  AIReportGenerationRequest
} from '../types/performance';

export class PerformanceService {
  /**
   * Performance Records Management
   */
  static async createPerformance(data: PerformanceCreate): Promise<PerformanceResponse> {
    try {
      // Calculate percentage
      const percentage = (data.score / data.maxScore) * 100;
      
      const performance = new Performance({
        ...data,
        percentage
      });

      await performance.save();
      
      // Update analytics after creating performance record
      await this.updateStudentAnalytics(data.studentId, data.academicYear);
      
      return await this.formatPerformanceResponse(performance);
    } catch (error) {
      logger.error('Error creating performance record:', error);
      throw new AppError('Failed to create performance record', 500);
    }
  }

  static async getPerformances(query: PerformanceQuery): Promise<PerformanceListResponse> {
    try {
      const {
        studentId,
        academicYear,
        semester,
        subject,
        assessmentType,
        startDate,
        endDate,
        page = 1,
        limit = 10,
        sortBy = 'assessmentDate',
        sortOrder = 'desc'
      } = query;

      const filter: any = {};

      if (studentId) filter.studentId = new mongoose.Types.ObjectId(studentId);
      if (academicYear) filter.academicYear = academicYear;
      if (semester) filter.semester = semester;
      if (subject) filter.subject = subject;
      if (assessmentType) filter.assessmentType = assessmentType;
      
      if (startDate || endDate) {
        filter.assessmentDate = {};
        if (startDate) filter.assessmentDate.$gte = new Date(startDate);
        if (endDate) filter.assessmentDate.$lte = new Date(endDate);
      }

      const sort: any = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const skip = (page - 1) * limit;

      const [performances, total] = await Promise.all([
        Performance.find(filter)
          .populate('studentId', 'name rollNumber')
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        Performance.countDocuments(filter)
      ]);

      const formattedPerformances = await Promise.all(
        performances.map(perf => this.formatPerformanceResponse(perf))
      );

      return {
        performances: formattedPerformances,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error fetching performances:', error);
      throw new AppError('Failed to fetch performances', 500);
    }
  }

  static async getPerformanceById(id: string): Promise<PerformanceResponse> {
    try {
      const performance = await Performance.findById(id)
        .populate('studentId', 'name rollNumber')
        .populate('createdBy', 'name')
        .populate('updatedBy', 'name')
        .lean();

      if (!performance) {
        throw new AppError('Performance record not found', 404);
      }

      return await this.formatPerformanceResponse(performance);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching performance by ID:', error);
      throw new AppError('Failed to fetch performance record', 500);
    }
  }

  static async updatePerformance(id: string, data: PerformanceUpdate): Promise<PerformanceResponse> {
    try {
      const performance = await Performance.findById(id);
      if (!performance) {
        throw new AppError('Performance record not found', 404);
      }

      // Recalculate percentage if score or maxScore is updated
      if (data.score !== undefined || data.maxScore !== undefined) {
        const newScore = data.score ?? performance.score;
        const newMaxScore = data.maxScore ?? performance.maxScore;
        data.percentage = (newScore / newMaxScore) * 100;
      }

      Object.assign(performance, data);
      await performance.save();

      // Update analytics after updating performance record
      await this.updateStudentAnalytics(performance.studentId.toString(), performance.academicYear);

      return await this.formatPerformanceResponse(performance);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error updating performance:', error);
      throw new AppError('Failed to update performance record', 500);
    }
  }

  static async deletePerformance(id: string): Promise<void> {
    try {
      const performance = await Performance.findById(id);
      if (!performance) {
        throw new AppError('Performance record not found', 404);
      }

      await Performance.findByIdAndDelete(id);

      // Update analytics after deleting performance record
      await this.updateStudentAnalytics(performance.studentId.toString(), performance.academicYear);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error deleting performance:', error);
      throw new AppError('Failed to delete performance record', 500);
    }
  }

  /**
   * Attendance Management
   */
  static async createAttendance(data: AttendanceCreate): Promise<AttendanceResponse> {
    try {
      // Check if attendance already exists for this student and date
      const existingAttendance = await Attendance.findOne({
        studentId: data.studentId,
        date: data.date
      });

      if (existingAttendance) {
        throw new AppError('Attendance already marked for this date', 400);
      }

      const attendance = new Attendance(data);
      await attendance.save();

      return await this.formatAttendanceResponse(attendance);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error creating attendance:', error);
      throw new AppError('Failed to create attendance record', 500);
    }
  }

  static async getAttendance(query: AttendanceQuery): Promise<AttendanceListResponse> {
    try {
      const {
        studentId,
        classId,
        batchId,
        date,
        startDate,
        endDate,
        status,
        page = 1,
        limit = 10,
        sortBy = 'date',
        sortOrder = 'desc'
      } = query;

      const filter: any = {};

      if (studentId) filter.studentId = new mongoose.Types.ObjectId(studentId);
      if (classId) filter.classId = new mongoose.Types.ObjectId(classId);
      if (batchId) filter.batchId = new mongoose.Types.ObjectId(batchId);
      if (status) filter.status = status;
      
      if (date) {
        filter.date = new Date(date);
      } else if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = new Date(startDate);
        if (endDate) filter.date.$lte = new Date(endDate);
      }

      const sort: any = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const skip = (page - 1) * limit;

      const [attendance, total] = await Promise.all([
        Attendance.find(filter)
          .populate('studentId', 'name rollNumber')
          .populate('classId', 'name')
          .populate('batchId', 'name')
          .populate('markedBy', 'name')
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        Attendance.countDocuments(filter)
      ]);

      const formattedAttendance = await Promise.all(
        attendance.map(att => this.formatAttendanceResponse(att))
      );

      return {
        attendance: formattedAttendance,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error fetching attendance:', error);
      throw new AppError('Failed to fetch attendance records', 500);
    }
  }

  static async bulkCreateAttendance(data: BulkAttendanceRequest): Promise<AttendanceResponse[]> {
    try {
      const { classId, batchId, date, attendance } = data;
      const attendanceRecords: AttendanceResponse[] = [];

      for (const att of attendance) {
        try {
          const attendanceData: AttendanceCreate = {
            studentId: att.studentId,
            classId,
            batchId,
            date: new Date(date),
            status: att.status,
            reason: att.reason,
            remarks: att.remarks,
            markedBy: 'system' // This should be the actual user ID
          };

          const createdAttendance = await this.createAttendance(attendanceData);
          attendanceRecords.push(createdAttendance);
        } catch (error) {
          logger.error(`Error creating attendance for student ${att.studentId}:`, error);
          // Continue with other records even if one fails
        }
      }

      return attendanceRecords;
    } catch (error) {
      logger.error('Error bulk creating attendance:', error);
      throw new AppError('Failed to bulk create attendance records', 500);
    }
  }

  /**
   * Performance Analytics Management
   */
  static async createPerformanceAnalytics(data: PerformanceAnalyticsCreate): Promise<PerformanceAnalyticsResponse> {
    try {
      const analytics = new PerformanceAnalytics(data);
      await analytics.save();

      return await this.formatPerformanceAnalyticsResponse(analytics);
    } catch (error) {
      logger.error('Error creating performance analytics:', error);
      throw new AppError('Failed to create performance analytics', 500);
    }
  }

  static async getPerformanceAnalytics(query: PerformanceAnalyticsQuery): Promise<PerformanceAnalyticsListResponse> {
    try {
      const {
        studentId,
        academicYear,
        semester,
        riskScoreMin,
        riskScoreMax,
        page = 1,
        limit = 10,
        sortBy = 'riskScore',
        sortOrder = 'desc'
      } = query;

      const filter: any = {};

      if (studentId) filter.studentId = new mongoose.Types.ObjectId(studentId);
      if (academicYear) filter.academicYear = academicYear;
      if (semester) filter.semester = semester;
      
      if (riskScoreMin !== undefined || riskScoreMax !== undefined) {
        filter.riskScore = {};
        if (riskScoreMin !== undefined) filter.riskScore.$gte = riskScoreMin;
        if (riskScoreMax !== undefined) filter.riskScore.$lte = riskScoreMax;
      }

      const sort: any = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const skip = (page - 1) * limit;

      const [analytics, total] = await Promise.all([
        PerformanceAnalytics.find(filter)
          .populate('studentId', 'name rollNumber')
          .populate('createdBy', 'name')
          .populate('updatedBy', 'name')
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        PerformanceAnalytics.countDocuments(filter)
      ]);

      const formattedAnalytics = await Promise.all(
        analytics.map(anal => this.formatPerformanceAnalyticsResponse(anal))
      );

      return {
        analytics: formattedAnalytics,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error fetching performance analytics:', error);
      throw new AppError('Failed to fetch performance analytics', 500);
    }
  }

  static async updateStudentAnalytics(studentId: string, academicYear: string): Promise<void> {
    try {
      // Get all performance records for the student
      const performances = await Performance.find({
        studentId: new mongoose.Types.ObjectId(studentId),
        academicYear
      }).lean();

      // Get attendance records
      const attendance = await Attendance.find({
        studentId: new mongoose.Types.ObjectId(studentId)
      }).lean();

      if (performances.length === 0) return;

      // Calculate overall performance
      const totalScore = performances.reduce((sum, perf) => sum + perf.score, 0);
      const totalMaxScore = performances.reduce((sum, perf) => sum + perf.maxScore, 0);
      const overallPercentage = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;

      // Calculate attendance percentage
      const totalDays = attendance.length;
      const presentDays = attendance.filter(att => att.status === 'present').length;
      const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

      // Calculate subject-wise performance
      const subjectPerformance = new Map();
      performances.forEach(perf => {
        if (!subjectPerformance.has(perf.subject)) {
          subjectPerformance.set(perf.subject, {
            scores: [],
            totalAssessments: 0
          });
        }
        const subject = subjectPerformance.get(perf.subject);
        subject.scores.push(perf.score);
        subject.totalAssessments++;
      });

      const subjectsPerformance = Array.from(subjectPerformance.entries()).map(([subject, data]: [string, any]) => ({
        subject,
        averageScore: data.scores.reduce((sum: number, score: number) => sum + score, 0) / data.scores.length,
        totalAssessments: data.totalAssessments,
        strengths: [], // Will be populated by AI
        weaknesses: [] // Will be populated by AI
      }));

      // Build AI input based on available data
      const historicalData = performances.map(perf => ({
        testScore: perf.score,
        date: new Date(perf.assessmentDate),
        topic: perf.topic || perf.subject,
      }));

      const prediction = await AIService.predictPerformance({
        studentId,
        subject: 'overall',
        historicalData,
        upcomingTopics: [],
      });

      // Determine trends (simplified logic)
      const performanceTrend = overallPercentage > 75 ? 'improving' : overallPercentage < 50 ? 'declining' : 'stable';
      const attendanceTrend = attendancePercentage > 90 ? 'improving' : attendancePercentage < 70 ? 'declining' : 'stable';
      const trends: PerformanceTrends = {
        performanceTrend,
        attendanceTrend,
        engagementTrend: 'stable',
      };

      // Update or create analytics record
      const predictedOverall = prediction.overallPrediction;
      const riskScore = Math.max(0, Math.min(100, 100 - predictedOverall));
      const predictedGrade = overallPercentage >= 90 ? 'A+' : overallPercentage >= 80 ? 'A' : overallPercentage >= 70 ? 'B' : overallPercentage >= 60 ? 'C' : 'D';
      const aiRecommendations = prediction.recommendations.map((rec) => ({
        type: 'improvement_tip' as const,
        title: rec,
        description: rec,
        priority: 'medium' as const,
      }));

      const analyticsData: PerformanceAnalyticsCreate = {
        studentId: studentId,
        academicYear,
        overallPercentage,
        attendancePercentage,
        subjectsPerformance,
        riskScore,
        predictedGrade,
        aiRecommendations,
        trends,
        createdBy: 'system',
        updatedBy: 'system',
      };

      await PerformanceAnalytics.findOneAndUpdate(
        { studentId: new mongoose.Types.ObjectId(studentId), academicYear },
        analyticsData,
        { upsert: true, new: true }
      );
    } catch (error) {
      logger.error('Error updating student analytics:', error);
      // Don't throw error as this is a background process
    }
  }

  /**
   * Performance Reports Management
   */
  static async generatePerformanceReport(data: GenerateReportRequest): Promise<PerformanceReportResponse> {
    try {
      const { studentId, reportType, reportPeriod, startDate, endDate, isScheduled = false } = data;

      // Create initial report record
      const reportData: PerformanceReportCreate = {
        studentId: studentId,
        reportType,
        reportPeriod,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reportData: {
          performanceSummary: { overallPercentage: 0, attendancePercentage: 0, totalAssessments: 0, averageScore: 0 },
          subjectBreakdown: [],
          attendanceBreakdown: { totalDays: 0, presentDays: 0, absentDays: 0, lateDays: 0, attendanceTrend: 'stable' },
          aiInsights: { riskAssessment: '', predictedGrade: '', recommendations: [] }
        },
        isScheduled,
        generatedBy: 'system' // This should be the actual user ID
      };

      const report = new PerformanceReport(reportData);
      await report.save();

      // Generate report data in background
      this.generateReportData(report._id.toString(), data);

      return await this.formatPerformanceReportResponse(report);
    } catch (error) {
      logger.error('Error generating performance report:', error);
      throw new AppError('Failed to generate performance report', 500);
    }
  }

  private static async generateReportData(reportId: string, data: GenerateReportRequest): Promise<void> {
    try {
      const { studentId, startDate, endDate } = data;

      // Get performance data
      const performances = await Performance.find({
        studentId: new mongoose.Types.ObjectId(studentId),
        assessmentDate: { $gte: new Date(startDate), $lte: new Date(endDate) }
      }).lean();

      // Get attendance data
      const attendance = await Attendance.find({
        studentId: new mongoose.Types.ObjectId(studentId),
        date: { $gte: new Date(startDate), $lte: new Date(endDate) }
      }).lean();

      // Calculate performance summary
      const totalScore = performances.reduce((sum, perf) => sum + perf.score, 0);
      const totalMaxScore = performances.reduce((sum, perf) => sum + perf.maxScore, 0);
      const overallPercentage = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;
      const averageScore = performances.length > 0 ? totalScore / performances.length : 0;

      // Calculate attendance breakdown
      const totalDays = attendance.length;
      const presentDays = attendance.filter(att => att.status === 'present').length;
      const absentDays = attendance.filter(att => att.status === 'absent').length;
      const lateDays = attendance.filter(att => att.status === 'late').length;
      const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

      // Calculate subject breakdown
      const subjectPerformance = new Map();
      performances.forEach(perf => {
        if (!subjectPerformance.has(perf.subject)) {
          subjectPerformance.set(perf.subject, {
            scores: [],
            totalAssessments: 0
          });
        }
        const subject = subjectPerformance.get(perf.subject);
        subject.scores.push(perf.score);
        subject.totalAssessments++;
      });

      const subjectBreakdown = Array.from(subjectPerformance.entries()).map(([subject, data]: [string, any]) => ({
        subject,
        averageScore: data.scores.reduce((sum: number, score: number) => sum + score, 0) / data.scores.length,
        totalAssessments: data.totalAssessments,
        strengths: [],
        weaknesses: []
      }));

      // Generate AI insights
      const aiRequest: AIReportGenerationRequest = {
        studentId,
        reportType: data.reportType,
        reportPeriod: data.reportPeriod,
        startDate,
        endDate,
        performanceData: {
          summary: {
            overallPercentage,
            attendancePercentage,
            totalAssessments: performances.length,
            averageScore
          },
          subjects: subjectBreakdown,
          attendance: {
            totalDays,
            presentDays,
            absentDays,
            lateDays,
            attendanceTrend: attendancePercentage > 90 ? 'improving' : attendancePercentage < 70 ? 'declining' : 'stable'
          }
        },
        includeCharts: true,
        includeAIInsights: true
      };

      const aiReport = await (AIService as any).generateReport?.(aiRequest);

      // Update report with generated data
      const updateData: PerformanceReportUpdate = {
        pdfUrl: aiReport?.pdfUrl,
        excelUrl: aiReport?.excelUrl,
        status: 'completed'
      };

      await PerformanceReport.findByIdAndUpdate(reportId, updateData);
    } catch (error) {
      logger.error('Error generating report data:', error);
      await PerformanceReport.findByIdAndUpdate(reportId, {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async getPerformanceReports(query: PerformanceReportQuery): Promise<PerformanceReportListResponse> {
    try {
      const {
        studentId,
        reportType,
        reportPeriod,
        startDate,
        endDate,
        status,
        generatedBy,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = query;

      const filter: any = {};

      if (studentId) filter.studentId = new mongoose.Types.ObjectId(studentId);
      if (reportType) filter.reportType = reportType;
      if (reportPeriod) filter.reportPeriod = reportPeriod;
      if (status) filter.status = status;
      if (generatedBy) filter.generatedBy = new mongoose.Types.ObjectId(generatedBy);
      
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }

      const sort: any = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const skip = (page - 1) * limit;

      const [reports, total] = await Promise.all([
        PerformanceReport.find(filter)
          .populate('studentId', 'name rollNumber')
          .populate('generatedBy', 'name')
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        PerformanceReport.countDocuments(filter)
      ]);

      const formattedReports = await Promise.all(
        reports.map(report => this.formatPerformanceReportResponse(report))
      );

      return {
        reports: formattedReports,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error fetching performance reports:', error);
      throw new AppError('Failed to fetch performance reports', 500);
    }
  }

  /**
   * Performance Alerts Management
   */
  static async createPerformanceAlert(data: PerformanceAlertCreate): Promise<PerformanceAlertResponse> {
    try {
      const alert = new PerformanceAlert(data);
      await alert.save();

      // Send alerts through configured channels
      await this.sendAlertNotifications(alert);

      return await this.formatPerformanceAlertResponse(alert);
    } catch (error) {
      logger.error('Error creating performance alert:', error);
      throw new AppError('Failed to create performance alert', 500);
    }
  }

  static async getPerformanceAlerts(query: PerformanceAlertQuery): Promise<PerformanceAlertListResponse> {
    try {
      const {
        studentId,
        alertType,
        severity,
        isSent,
        isRead,
        startDate,
        endDate,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = query;

      const filter: any = {};

      if (studentId) filter.studentId = new mongoose.Types.ObjectId(studentId);
      if (alertType) filter.alertType = alertType;
      if (severity) filter.severity = severity;
      if (isSent !== undefined) filter.isSent = isSent;
      if (isRead !== undefined) filter.isRead = isRead;
      
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }

      const sort: any = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const skip = (page - 1) * limit;

      const [alerts, total] = await Promise.all([
        PerformanceAlert.find(filter)
          .populate('studentId', 'name rollNumber')
          .populate('createdBy', 'name')
          .populate('acknowledgedBy', 'name')
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        PerformanceAlert.countDocuments(filter)
      ]);

      const formattedAlerts = await Promise.all(
        alerts.map(alert => this.formatPerformanceAlertResponse(alert))
      );

      return {
        alerts: formattedAlerts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error fetching performance alerts:', error);
      throw new AppError('Failed to fetch performance alerts', 500);
    }
  }

  private static async sendAlertNotifications(alert: IPerformanceAlert): Promise<void> {
    try {
      // This would integrate with email, SMS, WhatsApp services
      // For now, just mark as sent
      alert.isSent = true;
      alert.sentAt = new Date();
      await alert.save();

      logger.info(`Alert sent for student ${alert.studentId}: ${alert.title}`);
    } catch (error) {
      logger.error('Error sending alert notifications:', error);
    }
  }

  /**
   * Statistics Methods
   */
  static async getPerformanceStats(query: any): Promise<PerformanceStats> {
    try {
      const filter: any = {};
      
      if (query.studentId) filter.studentId = new mongoose.Types.ObjectId(query.studentId);
      if (query.academicYear) filter.academicYear = query.academicYear;
      if (query.semester) filter.semester = query.semester;
      if (query.subject) filter.subject = query.subject;
      
      if (query.startDate || query.endDate) {
        filter.assessmentDate = {};
        if (query.startDate) filter.assessmentDate.$gte = new Date(query.startDate);
        if (query.endDate) filter.assessmentDate.$lte = new Date(query.endDate);
      }

      const performances = await Performance.find(filter).lean();
      
      if (performances.length === 0) {
        return {
          totalAssessments: 0,
          averageScore: 0,
          highestScore: 0,
          lowestScore: 0,
          subjectsCount: 0,
          studentsCount: 0
        };
      }

      const totalScore = performances.reduce((sum, perf) => sum + perf.score, 0);
      const scores = performances.map(perf => perf.score);
      const subjects = new Set(performances.map(perf => perf.subject));
      const students = new Set(performances.map(perf => perf.studentId.toString()));

      return {
        totalAssessments: performances.length,
        averageScore: totalScore / performances.length,
        highestScore: Math.max(...scores),
        lowestScore: Math.min(...scores),
        subjectsCount: subjects.size,
        studentsCount: students.size
      };
    } catch (error) {
      logger.error('Error getting performance stats:', error);
      throw new AppError('Failed to get performance statistics', 500);
    }
  }

  static async getAttendanceStats(query: any): Promise<AttendanceStats> {
    try {
      const filter: any = {};
      
      if (query.studentId) filter.studentId = new mongoose.Types.ObjectId(query.studentId);
      if (query.classId) filter.classId = new mongoose.Types.ObjectId(query.classId);
      if (query.batchId) filter.batchId = new mongoose.Types.ObjectId(query.batchId);
      
      if (query.startDate || query.endDate) {
        filter.date = {};
        if (query.startDate) filter.date.$gte = new Date(query.startDate);
        if (query.endDate) filter.date.$lte = new Date(query.endDate);
      }

      const attendance = await Attendance.find(filter).lean();
      
      if (attendance.length === 0) {
        return {
          totalDays: 0,
          presentDays: 0,
          absentDays: 0,
          lateDays: 0,
          attendancePercentage: 0,
          studentsCount: 0
        };
      }

      const presentDays = attendance.filter(att => att.status === 'present').length;
      const absentDays = attendance.filter(att => att.status === 'absent').length;
      const lateDays = attendance.filter(att => att.status === 'late').length;
      const students = new Set(attendance.map(att => att.studentId.toString()));

      return {
        totalDays: attendance.length,
        presentDays,
        absentDays,
        lateDays,
        attendancePercentage: (presentDays / attendance.length) * 100,
        studentsCount: students.size
      };
    } catch (error) {
      logger.error('Error getting attendance stats:', error);
      throw new AppError('Failed to get attendance statistics', 500);
    }
  }

  /**
   * Response Formatting Methods
   */
  private static async formatPerformanceResponse(performance: any): Promise<PerformanceResponse> {
    return {
      id: performance._id.toString(),
      studentId: performance.studentId._id?.toString() || performance.studentId.toString(),
      studentName: performance.studentId.name,
      academicYear: performance.academicYear,
      semester: performance.semester,
      subject: performance.subject,
      topic: performance.topic,
      assessmentType: performance.assessmentType,
      score: performance.score,
      maxScore: performance.maxScore,
      percentage: performance.percentage,
      grade: performance.grade,
      remarks: performance.remarks,
      assessmentDate: performance.assessmentDate.toISOString(),
      submittedDate: performance.submittedDate?.toISOString(),
      isLate: performance.isLate || false,
      weightage: performance.weightage || 100,
      createdBy: performance.createdBy.toString(),
      updatedBy: performance.updatedBy.toString(),
      createdAt: performance.createdAt.toISOString(),
      updatedAt: performance.updatedAt.toISOString()
    };
  }

  private static async formatAttendanceResponse(attendance: any): Promise<AttendanceResponse> {
    return {
      id: attendance._id.toString(),
      studentId: attendance.studentId._id?.toString() || attendance.studentId.toString(),
      studentName: attendance.studentId.name,
      classId: attendance.classId?._id?.toString(),
      className: attendance.classId?.name,
      batchId: attendance.batchId?._id?.toString(),
      batchName: attendance.batchId?.name,
      date: attendance.date.toISOString(),
      status: attendance.status,
      reason: attendance.reason,
      remarks: attendance.remarks,
      markedBy: attendance.markedBy._id?.toString() || attendance.markedBy.toString(),
      markedByName: attendance.markedBy.name,
      createdAt: attendance.createdAt.toISOString(),
      updatedAt: attendance.updatedAt.toISOString()
    };
  }

  private static async formatPerformanceAnalyticsResponse(analytics: any): Promise<PerformanceAnalyticsResponse> {
    return {
      id: analytics._id.toString(),
      studentId: analytics.studentId._id?.toString() || analytics.studentId.toString(),
      studentName: analytics.studentId.name,
      academicYear: analytics.academicYear,
      semester: analytics.semester,
      overallPercentage: analytics.overallPercentage,
      attendancePercentage: analytics.attendancePercentage,
      subjectsPerformance: analytics.subjectsPerformance,
      riskScore: analytics.riskScore,
      riskLevel: analytics.riskLevel || 'low',
      predictedGrade: analytics.predictedGrade,
      aiRecommendations: analytics.aiRecommendations,
      trends: analytics.trends,
      lastUpdated: analytics.lastUpdated.toISOString(),
      createdBy: analytics.createdBy._id?.toString() || analytics.createdBy.toString(),
      updatedBy: analytics.updatedBy._id?.toString() || analytics.updatedBy.toString(),
      createdAt: analytics.createdAt.toISOString(),
      updatedAt: analytics.updatedAt.toISOString()
    };
  }

  private static async formatPerformanceReportResponse(report: any): Promise<PerformanceReportResponse> {
    return {
      id: report._id.toString(),
      studentId: report.studentId._id?.toString() || report.studentId.toString(),
      studentName: report.studentId.name,
      reportType: report.reportType,
      reportPeriod: report.reportPeriod,
      startDate: report.startDate.toISOString(),
      endDate: report.endDate.toISOString(),
      reportData: report.reportData,
      pdfUrl: report.pdfUrl,
      excelUrl: report.excelUrl,
      generatedBy: report.generatedBy._id?.toString() || report.generatedBy.toString(),
      generatedByName: report.generatedBy.name,
      isScheduled: report.isScheduled,
      status: report.status,
      errorMessage: report.errorMessage,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString()
    };
  }

  private static async formatPerformanceAlertResponse(alert: any): Promise<PerformanceAlertResponse> {
    return {
      id: alert._id.toString(),
      studentId: alert.studentId._id?.toString() || alert.studentId.toString(),
      studentName: alert.studentId.name,
      alertType: alert.alertType,
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      data: alert.data,
      channels: alert.channels,
      isSent: alert.isSent,
      sentAt: alert.sentAt?.toISOString(),
      isRead: alert.isRead,
      readAt: alert.readAt?.toISOString(),
      acknowledgedBy: alert.acknowledgedBy?._id?.toString(),
      acknowledgedByName: alert.acknowledgedBy?.name,
      createdBy: alert.createdBy._id?.toString() || alert.createdBy.toString(),
      createdByName: alert.createdBy.name,
      createdAt: alert.createdAt.toISOString(),
      updatedAt: alert.updatedAt.toISOString()
    };
  }
}


