import { User, Batch, Subject, Content, Subscription, Payment, Call, Message, Attendance } from '../models';
import { createError } from '../utils/appError';
import { logger } from '../utils/logger';
import { DashboardMetrics } from '../types/admin';

export class MetricsService {
  /**
   * Get comprehensive dashboard metrics
   */
  async getDashboardMetrics(filters: {
    startDate?: Date;
    endDate?: Date;
    scope?: string;
  } = {}): Promise<DashboardMetrics> {
    try {
      const { startDate, endDate, scope } = filters;
      
      // Get overview metrics
      const overview = await this.getOverviewMetrics(startDate, endDate);
      
      // Get trend metrics
      const trends = await this.getTrendMetrics(startDate, endDate);
      
      // Get health metrics
      const health = await this.getHealthMetrics(startDate, endDate);

      return {
        overview,
        trends,
        health
      };

    } catch (error) {
      logger.error('Error getting dashboard metrics', { error, filters });
      throw createError('Failed to get dashboard metrics', 500);
    }
  }

  /**
   * Get overview KPIs
   */
  private async getOverviewMetrics(startDate?: Date, endDate?: Date) {
    const dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter.createdAt = { $gte: startDate, $lte: endDate };
    }

    // Get user counts
    const [totalTutors, activeStudents] = await Promise.all([
      User.countDocuments({ role: 'teacher', ...dateFilter }),
      User.countDocuments({ role: 'student', status: 'active', ...dateFilter })
    ]);

    // Get class and session metrics
    const activeClasses = await Batch.countDocuments({ status: 'active' });
    const sessionsToday = await this.getSessionsToday();

    // Get attendance rate
    const attendanceRate = await this.getAttendanceRate(startDate, endDate);

    // Get homework submission rate
    const homeworkSubmissionRate = await this.getHomeworkSubmissionRate(startDate, endDate);

    // Get average test scores
    const averageTestScores = await this.getAverageTestScores(startDate, endDate);

    // Get revenue (from Module 7)
    const revenue = await this.getRevenue(startDate, endDate);

    // Get storage usage
    const storageUsage = await this.getStorageUsage();

    return {
      totalTutors,
      activeStudents,
      activeClasses,
      sessionsToday,
      attendanceRate,
      homeworkSubmissionRate,
      averageTestScores,
      revenue,
      storageUsage
    };
  }

  /**
   * Get trend metrics
   */
  private async getTrendMetrics(startDate?: Date, endDate?: Date) {
    const dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter.createdAt = { $gte: startDate, $lte: endDate };
    }

    // Get daily active users
    const dailyActiveUsers = await this.getDailyActiveUsers(startDate, endDate);

    // Get weekly active users
    const weeklyActiveUsers = await this.getWeeklyActiveUsers(startDate, endDate);

    // Get monthly active users
    const monthlyActiveUsers = await this.getMonthlyActiveUsers(startDate, endDate);

    // Get messages sent (from Module 6)
    const messagesSent = await this.getMessagesSent(startDate, endDate);

    // Get material uploads (from Module 5)
    const materialUploads = await this.getMaterialUploads(startDate, endDate);

    // Get AI requests (from Module 6)
    const aiRequests = await this.getAIRequests(startDate, endDate);

    return {
      dailyActiveUsers,
      weeklyActiveUsers,
      monthlyActiveUsers,
      messagesSent,
      materialUploads,
      aiRequests
    };
  }

  /**
   * Get health metrics
   */
  private async getHealthMetrics(startDate?: Date, endDate?: Date) {
    // Calculate class health score
    const classHealthScore = await this.getClassHealthScore(startDate, endDate);

    // Calculate drop-off risk
    const dropOffRisk = await this.getDropOffRisk(startDate, endDate);

    // Determine system health
    const systemHealth = this.getSystemHealth(classHealthScore, dropOffRisk);

    return {
      classHealthScore,
      dropOffRisk,
      systemHealth
    };
  }

  /**
   * Get sessions today
   */
  private async getSessionsToday(): Promise<number> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    // This would typically query a sessions/classes collection
    // For now, return a placeholder
    return 0;
  }

  /**
   * Get attendance rate
   */
  private async getAttendanceRate(startDate?: Date, endDate?: Date): Promise<number> {
    const dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter.date = { $gte: startDate, $lte: endDate };
    }

    const pipeline: any[] = [
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          attendedSessions: {
            $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
          }
        }
      }
    ];

    const result = await Attendance.aggregate(pipeline);
    const stats = result[0];

    if (!stats || stats.totalSessions === 0) return 0;
    return (stats.attendedSessions / stats.totalSessions) * 100;
  }

  /**
   * Get homework submission rate
   */
  private async getHomeworkSubmissionRate(startDate?: Date, endDate?: Date): Promise<number> {
    // This would query homework/assignments collection
    // For now, return a placeholder
    return 85.5;
  }

  /**
   * Get average test scores
   */
  private async getAverageTestScores(startDate?: Date, endDate?: Date): Promise<number> {
    // This would query test/marks collection
    // For now, return a placeholder
    return 78.2;
  }

  /**
   * Get revenue
   */
  private async getRevenue(startDate?: Date, endDate?: Date): Promise<number> {
    const dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter.createdAt = { $gte: startDate, $lte: endDate };
    }

    const pipeline: any[] = [
      { $match: { status: 'completed', ...dateFilter } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' }
        }
      }
    ];

    const result = await Payment.aggregate(pipeline);
    return result[0]?.totalRevenue || 0;
  }

  /**
   * Get storage usage
   */
  private async getStorageUsage(): Promise<number> {
    // This would query storage stats or content collection
    // For now, return a placeholder
    return 1024 * 1024 * 1024 * 50; // 50 GB
  }

  /**
   * Get daily active users
   */
  private async getDailyActiveUsers(startDate?: Date, endDate?: Date): Promise<Array<{ date: string; count: number }>> {
    const pipeline: any[] = [
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$lastActiveAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ];

    const result = await User.aggregate(pipeline);
    return result.map(item => ({
      date: item._id,
      count: item.count
    }));
  }

  /**
   * Get weekly active users
   */
  private async getWeeklyActiveUsers(startDate?: Date, endDate?: Date): Promise<Array<{ week: string; count: number }>> {
    const pipeline: any[] = [
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-W%U', date: '$lastActiveAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ];

    const result = await User.aggregate(pipeline);
    return result.map(item => ({
      week: item._id,
      count: item.count
    }));
  }

  /**
   * Get monthly active users
   */
  private async getMonthlyActiveUsers(startDate?: Date, endDate?: Date): Promise<Array<{ month: string; count: number }>> {
    const pipeline: any[] = [
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m', date: '$lastActiveAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ];

    const result = await User.aggregate(pipeline);
    return result.map(item => ({
      month: item._id,
      count: item.count
    }));
  }

  /**
   * Get messages sent
   */
  private async getMessagesSent(startDate?: Date, endDate?: Date): Promise<Array<{ date: string; count: number }>> {
    const dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter.createdAt = { $gte: startDate, $lte: endDate };
    }

    const pipeline: any[] = [
      { $match: dateFilter },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ];

    const result = await Message.aggregate(pipeline);
    return result.map(item => ({
      date: item._id,
      count: item.count
    }));
  }

  /**
   * Get material uploads
   */
  private async getMaterialUploads(startDate?: Date, endDate?: Date): Promise<Array<{ date: string; count: number }>> {
    const dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter.createdAt = { $gte: startDate, $lte: endDate };
    }

    const pipeline: any[] = [
      { $match: dateFilter },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ];

    const result = await Content.aggregate(pipeline);
    return result.map(item => ({
      date: item._id,
      count: item.count
    }));
  }

  /**
   * Get AI requests
   */
  private async getAIRequests(startDate?: Date, endDate?: Date): Promise<Array<{ date: string; count: number }>> {
    // This would query AI request logs
    // For now, return placeholder data
    return [
      { date: '2024-01-01', count: 150 },
      { date: '2024-01-02', count: 180 },
      { date: '2024-01-03', count: 200 }
    ];
  }

  /**
   * Get class health score
   */
  private async getClassHealthScore(startDate?: Date, endDate?: Date): Promise<number> {
    // Calculate based on attendance, engagement, performance
    // For now, return a placeholder
    return 85.5;
  }

  /**
   * Get drop-off risk
   */
  private async getDropOffRisk(startDate?: Date, endDate?: Date): Promise<number> {
    // Calculate based on user activity patterns
    // For now, return a placeholder
    return 12.3;
  }

  /**
   * Get system health status
   */
  private getSystemHealth(classHealthScore: number, dropOffRisk: number): 'excellent' | 'good' | 'warning' | 'critical' {
    if (classHealthScore >= 90 && dropOffRisk <= 5) return 'excellent';
    if (classHealthScore >= 75 && dropOffRisk <= 15) return 'good';
    if (classHealthScore >= 60 && dropOffRisk <= 25) return 'warning';
    return 'critical';
  }

  /**
   * Get usage metrics by type
   */
  async getUsageMetrics(metric: string, filters: {
    startDate?: Date;
    endDate?: Date;
    groupBy?: string;
  } = {}): Promise<any> {
    try {
      const { startDate, endDate, groupBy = 'day' } = filters;

      switch (metric) {
        case 'uploads':
          return await this.getMaterialUploads(startDate, endDate);
        case 'messages':
          return await this.getMessagesSent(startDate, endDate);
        case 'aiRequests':
          return await this.getAIRequests(startDate, endDate);
        default:
          throw createError('Invalid metric type', 400);
      }

    } catch (error) {
      logger.error('Error getting usage metrics', { error, metric, filters });
      throw createError('Failed to get usage metrics', 500);
    }
  }

  /**
   * Get attendance metrics
   */
  async getAttendanceMetrics(filters: {
    startDate?: Date;
    endDate?: Date;
    batchId?: string;
    subjectId?: string;
  } = {}): Promise<any> {
    try {
      const { startDate, endDate, batchId, subjectId } = filters;

      const matchFilter: any = {};
      if (startDate && endDate) {
        matchFilter.date = { $gte: startDate, $lte: endDate };
      }
      if (batchId) matchFilter.batchId = batchId;
      if (subjectId) matchFilter.subjectId = subjectId;

      const pipeline: any[] = [
        { $match: matchFilter },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
              batchId: '$batchId',
              subjectId: '$subjectId'
            },
            totalStudents: { $sum: 1 },
            presentStudents: {
              $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
            },
            attendanceRate: {
              $avg: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
            }
          }
        },
        { $sort: { '_id.date': 1 } }
      ];

      const result = await Attendance.aggregate(pipeline);
      return result;

    } catch (error) {
      logger.error('Error getting attendance metrics', { error, filters });
      throw createError('Failed to get attendance metrics', 500);
    }
  }

  /**
   * Get revenue metrics
   */
  async getRevenueMetrics(filters: {
    startDate?: Date;
    endDate?: Date;
    groupBy?: string;
  } = {}): Promise<any> {
    try {
      const { startDate, endDate, groupBy = 'month' } = filters;

      const dateFilter: any = {};
      if (startDate && endDate) {
        dateFilter.createdAt = { $gte: startDate, $lte: endDate };
      }

      const dateFormat = groupBy === 'month' ? '%Y-%m' : '%Y-%m-%d';

      const pipeline: any[] = [
        { $match: { status: 'completed', ...dateFilter } },
        {
          $group: {
            _id: {
              period: { $dateToString: { format: dateFormat, date: '$createdAt' } }
            },
            totalRevenue: { $sum: '$amount' },
            paymentCount: { $sum: 1 }
          }
        },
        { $sort: { '_id.period': 1 } }
      ];

      const result = await Payment.aggregate(pipeline);
      return result;

    } catch (error) {
      logger.error('Error getting revenue metrics', { error, filters });
      throw createError('Failed to get revenue metrics', 500);
    }
  }
}

export const metricsService = new MetricsService();
