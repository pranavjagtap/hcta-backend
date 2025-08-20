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

// Create a new teaching log
router.post("/", authorize(["take_attendance"]), createTeachingLogController);

// Get all teaching logs for the authenticated tutor
router.get("/", authorize(["take_attendance"]), getTutorTeachingLogsController);

// Get daily schedule
router.get("/schedule", authorize(["take_attendance"]), getDailyScheduleController);

// Get batch teaching statistics
router.get("/batch/:batchId/stats", authorize(["take_attendance"]), getBatchTeachingStatsController);

// Get teaching log by ID
router.get("/:id", authorize(["take_attendance"]), getTeachingLogByIdController);

// Update teaching log
router.put("/:id", authorize(["take_attendance"]), updateTeachingLogController);

// Mark teaching log as completed or cancelled
router.patch("/:id/status", authorize(["take_attendance"]), markTeachingLogCompletedController);

// Delete teaching log
router.delete("/:id", authorize(["take_attendance"]), deleteTeachingLogController);

export default router;
