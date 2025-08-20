import { Request, Response } from 'express';
import { NotificationService } from '../services/notificationService';
import { z } from 'zod';

const notificationService = new NotificationService();

// Validation schemas
const createNotificationSchema = z.object({
  userId: z.string().min(1),
  type: z.enum(['message', 'call', 'meeting', 'doubt', 'system', 'reminder']),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  meta: z.object({
    conversationId: z.string().optional(),
    messageId: z.string().optional(),
    callId: z.string().optional(),
    meetingId: z.string().optional(),
    doubtId: z.string().optional(),
    actionUrl: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium')
  }).optional()
});

const updateNotificationSchema = z.object({
  status: z.enum(['read', 'archived']).optional(),
  meta: z.record(z.any()).optional()
});

export const notificationController = {
  // Get user notifications
  async getUserNotifications(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const { status, type, limit = 20, page = 1 } = req.query;

      const notifications = await notificationService.getUserNotifications(
        userId,
        {
          status: status as 'unread' | 'read' | 'archived',
          type: type as string,
          limit: parseInt(limit as string),
          page: parseInt(page as string)
        }
      );

      res.json({
        success: true,
        data: notifications
      });
    } catch (error) {
      console.error('Error getting user notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get notifications'
      });
    }
  },

  // Get unread count
  async getUnreadCount(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const count = await notificationService.getUnreadCount(userId);

      res.json({
        success: true,
        data: { unreadCount: count }
      });
    } catch (error) {
      console.error('Error getting unread count:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get unread count'
      });
    }
  },

  // Mark notification as read
  async markAsRead(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      const { notificationId } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const notification = await notificationService.markAsRead(notificationId, userId);
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found or access denied'
        });
      }

      res.json({
        success: true,
        data: notification,
        message: 'Notification marked as read'
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark notification as read'
      });
    }
  },

  // Mark all notifications as read
  async markAllAsRead(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const result = await notificationService.markAllAsRead(userId);

      res.json({
        success: true,
        data: { updatedCount: result.modifiedCount },
        message: 'All notifications marked as read'
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark all notifications as read'
      });
    }
  },

  // Archive notification
  async archiveNotification(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      const { notificationId } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const notification = await notificationService.archiveNotification(notificationId, userId);
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found or access denied'
        });
      }

      res.json({
        success: true,
        data: notification,
        message: 'Notification archived'
      });
    } catch (error) {
      console.error('Error archiving notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to archive notification'
      });
    }
  },

  // Create notification (admin/teacher only)
  async createNotification(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const parsed = createNotificationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: parsed.error.flatten(),
        });
      }

      const { userId: targetUserId, type, title, message, meta } = parsed.data;

      const notification = await notificationService.createNotification(
        targetUserId,
        type,
        title,
        message,
        meta
      );

      res.json({
        success: true,
        data: notification,
        message: 'Notification created successfully'
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create notification'
      });
    }
  },

  // Create bulk notifications (admin/teacher only)
  async createBulkNotifications(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const { notifications } = req.body;

      if (!Array.isArray(notifications) || notifications.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Notifications array is required and must not be empty'
        });
      }

      // Validate each notification
      for (const notification of notifications) {
        const parsed = createNotificationSchema.safeParse(notification);
        if (!parsed.success) {
          return res.status(400).json({
            success: false,
            message: 'Validation failed for one or more notifications',
            errors: parsed.error.flatten(),
          });
        }
      }

      const createdNotifications = await notificationService.createBulkNotifications(notifications);

      res.json({
        success: true,
        data: createdNotifications,
        message: `${createdNotifications.length} notifications created successfully`
      });
    } catch (error) {
      console.error('Error creating bulk notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create bulk notifications'
      });
    }
  },

  // Get notification statistics
  async getNotificationStats(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const { startDate, endDate } = req.query;

      const dateRange = startDate && endDate ? {
        start: new Date(startDate as string),
        end: new Date(endDate as string)
      } : undefined;

      const stats = await notificationService.getNotificationStats(userId, dateRange);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting notification stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get notification statistics'
      });
    }
  },

  // Delete notification
  async deleteNotification(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      const { notificationId } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const result = await notificationService.deleteNotification(notificationId, userId);
      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found or access denied'
        });
      }

      res.json({
        success: true,
        message: 'Notification deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete notification'
      });
    }
  },

  // Clean old notifications (admin only)
  async cleanOldNotifications(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const { daysOld = 30 } = req.query;

      const result = await notificationService.cleanOldNotifications(parseInt(daysOld as string));

      res.json({
        success: true,
        data: { deletedCount: result.deletedCount },
        message: `Cleaned ${result.deletedCount} old notifications`
      });
    } catch (error) {
      console.error('Error cleaning old notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to clean old notifications'
      });
    }
  },

  // Send push notification (admin/teacher only)
  async sendPushNotification(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const { targetUserIds, title, message, data } = req.body;

      if (!Array.isArray(targetUserIds) || targetUserIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Target user IDs array is required'
        });
      }

      if (!title || !message) {
        return res.status(400).json({
          success: false,
          message: 'Title and message are required'
        });
      }

      const result = await notificationService.sendPushNotification(
        targetUserIds,
        title,
        message,
        data
      );

      res.json({
        success: true,
        data: result,
        message: 'Push notification sent successfully'
      });
    } catch (error) {
      console.error('Error sending push notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send push notification'
      });
    }
  },

  // Send email notification (admin/teacher only)
  async sendEmailNotification(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const { targetUserIds, subject, template, templateData } = req.body;

      if (!Array.isArray(targetUserIds) || targetUserIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Target user IDs array is required'
        });
      }

      if (!subject || !template) {
        return res.status(400).json({
          success: false,
          message: 'Subject and template are required'
        });
      }

      const result = await notificationService.sendEmailNotification(
        targetUserIds,
        subject,
        template,
        templateData
      );

      res.json({
        success: true,
        data: result,
        message: 'Email notification sent successfully'
      });
    } catch (error) {
      console.error('Error sending email notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send email notification'
      });
    }
  },

  // Send SMS notification (admin/teacher only)
  async sendSMSNotification(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const { targetUserIds, message } = req.body;

      if (!Array.isArray(targetUserIds) || targetUserIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Target user IDs array is required'
        });
      }

      if (!message) {
        return res.status(400).json({
          success: false,
          message: 'Message is required'
        });
      }

      const result = await notificationService.sendSMSNotification(
        targetUserIds,
        message
      );

      res.json({
        success: true,
        data: result,
        message: 'SMS notification sent successfully'
      });
    } catch (error) {
      console.error('Error sending SMS notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send SMS notification'
      });
    }
  }
};
