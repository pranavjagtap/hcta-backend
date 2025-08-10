import { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import "../types/express";
import {
  createSubmission,
  getTutorSubmissions,
  getSubmissionById,
  updateSubmission,
  gradeSubmission,
  bulkGradeSubmissions,
  softDeleteSubmission,
  getAssignmentSubmissions,
  getAssignmentSubmissionSummary,
  getStudentSubmissions,
  getSubmissionStats,
  checkAssignmentAccess,
  checkStudentExists,
} from "../services/submission";
import {
  createSubmissionSchema,
  updateSubmissionSchema,
  submissionQuerySchema,
  gradeSubmissionSchema,
  getAssignmentSubmissionsSchema,
  getStudentSubmissionsSchema,
  bulkGradeSubmissionsSchema,
} from "../validators/submission";

// Create a new submission
export const createSubmissionController = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = createSubmissionSchema.safeParse(req.body);
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

    // Check if assignment exists and belongs to tutor
    const assignment = await checkAssignmentAccess(parsed.data.assignmentId, req.user._id);
    if (!assignment) {
      res.status(400).json({
        success: false,
        error: "Assignment not found or access denied",
      });
      return;
    }

    // Check if student exists
    const student = await checkStudentExists(parsed.data.studentId);
    if (!student) {
      res.status(400).json({
        success: false,
        error: "Student not found",
      });
      return;
    }

    const submissionData = {
      ...parsed.data,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    };

    const submission = await createSubmission(submissionData);

    res.status(201).json({
      success: true,
      data: submission,
      message: "Submission created successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to create submission",
      details: err.message || err
    });
  }
};

// Get submissions for the authenticated tutor
export const getTutorSubmissionsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = submissionQuerySchema.safeParse(req.query);
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
    if (parsed.data.assignmentId) {
      filters.assignmentId = parsed.data.assignmentId;
    }
    if (parsed.data.studentId) {
      filters.studentId = parsed.data.studentId;
    }
    if (parsed.data.status) {
      filters.status = parsed.data.status;
    }
    if (parsed.data.startDate || parsed.data.endDate) {
      filters.submittedAt = {};
      if (parsed.data.startDate) {
        filters.submittedAt.$gte = new Date(parsed.data.startDate);
      }
      if (parsed.data.endDate) {
        filters.submittedAt.$lte = new Date(parsed.data.endDate);
      }
    }

    const result = await getTutorSubmissions(req.user._id, filters, {
      page: parsed.data.page,
      limit: parsed.data.limit,
      search: parsed.data.search,
    });

    res.status(200).json({
      success: true,
      data: result,
      message: "Submissions retrieved successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to retrieve submissions",
      details: err.message || err
    });
  }
};

// Get submission by ID
export const getSubmissionByIdController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        error: "Invalid submission ID",
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

    const submission = await getSubmissionById(id, req.user._id);

    if (!submission) {
      res.status(404).json({
        success: false,
        error: "Submission not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: submission,
      message: "Submission retrieved successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to retrieve submission",
      details: err.message || err
    });
  }
};

// Update submission
export const updateSubmissionController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        error: "Invalid submission ID",
      });
      return;
    }

    const parsed = updateSubmissionSchema.safeParse(req.body);
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

    // Check if assignment exists and belongs to tutor if assignmentId is being updated
    if (parsed.data.assignmentId) {
      const assignment = await checkAssignmentAccess(parsed.data.assignmentId, req.user._id);
      if (!assignment) {
        res.status(400).json({
          success: false,
          error: "Assignment not found or access denied",
        });
        return;
      }
    }

    // Check if student exists if studentId is being updated
    if (parsed.data.studentId) {
      const student = await checkStudentExists(parsed.data.studentId);
      if (!student) {
        res.status(400).json({
          success: false,
          error: "Student not found",
        });
        return;
      }
    }

    const updateData = {
      ...parsed.data,
      updatedBy: req.user._id,
    };

    const submission = await updateSubmission(id, updateData, req.user._id);

    if (!submission) {
      res.status(404).json({
        success: false,
        error: "Submission not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: submission,
      message: "Submission updated successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to update submission",
      details: err.message || err
    });
  }
};

// Grade a submission
export const gradeSubmissionController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        error: "Invalid submission ID",
      });
      return;
    }

    const parsed = gradeSubmissionSchema.safeParse(req.body);
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

    const submission = await gradeSubmission(
      id, 
      parsed.data.marksAwarded, 
      parsed.data.remarks, 
      parsed.data.status, 
      req.user._id
    );

    if (!submission) {
      res.status(404).json({
        success: false,
        error: "Submission not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: submission,
      message: "Submission graded successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to grade submission",
      details: err.message || err
    });
  }
};

// Bulk grade submissions
export const bulkGradeSubmissionsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = bulkGradeSubmissionsSchema.safeParse(req.body);
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

    const results = await bulkGradeSubmissions(parsed.data.submissions, req.user._id);

    res.status(200).json({
      success: true,
      data: results,
      message: "Submissions graded successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to grade submissions",
      details: err.message || err
    });
  }
};

// Delete submission
export const deleteSubmissionController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        error: "Invalid submission ID",
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

    const submission = await softDeleteSubmission(id, req.user._id);

    if (!submission) {
      res.status(404).json({
        success: false,
        error: "Submission not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Submission deleted successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to delete submission",
      details: err.message || err
    });
  }
};

// Get submissions for a specific assignment
export const getAssignmentSubmissionsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { assignmentId } = req.params;

    if (!isValidObjectId(assignmentId)) {
      res.status(400).json({
        success: false,
        error: "Invalid assignment ID",
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

    const submissions = await getAssignmentSubmissions(assignmentId, req.user._id);

    if (submissions === null) {
      res.status(404).json({
        success: false,
        error: "Assignment not found or access denied",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: submissions,
      message: "Assignment submissions retrieved successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to retrieve assignment submissions",
      details: err.message || err
    });
  }
};

// Get assignment submission summary
export const getAssignmentSubmissionSummaryController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { assignmentId } = req.params;

    if (!isValidObjectId(assignmentId)) {
      res.status(400).json({
        success: false,
        error: "Invalid assignment ID",
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

    const summary = await getAssignmentSubmissionSummary(assignmentId, req.user._id);

    if (!summary) {
      res.status(404).json({
        success: false,
        error: "Assignment not found or access denied",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: summary,
      message: "Assignment submission summary retrieved successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to retrieve assignment submission summary",
      details: err.message || err
    });
  }
};

// Get submissions for a specific student
export const getStudentSubmissionsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;

    if (!isValidObjectId(studentId)) {
      res.status(400).json({
        success: false,
        error: "Invalid student ID",
      });
      return;
    }

    const parsed = getStudentSubmissionsSchema.safeParse({
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

    const startDate = parsed.data.startDate ? new Date(parsed.data.startDate) : undefined;
    const endDate = parsed.data.endDate ? new Date(parsed.data.endDate) : undefined;

    const submissions = await getStudentSubmissions(studentId, startDate, endDate);

    res.status(200).json({
      success: true,
      data: submissions,
      message: "Student submissions retrieved successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to retrieve student submissions",
      details: err.message || err
    });
  }
};

// Get submission statistics
export const getSubmissionStatsController = async (req: Request, res: Response): Promise<void> => {
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

    const stats = await getSubmissionStats(req.user._id, start, end);

    res.status(200).json({
      success: true,
      data: stats,
      message: "Submission statistics retrieved successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to retrieve submission statistics",
      details: err.message || err
    });
  }
};
