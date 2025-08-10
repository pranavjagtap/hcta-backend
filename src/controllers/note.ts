import { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import "../types/express";
import {
  createNote,
  getTutorNotes,
  getNoteById,
  updateNote,
  toggleNotePublic,
  approveNote,
  bulkUpdateNotes,
  softDeleteNote,
  getBatchNotes,
  getBatchNotesSummary,
  searchNotes,
  getNoteStats,
  checkBatchAccess,
  checkSubjectExists,
} from "../services/note";
import {
  createNoteSchema,
  updateNoteSchema,
  noteQuerySchema,
  togglePublicSchema,
  approveNoteSchema,
  getBatchNotesSchema,
  searchNotesSchema,
  bulkUpdateNotesSchema,
} from "../validators/note";

// Create a new note
export const createNoteController = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = createNoteSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: "Validation failed",
        details: parsed.error.errors
      });
      return;
    }

    if (!req.user?._id) {
      res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
      return;
    }

    // Check if batch exists and belongs to tutor
    const batch = await checkBatchAccess(parsed.data.batchId, req.user._id);
    if (!batch) {
      res.status(400).json({
        success: false,
        error: "Batch not found or access denied",
      });
      return;
    }

    // Check if subject exists if provided
    if (parsed.data.subjectId) {
      const subject = await checkSubjectExists(parsed.data.subjectId);
      if (!subject) {
        res.status(400).json({
          success: false,
          error: "Subject not found",
        });
        return;
      }
    }

    const noteData = {
      ...parsed.data,
      uploadedBy: req.user._id,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    };

    const note = await createNote(noteData);

    res.status(201).json({
      success: true,
      data: note,
      message: "Note created successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to create note",
      details: err.message || err
    });
  }
};

// Get notes for the authenticated tutor
export const getTutorNotesController = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = noteQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: "Invalid query parameters",
        details: parsed.error.errors
      });
      return;
    }

    if (!req.user?._id) {
      res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
      return;
    }

    const filters: any = {};
    if (parsed.data.batchId) {
      filters.batchId = parsed.data.batchId;
    }
    if (parsed.data.subjectId) {
      filters.subjectId = parsed.data.subjectId;
    }
    if (parsed.data.noteType) {
      filters.noteType = parsed.data.noteType;
    }
    if (parsed.data.isPublic !== undefined) {
      filters.isPublic = parsed.data.isPublic;
    }
    if (parsed.data.approved !== undefined) {
      filters.approved = parsed.data.approved;
    }
    if (parsed.data.startDate || parsed.data.endDate) {
      filters.createdAt = {};
      if (parsed.data.startDate) {
        filters.createdAt.$gte = new Date(parsed.data.startDate);
      }
      if (parsed.data.endDate) {
        filters.createdAt.$lte = new Date(parsed.data.endDate);
      }
    }

    const result = await getTutorNotes(req.user._id, filters, {
      page: parsed.data.page,
      limit: parsed.data.limit,
      search: parsed.data.search,
    });

    res.status(200).json({
      success: true,
      data: result,
      message: "Notes retrieved successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to retrieve notes",
      details: err.message || err
    });
  }
};

// Get note by ID
export const getNoteByIdController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        error: "Invalid note ID",
      });
      return;
    }

    if (!req.user?._id) {
      res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
      return;
    }

    const note = await getNoteById(id, req.user._id);

    if (!note) {
      res.status(404).json({
        success: false,
        error: "Note not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: note,
      message: "Note retrieved successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to retrieve note",
      details: err.message || err
    });
  }
};

// Update note
export const updateNoteController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        error: "Invalid note ID",
      });
      return;
    }

    const parsed = updateNoteSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: "Validation failed",
        details: parsed.error.errors
      });
      return;
    }

    if (!req.user?._id) {
      res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
      return;
    }

    // Check if batch exists and belongs to tutor if batchId is being updated
    if (parsed.data.batchId) {
      const batch = await checkBatchAccess(parsed.data.batchId, req.user._id);
      if (!batch) {
        res.status(400).json({
          success: false,
          error: "Batch not found or access denied",
        });
        return;
      }
    }

    // Check if subject exists if subjectId is being updated
    if (parsed.data.subjectId) {
      const subject = await checkSubjectExists(parsed.data.subjectId);
      if (!subject) {
        res.status(400).json({
          success: false,
          error: "Subject not found",
        });
        return;
      }
    }

    const updateData = {
      ...parsed.data,
      updatedBy: req.user._id,
    };

    const note = await updateNote(id, updateData, req.user._id);

    if (!note) {
      res.status(404).json({
        success: false,
        error: "Note not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: note,
      message: "Note updated successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to update note",
      details: err.message || err
    });
  }
};

// Toggle note public status
export const toggleNotePublicController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        error: "Invalid note ID",
      });
      return;
    }

    const parsed = togglePublicSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: "Validation failed",
        details: parsed.error.errors
      });
      return;
    }

    if (!req.user?._id) {
      res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
      return;
    }

    const note = await toggleNotePublic(id, parsed.data.isPublic, req.user._id);

    if (!note) {
      res.status(404).json({
        success: false,
        error: "Note not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: note,
      message: `Note ${parsed.data.isPublic ? 'made public' : 'made private'} successfully`,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to toggle note public status",
      details: err.message || err
    });
  }
};

// Approve/reject note
export const approveNoteController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        error: "Invalid note ID",
      });
      return;
    }

    const parsed = approveNoteSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: "Validation failed",
        details: parsed.error.errors
      });
      return;
    }

    if (!req.user?._id) {
      res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
      return;
    }

    const note = await approveNote(id, parsed.data.approved, req.user._id);

    if (!note) {
      res.status(404).json({
        success: false,
        error: "Note not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: note,
      message: `Note ${parsed.data.approved ? 'approved' : 'rejected'} successfully`,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to approve/reject note",
      details: err.message || err
    });
  }
};

// Bulk update notes
export const bulkUpdateNotesController = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = bulkUpdateNotesSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: "Validation failed",
        details: parsed.error.errors
      });
      return;
    }

    if (!req.user?._id) {
      res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
      return;
    }

    const result = await bulkUpdateNotes(parsed.data.noteIds, parsed.data.updates || {}, req.user._id);

    res.status(200).json({
      success: true,
      data: result,
      message: "Notes updated successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to bulk update notes",
      details: err.message || err
    });
  }
};

// Delete note
export const deleteNoteController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        error: "Invalid note ID",
      });
      return;
    }

    if (!req.user?._id) {
      res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
      return;
    }

    const note = await softDeleteNote(id, req.user._id);

    if (!note) {
      res.status(404).json({
        success: false,
        error: "Note not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Note deleted successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to delete note",
      details: err.message || err
    });
  }
};

// Get notes for a specific batch
export const getBatchNotesController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { batchId } = req.params;

    if (!isValidObjectId(batchId)) {
      res.status(400).json({
        success: false,
        error: "Invalid batch ID",
      });
      return;
    }

    const parsed = getBatchNotesSchema.safeParse({
      batchId,
      ...req.query
    });
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: "Invalid query parameters",
        details: parsed.error.errors
      });
      return;
    }

    if (!req.user?._id) {
      res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
      return;
    }

    const filters: any = {};
    if (parsed.data.noteType) {
      filters.noteType = parsed.data.noteType;
    }
    if (parsed.data.isPublic !== undefined) {
      filters.isPublic = parsed.data.isPublic;
    }
    if (parsed.data.approved !== undefined) {
      filters.approved = parsed.data.approved;
    }

    const notes = await getBatchNotes(batchId, req.user._id, filters);

    if (notes === null) {
      res.status(404).json({
        success: false,
        error: "Batch not found or access denied",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: notes,
      message: "Batch notes retrieved successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to retrieve batch notes",
      details: err.message || err
    });
  }
};

// Get batch notes summary
export const getBatchNotesSummaryController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { batchId } = req.params;

    if (!isValidObjectId(batchId)) {
      res.status(400).json({
        success: false,
        error: "Invalid batch ID",
      });
      return;
    }

    if (!req.user?._id) {
      res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
      return;
    }

    const summary = await getBatchNotesSummary(batchId, req.user._id);

    if (!summary) {
      res.status(404).json({
        success: false,
        error: "Batch not found or access denied",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: summary,
      message: "Batch notes summary retrieved successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to retrieve batch notes summary",
      details: err.message || err
    });
  }
};

// Search notes
export const searchNotesController = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = searchNotesSchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: "Invalid query parameters",
        details: parsed.error.errors
      });
      return;
    }

    if (!req.user?._id) {
      res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
      return;
    }

    const filters: any = {};
    if (parsed.data.batchId) {
      filters.batchId = parsed.data.batchId;
    }
    if (parsed.data.subjectId) {
      filters.subjectId = parsed.data.subjectId;
    }
    if (parsed.data.noteType) {
      filters.noteType = parsed.data.noteType;
    }
    if (parsed.data.isPublic !== undefined) {
      filters.isPublic = parsed.data.isPublic;
    }
    if (parsed.data.approved !== undefined) {
      filters.approved = parsed.data.approved;
    }

    const results = await searchNotes(parsed.data.query, req.user._id, filters);

    res.status(200).json({
      success: true,
      data: results,
      message: "Notes search completed successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to search notes",
      details: err.message || err
    });
  }
};

// Get note statistics
export const getNoteStatsController = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user?._id) {
      res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
      return;
    }

    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const stats = await getNoteStats(req.user._id, start, end);

    res.status(200).json({
      success: true,
      data: stats,
      message: "Note statistics retrieved successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to retrieve note statistics",
      details: err.message || err
    });
  }
};
