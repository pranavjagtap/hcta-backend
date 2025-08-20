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

// Create a new subject
router.post("/", authorize(["manage_users"]), createSubjectController);

// Get all subjects
router.get("/", authorize(["view_all_batches", "manage_own_batches"]), getSubjects);

// Get subject statistics
router.get("/stats", authorize(["view_all_batches", "manage_own_batches"]), getSubjectStatsController);

// Get curriculum structure (boards, classes, subjects)
router.get("/curriculum", authorize(["view_all_batches", "manage_own_batches"]), getCurriculumStructureController);

// Get subjects by board and class level
router.get("/by-board-class", authorize(["view_all_batches", "manage_own_batches"]), getSubjectsByBoardAndClassController);

// Get subject by ID
router.get("/:id", authorize(["view_all_batches", "manage_own_batches"]), getSubjectByIdController);

// Update subject
router.put("/:id", authorize(["manage_users"]), updateSubjectController);

// Add topic to subject
router.post("/:id/topics", authorize(["manage_users"]), addTopicController);

// Remove topic from subject
router.delete("/:id/topics", authorize(["manage_users"]), removeTopicController);

// Delete subject
router.delete("/:id", authorize(["manage_users"]), deleteSubjectController);

export default router;
