import { Request, Response, NextFunction } from "express";
import { ClassService } from "../services/class";
import { createClassSchema, updateClassSchema, classQuerySchema } from "../validators/class";
import { AppError } from "../utils/appError";
import { sendResponse } from "../utils/response";

// Extend Request type to include user
interface AuthenticatedRequest extends Request {
  user?: {
    _id: string;
    uid: string;
    name?: string;
    email?: string;
    role: any;
    permissions?: string[];
  };
}

export const createClassController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validatedData = createClassSchema.parse(req.body);
    const userId = req.user?._id;
    const userRole = req.user?.role;

    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    // Only admins and teachers can create classes
    if (!["admin", "teacher"].includes(userRole || "")) {
      throw new AppError("Insufficient permissions", 403);
    }

    const newClass = await ClassService.createClass(validatedData, userId);

    sendResponse(res, newClass, "Class created successfully", 201);
  } catch (error) {
    next(error);
  }
};

export const getClassesController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validatedQuery = classQuerySchema.parse(req.query);
    const userId = req.user?._id;
    const userRole = req.user?.role;

    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    const result = await ClassService.getClasses(validatedQuery, userId, userRole || "");

    sendResponse(res, result, "Classes retrieved successfully", 200);
  } catch (error) {
    next(error);
  }
};

export const getClassByIdController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;
    const userRole = req.user?.role;

    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    const classData = await ClassService.getClassById(id, userId, userRole);

    sendResponse(res, classData, "Class retrieved successfully", 200);
  } catch (error) {
    next(error);
  }
};

export const updateClassController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const validatedData = updateClassSchema.parse(req.body);
    const userId = req.user?._id;
    const userRole = req.user?.role;

    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    // Only admins and assigned teachers can update classes
    if (!["admin", "teacher"].includes(userRole || "")) {
      throw new AppError("Insufficient permissions", 403);
    }

    const updatedClass = await ClassService.updateClass(id, validatedData, userId, userRole);

    sendResponse(res, updatedClass, "Class updated successfully", 200);
  } catch (error) {
    next(error);
  }
};

export const deleteClassController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;
    const userRole = req.user?.role;

    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    // Only admins can delete classes
    if (userRole !== "admin") {
      throw new AppError("Insufficient permissions", 403);
    }

    await ClassService.deleteClass(id, userId, userRole);

    sendResponse(res, null, "Class deleted successfully", 200);
  } catch (error) {
    next(error);
  }
};

export const getClassStatsController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const userRole = req.user?.role;

    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    const stats = await ClassService.getClassStats(userId, userRole || "");

    sendResponse(res, stats, "Class statistics retrieved successfully", 200);
  } catch (error) {
    next(error);
  }
};

export const getClassStudentsController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { page, limit, search } = req.query;
    const userId = req.user?._id;
    const userRole = req.user?.role;

    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    const query = {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 10,
      search: search as string,
    };

    const result = await ClassService.getClassStudents(id, query, userId, userRole || "");

    sendResponse(res, result, "Class students retrieved successfully", 200);
  } catch (error) {
    next(error);
  }
};
