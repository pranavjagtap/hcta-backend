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

// Create a new submission
router.post("/", authorize(["submit_assignments"]), createSubmissionController);

// Get all submissions for the authenticated tutor
router.get("/", authorize(["create_assignments", "view_assignments"]), getTutorSubmissionsController);

// Get submission statistics
router.get("/stats", authorize(["create_assignments", "view_assignments"]), getSubmissionStatsController);

// Get assignment submission summary
router.get("/assignment/:assignmentId/summary", authorize(["create_assignments"]), getAssignmentSubmissionSummaryController);

// Get submissions for a specific assignment
router.get("/assignment/:assignmentId", authorize(["create_assignments", "view_assignments"]), getAssignmentSubmissionsController);

// Get submissions for a specific student
router.get("/student/:studentId", authorize(["create_assignments", "view_assignments"]), getStudentSubmissionsController);

// Get submission by ID
router.get("/:id", authorize(["create_assignments", "view_assignments", "submit_assignments"]), getSubmissionByIdController);

// Update submission
router.put("/:id", authorize(["submit_assignments"]), updateSubmissionController);

// Grade a submission
router.patch("/:id/grade", authorize(["create_assignments"]), gradeSubmissionController);

// Bulk grade submissions
router.patch("/bulk-grade", authorize(["create_assignments"]), bulkGradeSubmissionsController);

// Delete submission
router.delete("/:id", authorize(["create_assignments", "submit_assignments"]), deleteSubmissionController);

export default router;
