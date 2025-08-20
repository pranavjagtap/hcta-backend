import { Router } from 'express';
import * as doubtController from '../controllers/doubtController';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Doubt management routes
router.post('/ask', authorize(['student', 'teacher', 'admin']), doubtController.askDoubt);
router.post('/ask/voice', authorize(['student', 'teacher', 'admin']), doubtController.askDoubtWithVoice);
router.get('/history', authorize(['student', 'teacher', 'admin']), doubtController.getDoubtHistory);
router.get('/:doubtId', authorize(['student', 'teacher', 'admin']), doubtController.getDoubtById);

// Feedback and escalation
router.post('/:doubtId/feedback', authorize(['student', 'teacher', 'admin']), doubtController.addFeedback);
router.post('/:doubtId/escalate', authorize(['student', 'teacher', 'admin']), doubtController.escalateDoubt);

// AI recommendations and analytics
router.get('/recommendations/similar', authorize(['student', 'teacher', 'admin']), doubtController.getSimilarDoubts);
router.get('/recommendations/content', authorize(['student', 'teacher', 'admin']), doubtController.getRecommendedContent);
router.get('/analytics/summary', authorize(['student', 'teacher', 'admin']), doubtController.getDoubtAnalytics);
router.get('/analytics/detailed', authorize(['teacher', 'admin']), doubtController.getSystemDoubtAnalytics);

// Subject-specific doubts
// Subject-specific routes can be added when implemented in controller

export default router;
