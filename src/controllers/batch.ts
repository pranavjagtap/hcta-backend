import { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import "../types/express";
import {
  createBatch,
  getAllBatches,
  getBatchById,
  updateBatch,
  softDeleteBatch,
  addStudentsToBatch,
  removeStudentFromBatch,
  getBatchStats,
  checkBatchNameExists,
} from "../services/batch";
import {
  createBatchSchema,
  updateBatchSchema,
  batchQuerySchema,
  addStudentsToBatchSchema,
  removeStudentFromBatchSchema,
} from "../validators/batch";

// Create a new batch
export const createBatchController = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = createBatchSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: "Validation failed",
        details: parsed.error.errors
      });
      return;
    }

    // Check for duplicate batch name for this tutor
    if (!req.user?._id) {
      res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
      return;
    }

    const nameExists = await checkBatchNameExists(parsed.data.name, req.user._id);
    if (nameExists) {
      res.status(400).json({
        success: false,
        error: "Batch name already exists for this tutor",
      });
      return;
    }

    const batchData = {
      ...parsed.data,
      tutorId: req.user._id,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    };

    const batch = await createBatch(batchData);
    res.status(201).json({
      success: true,
      data: batch,
      message: "Batch created successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to create batch",
      details: err.message || err
    });
  }
};

// Get all batches for the authenticated tutor
export const getTutorBatches = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = batchQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: "Invalid query parameters",
        details: parsed.error.errors
      });
      return;
    }

    const filters: any = {
      tutorId: req.user?._id,
    };

    if (parsed.data.academicYear) {
      filters.academicYear = parsed.data.academicYear;
    }

    if (parsed.data.isActive !== undefined) {
      filters.isActive = parsed.data.isActive;
    }

    const result = await getAllBatches(filters, {
      page: parsed.data.page,
      limit: parsed.data.limit,
      search: parsed.data.search,
    });

    res.status(200).json({
      success: true,
      data: result,
      message: "Batches retrieved successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to retrieve batches",
      details: err.message || err
    });
  }
};

// Get batch by ID
export const getBatchByIdController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        error: "Invalid batch ID",
      });
      return;
    }

    const batch = await getBatchById(id);
    if (!batch) {
      res.status(404).json({
        success: false,
        error: "Batch not found",
      });
      return;
    }

    // Check if the batch belongs to the authenticated tutor
    if (batch.tutorId.toString() !== req.user?._id) {
      res.status(403).json({
        success: false,
        error: "Access denied",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: batch,
      message: "Batch retrieved successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to retrieve batch",
      details: err.message || err
    });
  }
};

// Update batch
export const updateBatchController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        error: "Invalid batch ID",
      });
      return;
    }

    const parsed = updateBatchSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: "Validation failed",
        details: parsed.error.errors
      });
      return;
    }

    // Check if batch exists and belongs to the tutor
    const existingBatch = await getBatchById(id, false);
    if (!existingBatch) {
      res.status(404).json({
        success: false,
        error: "Batch not found",
      });
      return;
    }

    if (existingBatch.tutorId.toString() !== req.user?._id) {
      res.status(403).json({
        success: false,
        error: "Access denied",
      });
      return;
    }

    // Check for duplicate batch name if name is being updated
    if (parsed.data.name && parsed.data.name !== existingBatch.name) {
      if (!req.user?._id) {
        res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
        return;
      }
      const nameExists = await checkBatchNameExists(parsed.data.name, req.user._id, id);
      if (nameExists) {
        res.status(400).json({
          success: false,
          error: "Batch name already exists for this tutor",
        });
        return;
      }
    }

    const updatedBatch = await updateBatch(id, {
      ...parsed.data,
      updatedBy: req.user?._id,
    });

    res.status(200).json({
      success: true,
      data: updatedBatch,
      message: "Batch updated successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to update batch",
      details: err.message || err
    });
  }
};

// Add students to batch
export const addStudentsToBatchController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        error: "Invalid batch ID",
      });
      return;
    }

    const parsed = addStudentsToBatchSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: "Validation failed",
        details: parsed.error.errors
      });
      return;
    }

    // Check if batch exists and belongs to the tutor
    const existingBatch = await getBatchById(id, false);
    if (!existingBatch) {
      res.status(404).json({
        success: false,
        error: "Batch not found",
      });
      return;
    }

    if (existingBatch.tutorId.toString() !== req.user?._id) {
      res.status(403).json({
        success: false,
        error: "Access denied",
      });
      return;
    }

    const updatedBatch = await addStudentsToBatch(id, parsed.data.studentIds);

    res.status(200).json({
      success: true,
      data: updatedBatch,
      message: "Students added to batch successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to add students to batch",
      details: err.message || err
    });
  }
};

// Remove student from batch
export const removeStudentFromBatchController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        error: "Invalid batch ID",
      });
      return;
    }

    const parsed = removeStudentFromBatchSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: "Validation failed",
        details: parsed.error.errors
      });
      return;
    }

    // Check if batch exists and belongs to the tutor
    const existingBatch = await getBatchById(id, false);
    if (!existingBatch) {
      res.status(404).json({
        success: false,
        error: "Batch not found",
      });
      return;
    }

    if (existingBatch.tutorId.toString() !== req.user?._id) {
      res.status(403).json({
        success: false,
        error: "Access denied",
      });
      return;
    }

    const updatedBatch = await removeStudentFromBatch(id, parsed.data.studentId);

    res.status(200).json({
      success: true,
      data: updatedBatch,
      message: "Student removed from batch successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to remove student from batch",
      details: err.message || err
    });
  }
};

// Delete batch (soft delete)
export const deleteBatch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        error: "Invalid batch ID",
      });
      return;
    }

    // Check if batch exists and belongs to the tutor
    const existingBatch = await getBatchById(id, false);
    if (!existingBatch) {
      res.status(404).json({
        success: false,
        error: "Batch not found",
      });
      return;
    }

    if (existingBatch.tutorId.toString() !== req.user?._id) {
      res.status(403).json({
        success: false,
        error: "Access denied",
      });
      return;
    }

    await softDeleteBatch(id);

    res.status(200).json({
      success: true,
      message: "Batch deleted successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to delete batch",
      details: err.message || err
    });
  }
};

// Get batch dashboard statistics
export const getBatchDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await getBatchStats(req.user?._id);

    res.status(200).json({
      success: true,
      data: stats,
      message: "Batch statistics retrieved successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to retrieve batch statistics",
      details: err.message || err
    });
  }
};
