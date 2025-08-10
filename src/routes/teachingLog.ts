import express from "express";
import {
  createTeachingLogController,
  getTutorTeachingLogsController,
  getTeachingLogByIdController,
  updateTeachingLogController,
  markTeachingLogCompletedController,
  deleteTeachingLogController,
  getBatchTeachingStatsController,
  getDailyScheduleController,
} from "../controllers/teachingLog";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get daily schedule
router.get("/schedule", authorize(["teacher", "admin"]), getDailyScheduleController);

// Get batch teaching statistics
router.get("/batch/:batchId/stats", authorize(["teacher", "admin"]), getBatchTeachingStatsController);

// Create a new teaching log
router.post("/", authorize(["teacher", "admin"]), createTeachingLogController);

// Get all teaching logs for the authenticated tutor
router.get("/", authorize(["teacher", "admin"]), getTutorTeachingLogsController);

// Get teaching log by ID
router.get("/:id", authorize(["teacher", "admin"]), getTeachingLogByIdController);

// Update teaching log
router.put("/:id", authorize(["teacher", "admin"]), updateTeachingLogController);

// Mark teaching log as completed or cancelled
router.patch("/:id/status", authorize(["teacher", "admin"]), markTeachingLogCompletedController);

// Delete teaching log
router.delete("/:id", authorize(["teacher", "admin"]), deleteTeachingLogController);

export default router;
