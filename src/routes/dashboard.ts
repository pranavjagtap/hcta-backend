import express from "express";
import {
  getTeacherDashboard,
  getBatchDashboard,
  getAnalytics,
  createDashboardData,
  getDashboardById,
  updateDashboardData,
  deleteDashboard,
  getAllDashboardsData,
} from "../controllers/dashboard";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Dashboard data endpoints
router.get("/", authorize(["view_reports"]), getTeacherDashboard);
router.get("/analytics", authorize(["view_reports"]), getAnalytics);
router.get("/batch/:batchId", authorize(["view_reports"]), getBatchDashboard);

// CRUD endpoints for dashboard caching
router.post("/", authorize(["view_reports"]), createDashboardData);
router.get("/:id", authorize(["view_reports"]), getDashboardById);
router.put("/:id", authorize(["view_reports"]), updateDashboardData);
router.delete("/:id", authorize(["view_reports"]), deleteDashboard);
router.get("/list/all", authorize(["view_reports"]), getAllDashboardsData);

export default router;
