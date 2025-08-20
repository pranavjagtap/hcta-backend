import { Request, Response, NextFunction } from 'express';
import { CallService } from '../services/callService';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/appError';
import { AuthenticatedRequest } from '../types/communication';

const callService = new CallService();

// ============================================================================
// CALL MANAGEMENT CONTROLLERS
// ============================================================================

/**
 * Initiate a call
 */
export const initiateCall = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userId = req.user?._id;
  const callData = req.body;

  if (!userId) {
    return next(new AppError('User not authenticated', 401));
  }

  const call = await callService.initiateCall(userId, callData);

  res.status(201).json({
    success: true,
    message: 'Call initiated successfully',
    data: { call }
  });
});

/**
 * Accept a call
 */
export const acceptCall = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userId = req.user?._id;
  const { callId } = req.params;

  if (!userId) {
    return next(new AppError('User not authenticated', 401));
  }

  const call = await callService.acceptCall(callId, userId);

  res.status(200).json({
    success: true,
    message: 'Call accepted successfully',
    data: { call }
  });
});

/**
 * Reject a call
 */
export const rejectCall = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userId = req.user?._id;
  const { callId } = req.params;
  const { reason } = req.body;

  if (!userId) {
    return next(new AppError('User not authenticated', 401));
  }

  await callService.rejectCall(callId, userId, reason);

  res.status(200).json({
    success: true,
    message: 'Call rejected successfully'
  });
});

/**
 * End a call
 */
export const endCall = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userId = req.user?._id;
  const { callId } = req.params;

  if (!userId) {
    return next(new AppError('User not authenticated', 401));
  }

  const call = await callService.endCall(callId, userId);

  res.status(200).json({
    success: true,
    message: 'Call ended successfully',
    data: { call }
  });
});

/**
 * Get call by ID
 */
export const getCallById = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userId = req.user?._id;
  const { callId } = req.params;

  if (!userId) {
    return next(new AppError('User not authenticated', 401));
  }

  const call = await callService.getCallById(callId, userId);

  res.status(200).json({
    success: true,
    message: 'Call retrieved successfully',
    data: { call }
  });
});

/**
 * Get call history
 */
export const getCallHistory = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userId = req.user?._id;
  const filters = req.query;

  if (!userId) {
    return next(new AppError('User not authenticated', 401));
  }

  const calls = await callService.getCallHistory(userId, filters);

  res.status(200).json({
    success: true,
    message: 'Call history retrieved successfully',
    data: calls
  });
});

/**
 * Get active calls
 */
export const getActiveCalls = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userId = req.user?._id;

  if (!userId) {
    return next(new AppError('User not authenticated', 401));
  }

  const calls = await callService.getActiveCalls(userId);

  res.status(200).json({
    success: true,
    message: 'Active calls retrieved successfully',
    data: { calls }
  });
});

// ============================================================================
// CALL PARTICIPANT MANAGEMENT
// ============================================================================

/**
 * Add participant to call
 */
export const addParticipant = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userId = req.user?._id;
  const { callId } = req.params;
  const { participantId } = req.body;

  if (!userId) {
    return next(new AppError('User not authenticated', 401));
  }

  if (!participantId) {
    return next(new AppError('Participant ID is required', 400));
  }

  const call = await callService.addParticipant(callId, userId, participantId);

  res.status(200).json({
    success: true,
    message: 'Participant added successfully',
    data: { call }
  });
});

/**
 * Remove participant from call
 */
export const removeParticipant = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userId = req.user?._id;
  const { callId, participantId } = req.params;

  if (!userId) {
    return next(new AppError('User not authenticated', 401));
  }

  const call = await callService.removeParticipant(callId, userId, participantId);

  res.status(200).json({
    success: true,
    message: 'Participant removed successfully',
    data: { call }
  });
});

// ============================================================================
// CALL RECORDING
// ============================================================================

/**
 * Set call recording URL
 */
export const setRecordingUrl = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userId = req.user?._id;
  const { callId } = req.params;
  const { recordingUrl } = req.body;

  if (!userId) {
    return next(new AppError('User not authenticated', 401));
  }

  if (!recordingUrl) {
    return next(new AppError('Recording URL is required', 400));
  }

  await callService.setRecordingUrl(callId, userId, recordingUrl);

  res.status(200).json({
    success: true,
    message: 'Recording URL set successfully'
  });
});

// ============================================================================
// CALL ANALYTICS
// ============================================================================

/**
 * Get call statistics
 */
export const getCallStats = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userId = req.user?._id;
  const { startDate, endDate } = req.query;

  if (!userId) {
    return next(new AppError('User not authenticated', 401));
  }

  const dateRange = startDate && endDate ? {
    start: new Date(startDate as string),
    end: new Date(endDate as string)
  } : undefined;

  const stats = await callService.getCallStats(userId, dateRange);

  res.status(200).json({
    success: true,
    message: 'Call statistics retrieved successfully',
    data: { stats }
  });
});
