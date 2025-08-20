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
  bulkUploadStudentsController,
} from "../controllers/student";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { handleFileUpload } from "../middlewares/fileUpload";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Create a new student
router.post("/", authorize(["manage_students"]), handleFileUpload("profilePicture"), createStudentController);

// Bulk upload students
router.post("/bulk-upload", authorize(["manage_students"]), bulkUploadStudentsController);

// Get all students for the authenticated tutor
router.get("/", authorize(["view_students"]), getTutorStudentsController);

// Get student statistics
router.get("/stats", authorize(["view_students"]), getStudentStatsController);

// Get unassigned students (for batch assignment)
router.get("/unassigned", authorize(["view_students"]), getUnassignedStudentsController);

// Get student by ID
router.get("/:id", authorize(["view_students"]), getStudentByIdController);

// Update student
router.put("/:id", authorize(["manage_students"]), handleFileUpload("profilePicture"), updateStudentController);

// Add weakness to student
router.post("/:id/weaknesses", authorize(["manage_students"]), addWeaknessController);

// Remove weakness from student
router.delete("/:id/weaknesses", authorize(["manage_students"]), removeWeaknessController);

// Soft delete student
router.delete("/:id", authorize(["manage_students"]), deleteStudent);

export default router;
