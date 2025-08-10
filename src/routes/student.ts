import express from "express";
import {
  createStudentController,
  getTutorStudentsController,
  getStudentByIdController,
  updateStudentController,
  addWeaknessController,
  removeWeaknessController,
  deleteStudent,
  getUnassignedStudentsController,
  getStudentStatsController,
} from "../controllers/student";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get student statistics
router.get("/stats", authorize(["teacher", "admin"]), getStudentStatsController);

// Get unassigned students (for batch assignment)
router.get("/unassigned", authorize(["teacher", "admin"]), getUnassignedStudentsController);

// Create a new student
router.post("/", authorize(["teacher", "admin"]), createStudentController);

// Get all students for the authenticated tutor
router.get("/", authorize(["teacher", "admin"]), getTutorStudentsController);

// Get student by ID
router.get("/:id", authorize(["teacher", "admin"]), getStudentByIdController);

// Update student
router.put("/:id", authorize(["teacher", "admin"]), updateStudentController);

// Add weakness to student
router.post("/:id/weaknesses", authorize(["teacher", "admin"]), addWeaknessController);

// Remove weakness from student
router.delete("/:id/weaknesses", authorize(["teacher", "admin"]), removeWeaknessController);

// Soft delete student
router.delete("/:id", authorize(["teacher", "admin"]), deleteStudent);

export default router;
