import { Request, Response } from "express";
import {
  createFee,
  getFeeById,
  getAllFees,
  updateFee,
  softDeleteFee,
  processFeePayment,
  createBulkFees,
  getFeeStats,
  getFeeSummary,
  generateFeeReport,
  toggleFeeLock,
  getFeesByStudent,
  getFeesByBatch,
  checkFeeExists,
} from "../services/fee";
import {
  createFeeSchema,
  updateFeeSchema,
  feeQuerySchema,
  feePaymentSchema,
  bulkFeeSchema,
  feeStatsQuerySchema,
  feeReportQuerySchema,
  feeSummaryQuerySchema,
} from "../validators/fee";

// Create fee
export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = createFeeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: "Validation failed",
        details: parsed.error.errors,
      });
      return;
    }

    // Check if fee already exists for this student in this month
    const existingFee = await checkFeeExists(
      parsed.data.studentId,
      parsed.data.batchId,
      parsed.data.monthYear
    );

    if (existingFee) {
      res.status(400).json({
        success: false,
        error: "Fee already exists for this student in this month",
      });
      return;
    }

    const fee = await createFee({
      ...parsed.data,
      createdBy: req.user?._id,
      updatedBy: req.user?._id,
    });

    res.status(201).json({
      success: true,
      data: fee,
      message: "Fee created successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to create fee",
      details: error,
    });
  }
};

// Get all fees with pagination and filters
export const getAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = feeQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: "Invalid query parameters",
        details: parsed.error.errors,
      });
      return;
    }

    const filters: any = {};
    if (parsed.data.studentId) filters.studentId = parsed.data.studentId;
    if (parsed.data.batchId) filters.batchId = parsed.data.batchId;
    if (parsed.data.monthYear) filters.monthYear = parsed.data.monthYear;
    if (parsed.data.paymentStatus) filters.paymentStatus = parsed.data.paymentStatus;
    if (parsed.data.isLocked !== undefined) filters.isLocked = parsed.data.isLocked;

    const options = {
      page: parsed.data.page || 1,
      limit: parsed.data.limit || 10,
      search: parsed.data.search,
      populate: true,
    };

    const result = await getAllFees(filters, options);

    res.status(200).json({
      success: true,
      data: result.fees,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch fees",
      details: error,
    });
  }
};

// Get fee by ID
export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const fee = await getFeeById(id);
    if (!fee) {
      res.status(404).json({
        success: false,
        error: "Fee not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: fee,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch fee",
      details: error,
    });
  }
};

// Update fee
export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const parsed = updateFeeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: "Validation failed",
        details: parsed.error.errors,
      });
      return;
    }

    const fee = await updateFee(id, {
      ...parsed.data,
      updatedBy: req.user?._id,
    });

    if (!fee) {
      res.status(404).json({
        success: false,
        error: "Fee not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: fee,
      message: "Fee updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to update fee",
      details: error,
    });
  }
};

// Delete fee
export const softDelete = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const fee = await softDeleteFee(id);
    if (!fee) {
      res.status(404).json({
        success: false,
        error: "Fee not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Fee deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to delete fee",
      details: error,
    });
  }
};

// Process fee payment
export const processPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = feePaymentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: "Validation failed",
        details: parsed.error.errors,
      });
      return;
    }

    const fee = await processFeePayment({
      ...parsed.data,
      updatedBy: req.user?._id,
    });

    res.status(200).json({
      success: true,
      data: fee,
      message: "Payment processed successfully",
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Fee not found") {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }
      if (error.message === "Fee is locked and cannot be modified") {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }
    }

    res.status(500).json({
      success: false,
      error: "Failed to process payment",
      details: error,
    });
  }
};

// Create bulk fees
export const createBulk = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = bulkFeeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: "Validation failed",
        details: parsed.error.errors,
      });
      return;
    }

    const fees = await createBulkFees({
      ...parsed.data,
      createdBy: req.user?._id,
    });

    res.status(201).json({
      success: true,
      data: fees,
      message: `${fees.length} fees created successfully`,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("already exist")) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: "Failed to create bulk fees",
      details: error,
    });
  }
};

// Get fee statistics
export const getStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = feeStatsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: "Invalid query parameters",
        details: parsed.error.errors,
      });
      return;
    }

    const stats = await getFeeStats(parsed.data);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch fee statistics",
      details: error,
    });
  }
};

// Get fee summary
export const getSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = feeSummaryQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: "Invalid query parameters",
        details: parsed.error.errors,
      });
      return;
    }

    const summary = await getFeeSummary(parsed.data);

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch fee summary",
      details: error,
    });
  }
};

// Generate fee report
export const generateReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = feeReportQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: "Invalid query parameters",
        details: parsed.error.errors,
      });
      return;
    }

    const report = await generateFeeReport(parsed.data);

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to generate fee report",
      details: error,
    });
  }
};

// Toggle fee lock
export const toggleLock = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isLocked } = req.body;

    if (typeof isLocked !== "boolean") {
      res.status(400).json({
        success: false,
        error: "isLocked must be a boolean value",
      });
      return;
    }

    const fee = await toggleFeeLock(id, isLocked, req.user?._id);

    if (!fee) {
      res.status(404).json({
        success: false,
        error: "Fee not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: fee,
      message: `Fee ${isLocked ? "locked" : "unlocked"} successfully`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to toggle fee lock",
      details: error,
    });
  }
};

// Get fees by student
export const getByStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;

    const fees = await getFeesByStudent(studentId);

    res.status(200).json({
      success: true,
      data: fees,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch student fees",
      details: error,
    });
  }
};

// Get fees by batch
export const getByBatch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { batchId } = req.params;

    const fees = await getFeesByBatch(batchId);

    res.status(200).json({
      success: true,
      data: fees,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch batch fees",
      details: error,
    });
  }
};
