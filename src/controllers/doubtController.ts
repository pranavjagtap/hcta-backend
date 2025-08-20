import { Request, Response, NextFunction } from 'express';
import { DoubtService } from '../services/doubtService';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/appError';
import { AuthenticatedRequest } from '../types/communication';
import { handleContentUpload } from '../middlewares/contentUpload';

// ============================================================================
// DOUBT SOLVING CONTROLLERS
// ============================================================================

/**
 * Ask a doubt (text mode)
 */
export const askDoubt = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userId = req.user?._id;
  const doubtData = req.body;

  if (!userId) {
    return next(new AppError('User not authenticated', 401));
  }

  const doubt = await DoubtService.askDoubt(userId, doubtData);

  res.status(201).json({
    success: true,
    message: 'Doubt processed successfully',
    data: { doubt }
  });
});

/**
 * Ask a doubt with voice input
 */
export const askDoubtWithVoice = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userId = req.user?._id;
  const doubtData = req.body;

  if (!userId) {
    return next(new AppError('User not authenticated', 401));
  }

  if (!req.file) {
    return next(new AppError('Audio file is required', 400));
  }

  const doubt = await DoubtService.askDoubtWithVoice(userId, req.file, doubtData);

  res.status(201).json({
    success: true,
    message: 'Voice doubt processed successfully',
    data: { doubt }
  });
});

/**
 * Get doubt by ID
 */
export const getDoubtById = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userId = req.user?._id;
  const { doubtId } = req.params;

  if (!userId) {
    return next(new AppError('User not authenticated', 401));
  }

  const doubt = await DoubtService.getDoubtById(doubtId, userId);

  res.status(200).json({
    success: true,
    message: 'Doubt retrieved successfully',
    data: { doubt }
  });
});

/**
 * Get doubt history
 */
export const getDoubtHistory = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userId = req.user?._id;
  const filters = req.query;

  if (!userId) {
    return next(new AppError('User not authenticated', 401));
  }

  const doubts = await DoubtService.getDoubtHistory(userId, filters);

  res.status(200).json({
    success: true,
    message: 'Doubt history retrieved successfully',
    data: doubts
  });
});

/**
 * Add feedback to doubt
 */
export const addFeedback = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userId = req.user?._id;
  const { doubtId } = req.params;
  const feedbackData = req.body;

  if (!userId) {
    return next(new AppError('User not authenticated', 401));
  }

  await DoubtService.addFeedback(doubtId, userId, feedbackData);

  res.status(200).json({
    success: true,
    message: 'Feedback added successfully'
  });
});

// ============================================================================
// DOUBT ANALYTICS & RECOMMENDATIONS
// ============================================================================

/**
 * Get doubt analytics
 */
export const getDoubtAnalytics = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userId = req.user?._id;
  const { startDate, endDate } = req.query;

  if (!userId) {
    return next(new AppError('User not authenticated', 401));
  }

  const dateRange = startDate && endDate ? {
    start: new Date(startDate as string),
    end: new Date(endDate as string)
  } : undefined;

  const analytics = await DoubtService.getDoubtAnalytics(userId, dateRange);

  res.status(200).json({
    success: true,
    message: 'Doubt analytics retrieved successfully',
    data: { analytics }
  });
});

/**
 * Get similar doubts
 */
export const getSimilarDoubts = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userId = req.user?._id;
  const { doubtId } = req.params;
  const { limit = 5 } = req.query;

  if (!userId) {
    return next(new AppError('User not authenticated', 401));
  }

  const doubts = await DoubtService.getSimilarDoubts(doubtId, userId, Number(limit));

  res.status(200).json({
    success: true,
    message: 'Similar doubts retrieved successfully',
    data: { doubts }
  });
});

/**
 * Get recommended content based on doubt
 */
export const getRecommendedContent = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userId = req.user?._id;
  const { doubtId } = req.params;
  const { limit = 5 } = req.query;

  if (!userId) {
    return next(new AppError('User not authenticated', 401));
  }

  const content = await DoubtService.getRecommendedContent(doubtId, userId, Number(limit));

  res.status(200).json({
    success: true,
    message: 'Recommended content retrieved successfully',
    data: { content }
  });
});

/**
 * Get follow-up suggestions
 */
export const getFollowUpSuggestions = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userId = req.user?._id;
  const { doubtId } = req.params;

  if (!userId) {
    return next(new AppError('User not authenticated', 401));
  }

  const suggestions = await DoubtService.getFollowUpSuggestions(doubtId, userId);

  res.status(200).json({
    success: true,
    message: 'Follow-up suggestions retrieved successfully',
    data: { suggestions }
  });
});

// ============================================================================
// DOUBT ESCALATION
// ============================================================================

/**
 * Escalate doubt to teacher
 */
export const escalateDoubt = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userId = req.user?._id;
  const { doubtId } = req.params;
  const { teacherId } = req.body;

  if (!userId) {
    return next(new AppError('User not authenticated', 401));
  }

  if (!teacherId) {
    return next(new AppError('Teacher ID is required', 400));
  }

  await DoubtService.escalateDoubt(doubtId, userId, teacherId);

  res.status(200).json({
    success: true,
    message: 'Doubt escalated successfully'
  });
});

// ============================================================================
// ADMIN CONTROLLERS
// ============================================================================

/**
 * Get all doubts (admin only)
 */
export const getAllDoubts = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userId = req.user?._id;
  const filters = req.query;

  if (!userId) {
    return next(new AppError('User not authenticated', 401));
  }

  // TODO: Add admin role check
  // if (req.user?.role !== 'admin') {
  //   return next(new AppError('Access denied', 403));
  // }

  const doubts = await DoubtService.getDoubtHistory(userId, filters);

  res.status(200).json({
    success: true,
    message: 'All doubts retrieved successfully',
    data: doubts
  });
});

/**
 * Get system-wide doubt analytics (admin only)
 */
export const getSystemDoubtAnalytics = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userId = req.user?._id;
  const { startDate, endDate } = req.query;

  if (!userId) {
    return next(new AppError('User not authenticated', 401));
  }

  // TODO: Add admin role check
  // if (req.user?.role !== 'admin') {
  //   return next(new AppError('Access denied', 403));
  // }

  const dateRange = startDate && endDate ? {
    start: new Date(startDate as string),
    end: new Date(endDate as string)
  } : undefined;

  const analytics = await DoubtService.getDoubtAnalytics(undefined, dateRange);

  res.status(200).json({
    success: true,
    message: 'System doubt analytics retrieved successfully',
    data: { analytics }
  });
});
