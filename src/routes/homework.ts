import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import {
  // AI Generation Controllers
  generateHomeworkWithAIController,
  regenerateQuestionWithAIController,
  
  // Homework CRUD Controllers
  createHomeworkController,
  getHomeworksController,
  getHomeworkByIdController,
  updateHomeworkController,
  deleteHomeworkController,
  
  // Homework Publishing Controllers
  publishHomeworkController,
  unpublishHomeworkController,
  
  // Homework Submission Controllers
  createHomeworkSubmissionController,
  getHomeworkSubmissionsController,
  getHomeworkSubmissionByIdController,
  updateHomeworkSubmissionController,
  deleteHomeworkSubmissionController,
  
  // Grading Controllers
  gradeHomeworkSubmissionController,
  autoGradeHomeworkSubmissionController,
  
  // Export Controllers
  exportHomeworkController,
  
  // Analytics Controllers
  getHomeworkAnalyticsController,
  getHomeworkStatsController,
  
  // Student-specific Controllers
  getStudentHomeworksController,
  getClassHomeworksController,
  getBatchHomeworksController
} from '../controllers/homework';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * AI Generation Routes
 */
router.post('/generate', authorize(['teacher', 'admin']), generateHomeworkWithAIController);
router.post('/regenerate-question', authorize(['teacher', 'admin']), regenerateQuestionWithAIController);

/**
 * Homework CRUD Routes
 */
router.post('/', authorize(['teacher', 'admin']), createHomeworkController);
router.get('/', getHomeworksController);
router.get('/:id', getHomeworkByIdController);
router.put('/:id', authorize(['teacher', 'admin']), updateHomeworkController);
router.delete('/:id', authorize(['teacher', 'admin']), deleteHomeworkController);

/**
 * Homework Publishing Routes
 */
router.post('/:id/publish', authorize(['teacher', 'admin']), publishHomeworkController);
router.post('/:id/unpublish', authorize(['teacher', 'admin']), unpublishHomeworkController);

/**
 * Homework Submission Routes
 */
router.post('/submissions', authorize(['student', 'teacher', 'admin']), createHomeworkSubmissionController);
router.get('/submissions', getHomeworkSubmissionsController);
router.get('/submissions/:id', getHomeworkSubmissionByIdController);
router.put('/submissions/:id', authorize(['student', 'teacher', 'admin']), updateHomeworkSubmissionController);
router.delete('/submissions/:id', authorize(['teacher', 'admin']), deleteHomeworkSubmissionController);

/**
 * Grading Routes
 */
router.post('/submissions/:id/grade', authorize(['teacher', 'admin']), gradeHomeworkSubmissionController);
router.post('/submissions/:id/auto-grade', authorize(['teacher', 'admin']), autoGradeHomeworkSubmissionController);

/**
 * Export Routes
 */
router.post('/export', authorize(['teacher', 'admin']), exportHomeworkController);

/**
 * Analytics Routes
 */
router.get('/:id/analytics', getHomeworkAnalyticsController);
router.get('/stats/overview', getHomeworkStatsController);

/**
 * Student-specific Routes
 */
router.get('/student/:studentId', getStudentHomeworksController);
router.get('/class/:classId', getClassHomeworksController);
router.get('/batch/:batchId', getBatchHomeworksController);

export default router;
