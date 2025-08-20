import { Conversation, Message, Notification } from '../models';
import mongoose from 'mongoose';
import { 
  ConversationResponse, 
  MessageResponse, 
  CreateConversationRequest, 
  SendMessageRequest, 
  UpdateMessageRequest,
  ConversationFilters,
  MessageFilters,
  PaginatedResponse,
  ApiResponse
} from '../types/communication';
import { AppError } from '../utils/appError';
import { deleteFromS3 } from '../middlewares/contentUpload';
import { createNotification } from '../utils/notifications';

export class ChatService {
  /**
   * Create or find a direct conversation between two users
   */
  async findOrCreateDirectConversation(
    participant1: string,
    participant2: string
  ): Promise<ConversationResponse> {
    const existing = await Conversation.findOne({
      type: 'direct',
      participants: { $all: [participant1, participant2] }
    })
      .populate('participants', 'name email avatar role')
      .populate('lastMessage.senderId', 'name email avatar')
      .lean();

    if (existing) {
      return this.formatConversationResponse(existing);
    }

    const conversation = new Conversation({
      type: 'direct',
      participants: [participant1, participant2],
      createdBy: participant1
    });

    await conversation.save();

    const populatedConversation = await Conversation.findById(conversation._id)
      .populate('participants', 'name email avatar role')
      .populate('lastMessage.senderId', 'name email avatar')
      .lean();

    return this.formatConversationResponse(populatedConversation);
  }

  /**
   * Create a group conversation
   */
  async createGroupConversation(
    data: CreateConversationRequest,
    createdBy: string
  ): Promise<ConversationResponse> {
    if (data.type !== 'group') {
      throw new AppError('Invalid conversation type', 400);
    }

    if (data.participants.length < 3) {
      throw new AppError('Group conversations must have at least 3 participants', 400);
    }

    // Ensure creator is in participants
    if (!data.participants.includes(createdBy)) {
      data.participants.push(createdBy);
    }

    const conversation = new Conversation({
      ...data,
      createdBy
    });

    await conversation.save();

    const populatedConversation = await Conversation.findById(conversation._id)
      .populate('participants', 'name email avatar role')
      .lean();

    return this.formatConversationResponse(populatedConversation);
  }

  /**
   * Get conversations for a user with filters and pagination
   */
  async getUserConversations(
    userId: string,
    filters: ConversationFilters = {}
  ): Promise<PaginatedResponse<ConversationResponse>> {
    const { type, batchId, subject, search, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const query: any = {
      participants: userId
    };

    if (type) {
      query.type = type;
    }

    if (batchId) {
      query.batchId = batchId;
    }

    if (subject) {
      query.subject = { $regex: subject, $options: 'i' };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    const [conversations, total] = await Promise.all([
      Conversation.find(query)
        .populate('participants', 'name email avatar role')
        .populate('lastMessage.senderId', 'name email avatar')
        .sort({ lastMessageAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Conversation.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: conversations.map(this.formatConversationResponse),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  /**
   * Get a conversation by ID
   */
  async getConversationById(
    conversationId: string,
    userId: string
  ): Promise<ConversationResponse> {
    const conversation = await Conversation.findById(conversationId)
      .populate('participants', 'name email avatar role')
      .populate('lastMessage.senderId', 'name email avatar')
      .lean();

    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    if (!conversation.participants.some(p => p._id.toString() === userId)) {
      throw new AppError('Access denied', 403);
    }

    return this.formatConversationResponse(conversation);
  }

  /**
   * Send a message in a conversation
   */
  async sendMessage(
    conversationId: string,
    senderId: string,
    data: any
  ): Promise<MessageResponse> {
    // Verify conversation exists and user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    if (!conversation.participants.some((p: any) => p.toString() === senderId)) {
      throw new AppError('Access denied', 403);
    }

    // Handle file upload if present
    if (data.attachmentMeta && data.type !== 'text') {
      // File should already be uploaded to S3 by the time it reaches here
      // Just validate the URL exists
      if (!data.attachmentMeta.url) {
        throw new AppError('File upload required for non-text messages', 400);
      }
    }

    // Create message
    const message = new Message({
      conversationId,
      senderId,
      ...data
    });

    await message.save();

    // Update conversation's last message
    conversation.lastMessage = {
      content: data.content,
      senderId: new (mongoose as any).Types.ObjectId(senderId),
      type: data.type,
      timestamp: new Date()
    };
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // Send notifications to other participants
    const otherParticipants = conversation.participants.filter(
      p => p.toString() !== senderId
    );

    for (const participantId of otherParticipants) {
      await createNotification(
        participantId.toString(),
        'message',
        'New Message',
        `You have a new message in ${conversation.title || 'conversation'}`,
        {
          conversationId: conversationId,
          messageId: message._id.toString(),
          priority: 'medium'
        }
      );
    }

    // Return populated message
    await message.populate('sender', 'name email avatar');
    await message.populate('replyMessage', 'content type senderId');
    await message.populate('replyMessage.senderId', 'name email avatar');
    const populatedMessageDoc = message;
    const populatedMessage = (populatedMessageDoc as any).toObject ? (populatedMessageDoc as any).toObject() : populatedMessageDoc;

    return this.formatMessageResponse(populatedMessage);
  }

  /**
   * Get messages in a conversation with pagination
   */
  async getConversationMessages(
    conversationId: string,
    userId: string,
    filters: MessageFilters = {}
  ): Promise<PaginatedResponse<MessageResponse>> {
    const { cursor, limit = 50, before, after } = filters;

    // Verify conversation exists and user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    if (!conversation.participants.some((p: any) => p.toString() === userId)) {
      throw new AppError('Access denied', 403);
    }

    const query: any = { conversationId };

    if (cursor) {
      query._id = { $lt: cursor };
    }

    if (before) {
      query.createdAt = { $lt: before };
    }

    if (after) {
      query.createdAt = { $gt: after };
    }

    const messages = await Message.find(query)
      .populate('sender', 'name email avatar')
      .populate('replyMessage', 'content type senderId')
      .populate('replyMessage.senderId', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Mark messages as read (best effort)
    try {
      await (Message as any).markAllAsRead?.(conversationId, userId);
    } catch {}

    return {
      data: messages.map(this.formatMessageResponse),
      pagination: {
        page: 1,
        limit,
        total: messages.length,
        totalPages: 1,
        hasNext: messages.length === limit,
        hasPrev: false
      }
    };
  }

  /**
   * Update a message
   */
  async updateMessage(
    messageId: string,
    userId: string,
    data: UpdateMessageRequest
  ): Promise<MessageResponse> {
    const message = await Message.findById(messageId);
    if (!message) {
      throw new AppError('Message not found', 404);
    }

    if (message.senderId.toString() !== userId) {
      throw new AppError('Access denied', 403);
    }

    if (message.deletedAt) {
      throw new AppError('Cannot edit deleted message', 400);
    }

    message.content = data.content;
    message.editedAt = new Date();
    await message.save();

    await message.populate('sender', 'name email avatar');
    await message.populate('replyMessage', 'content type senderId');
    await message.populate('replyMessage.senderId', 'name email avatar');
    const populatedMessageDoc = message;
    const populatedMessage = (populatedMessageDoc as any).toObject ? (populatedMessageDoc as any).toObject() : populatedMessageDoc;

    return this.formatMessageResponse(populatedMessage);
  }

  /**
   * Delete a message (soft delete)
   */
  async deleteMessage(
    messageId: string,
    userId: string
  ): Promise<void> {
    const message = await Message.findById(messageId);
    if (!message) {
      throw new AppError('Message not found', 404);
    }

    if (message.senderId.toString() !== userId) {
      throw new AppError('Access denied', 403);
    }

    if ((message as any).softDelete) {
      await (message as any).softDelete();
    } else {
      (message as any).deletedAt = new Date();
      await message.save();
    }

    // Delete attachment from S3 if exists
    const fileKey = (message as any).attachmentMeta?.fileKey;
    if (fileKey) {
      await deleteFromS3(fileKey);
    }
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(
    conversationId: string,
    userId: string,
    messageIds?: string[]
  ): Promise<void> {
    if (messageIds && messageIds.length > 0) {
      // Mark specific messages as read
      for (const messageId of messageIds) {
        const message = await Message.findById(messageId);
        if (message && message.conversationId.toString() === conversationId) {
          if ((message as any).markAsRead) {
            await (message as any).markAsRead(userId);
          } else {
            const alreadyRead = Array.isArray((message as any).readBy) && (message as any).readBy.some((r: any) => r.userId?.toString() === userId);
            if (!alreadyRead) {
              (message as any).readBy = [
                ...(((message as any).readBy || []) as any[]),
                { userId: new (mongoose as any).Types.ObjectId(userId), readAt: new Date() }
              ];
              await message.save();
            }
          }
        }
      }
    } else {
      // Mark all messages in conversation as read
      try {
        await (Message as any).markAllAsRead?.(conversationId, userId);
      } catch {
        await Message.updateMany(
          { conversationId, 'readBy.userId': { $ne: new (mongoose as any).Types.ObjectId(userId) } },
          { $push: { readBy: { userId: new (mongoose as any).Types.ObjectId(userId), readAt: new Date() } } }
        );
      }
    }
  }

  /**
   * Get unread message count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    const conversations = await Conversation.find({ participants: userId });
    let totalUnread = 0;

    for (const conversation of conversations) {
      try {
        const unreadCount = await (Message as any).getUnreadCount?.(conversation._id.toString(), userId);
        if (typeof unreadCount === 'number') {
          totalUnread += unreadCount;
          continue;
        }
      } catch {}
      const fallbackCount = await Message.countDocuments({
        conversationId: conversation._id,
        'readBy.userId': { $ne: new (mongoose as any).Types.ObjectId(userId) },
        senderId: { $ne: new (mongoose as any).Types.ObjectId(userId) }
      });
      totalUnread += fallbackCount;
    }

    return totalUnread;
  }

  /**
   * Search messages in conversations
   */
  async searchMessages(
    userId: string,
    query: string,
    filters: {
      conversationId?: string;
      type?: string;
      dateRange?: { start: Date; end: Date };
      page?: number;
      limit?: number;
    } = {}
  ): Promise<PaginatedResponse<MessageResponse>> {
    const { conversationId, type, dateRange, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    // Get user's conversations
    const userConversations = await Conversation.find({ participants: userId });
    const conversationIds = userConversations.map(c => c._id);

    const searchQuery: any = {
      conversationId: { $in: conversationIds },
      content: { $regex: query, $options: 'i' },
      deletedAt: { $exists: false }
    };

    if (conversationId) {
      searchQuery.conversationId = conversationId;
    }

    if (type) {
      searchQuery.type = type;
    }

    if (dateRange) {
      searchQuery.createdAt = {
        $gte: dateRange.start,
        $lte: dateRange.end
      };
    }

    const [messages, total] = await Promise.all([
      Message.find(searchQuery)
        .populate('sender', 'name email avatar')
        .populate('replyMessage', 'content type senderId')
        .populate('replyMessage.senderId', 'name email avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Message.countDocuments(searchQuery)
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: messages.map(this.formatMessageResponse),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  /**
   * Format conversation response
   */
  private formatConversationResponse(conversation: any): ConversationResponse {
    return {
      _id: conversation._id.toString(),
      type: conversation.type,
      participants: conversation.participants.map((p: any) => ({
        _id: p._id.toString(),
        name: p.name,
        email: p.email,
        avatar: p.avatar,
        role: p.role
      })),
      title: conversation.title,
      batchId: conversation.batchId?.toString(),
      subject: conversation.subject,
      createdBy: conversation.createdBy.toString(),
      lastMessageAt: conversation.lastMessageAt,
      lastMessage: conversation.lastMessage ? {
        content: conversation.lastMessage.content,
        senderId: conversation.lastMessage.senderId._id.toString(),
        type: conversation.lastMessage.type,
        timestamp: conversation.lastMessage.timestamp
      } : undefined,
      unreadCount: conversation.unreadCount,
      settings: conversation.settings,
      metadata: conversation.metadata,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt
    };
  }

  /**
   * Format message response
   */
  private formatMessageResponse(message: any): MessageResponse {
    return {
      _id: message._id.toString(),
      conversationId: message.conversationId.toString(),
      senderId: message.senderId.toString(),
      sender: message.sender ? {
        _id: message.sender._id.toString(),
        name: message.sender.name,
        email: message.sender.email,
        avatar: message.sender.avatar
      } : undefined,
      type: message.type,
      content: message.content,
      attachmentMeta: message.attachmentMeta,
      replyTo: message.replyTo?.toString(),
      replyMessage: message.replyMessage ? this.formatMessageResponse(message.replyMessage) : undefined,
      editedAt: message.editedAt,
      deletedAt: message.deletedAt,
      readBy: message.readBy.map((read: any) => ({
        userId: read.userId.toString(),
        readAt: read.readAt
      })),
      metadata: message.metadata,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt
    };
  }
}
