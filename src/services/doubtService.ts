import { Doubt, Content } from '../models';
import mongoose from 'mongoose';
import { 
  DoubtResponse, 
  AskDoubtRequest, 
  DoubtFeedbackRequest, 
  DoubtHistoryFilters,
  PaginatedResponse
} from '../types/communication';
import { createError } from '../utils/appError';
import { AIService } from './aiService';
import { uploadToS3, deleteFromS3 } from '../middlewares/fileUpload';

export class DoubtService {
  /**
   * Ask a doubt and get AI response
   */
  static async askDoubt(
    userId: string,
    data: AskDoubtRequest
  ): Promise<DoubtResponse> {
    const { query, subject, mode, context } = data;

    if (!query.trim()) {
      throw createError('Query cannot be empty', 400);
    }

    // Create doubt record
    const doubt = new Doubt({
      userId,
      subject,
      query,
      mode,
      context
    });

    await doubt.save();

    try {
      // Get AI response
      const aiResponse = await AIService.generateAnswer({
        query,
        subject,
        context: {
          courseMaterials: context?.courseMaterials || [],
          weakTopics: context?.weakTopics || [],
          recentChatContext: context?.recentChatContext
        }
      });

      // Update doubt with AI response (cast contentId to ObjectId)
      const transformed = {
        ...aiResponse,
        sources: (aiResponse.sources || []).map(s => ({
          ...s,
          contentId: new mongoose.Types.ObjectId(s.contentId as any),
        })),
      };
      doubt.aiResponse = transformed as any;
      await doubt.save();

      // If voice mode, generate TTS
      if (mode === 'voice') {
        const ttsUrl = await AIService.generateTTS(aiResponse.answer);
        doubt.ttsUrl = ttsUrl;
        await doubt.save();
      }

      await doubt.populate([
        { path: 'user', select: 'name email avatar' },
        { path: 'contentSources', select: 'title type' },
      ]);
      const populatedDoubt = doubt.toObject();

      return this.formatDoubtResponse(populatedDoubt);
    } catch (error) {
      // Update doubt with error information
      doubt.aiResponse = {
        answer: 'Sorry, I encountered an error while processing your question. Please try again.',
        steps: [],
        sources: [],
        followUps: [],
        confidence: 0
      };
      doubt.metadata = {
        ...doubt.metadata,
        processingTime: 0,
        tokensUsed: 0,
        modelVersion: 'error'
      };
      await doubt.save();

      throw createError('Failed to generate AI response', 500);
    }
  }

  /**
   * Ask doubt with voice input
   */
  static async askDoubtWithVoice(
    userId: string,
    audioFile: Express.Multer.File,
    data: Omit<AskDoubtRequest, 'query' | 'mode'>
  ): Promise<DoubtResponse> {
    let uploadedKey: string | undefined;
    try {
      // Upload audio file to S3
      const audioUpload: any = await uploadToS3(audioFile, 'doubts-voice');
      uploadedKey = audioUpload?.key;

      // Convert speech to text
      const transcript = await AIService.speechToText(String(audioUpload?.url || ''));

      // Create doubt with voice mode
      const doubt = new Doubt({
        userId: userId,
        subject: data.subject,
        query: transcript,
        mode: 'voice',
        transcript,
        context: data.context
      });

      await doubt.save();

      // Get AI response
      const aiResponse = await AIService.generateAnswer({
        query: transcript,
        subject: data.subject,
        context: {
          courseMaterials: data.context?.courseMaterials || [],
          weakTopics: data.context?.weakTopics || [],
          recentChatContext: data.context?.recentChatContext
        }
      });

      // Generate TTS response
      const ttsUrl = await AIService.generateTTS(aiResponse.answer);

      // Update doubt with results (cast contentId to ObjectId)
      const transformed = {
        ...aiResponse,
        sources: (aiResponse.sources || []).map(s => ({
          ...s,
          contentId: new mongoose.Types.ObjectId(s.contentId as any),
        })),
      };
      doubt.aiResponse = transformed as any;
      doubt.ttsUrl = ttsUrl;
      await doubt.save();

      await doubt.populate([
        { path: 'user', select: 'name email avatar' },
        { path: 'contentSources', select: 'title type' },
      ]);
      const populatedDoubt = doubt.toObject();

      return this.formatDoubtResponse(populatedDoubt);
    } catch (error) {
      // Clean up uploaded file on error
      if (uploadedKey) {
        await deleteFromS3(uploadedKey);
      }

      throw createError('Failed to process voice doubt', 500);
    }
  }

  /**
   * Get doubt history for a user
   */
  static async getDoubtHistory(
    userId: string,
    filters: DoubtHistoryFilters = {}
  ): Promise<PaginatedResponse<DoubtResponse>> {
    const { subject, mode, helpful, dateRange, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const query: any = { userId };

    if (subject) {
      query.subject = subject;
    }

    if (mode) {
      query.mode = mode;
    }

    if (helpful !== undefined) {
      query['feedback.helpful'] = helpful;
    }

    if (dateRange) {
      query.createdAt = {
        $gte: dateRange.start,
        $lte: dateRange.end
      };
    }

    const [doubts, total] = await Promise.all([
      Doubt.find(query)
        .populate('user', 'name email avatar')
        .populate('contentSources', 'title type')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Doubt.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: doubts.map(this.formatDoubtResponse),
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
   * Get doubt by ID
   */
  static async getDoubtById(
    doubtId: string,
    userId: string
  ): Promise<DoubtResponse> {
    const doubt = await Doubt.findById(doubtId)
      .populate('user', 'name email avatar')
      .populate('contentSources', 'title type')
      .lean();

    if (!doubt) {
      throw createError('Doubt not found', 404);
    }

    if (doubt.userId.toString() !== userId) {
      throw createError('Access denied', 403);
    }

    return this.formatDoubtResponse(doubt);
  }

  /**
   * Add feedback to a doubt
   */
  static async addFeedback(
    doubtId: string,
    userId: string,
    feedback: DoubtFeedbackRequest
  ): Promise<void> {
    const doubt = await Doubt.findById(doubtId);
    if (!doubt) {
      throw createError('Doubt not found', 404);
    }

    if (doubt.userId.toString() !== userId) {
      throw createError('Access denied', 403);
    }

    (doubt as any).feedback = feedback as any;
    await doubt.save();
  }

  /**
   * Get doubt analytics for a user
   */
  static async getDoubtAnalytics(
    userId?: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<{
    totalDoubts: number;
    avgConfidence: number;
    helpfulCount: number;
    voiceCount: number;
    textCount: number;
    topSubjects: Array<{ subject: string; count: number }>;
    averageResponseTime: number;
  }> {
    const analytics = (await (Doubt as any).getDoubtAnalytics?.(userId, dateRange)) || {
      totalDoubts: await Doubt.countDocuments(userId ? { userId } : {}),
      avgConfidence: 0,
      helpfulCount: await Doubt.countDocuments({ ...(userId ? { userId } : {}), 'feedback.helpful': true }),
      voiceCount: await Doubt.countDocuments({ ...(userId ? { userId } : {}), mode: 'voice' }),
      textCount: await Doubt.countDocuments({ ...(userId ? { userId } : {}), mode: 'text' }),
    };
    const topSubjects = (await (Doubt as any).getTopSubjects?.(userId, 10)) || [];

    return {
      ...analytics,
      topSubjects: topSubjects.map((item: any) => ({
        subject: item._id,
        count: item.count
      })),
      averageResponseTime: analytics.avgConfidence * 1000 // Convert to milliseconds for display
    };
  }

  /**
   * Get similar doubts
   */
  static async getSimilarDoubts(
    doubtId: string,
    userId: string,
    limit: number = 5
  ): Promise<DoubtResponse[]> {
    const doubt = await Doubt.findById(doubtId);
    if (!doubt) {
      throw createError('Doubt not found', 404);
    }

    if (doubt.userId.toString() !== userId) {
      throw createError('Access denied', 403);
    }

    // Find similar doubts based on subject and query similarity
    const similarDoubts = await Doubt.find({
      _id: { $ne: doubtId },
      userId,
      subject: doubt.subject,
      query: { $regex: doubt.query.split(' ').slice(0, 3).join(' '), $options: 'i' }
    })
    .populate('user', 'name email avatar')
    .populate('contentSources', 'title type')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

    return similarDoubts.map(this.formatDoubtResponse);
  }

  /**
   * Get recommended content based on doubt
   */
  static async getRecommendedContent(
    doubtId: string,
    userId: string,
    limit: number = 5
  ): Promise<any[]> {
    const doubt = await Doubt.findById(doubtId);
    if (!doubt) {
      throw createError('Doubt not found', 404);
    }

    if (doubt.userId.toString() !== userId) {
      throw createError('Access denied', 403);
    }

    // Get content recommendations based on doubt subject and sources
    const contentIds = (doubt.aiResponse?.sources || []).map((s: any) =>
      typeof s.contentId === 'string' ? new mongoose.Types.ObjectId(s.contentId) : s.contentId
    );
    
    const recommendedContent = await Content.find({
      _id: { $in: contentIds },
      status: 'active'
    })
    .select('title description type subject topic tags')
    .limit(limit)
    .lean();

    return recommendedContent;
  }

  /**
   * Escalate doubt to teacher
   */
  static async escalateDoubt(
    doubtId: string,
    userId: string,
    teacherId: string
  ): Promise<void> {
    const doubt = await Doubt.findById(doubtId);
    if (!doubt) {
      throw createError('Doubt not found', 404);
    }

    if (doubt.userId.toString() !== userId) {
      throw createError('Access denied', 403);
    }

    // Create escalation record (this could be a separate model)
    // For now, we'll just update the doubt with escalation info
    (doubt as any).metadata = {
      ...(doubt as any).metadata,
      escalated: true,
      escalatedTo: teacherId,
      escalatedAt: new Date(),
    };

    await doubt.save();

    // Send notification to teacher
    // await createNotification(teacherId, 'doubt', 'Doubt Escalation', 
    //   `A student has escalated a doubt for your review`, {
    //     doubtId: doubt._id.toString(),
    //     priority: 'high'
    //   }
    // );
  }

  /**
   * Get follow-up suggestions for a doubt
   */
  static async getFollowUpSuggestions(
    doubtId: string,
    userId: string
  ): Promise<string[]> {
    const doubt = await Doubt.findById(doubtId);
    if (!doubt) {
      throw createError('Doubt not found', 404);
    }

    if (doubt.userId.toString() !== userId) {
      throw createError('Access denied', 403);
    }

    return doubt.aiResponse.followUps || [];
  }

  /**
   * Clean up old doubt records
   */
  static async cleanupOldDoubts(daysOld: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await Doubt.deleteMany({
      createdAt: { $lt: cutoffDate },
      'feedback.helpful': { $ne: true } // Keep helpful doubts longer
    });

    return result.deletedCount || 0;
  }

  /**
   * Format doubt response
   */
  private static formatDoubtResponse(doubt: any): DoubtResponse {
    return {
      _id: doubt._id.toString(),
      userId: doubt.userId.toString(),
      user: doubt.user ? {
        _id: doubt.user._id.toString(),
        name: doubt.user.name,
        email: doubt.user.email,
        avatar: doubt.user.avatar
      } : undefined,
      subject: doubt.subject,
      query: doubt.query,
      aiResponse: {
        answer: doubt.aiResponse.answer,
        steps: doubt.aiResponse.steps,
        sources: doubt.aiResponse.sources.map((s: any) => ({
          contentId: s.contentId.toString(),
          title: s.title,
          section: s.section,
          relevance: s.relevance
        })),
        followUps: doubt.aiResponse.followUps,
        confidence: doubt.aiResponse.confidence
      },
      mode: doubt.mode,
      transcript: doubt.transcript,
      ttsUrl: doubt.ttsUrl,
      feedback: doubt.feedback,
      context: doubt.context ? {
        courseMaterials: doubt.context.courseMaterials?.map((c: any) => c.toString()),
        weakTopics: doubt.context.weakTopics,
        recentChatContext: doubt.context.recentChatContext,
        performanceHints: doubt.context.performanceHints
      } : undefined,
      metadata: doubt.metadata,
      createdAt: doubt.createdAt,
      updatedAt: doubt.updatedAt
    };
  }
}
