import { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import {
  createPerformance,
  getTutorPerformances,
  getPerformanceById,
  updatePerformance,
  softDeletePerformance,
  bulkCreatePerformances,
  getStudentPerformances,
  getStudentPerformanceSummary,
  getBatchPerformanceSummary,
  getPerformanceComparison,
  getPerformanceStats,
  getPerformanceHeatmapData,
  checkStudentAccess,
  checkSubjectExists,
} from "../services/performance";
import {
  createPerformanceSchema,
  updatePerformanceSchema,
  performanceQuerySchema,
  getStudentPerformanceSchema,
  getBatchPerformanceSchema,
  performanceComparisonSchema,
  bulkCreatePerformanceSchema,
  performanceStatsSchema,
  performanceHeatmapSchema,
} from "../validators/performance";

// Create a new performance record
export const createPerformanceController = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = createPerformanceSchema.safeParse(req.body);
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

    // Check if student exists and belongs to tutor
    const student = await checkStudentAccess(parsed.data.studentId, req.user._id);
    if (!student) {
      res.status(400).json({
        success: false,
        error: "Student not found or access denied",
      });
      return;
    }

    // Check if subject exists
    const subject = await checkSubjectExists(parsed.data.subjectId);
    if (!subject) {
      res.status(400).json({
        success: false,
        error: "Subject not found",
      });
      return;
    }

    const performanceData = {
      ...parsed.data,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    };

    const performance = await createPerformance(performanceData);

    res.status(201).json({
      success: true,
      data: performance,
      message: "Performance record created successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to create performance record",
      details: err.message || err
    });
  }
};

// Get performances for the authenticated tutor
export const getTutorPerformancesController = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = performanceQuerySchema.safeParse(req.query);
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
    if (parsed.data.studentId) {
      filters.studentId = parsed.data.studentId;
    }
    if (parsed.data.subjectId) {
      filters.subjectId = parsed.data.subjectId;
    }
    if (parsed.data.assessmentType) {
      filters.assessmentType = parsed.data.assessmentType;
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
    if (parsed.data.minScore !== undefined) {
      filters.score = { ...filters.score, $gte: parsed.data.minScore };
    }
    if (parsed.data.maxScore !== undefined) {
      filters.score = { ...filters.score, $lte: parsed.data.maxScore };
    }

    const result = await getTutorPerformances(req.user._id, filters, {
      page: parsed.data.page,
      limit: parsed.data.limit,
      search: parsed.data.search,
    });

    res.status(200).json({
      success: true,
      data: result,
      message: "Performance records retrieved successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to retrieve performance records",
      details: err.message || err
    });
  }
};

// Get performance by ID
export const getPerformanceByIdController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        error: "Invalid performance ID",
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

    const performance = await getPerformanceById(id, req.user._id);

    if (!performance) {
      res.status(404).json({
        success: false,
        error: "Performance record not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: performance,
      message: "Performance record retrieved successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to retrieve performance record",
      details: err.message || err
    });
  }
};

// Update performance
export const updatePerformanceController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        error: "Invalid performance ID",
      });
      return;
    }

    const parsed = updatePerformanceSchema.safeParse(req.body);
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

    // Check if student exists and belongs to tutor if studentId is being updated
    if (parsed.data.studentId) {
      const student = await checkStudentAccess(parsed.data.studentId, req.user._id);
      if (!student) {
        res.status(400).json({
          success: false,
          error: "Student not found or access denied",
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

    const performance = await updatePerformance(id, updateData, req.user._id);

    if (!performance) {
      res.status(404).json({
        success: false,
        error: "Performance record not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: performance,
      message: "Performance record updated successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to update performance record",
      details: err.message || err
    });
  }
};

// Delete performance
export const deletePerformanceController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        error: "Invalid performance ID",
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

    const performance = await softDeletePerformance(id, req.user._id);

    if (!performance) {
      res.status(404).json({
        success: false,
        error: "Performance record not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Performance record deleted successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to delete performance record",
      details: err.message || err
    });
  }
};

// Bulk create performance records
export const bulkCreatePerformancesController = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = bulkCreatePerformanceSchema.safeParse(req.body);
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

    // Validate all students belong to tutor
    for (const performance of parsed.data.performances) {
      const student = await checkStudentAccess(performance.studentId, req.user!._id);
      if (!student) {
        res.status(400).json({
          success: false,
          error: `Student not found or access denied for student ID: ${performance.studentId}`,
        });
        return;
      }

      const subject = await checkSubjectExists(performance.subjectId);
      if (!subject) {
        res.status(400).json({
          success: false,
          error: `Subject not found for subject ID: ${performance.subjectId}`,
        });
        return;
      }
    }

    const performanceData = parsed.data.performances.map(perf => ({
      ...perf,
      createdBy: req.user!._id,
      updatedBy: req.user!._id,
    }));

    const performances = await bulkCreatePerformances(performanceData);

    res.status(201).json({
      success: true,
      data: performances,
      message: "Performance records created successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to create performance records",
      details: err.message || err
    });
  }
};

// Get performances for a specific student
export const getStudentPerformancesController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;

    if (!isValidObjectId(studentId)) {
      res.status(400).json({
        success: false,
        error: "Invalid student ID",
      });
      return;
    }

    const parsed = getStudentPerformanceSchema.safeParse({
      studentId,
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

    // Check if student belongs to tutor
    const student = await checkStudentAccess(studentId, req.user._id);
    if (!student) {
      res.status(404).json({
        success: false,
        error: "Student not found or access denied",
      });
      return;
    }

    const filters: any = {};
    if (parsed.data.startDate || parsed.data.endDate) {
      filters.date = {};
      if (parsed.data.startDate) {
        filters.date.$gte = new Date(parsed.data.startDate);
      }
      if (parsed.data.endDate) {
        filters.date.$lte = new Date(parsed.data.endDate);
      }
    }
    if (parsed.data.subjectId) {
      filters.subjectId = parsed.data.subjectId;
    }
    if (parsed.data.assessmentType) {
      filters.assessmentType = parsed.data.assessmentType;
    }

    const performances = await getStudentPerformances(studentId, filters);

    res.status(200).json({
      success: true,
      data: performances,
      message: "Student performances retrieved successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to retrieve student performances",
      details: err.message || err
    });
  }
};

// Get student performance summary
export const getStudentPerformanceSummaryController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;

    if (!isValidObjectId(studentId)) {
      res.status(400).json({
        success: false,
        error: "Invalid student ID",
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

    // Check if student belongs to tutor
    const student = await checkStudentAccess(studentId, req.user._id);
    if (!student) {
      res.status(404).json({
        success: false,
        error: "Student not found or access denied",
      });
      return;
    }

    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const summary = await getStudentPerformanceSummary(studentId, start, end);

    if (!summary) {
      res.status(404).json({
        success: false,
        error: "Student not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: summary,
      message: "Student performance summary retrieved successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to retrieve student performance summary",
      details: err.message || err
    });
  }
};

// Get batch performance summary
export const getBatchPerformanceSummaryController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { batchId } = req.params;

    if (!isValidObjectId(batchId)) {
      res.status(400).json({
        success: false,
        error: "Invalid batch ID",
      });
      return;
    }

    const parsed = getBatchPerformanceSchema.safeParse({
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

    const startDate = parsed.data.startDate ? new Date(parsed.data.startDate) : undefined;
    const endDate = parsed.data.endDate ? new Date(parsed.data.endDate) : undefined;

    const summary = await getBatchPerformanceSummary(batchId, startDate, endDate);

    if (!summary) {
      res.status(404).json({
        success: false,
        error: "Batch not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: summary,
      message: "Batch performance summary retrieved successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to retrieve batch performance summary",
      details: err.message || err
    });
  }
};

// Get performance comparison
export const getPerformanceComparisonController = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = performanceComparisonSchema.safeParse(req.query);
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

    // Check if student belongs to tutor
    const student = await checkStudentAccess(parsed.data.studentId, req.user._id);
    if (!student) {
      res.status(404).json({
        success: false,
        error: "Student not found or access denied",
      });
      return;
    }

    const comparison = await getPerformanceComparison(
      parsed.data.studentId,
      new Date(parsed.data.currentStartDate),
      new Date(parsed.data.currentEndDate),
      new Date(parsed.data.previousStartDate),
      new Date(parsed.data.previousEndDate)
    );

    if (!comparison) {
      res.status(404).json({
        success: false,
        error: "Student not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: comparison,
      message: "Performance comparison retrieved successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to retrieve performance comparison",
      details: err.message || err
    });
  }
};

// Get performance statistics
export const getPerformanceStatsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = performanceStatsSchema.safeParse(req.query);
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

    const startDate = parsed.data.startDate ? new Date(parsed.data.startDate) : undefined;
    const endDate = parsed.data.endDate ? new Date(parsed.data.endDate) : undefined;

    const stats = await getPerformanceStats(
      req.user._id,
      startDate,
      endDate,
      parsed.data.studentId,
      parsed.data.subjectId,
      parsed.data.assessmentType
    );

    res.status(200).json({
      success: true,
      data: stats,
      message: "Performance statistics retrieved successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to retrieve performance statistics",
      details: err.message || err
    });
  }
};

// Get performance heatmap data
export const getPerformanceHeatmapController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { batchId } = req.params;

    if (!isValidObjectId(batchId)) {
      res.status(400).json({
        success: false,
        error: "Invalid batch ID",
      });
      return;
    }

    const parsed = performanceHeatmapSchema.safeParse({
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

    const startDate = parsed.data.startDate ? new Date(parsed.data.startDate) : undefined;
    const endDate = parsed.data.endDate ? new Date(parsed.data.endDate) : undefined;

    const heatmapData = await getPerformanceHeatmapData(
      batchId,
      parsed.data.subjectIds,
      startDate,
      endDate
    );

    res.status(200).json({
      success: true,
      data: heatmapData,
      message: "Performance heatmap data retrieved successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to retrieve performance heatmap data",
      details: err.message || err
    });
  }
};
