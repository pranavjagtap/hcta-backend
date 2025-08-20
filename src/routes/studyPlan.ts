import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import {
  // AI Generation Controllers
  generateStudyPlanWithAIController,
  
  // Study Plan CRUD Controllers
  createStudyPlanController,
  getStudyPlansController,
  getStudyPlanByIdController,
  updateStudyPlanController,
  deleteStudyPlanController,
  
  // Study Plan Status Controllers
  activateStudyPlanController,
  pauseStudyPlanController,
  completeStudyPlanController,
  
  // Study Plan Progress Controllers
  createStudyPlanProgressController,
  getStudyPlanProgressController,
  updateStudyPlanProgressController,
  
  // Analytics Controllers
  getStudyPlanAnalyticsController,
  getStudyPlanStatsController,
  
  // Performance-based Update Controller
  updateStudyPlanBasedOnPerformanceController,
  
  // Student-specific Controllers
  getStudentStudyPlansController,
  getActiveStudyPlanController
} from '../controllers/studyPlan';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * AI Generation Routes
 */
router.post('/generate', authorize(['teacher', 'admin']), generateStudyPlanWithAIController);

/**
 * Study Plan CRUD Routes
 */
router.post('/', authorize(['teacher', 'admin']), createStudyPlanController);
router.get('/', getStudyPlansController);
router.get('/:id', getStudyPlanByIdController);
router.put('/:id', authorize(['teacher', 'admin']), updateStudyPlanController);
router.delete('/:id', authorize(['teacher', 'admin']), deleteStudyPlanController);

/**
 * Study Plan Status Routes
 */
router.post('/:id/activate', authorize(['teacher', 'admin']), activateStudyPlanController);
router.post('/:id/pause', authorize(['teacher', 'admin']), pauseStudyPlanController);
router.post('/:id/complete', authorize(['teacher', 'admin']), completeStudyPlanController);

/**
 * Study Plan Progress Routes
 */
router.post('/progress', authorize(['student', 'teacher', 'admin']), createStudyPlanProgressController);
router.get('/:studyPlanId/progress', getStudyPlanProgressController);
router.put('/progress/:id', authorize(['student', 'teacher', 'admin']), updateStudyPlanProgressController);

/**
 * Analytics Routes
 */
router.get('/:studyPlanId/analytics', getStudyPlanAnalyticsController);
router.get('/stats/overview', getStudyPlanStatsController);

/**
 * Performance-based Update Routes
 */
router.post('/:studyPlanId/update-performance', authorize(['teacher', 'admin']), updateStudyPlanBasedOnPerformanceController);

/**
 * Student-specific Routes
 */
router.get('/student/:studentId', getStudentStudyPlansController);
router.get('/student/:studentId/active', getActiveStudyPlanController);

export default router;
