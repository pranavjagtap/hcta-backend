import express from "express";
import {
  createNoteController,
  getTutorNotesController,
  getNoteByIdController,
  updateNoteController,
  toggleNotePublicController,
  approveNoteController,
  bulkUpdateNotesController,
  deleteNoteController,
  getBatchNotesController,
  getBatchNotesSummaryController,
  searchNotesController,
  getNoteStatsController,
} from "../controllers/note";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get note statistics
router.get("/stats", authorize(["teacher", "admin"]), getNoteStatsController);

// Search notes
router.get("/search", authorize(["teacher", "admin"]), searchNotesController);

// Get batch notes summary
router.get("/batch/:batchId/summary", authorize(["teacher", "admin"]), getBatchNotesSummaryController);

// Get notes for a specific batch
router.get("/batch/:batchId", authorize(["teacher", "admin"]), getBatchNotesController);

// Create a new note
router.post("/", authorize(["teacher", "admin"]), createNoteController);

// Get all notes for the authenticated tutor
router.get("/", authorize(["teacher", "admin"]), getTutorNotesController);

// Get note by ID
router.get("/:id", authorize(["teacher", "admin"]), getNoteByIdController);

// Update note
router.put("/:id", authorize(["teacher", "admin"]), updateNoteController);

// Toggle note public status
router.patch("/:id/public", authorize(["teacher", "admin"]), toggleNotePublicController);

// Approve/reject note
router.patch("/:id/approve", authorize(["teacher", "admin"]), approveNoteController);

// Bulk update notes
router.patch("/bulk", authorize(["teacher", "admin"]), bulkUpdateNotesController);

// Delete note
router.delete("/:id", authorize(["teacher", "admin"]), deleteNoteController);

export default router;
