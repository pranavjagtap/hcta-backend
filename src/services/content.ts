import { Content, IContent } from '../models/content';
import { ContentAccess, IContentAccess } from '../models/contentAccess';
import { Subject } from '../models/subject';
import { User } from '../models/user';
import { Batch } from '../models/batch';
import { AppError } from '../utils/appError';
import { validateObjectId } from '../utils/validate';
import { uploadToS3, deleteFromS3, generateSignedUrl, validateFileSize, generateVideoThumbnail } from '../middlewares/contentUpload';
import { 
  ContentCreate, 
  ContentUpdate, 
  ContentQuery, 
  ContentResponse,
  ContentListResponse,
  ContentStatsResponse,
  ContentAccessRequest,
  ContentAccessResponse,
  ContentSearchRequest,
  ContentSearchResponse,
  ContentAnalyticsRequest,
  ContentAnalyticsResponse,
  FileUploadResponse
} from '../types/content';
import mongoose from 'mongoose';

class ContentService {
  /**
   * Create new content
   */
  async createContent(contentData: ContentCreate, userId: string): Promise<ContentResponse> {
    try {
      // Validate subject ID
      if (!validateObjectId(contentData.subjectId)) {
        throw new AppError("Invalid subject ID", 400);
      }
      const subject = await Subject.findById(contentData.subjectId);
      if (!subject) {
        throw new AppError("Subject not found", 404);
      }

      // Validate file
      if (!contentData.file) {
        throw new AppError("File is required", 400);
      }

      // Validate file size
      if (!validateFileSize(contentData.file, contentData.type)) {
        const config = this.getFileConfig(contentData.type);
        throw new AppError(`File size exceeds maximum limit of ${config.maxSize / (1024 * 1024)}MB`, 400);
      }

      // Upload file
      const useS3 = process.env.USE_S3_STORAGE === "true";
      let fileUrl: string;
      let fileKey: string | undefined;
      let duration: number | undefined;

      if (useS3) {
        const uploadResult = await uploadToS3(contentData.file, contentData.type);
        fileUrl = uploadResult.url;
        fileKey = uploadResult.key;
        duration = uploadResult.duration;
      } else {
        fileUrl = `/uploads/content/${contentData.type}s/${contentData.file.filename}`;
      }

      // Generate thumbnail for videos
      let thumbnailUrl: string | undefined;
      if (contentData.type === 'video' && useS3) {
        try {
          const thumbnailBuffer = await generateVideoThumbnail(contentData.file.buffer, contentData.file.mimetype);
          const thumbnailResult = await uploadToS3(
            { ...contentData.file, buffer: thumbnailBuffer, mimetype: 'image/jpeg' } as any,
            'image'
          );
          thumbnailUrl = thumbnailResult.url;
        } catch (error) {
          console.warn('Failed to generate video thumbnail:', error);
        }
      }

      // Create content record
      const content = new Content({
        title: contentData.title,
        description: contentData.description,
        type: contentData.type,
        fileUrl,
        fileKey,
        fileName: contentData.file.originalname,
        fileSize: contentData.file.size,
        mimeType: contentData.file.mimetype,
        duration,
        subjectId: contentData.subjectId,
        topic: contentData.topic,
        subtopic: contentData.subtopic,
        grade: contentData.grade,
        tags: contentData.tags || [],
        authorId: userId,
        uploadedBy: userId,
        isPublic: contentData.isPublic ?? true,
        assignedTo: contentData.assignedTo || [],
        sharedWith: contentData.sharedWith || [],
        metadata: {
          ...contentData.metadata,
          thumbnailUrl,
          language: contentData.metadata?.language || 'en',
          difficulty: contentData.metadata?.difficulty || 'intermediate'
        },
        quizData: contentData.quizData
      });

      await content.save();

      return this.formatContentResponse(content);
    } catch (error) {
      throw new AppError(
        `Failed to create content: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  /**
   * Get content by ID with user access info
   */
  async getContentById(contentId: string, userId: string, userType: string): Promise<ContentResponse> {
    try {
      if (!validateObjectId(contentId)) {
        throw new AppError("Invalid content ID", 400);
      }

      const content = await Content.findById(contentId)
        .populate('subjectId', 'name')
        .populate('authorId', 'name email')
        .populate('uploadedBy', 'name email')
        .populate('sharedWith', 'name email')
        .populate('assignedTo', 'name')
        .populate('reviewedBy', 'name');

      if (!content) {
        throw new AppError("Content not found", 404);
      }

      // Check access permissions
      await this.checkContentAccess(content, userId, userType);

      // Update access tracking
      await this.trackContentAccess(contentId, userId, userType, 'view');

      return this.formatContentResponse(content, userId);
    } catch (error) {
      throw new AppError(
        `Failed to get content: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  /**
   * Get content list with filters and pagination
   */
  async getContentList(query: ContentQuery, userId: string, userType: string): Promise<ContentListResponse> {
    try {
      const page = query.page || 1;
      const limit = query.limit || 10;
      const skip = (page - 1) * limit;

      // Build filter query
      const filter: any = {};

      // Basic filters
      if (query.subjectId) {
        if (!validateObjectId(query.subjectId)) {
          throw new AppError("Invalid subject ID", 400);
        }
        filter.subjectId = query.subjectId;
      }

      if (query.type) {
        filter.type = query.type;
      }

      if (query.status) {
        filter.status = query.status;
      }

      if (query.isPublic !== undefined) {
        filter.isPublic = query.isPublic;
      }

      if (query.grade) {
        filter.grade = query.grade;
      }

      if (query.difficulty) {
        filter['metadata.difficulty'] = query.difficulty;
      }

      if (query.language) {
        filter['metadata.language'] = query.language;
      }

      if (query.tags && query.tags.length > 0) {
        filter.tags = { $in: query.tags };
      }

      if (query.dateFrom || query.dateTo) {
        filter.createdAt = {};
        if (query.dateFrom) {
          filter.createdAt.$gte = new Date(query.dateFrom);
        }
        if (query.dateTo) {
          filter.createdAt.$lte = new Date(query.dateTo);
        }
      }

      // Role-based filters
      if (userType === 'student') {
        // Students can only see public content or content assigned to their batches
        filter.$or = [
          { isPublic: true },
          { assignedTo: { $in: await this.getStudentBatches(userId) } }
        ];
      } else if (userType === 'teacher') {
        // Teachers can see their own content, shared content, and public content
        filter.$or = [
          { authorId: userId },
          { sharedWith: userId },
          { isPublic: true }
        ];
      }
      // Admins can see all content

      // Text search
      if (query.search) {
        filter.$text = { $search: query.search };
      }

      // Build sort query
      const sort: any = {};
      if (query.sortBy) {
        sort[query.sortBy] = query.sortOrder === 'asc' ? 1 : -1;
      } else {
        sort.createdAt = -1;
      }

      // Execute query
      const [contents, total] = await Promise.all([
        Content.find(filter)
          .populate('subjectId', 'name')
          .populate('authorId', 'name email')
          .populate('uploadedBy', 'name email')
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        Content.countDocuments(filter)
      ]);

      // Get available filters
      const availableFilters = await this.getAvailableFilters();

      return {
        contents: contents.map(content => this.formatContentResponse(content, userId)),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        },
        filters: {
          applied: query,
          available: availableFilters
        }
      };
    } catch (error) {
      throw new AppError(
        `Failed to get content list: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  /**
   * Update content
   */
  async updateContent(contentId: string, updateData: ContentUpdate, userId: string, userType: string): Promise<ContentResponse> {
    try {
      if (!validateObjectId(contentId)) {
        throw new AppError("Invalid content ID", 400);
      }

      const content = await Content.findById(contentId);
      if (!content) {
        throw new AppError("Content not found", 404);
      }

      // Check permissions
      if (userType !== 'admin' && content.authorId.toString() !== userId) {
        throw new AppError("You don't have permission to update this content", 403);
      }

      // Handle file upload if provided
      if (updateData.file) {
        // Validate file size
        if (!validateFileSize(updateData.file, content.type)) {
          const config = this.getFileConfig(content.type);
          throw new AppError(`File size exceeds maximum limit of ${config.maxSize / (1024 * 1024)}MB`, 400);
        }

        // Delete old file
        if (content.fileKey) {
          await deleteFromS3(content.fileKey);
        }

        // Upload new file
        const useS3 = process.env.USE_S3_STORAGE === "true";
        if (useS3) {
          const uploadResult = await uploadToS3(updateData.file, content.type);
          updateData.fileUrl = uploadResult.url;
          updateData.fileKey = uploadResult.key;
          updateData.fileName = updateData.file.originalname;
          updateData.fileSize = updateData.file.size;
          updateData.mimeType = updateData.file.mimetype;
          updateData.duration = uploadResult.duration;
        } else {
          updateData.fileUrl = `/uploads/content/${content.type}s/${updateData.file.filename}`;
          updateData.fileName = updateData.file.originalname;
          updateData.fileSize = updateData.file.size;
          updateData.mimeType = updateData.file.mimetype;
        }
      }

      // Update content
      const updatedContent = await Content.findByIdAndUpdate(
        contentId,
        { ...updateData, version: content.version + 1 },
        { new: true, runValidators: true }
      ).populate('subjectId', 'name')
       .populate('authorId', 'name email')
       .populate('uploadedBy', 'name email')
       .populate('sharedWith', 'name email')
       .populate('assignedTo', 'name');

      return this.formatContentResponse(updatedContent!);
    } catch (error) {
      throw new AppError(
        `Failed to update content: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  /**
   * Delete content
   */
  async deleteContent(contentId: string, userId: string, userType: string): Promise<void> {
    try {
      if (!validateObjectId(contentId)) {
        throw new AppError("Invalid content ID", 400);
      }

      const content = await Content.findById(contentId);
      if (!content) {
        throw new AppError("Content not found", 404);
      }

      // Check permissions
      if (userType !== 'admin' && content.authorId.toString() !== userId) {
        throw new AppError("You don't have permission to delete this content", 403);
      }

      // Delete file from storage
      if (content.fileKey) {
        await deleteFromS3(content.fileKey);
      }

      // Delete content access records
      await ContentAccess.deleteMany({ contentId });

      // Delete content
      await Content.findByIdAndDelete(contentId);
    } catch (error) {
      throw new AppError(
        `Failed to delete content: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  /**
   * Track content access
   */
  async trackContentAccess(contentId: string, userId: string, userType: string, action: string): Promise<void> {
    try {
      let accessRecord = await ContentAccess.findOne({ contentId, userId });

      if (!accessRecord) {
        accessRecord = new ContentAccess({
          contentId,
          userId,
          userType,
          accessCount: 0
        });
      }

      // Update access count and last accessed
      accessRecord.accessCount += 1;
      accessRecord.lastAccessed = new Date();

      // Update content stats
      const content = await Content.findById(contentId);
      if (content) {
        if (action === 'view') {
          content.stats.views += 1;
        } else if (action === 'download') {
          content.stats.downloads += 1;
          accessRecord.downloadCount += 1;
          accessRecord.lastDownloaded = new Date();
        }
        await content.save();
      }

      await accessRecord.save();
    } catch (error) {
      console.error('Failed to track content access:', error);
    }
  }

  /**
   * Handle content access actions (favorite, rate, review, progress)
   */
  async handleContentAccess(request: ContentAccessRequest, userId: string): Promise<void> {
    try {
      const { contentId, action, data } = request;

      if (!validateObjectId(contentId)) {
        throw new AppError("Invalid content ID", 400);
      }

      let accessRecord = await ContentAccess.findOne({ contentId, userId });

      if (!accessRecord) {
        throw new AppError("Content access record not found", 404);
      }

      switch (action) {
        case 'favorite':
          accessRecord.isFavorited = true;
          break;
        case 'unfavorite':
          accessRecord.isFavorited = false;
          break;
        case 'rate':
          if (data?.rating && (data.rating >= 1 && data.rating <= 5)) {
            accessRecord.rating = data.rating;
            // Update content average rating
            await this.updateContentRating(contentId);
          }
          break;
        case 'review':
          if (data?.review) {
            accessRecord.review = data.review;
            accessRecord.reviewDate = new Date();
          }
          break;
        case 'progress':
          if (data?.progress) {
            accessRecord.progress.currentTime = data.progress.currentTime;
            accessRecord.progress.totalTime = data.progress.totalTime;
          }
          break;
        default:
          throw new AppError("Invalid action", 400);
      }

      await accessRecord.save();
    } catch (error) {
      throw new AppError(
        `Failed to handle content access: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  /**
   * Search content
   */
  async searchContent(searchRequest: ContentSearchRequest, userId: string, userType: string): Promise<ContentSearchResponse> {
    try {
      const { query, filters, page = 1, limit = 10, sortBy = 'relevance', sortOrder = 'desc' } = searchRequest;
      const skip = (page - 1) * limit;

      // Build search query
      const searchFilter: any = {
        $text: { $search: query }
      };

      // Apply additional filters
      if (filters) {
        if (filters.subjectId) searchFilter.subjectId = filters.subjectId;
        if (filters.type) searchFilter.type = filters.type;
        if (filters.difficulty) searchFilter['metadata.difficulty'] = filters.difficulty;
        if (filters.language) searchFilter['metadata.language'] = filters.language;
        if (filters.grade) searchFilter.grade = filters.grade;
        if (filters.tags) searchFilter.tags = { $in: filters.tags };
      }

      // Role-based access
      if (userType === 'student') {
        searchFilter.$or = [
          { isPublic: true },
          { assignedTo: { $in: await this.getStudentBatches(userId) } }
        ];
      } else if (userType === 'teacher') {
        searchFilter.$or = [
          { authorId: userId },
          { sharedWith: userId },
          { isPublic: true }
        ];
      }

      // Build sort query
      const sort: any = {};
      if (sortBy === 'relevance') {
        sort.score = { $meta: 'textScore' };
      } else {
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
      }

      // Execute search
      const [results, total] = await Promise.all([
        Content.find(searchFilter)
          .populate('subjectId', 'name')
          .populate('authorId', 'name email')
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        Content.countDocuments(searchFilter)
      ]);

      // Generate suggestions
      const suggestions = await this.generateSearchSuggestions(query);

      return {
        results: results.map(content => this.formatContentResponse(content, userId)),
        suggestions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new AppError(
        `Failed to search content: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  /**
   * Public wrapper to get search suggestions
   */
  async getSearchSuggestions(query: string): Promise<string[]> {
    return this.generateSearchSuggestions(query);
  }

  /**
   * Assign content to batches (stub)
   */
  async assignContentToBatches(assignmentRequest: { contentId: string; batchIds: string[]; action: 'assign' | 'unassign' }, userId: string): Promise<void> {
    // TODO: implement assignment logic
    return;
  }

  /**
   * Share content with teachers (stub)
   */
  async shareContentWithTeachers(sharingRequest: { contentId: string; teacherIds: string[]; action: 'share' | 'unshare' }, userId: string): Promise<void> {
    // TODO: implement sharing logic
    return;
  }

  /**
   * Bulk update content status (stub)
   */
  async bulkUpdateContentStatus(bulkRequest: { ids: string[]; action?: 'status' | 'delete'; status?: string }, userId: string): Promise<void> {
    // TODO: implement bulk status update
    return;
  }

  /**
   * Get content versions (stub)
   */
  async getContentVersions(contentId: string, userId: string): Promise<any[]> {
    // TODO: implement versions listing
    return [];
  }

  /**
   * Restore content version (stub)
   */
  async restoreContentVersion(contentId: string, versionNumber: number, userId: string): Promise<ContentResponse> {
    // TODO: implement restore logic
    const content = await Content.findById(contentId);
    if (!content) throw new AppError('Content not found', 404);
    return this.formatContentResponse(content);
  }

  /**
   * Import content from CSV (stub)
   */
  async importContentFromCSV(csvPath: string, userId: string): Promise<{ imported: number; errors: Array<{ line: number; error: string }> }> {
    // TODO: implement CSV import
    return { imported: 0, errors: [] };
  }

  /**
   * Get content statistics
   */
  async getContentStats(userId: string, userType: string): Promise<ContentStatsResponse> {
    try {
      const filter: any = {};

      // Role-based filtering
      if (userType === 'student') {
        filter.$or = [
          { isPublic: true },
          { assignedTo: { $in: await this.getStudentBatches(userId) } }
        ];
      } else if (userType === 'teacher') {
        filter.$or = [
          { authorId: userId },
          { sharedWith: userId },
          { isPublic: true }
        ];
      }

      const [
        totalContents,
        totalViews,
        totalDownloads,
        totalFavorites,
        averageRating,
        contentsByType,
        contentsBySubject,
        topContents,
        recentUploads,
        storageUsage
      ] = await Promise.all([
        Content.countDocuments(filter),
        Content.aggregate([
          { $match: filter },
          { $group: { _id: null, total: { $sum: '$stats.views' } } }
        ]).then(result => result[0]?.total || 0),
        Content.aggregate([
          { $match: filter },
          { $group: { _id: null, total: { $sum: '$stats.downloads' } } }
        ]).then(result => result[0]?.total || 0),
        Content.aggregate([
          { $match: filter },
          { $group: { _id: null, total: { $sum: '$stats.favorites' } } }
        ]).then(result => result[0]?.total || 0),
        Content.aggregate([
          { $match: filter },
          { $group: { _id: null, avg: { $avg: '$stats.averageRating' } } }
        ]).then(result => result[0]?.avg || 0),
        Content.aggregate([
          { $match: filter },
          { $group: { _id: '$type', count: { $sum: 1 } } }
        ]).then(result => Object.fromEntries(result.map(r => [r._id, r.count]))),
        Content.aggregate([
          { $match: filter },
          { $lookup: { from: 'subjects', localField: 'subjectId', foreignField: '_id', as: 'subject' } },
          { $unwind: '$subject' },
          { $group: { _id: '$subject.name', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ]).then(result => result.map(r => ({ subject: r._id, count: r.count }))),
        Content.find(filter)
          .populate('subjectId', 'name')
          .populate('authorId', 'name email')
          .sort({ 'stats.views': -1 })
          .limit(10)
          .lean(),
        Content.find(filter)
          .populate('subjectId', 'name')
          .populate('authorId', 'name email')
          .sort({ createdAt: -1 })
          .limit(10)
          .lean(),
        Content.aggregate([
          { $match: filter },
          { $group: { _id: null, total: { $sum: '$fileSize' } } }
        ]).then(result => result[0]?.total || 0)
      ]);

      return {
        totalContents,
        totalViews,
        totalDownloads,
        totalFavorites,
        averageRating: Math.round(averageRating * 100) / 100,
        contentsByType,
        contentsBySubject,
        topContents: topContents.map(content => this.formatContentResponse(content, userId)),
        recentUploads: recentUploads.map(content => this.formatContentResponse(content, userId)),
        storageUsage: {
          total: storageUsage,
          byType: await this.getStorageUsageByType(filter)
        }
      };
    } catch (error) {
      throw new AppError(
        `Failed to get content stats: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private async checkContentAccess(content: IContent, userId: string, userType: string): Promise<void> {
    if (userType === 'admin') return;

    if (userType === 'student') {
      const studentBatches = await this.getStudentBatches(userId);
      if (!content.isPublic && !content.assignedTo.some(batchId => 
        studentBatches.includes(batchId.toString())
      )) {
        throw new AppError("You don't have access to this content", 403);
      }
    } else if (userType === 'teacher') {
      if (content.authorId.toString() !== userId && 
          !content.sharedWith.some(teacherId => teacherId.toString() === userId) &&
          !content.isPublic) {
        throw new AppError("You don't have access to this content", 403);
      }
    }
  }

  private async getStudentBatches(studentId: string): Promise<string[]> {
    // This would need to be implemented based on your student-batch relationship
    // For now, returning empty array
    return [];
  }

  private async getAvailableFilters() {
    const [subjects, types, difficulties, languages, grades, tags] = await Promise.all([
      Subject.find().select('name').lean(),
      Content.distinct('type'),
      Content.distinct('metadata.difficulty'),
      Content.distinct('metadata.language'),
      Content.distinct('grade'),
      Content.distinct('tags')
    ]);

    return {
      subjects: subjects.map(s => ({ _id: s._id.toString(), name: s.name })),
      types,
      difficulties,
      languages,
      grades,
      tags
    };
  }

  private async updateContentRating(contentId: string): Promise<void> {
    const ratings = await ContentAccess.find({ contentId, rating: { $exists: true } });
    const averageRating = ratings.reduce((sum, access) => sum + access.rating!, 0) / ratings.length;

    await Content.findByIdAndUpdate(contentId, {
      'stats.averageRating': Math.round(averageRating * 100) / 100,
      'stats.totalRatings': ratings.length
    });
  }

  private async generateSearchSuggestions(query: string): Promise<string[]> {
    // Simple implementation - in production, you might want to use a search engine like Elasticsearch
    const suggestions = await Content.find({
      $text: { $search: query },
      title: { $regex: query, $options: 'i' }
    })
    .select('title tags topic')
    .limit(5)
    .lean();

    return suggestions.map(s => s.title);
  }

  private async getStorageUsageByType(filter: any): Promise<Record<string, number>> {
    const result = await Content.aggregate([
      { $match: filter },
      { $group: { _id: '$type', total: { $sum: '$fileSize' } } }
    ]);

    return Object.fromEntries(result.map(r => [r._id, r.total]));
  }

  private getFileConfig(contentType: string) {
    const configs = {
      video: { maxSize: 500 * 1024 * 1024 },
      pdf: { maxSize: 50 * 1024 * 1024 },
      ppt: { maxSize: 100 * 1024 * 1024 },
      doc: { maxSize: 50 * 1024 * 1024 },
      image: { maxSize: 10 * 1024 * 1024 },
      audio: { maxSize: 100 * 1024 * 1024 },
      quiz: { maxSize: 1 * 1024 * 1024 },
      other: { maxSize: 50 * 1024 * 1024 }
    };

    return configs[contentType as keyof typeof configs] || configs.other;
  }

  private formatContentResponse(content: any, userId?: string): ContentResponse {
    const response: ContentResponse = {
      _id: content._id.toString(),
      title: content.title,
      description: content.description,
      type: content.type,
      fileUrl: content.fileUrl,
      fileKey: content.fileKey,
      fileName: content.fileName,
      fileSize: content.fileSize,
      formattedFileSize: content.formattedFileSize,
      mimeType: content.mimeType,
      duration: content.duration,
      formattedDuration: content.formattedDuration,
      subject: content.subjectId,
      topic: content.topic,
      subtopic: content.subtopic,
      grade: content.grade,
      tags: content.tags,
      author: content.authorId,
      uploadedBy: content.uploadedBy,
      isPublic: content.isPublic,
      sharedWith: content.sharedWith,
      assignedTo: content.assignedTo,
      version: content.version,
      isLatestVersion: content.isLatestVersion,
      quizData: content.quizData,
      metadata: content.metadata,
      stats: content.stats,
      status: content.status,
      reviewNotes: content.reviewNotes,
      reviewedBy: content.reviewedBy,
      reviewedAt: content.reviewedAt?.toISOString(),
      formattedDate: content.formattedDate,
      createdAt: content.createdAt.toISOString(),
      updatedAt: content.updatedAt.toISOString()
    };

    // Add user access info if userId is provided
    if (userId && content.userAccess) {
      response.userAccess = content.userAccess;
    }

    return response;
  }
}

export const contentService = new ContentService();
