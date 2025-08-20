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
router.post("/", authorize(["configure_payments"]), create);
router.get("/", authorize(["configure_payments", "view_fees"]), getAll);
router.get("/:id", authorize(["configure_payments", "view_fees"]), getById);
router.put("/:id", authorize(["configure_payments"]), update);
router.delete("/:id", authorize(["configure_payments"]), softDelete);

// Payment operations
router.post("/payment", authorize(["configure_payments"]), processPayment);
router.put("/:id/lock", authorize(["configure_payments"]), toggleLock);

// Bulk operations
router.post("/bulk", authorize(["configure_payments"]), createBulk);

// Analytics and reports
router.get("/stats/overview", authorize(["configure_payments", "view_fees"]), getStats);
router.get("/summary/students", authorize(["configure_payments", "view_fees"]), getSummary);
router.get("/reports/generate", authorize(["configure_payments", "view_fees"]), generateReport);

// Filtered queries
router.get("/student/:studentId", authorize(["configure_payments", "view_fees"]), getByStudent);
router.get("/batch/:batchId", authorize(["configure_payments", "view_fees"]), getByBatch);

export default router;
