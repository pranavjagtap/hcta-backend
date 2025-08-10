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

// Get upcoming assignments
router.get("/upcoming", authorize(["teacher", "admin"]), getUpcomingAssignments);

// Get assignment statistics for a batch
router.get("/stats/:batchId", authorize(["teacher", "admin"]), getBatchAssignmentStats);

// Create a new assignment
router.post("/", authorize(["teacher", "admin"]), createAssignment);

// Get all assignments for the authenticated tutor
router.get("/", authorize(["teacher", "admin"]), getTutorAssignments);

// Get assignment by ID
router.get("/:id", authorize(["teacher", "admin"]), getAssignmentById);

// Update assignment
router.put("/:id", authorize(["teacher", "admin"]), updateAssignment);

// Toggle assignment lock/unlock
router.patch("/:id/toggle-lock", authorize(["teacher", "admin"]), toggleAssignmentLock);

// Soft delete assignment
router.delete("/:id", authorize(["teacher", "admin"]), deleteAssignment);

export default router;
