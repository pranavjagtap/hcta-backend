import { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import "../types/express";
import {
  createTeachingLog,
  getTutorTeachingLogs,
  getTeachingLogById,
  updateTeachingLog,
  markTeachingLogCompleted,
  softDeleteTeachingLog,
  getBatchTeachingStats,
  getDailySchedule,
  checkBatchAccess,
  checkSubjectExists,
} from "../services/teachingLog";
import {
  createTeachingLogSchema,
  updateTeachingLogSchema,
  teachingLogQuerySchema,
  markCompletedSchema,
  getBatchTeachingStatsSchema,
  getDailyScheduleSchema,
} from "../validators/teachingLog";

// Create a new teaching log entry
export const createTeachingLogController = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = createTeachingLogSchema.safeParse(req.body);
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

    const teachingLogData = {
      ...parsed.data,
      tutorId: req.user._id,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    };

    const teachingLog = await createTeachingLog(teachingLogData);

    res.status(201).json({
      success: true,
      data: teachingLog,
      message: "Teaching log created successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to create teaching log",
      details: err.message || err
    });
  }
};

// Get teaching logs for the authenticated tutor
export const getTutorTeachingLogsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = teachingLogQuerySchema.safeParse(req.query);
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
    if (parsed.data.status) {
      filters.status = parsed.data.status;
    }
    if (parsed.data.startDate || parsed.data.endDate) {
      filters.date = {};
      if (parsed.data.startDate) {
        filters.date.$gte = new Date(parsed.data.startDate);
      }
      if (parsed.data.endDate) {
        filters.date.$lte = new Date(parsed.data.endDate);
      }
    }
    if (parsed.data.topic) {
      filters.topic = { $regex: parsed.data.topic, $options: "i" };
    }

    const result = await getTutorTeachingLogs(req.user._id, filters, {
      page: parsed.data.page,
      limit: parsed.data.limit,
      search: parsed.data.search,
    });

    res.status(200).json({
      success: true,
      data: result,
      message: "Teaching logs retrieved successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to retrieve teaching logs",
      details: err.message || err
    });
  }
};

// Get teaching log by ID
export const getTeachingLogByIdController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        error: "Invalid teaching log ID",
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

    const teachingLog = await getTeachingLogById(id, req.user._id);

    if (!teachingLog) {
      res.status(404).json({
        success: false,
        error: "Teaching log not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: teachingLog,
      message: "Teaching log retrieved successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to retrieve teaching log",
      details: err.message || err
    });
  }
};

// Update teaching log
export const updateTeachingLogController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        error: "Invalid teaching log ID",
      });
      return;
    }

    const parsed = updateTeachingLogSchema.safeParse(req.body);
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

    const teachingLog = await updateTeachingLog(id, updateData, req.user._id);

    if (!teachingLog) {
      res.status(404).json({
        success: false,
        error: "Teaching log not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: teachingLog,
      message: "Teaching log updated successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to update teaching log",
      details: err.message || err
    });
  }
};

// Mark teaching log as completed or cancelled
export const markTeachingLogCompletedController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        error: "Invalid teaching log ID",
      });
      return;
    }

    const parsed = markCompletedSchema.safeParse(req.body);
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

    const teachingLog = await markTeachingLogCompleted(id, parsed.data.status, req.user._id);

    if (!teachingLog) {
      res.status(404).json({
        success: false,
        error: "Teaching log not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: teachingLog,
      message: `Teaching log marked as ${parsed.data.status}`,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to update teaching log status",
      details: err.message || err
    });
  }
};

// Delete teaching log
export const deleteTeachingLogController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        error: "Invalid teaching log ID",
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

    const teachingLog = await softDeleteTeachingLog(id, req.user._id);

    if (!teachingLog) {
      res.status(404).json({
        success: false,
        error: "Teaching log not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Teaching log deleted successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to delete teaching log",
      details: err.message || err
    });
  }
};

// Get batch teaching statistics
export const getBatchTeachingStatsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { batchId } = req.params;

    if (!isValidObjectId(batchId)) {
      res.status(400).json({
        success: false,
        error: "Invalid batch ID",
      });
      return;
    }

    const parsed = getBatchTeachingStatsSchema.safeParse({
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

    // Check if batch exists and belongs to tutor
    const batch = await checkBatchAccess(batchId, req.user._id);
    if (!batch) {
      res.status(400).json({
        success: false,
        error: "Batch not found or access denied",
      });
      return;
    }

    const startDate = parsed.data.startDate ? new Date(parsed.data.startDate) : undefined;
    const endDate = parsed.data.endDate ? new Date(parsed.data.endDate) : undefined;

    const stats = await getBatchTeachingStats(batchId, req.user._id, startDate, endDate);

    res.status(200).json({
      success: true,
      data: stats,
      message: "Batch teaching statistics retrieved successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to retrieve batch teaching statistics",
      details: err.message || err
    });
  }
};

// Get daily schedule
export const getDailyScheduleController = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = getDailyScheduleSchema.safeParse(req.query);
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

    const date = parsed.data.date ? new Date(parsed.data.date) : undefined;
    const schedule = await getDailySchedule(req.user._id, date, parsed.data.batchId);

    res.status(200).json({
      success: true,
      data: schedule,
      message: "Daily schedule retrieved successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to retrieve daily schedule",
      details: err.message || err
    });
  }
};
