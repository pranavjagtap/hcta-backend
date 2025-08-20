import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import {
  sendMessageController,
  generatePerformanceReportController,
  getCommunicationsController,
  getCommunicationByIdController,
  updateCommunicationController,
  getGreetingSettingsController,
  updateGreetingSettingsController,
  sendBirthdayGreetingsController,
  sendFestivalGreetingsController,
  getCommunicationStatsController,
  createCommunicationController,
  deleteCommunicationController,
  retryCommunicationController,
  bulkSendMessagesController,
  getMessageTemplatesController
} from '../controllers/communication';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Message sending routes
router.post('/send-message', authorize(['manage_communications']), sendMessageController);
router.post('/bulk-send', authorize(['manage_communications']), bulkSendMessagesController);
router.post('/performance-report', authorize(['manage_communications']), generatePerformanceReportController);

// Communication management routes
router.get('/', authorize(['view_communications']), getCommunicationsController);
router.get('/stats', authorize(['view_communications']), getCommunicationStatsController);
router.get('/templates', authorize(['view_communications']), getMessageTemplatesController);
router.get('/:id', authorize(['view_communications']), getCommunicationByIdController);
router.post('/', authorize(['manage_communications']), createCommunicationController);
router.put('/:id', authorize(['manage_communications']), updateCommunicationController);
router.delete('/:id', authorize(['manage_communications']), deleteCommunicationController);
router.post('/:id/retry', authorize(['manage_communications']), retryCommunicationController);

// Greeting settings routes
router.get('/settings/greetings', authorize(['view_communications']), getGreetingSettingsController);
router.put('/settings/greetings', authorize(['manage_communications']), updateGreetingSettingsController);

// Greeting automation routes
router.post('/greetings/birthday', authorize(['manage_communications']), sendBirthdayGreetingsController);
router.post('/greetings/festival', authorize(['manage_communications']), sendFestivalGreetingsController);

export default router;
