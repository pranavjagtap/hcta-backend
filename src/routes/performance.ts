import express from "express";
import {
  createPerformanceController,
  getTutorPerformancesController,
  getPerformanceByIdController,
  updatePerformanceController,
  deletePerformanceController,
  bulkCreatePerformancesController,
  getStudentPerformancesController,
  getStudentPerformanceSummaryController,
  getBatchPerformanceSummaryController,
  getPerformanceComparisonController,
  getPerformanceStatsController,
  getPerformanceHeatmapController,
} from "../controllers/performance";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get performance statistics
router.get("/stats", authorize(["teacher", "admin"]), getPerformanceStatsController);

// Get performance comparison
router.get("/comparison", authorize(["teacher", "admin"]), getPerformanceComparisonController);

// Get performance heatmap data
router.get("/heatmap/:batchId", authorize(["teacher", "admin"]), getPerformanceHeatmapController);

// Get batch performance summary
router.get("/batch/:batchId/summary", authorize(["teacher", "admin"]), getBatchPerformanceSummaryController);

// Get student performance summary
router.get("/student/:studentId/summary", authorize(["teacher", "admin"]), getStudentPerformanceSummaryController);

// Get performances for a specific student
router.get("/student/:studentId", authorize(["teacher", "admin"]), getStudentPerformancesController);

// Create a new performance record
router.post("/", authorize(["teacher", "admin"]), createPerformanceController);

// Bulk create performance records
router.post("/bulk", authorize(["teacher", "admin"]), bulkCreatePerformancesController);

// Get all performances for the authenticated tutor
router.get("/", authorize(["teacher", "admin"]), getTutorPerformancesController);

// Get performance by ID
router.get("/:id", authorize(["teacher", "admin"]), getPerformanceByIdController);

// Update performance
router.put("/:id", authorize(["teacher", "admin"]), updatePerformanceController);

// Delete performance
router.delete("/:id", authorize(["teacher", "admin"]), deletePerformanceController);

export default router;
