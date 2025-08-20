import express from "express";
import {
  createAssignment,
  getTutorAssignments,
  getAssignmentById,
  updateAssignment,
  toggleAssignmentLock,
  deleteAssignment,
  getUpcomingAssignments,
  getBatchAssignmentStats,
} from "../controllers/assignment";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Create a new assignment
router.post("/", authorize(["create_assignments"]), createAssignment);

// Get all assignments for the authenticated tutor
router.get("/", authorize(["create_assignments", "view_assignments", "view_all_batches"]), getTutorAssignments);

// Get upcoming assignments
router.get("/upcoming", authorize(["create_assignments", "view_assignments", "view_all_batches"]), getUpcomingAssignments);

// Get assignment statistics for a batch
router.get("/stats/:batchId", authorize(["create_assignments", "view_all_batches"]), getBatchAssignmentStats);

// Get assignment by ID
router.get("/:id", authorize(["create_assignments", "view_assignments", "view_all_batches"]), getAssignmentById);

// Update assignment
router.put("/:id", authorize(["create_assignments"]), updateAssignment);

// Toggle assignment lock/unlock
router.patch("/:id/toggle-lock", authorize(["create_assignments"]), toggleAssignmentLock);

// Soft delete assignment
router.delete("/:id", authorize(["create_assignments"]), deleteAssignment);

export default router;
