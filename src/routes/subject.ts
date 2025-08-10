import express from "express";
import {
  createSubjectController,
  getSubjects,
  getSubjectByIdController,
  updateSubjectController,
  addTopicController,
  removeTopicController,
  deleteSubjectController,
  getSubjectsByBoardAndClassController,
  getCurriculumStructureController,
  getSubjectStatsController,
} from "../controllers/subject";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get subject statistics
router.get("/stats", authorize(["teacher", "admin"]), getSubjectStatsController);

// Get curriculum structure (boards, classes, subjects)
router.get("/curriculum", authorize(["teacher", "admin"]), getCurriculumStructureController);

// Get subjects by board and class level
router.get("/by-board-class", authorize(["teacher", "admin"]), getSubjectsByBoardAndClassController);

// Create a new subject
router.post("/", authorize(["admin"]), createSubjectController);

// Get all subjects
router.get("/", authorize(["teacher", "admin"]), getSubjects);

// Get subject by ID
router.get("/:id", authorize(["teacher", "admin"]), getSubjectByIdController);

// Update subject
router.put("/:id", authorize(["admin"]), updateSubjectController);

// Add topic to subject
router.post("/:id/topics", authorize(["admin"]), addTopicController);

// Remove topic from subject
router.delete("/:id/topics", authorize(["admin"]), removeTopicController);

// Delete subject
router.delete("/:id", authorize(["admin"]), deleteSubjectController);

export default router;
