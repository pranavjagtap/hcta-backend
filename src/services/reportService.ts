import { ReportSchedule, User, Batch, Content, Payment, Attendance, Message, Call } from '../models';
import { createError } from '../utils/appError';
import { logger } from '../utils/logger';
import { uploadToS3, generateSignedUrl } from '../utils/s3';
import { ReportData, ReportScheduleData } from '../types/admin';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export class ReportService {
  /**
   * Generate attendance report
   */
  async generateAttendanceReport(filters: {
    startDate: Date;
    endDate: Date;
    batchId?: string;
    subjectId?: string;
    format: 'csv' | 'xlsx' | 'pdf';
  }): Promise<{ fileUrl: string; fileName: string }> {
    try {
      const { startDate, endDate, batchId, subjectId, format } = filters;

      // Get attendance data
      const matchFilter: any = {
        date: { $gte: startDate, $lte: endDate }
      };
      if (batchId) matchFilter.batchId = batchId;
      if (subjectId) matchFilter.subjectId = subjectId;

      const attendanceData = await Attendance.aggregate([
        { $match: matchFilter },
        {
          $lookup: {
            from: 'users',
            localField: 'studentId',
            foreignField: '_id',
            as: 'student'
          }
        },
        {
          $lookup: {
            from: 'batches',
            localField: 'batchId',
            foreignField: '_id',
            as: 'batch'
          }
        },
        {
          $lookup: {
            from: 'subjects',
            localField: 'subjectId',
            foreignField: '_id',
            as: 'subject'
          }
        },
        {
          $unwind: '$student'
        },
        {
          $unwind: '$batch'
        },
        {
          $unwind: '$subject'
        },
        {
          $project: {
            date: 1,
            status: 1,
            'student.name': 1,
            'student.email': 1,
            'batch.name': 1,
            'subject.name': 1
          }
        },
        { $sort: { date: 1, 'student.name': 1 } }
      ]);

      // Generate report file
      const fileName = `attendance_report_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}.${format}`;
      const filePath = await this.generateReportFile(attendanceData, 'attendance', format, fileName);

      // Upload to S3
      const fileUrl = await this.uploadReportToS3(filePath, fileName);

      // Clean up local file
      fs.unlinkSync(filePath);

      logger.info('Attendance report generated', {
        startDate,
        endDate,
        batchId,
        subjectId,
        format,
        recordCount: attendanceData.length,
        fileUrl
      });

      return { fileUrl, fileName };

    } catch (error) {
      logger.error('Error generating attendance report', { error, filters });
      throw createError('Failed to generate attendance report', 500);
    }
  }

  /**
   * Generate performance report
   */
  async generatePerformanceReport(filters: {
    startDate: Date;
    endDate: Date;
    batchId?: string;
    subjectId?: string;
    format: 'csv' | 'xlsx' | 'pdf';
  }): Promise<{ fileUrl: string; fileName: string }> {
    try {
      const { startDate, endDate, batchId, subjectId, format } = filters;

      // This would typically query test/marks collection
      // For now, return placeholder data
      const performanceData = [
        {
          studentName: 'John Doe',
          studentEmail: 'john@example.com',
          batchName: 'Class 10A',
          subjectName: 'Mathematics',
          averageScore: 85.5,
          totalTests: 5,
          improvement: '+5.2%'
        }
      ];

      const fileName = `performance_report_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}.${format}`;
      const filePath = await this.generateReportFile(performanceData, 'performance', format, fileName);

      const fileUrl = await this.uploadReportToS3(filePath, fileName);
      fs.unlinkSync(filePath);

      logger.info('Performance report generated', {
        startDate,
        endDate,
        batchId,
        subjectId,
        format,
        recordCount: performanceData.length,
        fileUrl
      });

      return { fileUrl, fileName };

    } catch (error) {
      logger.error('Error generating performance report', { error, filters });
      throw createError('Failed to generate performance report', 500);
    }
  }

  /**
   * Generate usage report
   */
  async generateUsageReport(filters: {
    startDate: Date;
    endDate: Date;
    userId?: string;
    format: 'csv' | 'xlsx' | 'pdf';
  }): Promise<{ fileUrl: string; fileName: string }> {
    try {
      const { startDate, endDate, userId, format } = filters;

      const dateFilter = {
        createdAt: { $gte: startDate, $lte: endDate }
      };

      // Get usage data from various collections
      const [contentUploads, messages, calls, payments] = await Promise.all([
        Content.find(userId ? { uploadedBy: userId, ...dateFilter } : dateFilter)
          .populate('uploadedBy', 'name email')
          .lean(),
        Message.find(userId ? { senderId: userId, ...dateFilter } : dateFilter)
          .populate('senderId', 'name email')
          .lean(),
        Call.find(userId ? { 
          $or: [{ callerId: userId }, { receiverId: userId }],
          ...dateFilter 
        } : dateFilter)
          .populate('callerId', 'name email')
          .populate('receiverId', 'name email')
          .lean(),
        Payment.find(userId ? { userId, ...dateFilter } : dateFilter)
          .populate('userId', 'name email')
          .lean()
      ]);

      const usageData = {
        contentUploads: contentUploads.length,
        messages: messages.length,
        calls: calls.length,
        payments: payments.length,
        totalRevenue: payments.reduce((sum, payment) => sum + (payment.amount || 0), 0)
      };

      const fileName = `usage_report_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}.${format}`;
      const filePath = await this.generateReportFile(usageData, 'usage', format, fileName);

      const fileUrl = await this.uploadReportToS3(filePath, fileName);
      fs.unlinkSync(filePath);

      logger.info('Usage report generated', {
        startDate,
        endDate,
        userId,
        format,
        fileUrl
      });

      return { fileUrl, fileName };

    } catch (error) {
      logger.error('Error generating usage report', { error, filters });
      throw createError('Failed to generate usage report', 500);
    }
  }

  /**
   * Generate revenue report
   */
  async generateRevenueReport(filters: {
    startDate: Date;
    endDate: Date;
    format: 'csv' | 'xlsx' | 'pdf';
  }): Promise<{ fileUrl: string; fileName: string }> {
    try {
      const { startDate, endDate, format } = filters;

      const revenueData = await Payment.aggregate([
        {
          $match: {
            status: 'completed',
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: '$user'
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              userId: '$userId'
            },
            totalAmount: { $sum: '$amount' },
            paymentCount: { $sum: 1 },
            userName: { $first: '$user.name' },
            userEmail: { $first: '$user.email' }
          }
        },
        { $sort: { '_id.date': 1 } }
      ]);

      const fileName = `revenue_report_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}.${format}`;
      const filePath = await this.generateReportFile(revenueData, 'revenue', format, fileName);

      const fileUrl = await this.uploadReportToS3(filePath, fileName);
      fs.unlinkSync(filePath);

      logger.info('Revenue report generated', {
        startDate,
        endDate,
        format,
        recordCount: revenueData.length,
        fileUrl
      });

      return { fileUrl, fileName };

    } catch (error) {
      logger.error('Error generating revenue report', { error, filters });
      throw createError('Failed to generate revenue report', 500);
    }
  }

  /**
   * Create a scheduled report
   */
  async createScheduledReport(data: {
    name: string;
    type: 'attendance' | 'performance' | 'usage' | 'revenue' | 'custom';
    cron: string;
    filters: any;
    format: 'csv' | 'xlsx' | 'pdf';
    destination: {
      email?: string[];
      s3?: {
        bucket: string;
        key: string;
      };
    };
    createdBy: string;
  }): Promise<ReportScheduleData> {
    try {
      const reportSchedule = new ReportSchedule({
        name: data.name,
        type: data.type,
        cron: data.cron,
        filters: data.filters,
        format: data.format,
        destination: data.destination,
        createdBy: data.createdBy
      });

      await reportSchedule.save();
      await reportSchedule.populate('createdBy', 'name email');

      logger.info('Scheduled report created', {
        scheduleId: reportSchedule._id,
        name: data.name,
        type: data.type,
        cron: data.cron,
        createdBy: data.createdBy
      });

      return this.formatReportSchedule(reportSchedule);

    } catch (error) {
      logger.error('Error creating scheduled report', { error, data });
      throw createError('Failed to create scheduled report', 500);
    }
  }

  /**
   * Get scheduled reports
   */
  async getScheduledReports(filters: {
    type?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    schedules: ReportScheduleData[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const { page = 1, limit = 20, ...otherFilters } = filters;
      const skip = (page - 1) * limit;

      const query: any = {};
      Object.assign(query, otherFilters);

      const [schedules, total] = await Promise.all([
        ReportSchedule.find(query)
          .populate('createdBy', 'name email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        ReportSchedule.countDocuments(query)
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        schedules: schedules.map(schedule => this.formatReportSchedule(schedule)),
        total,
        page,
        totalPages
      };

    } catch (error) {
      logger.error('Error getting scheduled reports', { error, filters });
      throw createError('Failed to get scheduled reports', 500);
    }
  }

  /**
   * Update scheduled report
   */
  async updateScheduledReport(scheduleId: string, updates: {
    name?: string;
    cron?: string;
    filters?: any;
    format?: 'csv' | 'xlsx' | 'pdf';
    destination?: any;
    isActive?: boolean;
  }): Promise<ReportScheduleData> {
    try {
      const schedule = await ReportSchedule.findByIdAndUpdate(
        scheduleId,
        updates,
        { new: true }
      ).populate('createdBy', 'name email');

      if (!schedule) {
        throw createError('Scheduled report not found', 404);
      }

      logger.info('Scheduled report updated', {
        scheduleId,
        updates
      });

      return this.formatReportSchedule(schedule);

    } catch (error) {
      logger.error('Error updating scheduled report', { error, scheduleId, updates });
      throw error;
    }
  }

  /**
   * Delete scheduled report
   */
  async deleteScheduledReport(scheduleId: string): Promise<void> {
    try {
      const schedule = await ReportSchedule.findByIdAndDelete(scheduleId);
      
      if (!schedule) {
        throw createError('Scheduled report not found', 404);
      }

      logger.info('Scheduled report deleted', { scheduleId });

    } catch (error) {
      logger.error('Error deleting scheduled report', { error, scheduleId });
      throw error;
    }
  }

  /**
   * Generate report file based on format
   */
  private async generateReportFile(data: any, reportType: string, format: string, fileName: string): Promise<string> {
    const tempDir = os.tmpdir();
    const filePath = path.join(tempDir, fileName);

    switch (format) {
      case 'csv':
        return await this.generateCSV(data, filePath, reportType);
      case 'xlsx':
        return await this.generateExcel(data, filePath, reportType);
      case 'pdf':
        return await this.generatePDF(data, filePath, reportType);
      default:
        throw createError('Unsupported format', 400);
    }
  }

  /**
   * Generate CSV report
   */
  private async generateCSV(data: any, filePath: string, reportType: string): Promise<string> {
    const csv = require('csv-parser');
    const createCsvWriter = require('csv-writer').createObjectCsvWriter;

    let headers: any[] = [];
    let records: any[] = [];

    switch (reportType) {
      case 'attendance':
        headers = [
          { id: 'date', title: 'Date' },
          { id: 'studentName', title: 'Student Name' },
          { id: 'studentEmail', title: 'Student Email' },
          { id: 'batchName', title: 'Batch' },
          { id: 'subjectName', title: 'Subject' },
          { id: 'status', title: 'Status' }
        ];
        records = data.map((item: any) => ({
          date: item.date,
          studentName: item.student.name,
          studentEmail: item.student.email,
          batchName: item.batch.name,
          subjectName: item.subject.name,
          status: item.status
        }));
        break;
      // Add other report types as needed
    }

    const csvWriter = createCsvWriter({
      path: filePath,
      header: headers
    });

    await csvWriter.writeRecords(records);
    return filePath;
  }

  /**
   * Generate Excel report
   */
  private async generateExcel(data: any, filePath: string, reportType: string): Promise<string> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report');

    let headers: string[] = [];
    let rows: any[] = [];

    switch (reportType) {
      case 'attendance':
        headers = ['Date', 'Student Name', 'Student Email', 'Batch', 'Subject', 'Status'];
        rows = data.map((item: any) => [
          item.date,
          item.student.name,
          item.student.email,
          item.batch.name,
          item.subject.name,
          item.status
        ]);
        break;
      // Add other report types as needed
    }

    worksheet.addRow(headers);
    rows.forEach(row => worksheet.addRow(row));

    await workbook.xlsx.writeFile(filePath);
    return filePath;
  }

  /**
   * Generate PDF report
   */
  private async generatePDF(data: any, filePath: string, reportType: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);

      // Add title
      doc.fontSize(20).text(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`, { align: 'center' });
      doc.moveDown();

      // Add content based on report type
      switch (reportType) {
        case 'attendance':
          data.forEach((item: any, index: number) => {
            doc.fontSize(12).text(`${index + 1}. ${item.student.name} - ${item.status}`, { align: 'left' });
          });
          break;
        // Add other report types as needed
      }

      doc.end();

      stream.on('finish', () => resolve(filePath));
      stream.on('error', reject);
    });
  }

  /**
   * Upload report to S3
   */
  private async uploadReportToS3(filePath: string, fileName: string): Promise<string> {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const key = `reports/${fileName}`;
      
      await uploadToS3(fileBuffer, key, 'application/octet-stream');
      
      // Generate signed URL for download
      const signedUrl = await generateSignedUrl(key, { expiresIn: 3600 }); // 1 hour expiry
      
      return signedUrl;

    } catch (error) {
      logger.error('Error uploading report to S3', { error, filePath, fileName });
      throw createError('Failed to upload report', 500);
    }
  }

  /**
   * Format report schedule for response
   */
  private formatReportSchedule(schedule: any): ReportScheduleData {
    return {
      id: schedule._id.toString(),
      name: schedule.name,
      type: schedule.type,
      cron: schedule.cron,
      filters: schedule.filters,
      format: schedule.format,
      destination: schedule.destination,
      isActive: schedule.isActive,
      lastRunAt: schedule.lastRunAt,
      nextRunAt: schedule.nextRunAt,
      lastRunStatus: schedule.lastRunStatus,
      runCount: schedule.runCount,
      createdBy: schedule.createdBy._id?.toString() || schedule.createdBy.toString(),
      createdAt: schedule.createdAt
    };
  }
}

export const reportService = new ReportService();
