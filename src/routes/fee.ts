import express from "express";
import {
  create,
  getAll,
  getById,
  update,
  softDelete,
  processPayment,
  createBulk,
  getStats,
  getSummary,
  generateReport,
  toggleLock,
  getByStudent,
  getByBatch,
} from "../controllers/fee";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// CRUD operations
router.post("/", authorize(["admin", "teacher"]), create);
router.get("/", authorize(["admin", "teacher"]), getAll);
router.get("/:id", authorize(["admin", "teacher"]), getById);
router.put("/:id", authorize(["admin", "teacher"]), update);
router.delete("/:id", authorize(["admin"]), softDelete);

// Payment operations
router.post("/payment", authorize(["admin", "teacher"]), processPayment);
router.put("/:id/lock", authorize(["admin"]), toggleLock);

// Bulk operations
router.post("/bulk", authorize(["admin", "teacher"]), createBulk);

// Analytics and reports
router.get("/stats/overview", authorize(["admin", "teacher"]), getStats);
router.get("/summary/students", authorize(["admin", "teacher"]), getSummary);
router.get("/reports/generate", authorize(["admin", "teacher"]), generateReport);

// Filtered queries
router.get("/student/:studentId", authorize(["admin", "teacher"]), getByStudent);
router.get("/batch/:batchId", authorize(["admin", "teacher"]), getByBatch);

export default router;
