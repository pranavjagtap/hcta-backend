import { Router } from 'express';
import {
  generateLectureController,
  getLecturesController,
  getLectureByIdController,
  updateLectureController,
  deleteLectureController,
  retryLectureGenerationController,
  getLectureStatsController
} from '../controllers/lecture';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Generate new lecture with AI
router.post(
  '/generate',
  authorize(['manage_lectures']),
  generateLectureController
);

// Get all lectures for the user
router.get(
  '/',
  authorize(['view_lectures']),
  getLecturesController
);

// Get lecture statistics
router.get(
  '/stats',
  authorize(['view_lectures']),
  getLectureStatsController
);

// Get specific lecture by ID
router.get(
  '/:id',
  authorize(['view_lectures']),
  getLectureByIdController
);

// Update lecture
router.put(
  '/:id',
  authorize(['manage_lectures']),
  updateLectureController
);

// Delete lecture
router.delete(
  '/:id',
  authorize(['manage_lectures']),
  deleteLectureController
);

// Retry failed lecture generation
router.post(
  '/:id/retry',
  authorize(['manage_lectures']),
  retryLectureGenerationController
);

export default router;
