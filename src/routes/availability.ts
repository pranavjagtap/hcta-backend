import { Router } from 'express';
import { availabilityController } from '../controllers/availabilityController';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Availability management routes
router.get('/teacher/:teacherId', authorize(['student', 'teacher', 'admin']), availabilityController.getTeacherAvailability);
router.post('/set', authorize(['teacher', 'admin']), availabilityController.setAvailability);
router.patch('/update', authorize(['teacher', 'admin']), availabilityController.updateAvailability);
router.get('/teacher/:teacherId/slots', authorize(['student', 'teacher', 'admin']), availabilityController.getAvailableSlots);

// Meeting management routes
router.post('/meetings/schedule', authorize(['student', 'teacher', 'admin']), availabilityController.scheduleMeeting);
router.get('/meetings/upcoming', authorize(['student', 'teacher', 'admin']), availabilityController.getUpcomingMeetings);
router.get('/meetings/:meetingId', authorize(['student', 'teacher', 'admin']), availabilityController.getMeeting);
router.patch('/meetings/:meetingId', authorize(['student', 'teacher', 'admin']), availabilityController.updateMeeting);
router.post('/meetings/:meetingId/confirm', authorize(['teacher', 'admin']), availabilityController.confirmMeeting);
router.post('/meetings/:meetingId/cancel', authorize(['student', 'teacher', 'admin']), availabilityController.cancelMeeting);

// Statistics and analytics
router.get('/meetings/stats', authorize(['student', 'teacher', 'admin']), availabilityController.getMeetingStats);

export default router;
