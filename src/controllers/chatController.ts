import { Request, Response, NextFunction } from 'express';
import { ChatService } from '../services/chatService';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/appError';
import { AuthenticatedRequest } from '../types/communication';

const chatService = new ChatService();

// ============================================================================
// CONVERSATION CONTROLLERS
// ============================================================================

/**
 * Create or find a direct conversation
 */
export const createDirectConversation = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userId = req.user?._id;
  const { participantId } = req.body;

  if (!userId) {
    return next(new AppError('User not authenticated', 401));
  }

  if (!participantId) {
    return next(new AppError('Participant ID is required', 400));
  }

  if (userId === participantId) {
    return next(new AppError('Cannot create conversation with yourself', 400));
  }

  const conversation = await chatService.findOrCreateDirectConversation(userId, participantId);

  res.status(200).json({
    success: true,
    message: 'Conversation found/created successfully',
    data: { conversation }
  });
});

/**
 * Create a group conversation
 */
export const createGroupConversation = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userId = req.user?._id;
  const conversationData = req.body;

  if (!userId) {
    return next(new AppError('User not authenticated', 401));
  }

  const conversation = await chatService.createGroupConversation(conversationData, userId);

  res.status(201).json({
    success: true,
    message: 'Group conversation created successfully',
    data: { conversation }
  });
});

/**
 * Get user conversations
 */
export const getUserConversations = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userId = req.user?._id;
  const filters = req.query;

  if (!userId) {
    return next(new AppError('User not authenticated', 401));
  }

  const conversations = await chatService.getUserConversations(userId, filters);

  res.status(200).json({
    success: true,
    message: 'Conversations retrieved successfully',
    data: conversations
  });
});

/**
 * Get conversation by ID
 */
export const getConversationById = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userId = req.user?._id;
  const { conversationId } = req.params;

  if (!userId) {
    return next(new AppError('User not authenticated', 401));
  }

  const conversation = await chatService.getConversationById(conversationId, userId);

  res.status(200).json({
    success: true,
    message: 'Conversation retrieved successfully',
    data: { conversation }
  });
});

// ============================================================================
// MESSAGE CONTROLLERS
// ============================================================================

/**
 * Send a message
 */
export const sendMessage = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userId = req.user?._id;
  const { conversationId } = req.params;
  const messageData = req.body;

  if (!userId) {
    return next(new AppError('User not authenticated', 401));
  }

  const message = await chatService.sendMessage(conversationId, userId, messageData);

  res.status(201).json({
    success: true,
    message: 'Message sent successfully',
    data: { message }
  });
});

/**
 * Get conversation messages
 */
export const getConversationMessages = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userId = req.user?._id;
  const { conversationId } = req.params;
  const filters = req.query;

  if (!userId) {
    return next(new AppError('User not authenticated', 401));
  }

  const messages = await chatService.getConversationMessages(conversationId, userId, filters);

  res.status(200).json({
    success: true,
    message: 'Messages retrieved successfully',
    data: messages
  });
});

/**
 * Update a message
 */
export const updateMessage = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userId = req.user?._id;
  const { messageId } = req.params;
  const updateData = req.body;

  if (!userId) {
    return next(new AppError('User not authenticated', 401));
  }

  const message = await chatService.updateMessage(messageId, userId, updateData);

  res.status(200).json({
    success: true,
    message: 'Message updated successfully',
    data: { message }
  });
});

/**
 * Delete a message
 */
export const deleteMessage = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userId = req.user?._id;
  const { messageId } = req.params;

  if (!userId) {
    return next(new AppError('User not authenticated', 401));
  }

  await chatService.deleteMessage(messageId, userId);

  res.status(200).json({
    success: true,
    message: 'Message deleted successfully'
  });
});

/**
 * Mark messages as read
 */
export const markMessagesAsRead = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userId = req.user?._id;
  const { conversationId } = req.params;
  const { messageIds } = req.body;

  if (!userId) {
    return next(new AppError('User not authenticated', 401));
  }

  await chatService.markMessagesAsRead(conversationId, userId, messageIds);

  res.status(200).json({
    success: true,
    message: 'Messages marked as read successfully'
  });
});

// ============================================================================
// SEARCH CONTROLLERS
// ============================================================================

/**
 * Search messages
 */
export const searchMessages = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userId = req.user?._id;
  const { query } = req.query;
  const filters = req.query;

  if (!userId) {
    return next(new AppError('User not authenticated', 401));
  }

  if (!query || typeof query !== 'string') {
    return next(new AppError('Search query is required', 400));
  }

  const messages = await chatService.searchMessages(userId, query, filters);

  res.status(200).json({
    success: true,
    message: 'Search completed successfully',
    data: messages
  });
});

// ============================================================================
// UTILITY CONTROLLERS
// ============================================================================

/**
 * Get unread message count
 */
export const getUnreadCount = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userId = req.user?._id;

  if (!userId) {
    return next(new AppError('User not authenticated', 401));
  }

  const unreadCount = await chatService.getUnreadCount(userId);

  res.status(200).json({
    success: true,
    message: 'Unread count retrieved successfully',
    data: { unreadCount }
  });
});
