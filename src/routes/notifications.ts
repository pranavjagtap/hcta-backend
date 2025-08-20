import { Router } from 'express';
import { notificationController } from '../controllers/notificationController';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Notification management routes
router.get('/', authorize(['student', 'teacher', 'admin']), notificationController.getUserNotifications);
router.get('/unread-count', authorize(['student', 'teacher', 'admin']), notificationController.getUnreadCount);
router.patch('/:notificationId/read', authorize(['student', 'teacher', 'admin']), notificationController.markAsRead);
router.post('/mark-all-read', authorize(['student', 'teacher', 'admin']), notificationController.markAllAsRead);
router.patch('/:notificationId/archive', authorize(['student', 'teacher', 'admin']), notificationController.archiveNotification);
router.delete('/:notificationId', authorize(['student', 'teacher', 'admin']), notificationController.deleteNotification);

// Statistics
router.get('/stats', authorize(['student', 'teacher', 'admin']), notificationController.getNotificationStats);

// Admin/Teacher only routes
router.post('/create', authorize(['teacher', 'admin']), notificationController.createNotification);
router.post('/bulk-create', authorize(['teacher', 'admin']), notificationController.createBulkNotifications);
router.post('/push', authorize(['teacher', 'admin']), notificationController.sendPushNotification);
router.post('/email', authorize(['teacher', 'admin']), notificationController.sendEmailNotification);
router.post('/sms', authorize(['teacher', 'admin']), notificationController.sendSMSNotification);

// Maintenance routes (admin only)
router.delete('/cleanup/old', authorize(['admin']), notificationController.cleanOldNotifications);

export default router;
