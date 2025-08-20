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
router.get("/stats", authorize(["manage_users"]), getUserStats);

// Create new user
router.post("/", authorize(["manage_users"]), create);

// Get all users with pagination and search
router.get("/", authorize(["manage_users"]), getAll);

// Get user by ID
router.get("/:id", authorize(["manage_users"]), getById);

// Update user
router.put("/:id", authorize(["manage_users"]), update);

// Change user password
router.patch("/:id/change-password", authorize(["manage_users"]), changeUserPassword);

// Toggle user active/inactive status
router.patch("/:id/toggle-status", authorize(["manage_users"]), toggleUserStatus);

// Soft delete user
router.delete("/:id", authorize(["manage_users"]), softDelete);

export default router;
