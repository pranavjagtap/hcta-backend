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

// Create a new note
router.post("/", authorize(["manage_notes", "upload_notes"]), createNoteController);

// Get all notes for the authenticated tutor
router.get("/", authorize(["manage_notes", "upload_notes", "view_notes"]), getTutorNotesController);

// Get note statistics
router.get("/stats", authorize(["manage_notes", "upload_notes"]), getNoteStatsController);

// Search notes
router.get("/search", authorize(["manage_notes", "upload_notes", "view_notes"]), searchNotesController);

// Get batch notes summary
router.get("/batch/:batchId/summary", authorize(["manage_notes", "upload_notes"]), getBatchNotesSummaryController);

// Get notes for a specific batch
router.get("/batch/:batchId", authorize(["manage_notes", "upload_notes", "view_notes"]), getBatchNotesController);

// Get note by ID
router.get("/:id", authorize(["manage_notes", "upload_notes", "view_notes"]), getNoteByIdController);

// Update note
router.put("/:id", authorize(["manage_notes", "upload_notes"]), updateNoteController);

// Toggle note public status
router.patch("/:id/public", authorize(["manage_notes", "upload_notes"]), toggleNotePublicController);

// Approve/reject note
router.patch("/:id/approve", authorize(["manage_notes"]), approveNoteController);

// Bulk update notes
router.patch("/bulk", authorize(["manage_notes", "upload_notes"]), bulkUpdateNotesController);

// Delete note
router.delete("/:id", authorize(["manage_notes", "upload_notes"]), deleteNoteController);

export default router;
