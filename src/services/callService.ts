import { Call, Notification } from '../models';
import { 
  CallResponse, 
  InitiateCallRequest, 
  CallHistoryFilters,
  PaginatedResponse
} from '../types/communication';
import { AppError } from '../utils/appError';
import { createNotification } from '../utils/notifications';
import { v4 as uuidv4 } from 'uuid';

export class CallService {
  /**
   * Initiate a call
   */
  async initiateCall(
    initiatorId: string,
    data: InitiateCallRequest
  ): Promise<CallResponse> {
    const { participantIds, type, metadata, webrtcConfig } = data;

    // Validate participants
    if (participantIds.length === 0) {
      throw new AppError('At least one participant is required', 400);
    }

    // For group calls, limit participants
    if (type === 'group' && participantIds.length > 10) {
      throw new AppError('Group calls cannot have more than 10 participants', 400);
    }

    // Generate unique room ID
    const roomId = uuidv4();

    // Create call record (inline implementation)
    const participants = [
      { userId: initiatorId, role: 'initiator' as const },
      ...participantIds.map(id => ({ userId: id, role: 'participant' as const }))
    ];

    const call = new Call({
      roomId,
      type,
      participants,
      status: 'ringing',
      metadata: metadata || {},
      webrtcConfig: webrtcConfig || {}
    });
    await call.save();

    // Send notifications to participants
    for (const participantId of participantIds) {
      await createNotification(
        participantId,
        'call',
        'Incoming Call',
        `You have an incoming ${type} call`,
        {
          callId: call._id.toString(),
          priority: 'high'
        }
      );
    }

    await call.populate('participants.userId', 'name email avatar');
    const populatedCall = (call as any).toObject ? (call as any).toObject() : call;

    return this.formatCallResponse(populatedCall);
  }

  /**
   * Accept a call
   */
  async acceptCall(
    callId: string,
    userId: string
  ): Promise<CallResponse> {
    const call = await Call.findById(callId);
    if (!call) {
      throw new AppError('Call not found', 404);
    }

    // Check if user is a participant
    const participant = call.participants.find(p => p.userId.toString() === userId);
    if (!participant) {
      throw new AppError('Access denied', 403);
    }

    if (call.status !== 'ringing') {
      throw new AppError('Call is not in ringing state', 400);
    }

    // Start the call if it's the first acceptance
    if (call.status === 'ringing') {
      call.status = 'active';
      call.startedAt = new Date();
    }

    // Update participant's joined time
    participant.joinedAt = new Date();
    await call.save();

    await call.populate('participants.userId', 'name email avatar');
    const populatedCall = (call as any).toObject ? (call as any).toObject() : call;

    return this.formatCallResponse(populatedCall);
  }

  /**
   * Reject a call
   */
  async rejectCall(
    callId: string,
    userId: string,
    reason?: string
  ): Promise<void> {
    const call = await Call.findById(callId);
    if (!call) {
      throw new AppError('Call not found', 404);
    }

    // Check if user is a participant
    const participant = call.participants.find(p => p.userId.toString() === userId);
    if (!participant) {
      throw new AppError('Access denied', 403);
    }

    if (call.status !== 'ringing') {
      throw new AppError('Call is not in ringing state', 400);
    }

    // Mark call as declined
    (call as any).status = 'declined';
    (call as any).endedAt = new Date();
    await call.save();
  }

  /**
   * End a call
   */
  async endCall(
    callId: string,
    userId: string
  ): Promise<CallResponse> {
    const call = await Call.findById(callId);
    if (!call) {
      throw new AppError('Call not found', 404);
    }

    // Check if user is a participant
    const participant = call.participants.find(p => p.userId.toString() === userId);
    if (!participant) {
      throw new AppError('Access denied', 403);
    }

    if (call.status !== 'active') {
      throw new AppError('Call is not active', 400);
    }

    // Mark participant as left
    participant.leftAt = new Date();

    // Check if all participants have left
    const activeParticipants = call.participants.filter(p => !p.leftAt);
    if (activeParticipants.length === 0) {
      // End call and compute duration
      (call as any).status = 'ended';
      (call as any).endedAt = new Date();
      if ((call as any).startedAt) {
        const durationSec = Math.max(0, Math.round(((call as any).endedAt.getTime() - (call as any).startedAt.getTime()) / 1000));
        (call as any).durationSec = durationSec;
      }
      await call.save();
    } else {
      await call.save();
    }

    await call.populate('participants.userId', 'name email avatar');
    const populatedCall = (call as any).toObject ? (call as any).toObject() : call;

    return this.formatCallResponse(populatedCall);
  }

  /**
   * Get call history for a user
   */
  async getCallHistory(
    userId: string,
    filters: CallHistoryFilters = {}
  ): Promise<PaginatedResponse<CallResponse>> {
    const { type, status, dateRange, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const query: any = {
      'participants.userId': userId
    };

    if (type) {
      query.type = type;
    }

    if (status) {
      query.status = status;
    }

    if (dateRange) {
      query.createdAt = {
        $gte: dateRange.start,
        $lte: dateRange.end
      };
    }

    const [calls, total] = await Promise.all([
      Call.find(query)
        .populate('participants.userId', 'name email avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Call.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: calls.map(this.formatCallResponse),
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
   * Get active calls for a user
   */
  async getActiveCalls(userId: string): Promise<CallResponse[]> {
    const calls = await Call.find({ 'participants.userId': userId, status: 'active' })
      .populate('participants.userId', 'name email avatar')
      .lean();
    return (calls as any[]).map(this.formatCallResponse);
  }

  /**
   * Get call by ID
   */
  async getCallById(
    callId: string,
    userId: string
  ): Promise<CallResponse> {
    const call = await Call.findById(callId)
      .populate('participants.userId', 'name email avatar')
      .lean();

    if (!call) {
      throw new AppError('Call not found', 404);
    }

    // Check if user is a participant
    const participant = call.participants.find(p => p.userId._id.toString() === userId);
    if (!participant) {
      throw new AppError('Access denied', 403);
    }

    return this.formatCallResponse(call);
  }

  /**
   * Set call recording URL
   */
  async setRecordingUrl(
    callId: string,
    userId: string,
    recordingUrl: string
  ): Promise<void> {
    const call = await Call.findById(callId);
    if (!call) {
      throw new AppError('Call not found', 404);
    }

    // Check if user is a participant
    const participant = call.participants.find(p => p.userId.toString() === userId);
    if (!participant) {
      throw new AppError('Access denied', 403);
    }

    (call as any).recordingUrl = recordingUrl;
    await call.save();
  }

  /**
   * Add participant to an active call
   */
  async addParticipant(
    callId: string,
    userId: string,
    newParticipantId: string
  ): Promise<CallResponse> {
    const call = await Call.findById(callId);
    if (!call) {
      throw new AppError('Call not found', 404);
    }

    // Check if user is a participant
    const participant = call.participants.find(p => p.userId.toString() === userId);
    if (!participant) {
      throw new AppError('Access denied', 403);
    }

    if (call.status !== 'active') {
      throw new AppError('Call is not active', 400);
    }

    // Check if new participant is already in the call
    const existingParticipant = call.participants.find(p => p.userId.toString() === newParticipantId);
    if (existingParticipant) {
      throw new AppError('Participant already in call', 400);
    }

    // For group calls, check participant limit
    if (call.type === 'group' && call.participants.length >= 10) {
      throw new AppError('Group call participant limit reached', 400);
    }

    // Add new participant
    (call as any).participants.push({ userId: newParticipantId, role: 'participant' });
    await call.save();

    // Send notification to new participant
    await createNotification(
      newParticipantId,
      'call',
      'Added to Call',
      'You have been added to an active call',
      {
        callId: call._id.toString(),
        priority: 'high'
      }
    );

    await call.populate('participants.userId', 'name email avatar');
    const populatedCall = (call as any).toObject ? (call as any).toObject() : call;

    return this.formatCallResponse(populatedCall);
  }

  /**
   * Remove participant from call
   */
  async removeParticipant(
    callId: string,
    userId: string,
    participantIdToRemove: string
  ): Promise<CallResponse> {
    const call = await Call.findById(callId);
    if (!call) {
      throw new AppError('Call not found', 404);
    }

    // Check if user is a participant
    const participant = call.participants.find(p => p.userId.toString() === userId);
    if (!participant) {
      throw new AppError('Access denied', 403);
    }

    if (call.status !== 'active') {
      throw new AppError('Call is not active', 400);
    }

    // Check if participant to remove exists
    const participantToRemove = call.participants.find(p => p.userId.toString() === participantIdToRemove);
    if (!participantToRemove) {
      throw new AppError('Participant not found in call', 404);
    }

    // Remove participant from array
    (call as any).participants = (call as any).participants.filter((p: any) => p.userId.toString() !== participantIdToRemove);
    await call.save();

    // Check if call should end (no active participants)
    const activeParticipants = call.participants.filter(p => !p.leftAt);
    if (activeParticipants.length === 0) {
      (call as any).status = 'ended';
      (call as any).endedAt = new Date();
      if ((call as any).startedAt) {
        const durationSec = Math.max(0, Math.round(((call as any).endedAt.getTime() - (call as any).startedAt.getTime()) / 1000));
        (call as any).durationSec = durationSec;
      }
      await call.save();
    }

    await call.populate('participants.userId', 'name email avatar');
    const populatedCall = (call as any).toObject ? (call as any).toObject() : call;

    return this.formatCallResponse(populatedCall);
  }

  /**
   * Get call statistics for a user
   */
  async getCallStats(
    userId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<{
    totalCalls: number;
    completedCalls: number;
    missedCalls: number;
    averageDuration: number;
    callTypes: { voice: number; video: number; group: number };
  }> {
    const query: any = {
      'participants.userId': userId,
      status: { $in: ['ended', 'missed', 'declined'] }
    };

    if (dateRange) {
      query.createdAt = {
        $gte: dateRange.start,
        $lte: dateRange.end
      };
    }

    const calls = await Call.find(query).lean();

    const stats = {
      totalCalls: calls.length,
      completedCalls: calls.filter(c => c.status === 'ended').length,
      missedCalls: calls.filter(c => c.status === 'missed').length,
      averageDuration: 0,
      callTypes: {
        voice: calls.filter(c => c.type === 'voice').length,
        video: calls.filter(c => c.type === 'video').length,
        group: calls.filter(c => c.type === 'group').length
      }
    };

    // Calculate average duration
    const completedCalls = calls.filter(c => c.status === 'ended' && c.durationSec);
    if (completedCalls.length > 0) {
      const totalDuration = completedCalls.reduce((sum, call) => sum + (call.durationSec || 0), 0);
      stats.averageDuration = Math.round(totalDuration / completedCalls.length);
    }

    return stats;
  }

  /**
   * Clean up old call records
   */
  async cleanupOldCalls(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await Call.deleteMany({
      createdAt: { $lt: cutoffDate },
      status: { $in: ['ended', 'missed', 'declined'] }
    });

    return result.deletedCount || 0;
  }

  /**
   * Format call response
   */
  private formatCallResponse(call: any): CallResponse {
    return {
      _id: call._id.toString(),
      roomId: call.roomId,
      type: call.type,
      participants: call.participants.map((p: any) => ({
        userId: p.userId._id.toString(),
        user: p.userId ? {
          _id: p.userId._id.toString(),
          name: p.userId.name,
          email: p.userId.email,
          avatar: p.userId.avatar
        } : undefined,
        role: p.role,
        joinedAt: p.joinedAt,
        leftAt: p.leftAt,
        deviceInfo: p.deviceInfo
      })),
      status: call.status,
      startedAt: call.startedAt,
      endedAt: call.endedAt,
      durationSec: call.durationSec,
      recordingUrl: call.recordingUrl,
      metadata: call.metadata,
      webrtcConfig: call.webrtcConfig,
      createdAt: call.createdAt,
      updatedAt: call.updatedAt
    };
  }
}
