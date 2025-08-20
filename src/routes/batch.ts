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
router.post("/", authorize(["view_all_batches"]), createBatchController);

// Get all batches for the authenticated tutor
router.get("/", authorize(["view_all_batches"]), getTutorBatches);

// Get batch dashboard summary
router.get("/:id/dashboard", authorize(["view_all_batches"]), getBatchDashboard);

// Get batch by ID
router.get("/:id", authorize(["view_all_batches"]), getBatchByIdController);

// Update batch
router.put("/:id", authorize(["view_all_batches"]), updateBatchController);

// Add students to batch
router.post("/:id/students", authorize(["view_all_batches"]), addStudentsToBatchController);

// Remove student from batch
router.delete("/:id/students/:studentId", authorize(["view_all_batches"]), removeStudentFromBatchController);

// Soft delete batch
router.delete("/:id", authorize(["view_all_batches"]), deleteBatch);

export default router;
