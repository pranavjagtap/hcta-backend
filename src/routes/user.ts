import express from "express";
import {
  create,
  getAll,
  getById,
  update,
  softDelete,
  getUserStats,
  changeUserPassword,
  toggleUserStatus,
} from "../controllers/user";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get current user profile (no special permission needed)
router.get("/profile", getById);

// Update current user profile (no special permission needed) 
router.put("/profile", update);

// Admin only routes for user management
// Get user statistics
router.get("/stats", authorize(["admin"]), getUserStats);

// Create new user
router.post("/", authorize(["admin"]), create);

// Get all users with pagination and search
router.get("/", authorize(["admin"]), getAll);

// Get user by ID
router.get("/:id", authorize(["admin"]), getById);

// Update user
router.put("/:id", authorize(["admin"]), update);

// Change user password
router.patch("/:id/change-password", authorize(["admin"]), changeUserPassword);

// Toggle user active/inactive status
router.patch("/:id/toggle-status", authorize(["admin"]), toggleUserStatus);

// Soft delete user
router.delete("/:id", authorize(["admin"]), softDelete);

export default router;
