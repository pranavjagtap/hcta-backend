import express from "express";
import {
  createBatchController,
  getTutorBatches,
  getBatchByIdController,
  updateBatchController,
  addStudentsToBatchController,
  removeStudentFromBatchController,
  deleteBatch,
  getBatchDashboard,
} from "../controllers/batch";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Create a new batch
router.post("/", authorize(["teacher", "admin"]), createBatchController);

// Get all batches for the authenticated tutor
router.get("/", authorize(["teacher", "admin"]), getTutorBatches);

// Get batch dashboard summary
router.get("/:id/dashboard", authorize(["teacher", "admin"]), getBatchDashboard);

// Get batch by ID
router.get("/:id", authorize(["teacher", "admin"]), getBatchByIdController);

// Update batch
router.put("/:id", authorize(["teacher", "admin"]), updateBatchController);

// Add students to batch
router.post("/:id/students", authorize(["teacher", "admin"]), addStudentsToBatchController);

// Remove student from batch
router.delete("/:id/students/:studentId", authorize(["teacher", "admin"]), removeStudentFromBatchController);

// Soft delete batch
router.delete("/:id", authorize(["teacher", "admin"]), deleteBatch);

export default router;
