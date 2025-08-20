import { Notification, INotification } from '../models/notification';
import { User } from '../models/user';
import mongoose from 'mongoose';

export interface CreateNotificationData {
  userId: string;
  type: 'message' | 'call' | 'meeting' | 'doubt' | 'system' | 'reminder';
  title: string;
  message: string;
  meta?: {
    conversationId?: string;
    messageId?: string;
    callId?: string;
    meetingId?: string;
    doubtId?: string;
    actionUrl?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  };
}

export interface NotificationFilters {
  status?: 'unread' | 'read' | 'archived';
  type?: string;
  limit?: number;
  page?: number;
}

export interface PushNotificationData {
  targetUserIds: string[];
  title: string;
  message: string;
  data?: Record<string, any>;
}

export interface EmailNotificationData {
  targetUserIds: string[];
  subject: string;
  template: string;
  templateData?: Record<string, any>;
}

export interface SMSNotificationData {
  targetUserIds: string[];
  message: string;
}

export class NotificationService {
  // Get user notifications
  async getUserNotifications(userId: string, filters: NotificationFilters = {}): Promise<INotification[]> {
    try {
      const { status, type, limit = 20, page = 1 } = filters;
      const skip = (page - 1) * limit;
      
      const query: any = { userId };
      
      if (status) {
        query.status = status;
      }
      
      if (type) {
        query.type = type;
      }
      
      return await Notification.getUserNotifications(userId, filters);
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  // Get unread count
  async getUnreadCount(userId: string): Promise<number> {
    try {
      return await Notification.getUnreadCount(userId);
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string, userId: string): Promise<INotification | null> {
    try {
      const notification = await Notification.findById(notificationId);
      if (!notification || notification.userId.toString() !== userId) {
        return null;
      }

      return await notification.markAsRead();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllAsRead(userId: string): Promise<{ modifiedCount: number }> {
    try {
      return await Notification.markAllAsRead(userId);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Archive notification
  async archiveNotification(notificationId: string, userId: string): Promise<INotification | null> {
    try {
      const notification = await Notification.findById(notificationId);
      if (!notification || notification.userId.toString() !== userId) {
        return null;
      }

      return await notification.archive();
    } catch (error) {
      console.error('Error archiving notification:', error);
      throw error;
    }
  }

  // Create notification
  async createNotification(
    userId: string,
    type: 'message' | 'call' | 'meeting' | 'doubt' | 'system' | 'reminder',
    title: string,
    message: string,
    meta?: any
  ): Promise<INotification> {
    try {
      return await Notification.createNotification(userId, type, title, message, meta);
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Create bulk notifications
  async createBulkNotifications(notifications: CreateNotificationData[]): Promise<INotification[]> {
    try {
      return await Notification.createBulkNotifications(notifications);
    } catch (error) {
      console.error('Error creating bulk notifications:', error);
      throw error;
    }
  }

  // Get notification statistics
  async getNotificationStats(userId: string, dateRange?: { start: Date; end: Date }): Promise<any> {
    try {
      return await Notification.getNotificationStats(userId, dateRange);
    } catch (error) {
      console.error('Error getting notification stats:', error);
      throw error;
    }
  }

  // Delete notification
  async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    try {
      const notification = await Notification.findById(notificationId);
      if (!notification || notification.userId.toString() !== userId) {
        return false;
      }

      await notification.deleteOne();
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Clean old notifications
  async cleanOldNotifications(daysOld: number = 30): Promise<{ deletedCount: number }> {
    try {
      return await Notification.cleanOldNotifications(daysOld);
    } catch (error) {
      console.error('Error cleaning old notifications:', error);
      throw error;
    }
  }

  // Send push notification
  async sendPushNotification(
    targetUserIds: string[],
    title: string,
    message: string,
    data?: Record<string, any>
  ): Promise<{ successCount: number; failedCount: number; errors: string[] }> {
    try {
      const results = {
        successCount: 0,
        failedCount: 0,
        errors: [] as string[]
      };

      // Get users with push tokens
      const users = await User.find({
        _id: { $in: targetUserIds },
        'pushToken': { $exists: true, $ne: null }
      }).select('_id pushToken');

      for (const user of users) {
        try {
          // This is a placeholder for actual push notification implementation
          // In a real implementation, you would use FCM, OneSignal, or similar service
          console.log(`Sending push notification to user ${user._id}: ${title} - ${message}`);
          
          // Create notification record
          await this.createNotification(
            user._id.toString(),
            'system',
            title,
            message,
            { ...data, priority: 'medium' }
          );

          results.successCount++;
        } catch (error) {
          results.failedCount++;
          results.errors.push(`Failed to send push to user ${user._id}: ${error}`);
        }
      }

      return results;
    } catch (error) {
      console.error('Error sending push notifications:', error);
      throw error;
    }
  }

  // Send email notification
  async sendEmailNotification(
    targetUserIds: string[],
    subject: string,
    template: string,
    templateData?: Record<string, any>
  ): Promise<{ successCount: number; failedCount: number; errors: string[] }> {
    try {
      const results = {
        successCount: 0,
        failedCount: 0,
        errors: [] as string[]
      };

      // Get users with email addresses
      const users = await User.find({
        _id: { $in: targetUserIds },
        'email': { $exists: true, $ne: null }
      }).select('_id email name');

      for (const user of users) {
        try {
          // This is a placeholder for actual email notification implementation
          // In a real implementation, you would use SendGrid, AWS SES, or similar service
          console.log(`Sending email to ${user.email}: ${subject}`);
          
          // Create notification record
          await this.createNotification(
            user._id.toString(),
            'system',
            subject,
            `Email sent to ${user.email}`,
            { template, templateData, priority: 'medium' }
          );

          results.successCount++;
        } catch (error) {
          results.failedCount++;
          results.errors.push(`Failed to send email to user ${user._id}: ${error}`);
        }
      }

      return results;
    } catch (error) {
      console.error('Error sending email notifications:', error);
      throw error;
    }
  }

  // Send SMS notification
  async sendSMSNotification(
    targetUserIds: string[],
    message: string
  ): Promise<{ successCount: number; failedCount: number; errors: string[] }> {
    try {
      const results = {
        successCount: 0,
        failedCount: 0,
        errors: [] as string[]
      };

      // Get users with phone numbers
      const users = await User.find({
        _id: { $in: targetUserIds },
        'phone': { $exists: true, $ne: null }
      }).select('_id phone name').lean();

      for (const user of users) {
        try {
          // This is a placeholder for actual SMS notification implementation
          // In a real implementation, you would use Twilio, AWS SNS, or similar service
          const phone = (user as any).phone ? String((user as any).phone) : '';
          console.log(`Sending SMS to ${phone}: ${message}`);
          
          // Create notification record
          await this.createNotification(
            user._id.toString(),
            'system',
            'SMS Notification',
            message,
            { phone, priority: 'high' }
          );

          results.successCount++;
        } catch (error) {
          results.failedCount++;
          results.errors.push(`Failed to send SMS to user ${user._id}: ${error}`);
        }
      }

      return results;
    } catch (error) {
      console.error('Error sending SMS notifications:', error);
      throw error;
    }
  }

  // Send notification to multiple users
  async sendToMultipleUsers(
    userIds: string[],
    type: 'message' | 'call' | 'meeting' | 'doubt' | 'system' | 'reminder',
    title: string,
    message: string,
    meta?: any
  ): Promise<INotification[]> {
    try {
      const notifications = userIds.map(userId => ({
        userId,
        type,
        title,
        message,
        meta
      }));

      return await this.createBulkNotifications(notifications);
    } catch (error) {
      console.error('Error sending notifications to multiple users:', error);
      throw error;
    }
  }

  // Send notification to users by role
  async sendToUsersByRole(
    role: string,
    type: 'message' | 'call' | 'meeting' | 'doubt' | 'system' | 'reminder',
    title: string,
    message: string,
    meta?: any
  ): Promise<INotification[]> {
    try {
      const users = await User.find({ role }).select('_id');
      const userIds = users.map(user => user._id.toString());

      return await this.sendToMultipleUsers(userIds, type, title, message, meta);
    } catch (error) {
      console.error('Error sending notifications to users by role:', error);
      throw error;
    }
  }

  // Send notification to users by batch
  async sendToUsersByBatch(
    batchId: string,
    type: 'message' | 'call' | 'meeting' | 'doubt' | 'system' | 'reminder',
    title: string,
    message: string,
    meta?: any
  ): Promise<INotification[]> {
    try {
      const users = await User.find({ batch: batchId }).select('_id');
      const userIds = users.map(user => user._id.toString());

      return await this.sendToMultipleUsers(userIds, type, title, message, meta);
    } catch (error) {
      console.error('Error sending notifications to users by batch:', error);
      throw error;
    }
  }
}
