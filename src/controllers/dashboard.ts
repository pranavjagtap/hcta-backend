import { Request, Response } from "express";
import { 
  generateTeacherDashboardData,
  generateBatchDashboardData,
  generateAnalyticsData,
  createDashboard,
  getDashboardById as getDashboardByIdService,
  updateDashboard,
  softDeleteDashboard,
  getAllDashboards,
  getDashboardByTutor
} from "../services/dashboard";
import { 
  analyticsQuerySchema,
  batchDashboardQuerySchema,
  createDashboardSchema,
  updateDashboardSchema,
  dashboardQuerySchema
} from "../validators/dashboard";

// Get comprehensive teacher dashboard
export const getTeacherDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const tutorId = req.user?._id;

    if (!tutorId) {
      res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
      return;
    }

    // Generate dashboard data using service
    const dashboardData = await generateTeacherDashboardData(tutorId);

    res.status(200).json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch dashboard data",
      details: error,
    });
  }
};

// Get batch-specific dashboard
export const getBatchDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const { batchId } = req.params;
    const tutorId = req.user?._id;

    if (!tutorId) {
      res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
      return;
    }

    // Validate batch ID
    const parsed = batchDashboardQuerySchema.safeParse({ batchId });
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: "Invalid batch ID",
        details: parsed.error.errors,
      });
      return;
    }

    // Generate batch dashboard data using service
    const batchDashboardData = await generateBatchDashboardData(batchId, tutorId);

    res.status(200).json({
      success: true,
      data: batchDashboardData,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Batch not found or access denied") {
      res.status(404).json({
        success: false,
        error: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: "Failed to fetch batch dashboard data",
      details: error,
    });
  }
};

// Get analytics data for charts and reports
export const getAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { period, batchId } = req.query;
    const tutorId = req.user?._id;

    if (!tutorId) {
      res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
      return;
    }

    // Validate query parameters
    const parsed = analyticsQuerySchema.safeParse({ period, batchId });
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: "Invalid query parameters",
        details: parsed.error.errors,
      });
      return;
    }

    // Generate analytics data using service
    const analyticsData = await generateAnalyticsData(
      tutorId,
      parsed.data.period,
      parsed.data.batchId
    );

    res.status(200).json({
      success: true,
      data: analyticsData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch analytics data",
      details: error,
    });
  }
};

// Create dashboard (for caching purposes)
export const createDashboardData = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = createDashboardSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: "Validation failed",
        details: parsed.error.errors,
      });
      return;
    }

    const dashboard = await createDashboard(parsed.data);
    res.status(201).json({
      success: true,
      data: dashboard,
      message: "Dashboard created successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to create dashboard",
      details: error,
    });
  }
};

// Get dashboard by ID
export const getDashboardById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const dashboard = await getDashboardByIdService(id);
    if (!dashboard) {
      res.status(404).json({
        success: false,
        error: "Dashboard not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch dashboard",
      details: error,
    });
  }
};

// Update dashboard
export const updateDashboardData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const parsed = updateDashboardSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: "Validation failed",
        details: parsed.error.errors,
      });
      return;
    }

    const dashboard = await updateDashboard(id, parsed.data);
    if (!dashboard) {
      res.status(404).json({
        success: false,
        error: "Dashboard not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: dashboard,
      message: "Dashboard updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to update dashboard",
      details: error,
    });
  }
};

// Delete dashboard
export const deleteDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const dashboard = await softDeleteDashboard(id);
    if (!dashboard) {
      res.status(404).json({
        success: false,
        error: "Dashboard not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Dashboard deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to delete dashboard",
      details: error,
    });
  }
};

// Get all dashboards with pagination and filters
export const getAllDashboardsData = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = dashboardQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: "Invalid query parameters",
        details: parsed.error.errors,
      });
      return;
    }

    const filters: any = {};
    if (parsed.data.tutorId) filters.tutorId = parsed.data.tutorId;
    if (parsed.data.batchId) filters.batchId = parsed.data.batchId;
    if (parsed.data.period) filters.period = parsed.data.period;

    const options = {
      page: parsed.data.page || 1,
      limit: parsed.data.limit || 10,
      populate: true,
    };

    const result = await getAllDashboards(filters, options);

    res.status(200).json({
      success: true,
      data: result.dashboards,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch dashboards",
      details: error,
    });
  }
};
