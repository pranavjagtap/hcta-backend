import { Request, Response, NextFunction } from 'express';
import { lectureService } from '../services/lecture';
import { generateLectureSchema, lectureQuerySchema, lectureIdSchema } from '../validators/lecture';
import { AppError } from '../utils/appError';
import { sendResponse } from '../utils/response';
import { LectureGenerationRequest, LectureQuery } from '../types/lecture';

/**
 * Generate a new lecture with AI
 */
export const generateLectureController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate request body
    const validatedData = generateLectureSchema.parse(req.body);
    
    const lectureData = {
      ...validatedData,
      userId: req.user!._id
    };

    const lecture = await lectureService.createLecture(lectureData);

    sendResponse(res, lecture, 'Lecture generation started successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all lectures for the authenticated user
 */
export const getLecturesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate query parameters
    const validatedQuery = lectureQuerySchema.parse(req.query);
    
    const query: LectureQuery = {
      page: validatedQuery.page,
      limit: validatedQuery.limit,
      subject: validatedQuery.subject,
      topic: validatedQuery.topic,
      language: validatedQuery.language,
      status: validatedQuery.status,
      sortBy: validatedQuery.sortBy,
      sortOrder: validatedQuery.sortOrder
    };

    const result = await lectureService.getLectures(req.user?._id as string, query);

    sendResponse(res, result, 'Lectures retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific lecture by ID
 */
export const getLectureByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate lecture ID
    const { id } = lectureIdSchema.parse(req.params);

    const lecture = await lectureService.getLectureById(id, req.user?._id as string);

    sendResponse(res, lecture, 'Lecture retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Update a lecture
 */
export const updateLectureController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate lecture ID and request body
    const { id } = lectureIdSchema.parse(req.params);
    const validatedData = generateLectureSchema.partial().parse(req.body);

    const lecture = await lectureService.updateLecture(id, req.user?._id as string, validatedData);

    sendResponse(res, lecture, 'Lecture updated successfully', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a lecture
 */
export const deleteLectureController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate lecture ID
    const { id } = lectureIdSchema.parse(req.params);

    await lectureService.deleteLecture(id, req.user?._id as string);

    sendResponse(res, null, 'Lecture deleted successfully', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Retry failed lecture generation
 */
export const retryLectureGenerationController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate lecture ID
    const { id } = lectureIdSchema.parse(req.params);

    const lecture = await lectureService.retryLectureGeneration(id, req.user?._id as string);

    sendResponse(res, lecture, 'Lecture generation retry started successfully', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Get lecture statistics for the authenticated user
 */
export const getLectureStatsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const stats = await lectureService.getLectureStats(req.user?._id as string);

    sendResponse(res, stats, 'Lecture statistics retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};
