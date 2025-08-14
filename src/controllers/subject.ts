import { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import {
  createSubject,
  getAllSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
  addTopic,
  removeTopic,
  getSubjectsByBoardAndClass,
  getCurriculumStructure,
  getSubjectStats,
  checkSubjectNameExists,
} from "../services/subject";
import {
  createSubjectSchema,
  updateSubjectSchema,
  subjectQuerySchema,
  addTopicSchema,
  removeTopicSchema,
  getSubjectsByBoardAndClassSchema,
} from "../validators/subject";

// Create a new subject
export const createSubjectController = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = createSubjectSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: "Validation failed",
        details: parsed.error.errors
      });
      return;
    }

    // Check for duplicate subject name
    const nameExists = await checkSubjectNameExists(parsed.data.name);
    if (nameExists) {
      res.status(400).json({
        success: false,
        error: "Subject name already exists",
      });
      return;
    }

    const subject = await createSubject({
      ...parsed.data,
      createdBy: req.user?._id!,
      updatedBy: req.user?._id!,
    });
    res.status(201).json({
      success: true,
      data: subject,
      message: "Subject created successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to create subject",
      details: err.message || err
    });
  }
};

// Get all subjects with filtering
export const getSubjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = subjectQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: "Invalid query parameters",
        details: parsed.error.errors
      });
      return;
    }

    const filters: any = {};
    if (parsed.data.board) {
      filters.board = parsed.data.board;
    }
    if (parsed.data.classLevel) {
      filters.classLevel = parsed.data.classLevel;
    }
    if (parsed.data.isElective !== undefined) {
      filters.isElective = parsed.data.isElective;
    }

    const result = await getAllSubjects(filters, {
      page: parsed.data.page,
      limit: parsed.data.limit,
      search: parsed.data.search,
    });

    res.status(200).json({
      success: true,
      data: result,
      message: "Subjects retrieved successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to retrieve subjects",
      details: err.message || err
    });
  }
};

// Get subject by ID
export const getSubjectByIdController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        error: "Invalid subject ID",
      });
      return;
    }

    const subject = await getSubjectById(id);
    if (!subject) {
      res.status(404).json({
        success: false,
        error: "Subject not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: subject,
      message: "Subject retrieved successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to retrieve subject",
      details: err.message || err
    });
  }
};

// Update subject
export const updateSubjectController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        error: "Invalid subject ID",
      });
      return;
    }

    const parsed = updateSubjectSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: "Validation failed",
        details: parsed.error.errors
      });
      return;
    }

    // Check if subject exists
    const existingSubject = await getSubjectById(id);
    if (!existingSubject) {
      res.status(404).json({
        success: false,
        error: "Subject not found",
      });
      return;
    }

    // Check for duplicate subject name if name is being updated
    if (parsed.data.name && parsed.data.name !== existingSubject.name) {
      const nameExists = await checkSubjectNameExists(parsed.data.name, id);
      if (nameExists) {
        res.status(400).json({
          success: false,
          error: "Subject name already exists",
        });
        return;
      }
    }

    const updatedSubject = await updateSubject(id, parsed.data);

    res.status(200).json({
      success: true,
      data: updatedSubject,
      message: "Subject updated successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to update subject",
      details: err.message || err
    });
  }
};

// Add topic to subject
export const addTopicController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        error: "Invalid subject ID",
      });
      return;
    }

    const parsed = addTopicSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: "Validation failed",
        details: parsed.error.errors
      });
      return;
    }

    // Check if subject exists
    const existingSubject = await getSubjectById(id);
    if (!existingSubject) {
      res.status(404).json({
        success: false,
        error: "Subject not found",
      });
      return;
    }

    const updatedSubject = await addTopic(id, parsed.data.topic);

    res.status(200).json({
      success: true,
      data: updatedSubject,
      message: "Topic added successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to add topic",
      details: err.message || err
    });
  }
};

// Remove topic from subject
export const removeTopicController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        error: "Invalid subject ID",
      });
      return;
    }

    const parsed = removeTopicSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: "Validation failed",
        details: parsed.error.errors
      });
      return;
    }

    // Check if subject exists
    const existingSubject = await getSubjectById(id);
    if (!existingSubject) {
      res.status(404).json({
        success: false,
        error: "Subject not found",
      });
      return;
    }

    const updatedSubject = await removeTopic(id, parsed.data.topic);

    res.status(200).json({
      success: true,
      data: updatedSubject,
      message: "Topic removed successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to remove topic",
      details: err.message || err
    });
  }
};

// Delete subject
export const deleteSubjectController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        error: "Invalid subject ID",
      });
      return;
    }

    // Check if subject exists
    const existingSubject = await getSubjectById(id);
    if (!existingSubject) {
      res.status(404).json({
        success: false,
        error: "Subject not found",
      });
      return;
    }

    await deleteSubject(id);

    res.status(200).json({
      success: true,
      message: "Subject deleted successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to delete subject",
      details: err.message || err
    });
  }
};

// Get subjects by board and class level
export const getSubjectsByBoardAndClassController = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = getSubjectsByBoardAndClassSchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: "Invalid query parameters",
        details: parsed.error.errors
      });
      return;
    }

    const subjects = await getSubjectsByBoardAndClass(parsed.data.board, parsed.data.classLevel);

    res.status(200).json({
      success: true,
      data: subjects,
      message: "Subjects retrieved successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to retrieve subjects",
      details: err.message || err
    });
  }
};

// Get curriculum structure
export const getCurriculumStructureController = async (req: Request, res: Response): Promise<void> => {
  try {
    const structure = await getCurriculumStructure();

    res.status(200).json({
      success: true,
      data: structure,
      message: "Curriculum structure retrieved successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to retrieve curriculum structure",
      details: err.message || err
    });
  }
};

// Get subject statistics
export const getSubjectStatsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await getSubjectStats();

    res.status(200).json({
      success: true,
      data: stats,
      message: "Subject statistics retrieved successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to retrieve subject statistics",
      details: err.message || err
    });
  }
};
