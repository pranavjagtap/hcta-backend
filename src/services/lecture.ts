import { Lecture, ILecture } from '../models/lecture';
import { AppError } from '../utils/appError';
import { AIService } from './aiService';
import { 
  LectureCreate, 
  LectureUpdate, 
  LectureQuery, 
  LectureListResponse,
  LectureResponse,
  AILectureRequest
} from '../types/lecture';
import mongoose from 'mongoose';

class LectureService {
  /**
   * Create a new lecture with AI generation
   */
  async createLecture(lectureData: LectureCreate): Promise<LectureResponse> {
    try {
      // Create initial lecture record with pending status
      const lecture = new Lecture({
        ...lectureData,
        status: 'pending',
        script: '',
        audioUrl: ''
      });

      await lecture.save();

      // Start AI generation in background
      this.generateLectureWithAI(lecture._id.toString(), lectureData);

      return this.formatLectureResponse(lecture);
    } catch (error) {
      throw new AppError(
        `Failed to create lecture: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  /**
   * Generate lecture using AI service
   */
  private async generateLectureWithAI(lectureId: string, lectureData: LectureCreate): Promise<void> {
    try {
      // Update status to generating
      await Lecture.findByIdAndUpdate(lectureId, { status: 'generating' });

      // Prepare AI request
      const aiRequest: AILectureRequest = {
        subject: lectureData.subject,
        topic: lectureData.topic,
        language: lectureData.language,
        duration: lectureData.duration,
        voice: lectureData.voice
      };

      // Call AI service
      const aiResponse = await AIService.generateLecture({
        topic: aiRequest.topic,
        subject: aiRequest.subject,
        classLevel: '10', // Default class level
        duration: aiRequest.duration,
        difficulty: 'intermediate' as const,
        includeExamples: true,
        includeExercises: true
      });

      // Update lecture with AI-generated content
      const updatedLecture = await Lecture.findByIdAndUpdate(
        lectureId,
        {
          script: aiResponse.content,
          audioUrl: '', // Will be generated separately
          status: 'completed',
          metadata: {
            title: aiResponse.title,
            summary: aiResponse.summary,
            keyPoints: aiResponse.keyPoints,
            examples: aiResponse.examples,
            exercises: aiResponse.exercises
          }
        },
        { new: true }
      );

      if (!updatedLecture) {
        throw new Error('Lecture not found after AI generation');
      }

    } catch (error) {
      // Update lecture with error status
      await Lecture.findByIdAndUpdate(lectureId, {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error during AI generation'
      });
    }
  }

  /**
   * Get lectures with pagination and filtering
   */
  async getLectures(userId: string, query: LectureQuery): Promise<LectureListResponse> {
    try {
      const { page = 1, limit = 10, subject, topic, language, status, sortBy = 'createdAt', sortOrder = 'desc' } = query;

      // Build filter
      const filter: any = { userId: new mongoose.Types.ObjectId(userId) };
      
      if (subject) filter.subject = { $regex: subject, $options: 'i' };
      if (topic) filter.topic = { $regex: topic, $options: 'i' };
      if (language) filter.language = language;
      if (status) filter.status = status;

      // Build sort
      const sort: any = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Execute query
      const skip = (page - 1) * limit;
      const [lectures, total] = await Promise.all([
        Lecture.find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        Lecture.countDocuments(filter)
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        lectures: lectures.map(lecture => this.formatLectureResponse(lecture)),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      throw new AppError(
        `Failed to fetch lectures: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  /**
   * Get lecture by ID
   */
  async getLectureById(lectureId: string, userId: string): Promise<LectureResponse> {
    try {
      const lecture = await Lecture.findOne({
        _id: new mongoose.Types.ObjectId(lectureId),
        userId: new mongoose.Types.ObjectId(userId)
      });

      if (!lecture) {
        throw new AppError('Lecture not found', 404);
      }

      return this.formatLectureResponse(lecture);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        `Failed to fetch lecture: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  /**
   * Update lecture
   */
  async updateLecture(lectureId: string, userId: string, updateData: LectureUpdate): Promise<LectureResponse> {
    try {
      const lecture = await Lecture.findOneAndUpdate(
        {
          _id: new mongoose.Types.ObjectId(lectureId),
          userId: new mongoose.Types.ObjectId(userId)
        },
        updateData,
        { new: true, runValidators: true }
      );

      if (!lecture) {
        throw new AppError('Lecture not found', 404);
      }

      return this.formatLectureResponse(lecture);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        `Failed to update lecture: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  /**
   * Delete lecture
   */
  async deleteLecture(lectureId: string, userId: string): Promise<void> {
    try {
      const lecture = await Lecture.findOneAndDelete({
        _id: new mongoose.Types.ObjectId(lectureId),
        userId: new mongoose.Types.ObjectId(userId)
      });

      if (!lecture) {
        throw new AppError('Lecture not found', 404);
      }

      // TODO: Delete audio file from S3 if exists
      // if (lecture.audioKey) {
      //   await s3Service.deleteFile(lecture.audioKey);
      // }
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        `Failed to delete lecture: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  /**
   * Retry failed lecture generation
   */
  async retryLectureGeneration(lectureId: string, userId: string): Promise<LectureResponse> {
    try {
      const lecture = await Lecture.findOne({
        _id: new mongoose.Types.ObjectId(lectureId),
        userId: new mongoose.Types.ObjectId(userId)
      });

      if (!lecture) {
        throw new AppError('Lecture not found', 404);
      }

      if (lecture.status !== 'failed') {
        throw new AppError('Can only retry failed lectures', 400);
      }

      // Start AI generation again
      this.generateLectureWithAI(lectureId, {
        userId: userId,
        subject: lecture.subject,
        topic: lecture.topic,
        language: lecture.language,
        duration: lecture.duration,
        voice: lecture.voice
      });

      return this.formatLectureResponse(lecture);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        `Failed to retry lecture generation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  /**
   * Get lecture statistics for user
   */
  async getLectureStats(userId: string) {
    try {
      const stats = await Lecture.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
            pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
            generating: { $sum: { $cond: [{ $eq: ['$status', 'generating'] }, 1, 0] } },
            totalDuration: { $sum: '$duration' }
          }
        }
      ]);

      return stats[0] || {
        total: 0,
        completed: 0,
        failed: 0,
        pending: 0,
        generating: 0,
        totalDuration: 0
      };
    } catch (error) {
      throw new AppError(
        `Failed to fetch lecture stats: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  /**
   * Format lecture response
   */
  private formatLectureResponse(lecture: ILecture): LectureResponse {
    return {
      _id: lecture._id.toString(),
      userId: lecture.userId.toString(),
      subject: lecture.subject,
      topic: lecture.topic,
      language: lecture.language,
      duration: lecture.duration,
      voice: lecture.voice,
      script: lecture.script,
      audioUrl: lecture.audioUrl,
      status: lecture.status,
      errorMessage: lecture.errorMessage,
      metadata: lecture.metadata,
      formattedDuration: `${lecture.duration} minutes`,
      formattedDate: lecture.createdAt.toLocaleDateString(),
      createdAt: lecture.createdAt.toISOString(),
      updatedAt: lecture.updatedAt.toISOString()
    };
  }
}

export const lectureService = new LectureService();
