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
router.get("/", authorize(["teacher", "admin"]), getTeacherDashboard);
router.get("/analytics", authorize(["teacher", "admin"]), getAnalytics);
router.get("/batch/:batchId", authorize(["teacher", "admin"]), getBatchDashboard);

// CRUD endpoints for dashboard caching
router.post("/", authorize(["teacher", "admin"]), createDashboardData);
router.get("/:id", authorize(["teacher", "admin"]), getDashboardById);
router.put("/:id", authorize(["teacher", "admin"]), updateDashboardData);
router.delete("/:id", authorize(["teacher", "admin"]), deleteDashboard);
router.get("/list/all", authorize(["teacher", "admin"]), getAllDashboardsData);

export default router;
