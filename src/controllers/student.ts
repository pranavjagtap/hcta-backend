import { Request, Response, NextFunction } from "express";
import { isValidObjectId } from "mongoose";
import {
  createStudent,
  getTutorStudents,
  getStudentById,
  updateStudent,
  softDeleteStudent,
  addWeakness,
  removeWeakness,
  getUnassignedStudents,
  getStudentStats,
  checkStudentNameExists,
  bulkUploadStudents,
} from "../services/student";
import {
  createStudentSchema,
  updateStudentSchema,
  studentQuerySchema,
  bulkUploadSchema,
} from "../validators/student";
import { z } from "zod";
import { AppError } from "../utils/appError";
import { sendResponse } from "../utils/response";
import { handleFileUpload } from "../middlewares/fileUpload";

// Create a new student
export const createStudentController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedData = createStudentSchema.parse(req.body);
    const userId = (req as any).user?._id;
    const userRole = (req as any).user?.role;

    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    // Only admins and teachers can create students
    if (!["admin", "teacher"].includes(userRole || "")) {
      throw new AppError("Insufficient permissions", 403);
    }

    const profilePictureFile = req.file;
    const inputData: any = {
      ...validatedData,
      guardianInfo: validatedData.guardianInfo
        ? {
            ...validatedData.guardianInfo,
            email: validatedData.guardianInfo.email || "",
            address: validatedData.guardianInfo.address || "",
          }
        : undefined,
    };
    const student = await createStudent(inputData, profilePictureFile);

    sendResponse(res, student, "Student created successfully", 201);
  } catch (error) {
    next(error);
  }
};

// Get all students for the authenticated tutor
export const getTutorStudentsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = studentQuerySchema.safeParse(req.query);
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
    if (parsed.data.board) {
      filters.board = parsed.data.board;
    }
    if (parsed.data.classLevel) {
      filters.classLevel = parsed.data.classLevel;
    }

    const result = await getTutorStudents((req as any).user._id, filters, {
      page: parsed.data.page,
      limit: parsed.data.limit,
      search: parsed.data.search,
    });

    res.status(200).json({
      success: true,
      data: result,
      message: "Students retrieved successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to retrieve students",
      details: err.message || err
    });
  }
};

// Get student by ID
export const getStudentByIdController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        error: "Invalid student ID",
      });
      return;
    }

    const student = await getStudentById(id);
    if (!student) {
      res.status(404).json({
        success: false,
        error: "Student not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: student,
      message: "Student retrieved successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to retrieve student",
      details: err.message || err
    });
  }
};

// Update student
export const updateStudentController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const validatedData = updateStudentSchema.parse(req.body);
    const userId = (req as any).user?._id;
    const userRole = (req as any).user?.role;

    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    // Only admins and teachers can update students
    if (!["admin", "teacher"].includes(userRole || "")) {
      throw new AppError("Insufficient permissions", 403);
    }

    const profilePictureFile = req.file;
    const inputData: any = {
      ...validatedData,
      guardianInfo: validatedData.guardianInfo
        ? {
            ...validatedData.guardianInfo,
            email: validatedData.guardianInfo.email || "",
            address: validatedData.guardianInfo.address || "",
          }
        : undefined,
    };
    const updatedStudent = await updateStudent(id, inputData, profilePictureFile);

    sendResponse(res, updatedStudent, "Student updated successfully", 200);
  } catch (error) {
    next(error);
  }
};

// Add weakness to student
const weaknessSchema = z.object({ weakness: z.string().min(1) });

export const addWeaknessController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        error: "Invalid student ID",
      });
      return;
    }

    const parsed = weaknessSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: "Validation failed",
        details: parsed.error.errors
      });
      return;
    }

    // Check if student exists
    const existingStudent = await getStudentById(id, false);
    if (!existingStudent) {
      res.status(404).json({
        success: false,
        error: "Student not found",
      });
      return;
    }

    const updatedStudent = await addWeakness(id, parsed.data.weakness);

    res.status(200).json({
      success: true,
      data: updatedStudent,
      message: "Weakness added successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to add weakness",
      details: err.message || err
    });
  }
};

// Remove weakness from student
export const removeWeaknessController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        error: "Invalid student ID",
      });
      return;
    }

    const parsed = weaknessSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: "Validation failed",
        details: parsed.error.errors
      });
      return;
    }

    // Check if student exists
    const existingStudent = await getStudentById(id, false);
    if (!existingStudent) {
      res.status(404).json({
        success: false,
        error: "Student not found",
      });
      return;
    }

    const updatedStudent = await removeWeakness(id, parsed.data.weakness);

    res.status(200).json({
      success: true,
      data: updatedStudent,
      message: "Weakness removed successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to remove weakness",
      details: err.message || err
    });
  }
};

// Delete student (soft delete)
export const deleteStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        error: "Invalid student ID",
      });
      return;
    }

    // Check if student exists
    const existingStudent = await getStudentById(id, false);
    if (!existingStudent) {
      res.status(404).json({
        success: false,
        error: "Student not found",
      });
      return;
    }

    await softDeleteStudent(id);

    res.status(200).json({
      success: true,
      message: "Student deleted successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to delete student",
      details: err.message || err
    });
  }
};

// Get unassigned students
export const getUnassignedStudentsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = studentQuerySchema.safeParse(req.query);
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

    const result = await getUnassignedStudents((req as any).user._id, {
      page: parsed.data.page,
      limit: parsed.data.limit,
      search: parsed.data.search,
    });

    res.status(200).json({
      success: true,
      data: result,
      message: "Unassigned students retrieved successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to retrieve unassigned students",
      details: err.message || err
    });
  }
};

// Get student statistics
export const getStudentStatsController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user?._id;
    const userRole = (req as any).user?.role;

    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    const stats = await getStudentStats(userId);

    sendResponse(res, stats, "Student statistics retrieved successfully", 200);
  } catch (error) {
    next(error);
  }
};

// Bulk upload students
export const bulkUploadStudentsController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedData = bulkUploadSchema.parse(req.body);
    const userId = (req as any).user?._id;
    const userRole = (req as any).user?.role;

    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    // Only admins can bulk upload students
    if (userRole !== "admin") {
      throw new AppError("Insufficient permissions", 403);
    }

    const normalizedStudents = validatedData.students.map((s: any) => ({
      ...s,
      guardianInfo: s.guardianInfo
        ? {
            ...s.guardianInfo,
            email: s.guardianInfo.email || "",
            address: s.guardianInfo.address || "",
          }
        : undefined,
    }));
    const result = await bulkUploadStudents(normalizedStudents as any);

    sendResponse(res, result, "Bulk upload completed", 200);
  } catch (error) {
    next(error);
  }
};

