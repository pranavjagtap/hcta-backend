import express from "express";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import {
  createTopicController,
  getAllTopicsController,
  getTopicByIdController,
  updateTopicController,
  deleteTopicController,
  getTopicStatsController,
  getCurriculumTopicStructureController,
  getTopicsBySubjectWithProgressController,
  bulkCreateTopicsController,
  getTopicsByBoardAndClassController,
  searchTopicsByKeywordsController,
} from "../controllers/topic";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Topic CRUD operations
router.post("/", authorize(["manage_own_batches", "view_all_batches"]), createTopicController);
router.get("/", authorize(["manage_own_batches", "view_all_batches"]), getAllTopicsController);
router.get("/:id", authorize(["manage_own_batches", "view_all_batches"]), getTopicByIdController);
router.put("/:id", authorize(["manage_own_batches", "view_all_batches"]), updateTopicController);
router.delete("/:id", authorize(["manage_own_batches", "view_all_batches"]), deleteTopicController);

// Topic statistics and analytics
router.get("/stats/overview", authorize(["view_reports"]), getTopicStatsController);

// Curriculum planning routes
router.get("/curriculum/:subjectId", authorize(["manage_own_batches", "view_all_batches"]), getCurriculumTopicStructureController);
router.get("/subject/:subjectId/batch/:batchId/progress", authorize(["view_reports"]), getTopicsBySubjectWithProgressController);

// Bulk operations
router.post("/bulk/create", authorize(["manage_own_batches", "view_all_batches"]), bulkCreateTopicsController);

// Board and class level routes
router.get("/board/:board/class/:classLevel", authorize(["manage_own_batches", "view_all_batches"]), getTopicsByBoardAndClassController);

// Search and discovery routes
router.get("/search/keywords", authorize(["manage_own_batches", "view_all_batches"]), searchTopicsByKeywordsController);

export default router;

