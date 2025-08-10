import express from "express";
import {
  createSubmissionController,
  getTutorSubmissionsController,
  getSubmissionByIdController,
  updateSubmissionController,
  gradeSubmissionController,
  bulkGradeSubmissionsController,
  deleteSubmissionController,
  getAssignmentSubmissionsController,
  getAssignmentSubmissionSummaryController,
  getStudentSubmissionsController,
  getSubmissionStatsController,
} from "../controllers/submission";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get submission statistics
router.get("/stats", authorize(["teacher", "admin"]), getSubmissionStatsController);

// Get assignment submission summary
router.get("/assignment/:assignmentId/summary", authorize(["teacher", "admin"]), getAssignmentSubmissionSummaryController);

// Get submissions for a specific assignment
router.get("/assignment/:assignmentId", authorize(["teacher", "admin"]), getAssignmentSubmissionsController);

// Get submissions for a specific student
router.get("/student/:studentId", authorize(["teacher", "admin"]), getStudentSubmissionsController);

// Create a new submission
router.post("/", authorize(["teacher", "admin"]), createSubmissionController);

// Get all submissions for the authenticated tutor
router.get("/", authorize(["teacher", "admin"]), getTutorSubmissionsController);

// Get submission by ID
router.get("/:id", authorize(["teacher", "admin"]), getSubmissionByIdController);

// Update submission
router.put("/:id", authorize(["teacher", "admin"]), updateSubmissionController);

// Grade a submission
router.patch("/:id/grade", authorize(["teacher", "admin"]), gradeSubmissionController);

// Bulk grade submissions
router.patch("/bulk-grade", authorize(["teacher", "admin"]), bulkGradeSubmissionsController);

// Delete submission
router.delete("/:id", authorize(["teacher", "admin"]), deleteSubmissionController);

export default router;
