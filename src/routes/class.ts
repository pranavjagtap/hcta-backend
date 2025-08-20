import express from "express";
import {
  createClassController,
  getClassesController,
  getClassByIdController,
  updateClassController,
  deleteClassController,
  getClassStatsController,
  getClassStudentsController,
} from "../controllers/class";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Create a new class
router.post("/", authorize(["manage_classes"]), createClassController);

// Get all classes with pagination and filters
router.get("/", authorize(["view_classes"]), getClassesController);

// Get class statistics
router.get("/stats", authorize(["view_classes"]), getClassStatsController);

// Get class by ID
router.get("/:id", authorize(["view_classes"]), getClassByIdController);

// Get students in a class
router.get("/:id/students", authorize(["view_classes"]), getClassStudentsController);

// Update class
router.put("/:id", authorize(["manage_classes"]), updateClassController);

// Delete class (soft delete)
router.delete("/:id", authorize(["manage_classes"]), deleteClassController);

export default router;
