import { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import "../types/express";
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
} from "../services/student";
import {
  createStudentSchema,
  updateStudentSchema,
  studentQuerySchema,
  addWeaknessSchema,
  removeWeaknessSchema,
} from "../validators/student";

// Create a new student
export const createStudentController = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = createStudentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: "Validation failed",
        details: parsed.error.errors
      });
      return;
    }

    // Check for duplicate student name
    const nameExists = await checkStudentNameExists(parsed.data.name);
    if (nameExists) {
      res.status(400).json({
        success: false,
        error: "Student name already exists",
      });
      return;
    }

    const student = await createStudent(parsed.data);
    res.status(201).json({
      success: true,
      data: student,
      message: "Student created successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to create student",
      details: err.message || err
    });
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

    const result = await getTutorStudents(req.user._id, filters, {
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
export const updateStudentController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        error: "Invalid student ID",
      });
      return;
    }

    const parsed = updateStudentSchema.safeParse(req.body);
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

    // Check for duplicate student name if name is being updated
    if (parsed.data.name && parsed.data.name !== existingStudent.name) {
      const nameExists = await checkStudentNameExists(parsed.data.name, id);
      if (nameExists) {
        res.status(400).json({
          success: false,
          error: "Student name already exists",
        });
        return;
      }
    }

    const updatedStudent = await updateStudent(id, parsed.data);

    res.status(200).json({
      success: true,
      data: updatedStudent,
      message: "Student updated successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to update student",
      details: err.message || err
    });
  }
};

// Add weakness to student
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

    const parsed = addWeaknessSchema.safeParse(req.body);
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

    const parsed = removeWeaknessSchema.safeParse(req.body);
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

    const result = await getUnassignedStudents(req.user._id, {
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
export const getStudentStatsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await getStudentStats(req.user?._id);

    res.status(200).json({
      success: true,
      data: stats,
      message: "Student statistics retrieved successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to retrieve student statistics",
      details: err.message || err
    });
  }
};

