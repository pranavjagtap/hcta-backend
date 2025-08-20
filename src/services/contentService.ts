import { Content, ContentAccess, ContentAudit, ContentVersion, ContentAssignment } from '../models';
import { 
  ContentCreate, 
  ContentUpdate, 
  ContentResponse, 
  ContentListResponse, 
  ContentQuery,
  ContentSearchRequest,
  ContentAnalyticsRequest,
  ContentAssignmentRequest,
  ContentSharingRequest,
  BulkOperationRequest
} from '../types/content';
import { AppError } from '../utils/appError';
import { uploadToS3, deleteFromS3, generateVideoThumbnail } from '../middlewares/contentUpload';
import mongoose from 'mongoose';
import fs from 'fs';
// Use require to avoid TypeScript typing issues with csv-parser
// eslint-disable-next-line @typescript-eslint/no-var-requires
const csv = require('csv-parser');

export class ContentService {
  // ============================================================================
  // CONTENT CRUD OPERATIONS
  // ============================================================================

  /**
   * Create new content
   */
  async createContent(contentData: ContentCreate, userId: string): Promise<ContentResponse> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Handle file upload
      let fileUrl = '';
      let fileKey: string | undefined;
      let duration: number | undefined;
      let thumbnailUrl: string | undefined;
      let fileName: string = '';
      let fileSize: number = 0;
      let mimeType: string = '';

      if (contentData.file) {
        const uploadResult = await uploadToS3(contentData.file, contentData.type);
        fileUrl = uploadResult.url;
        fileKey = uploadResult.key;
        duration = uploadResult.duration;
        fileName = contentData.file.originalname;
        fileSize = contentData.file.size;
        mimeType = contentData.file.mimetype;

        // Generate thumbnail for videos
        if (contentData.type === 'video' && contentData.file) {
          const thumbnailBuffer = await generateVideoThumbnail(contentData.file.buffer, contentData.file.mimetype);
          const thumbnailUploadResult = await uploadToS3(
            { ...contentData.file, buffer: thumbnailBuffer },
            'image'
          );
          thumbnailUrl = thumbnailUploadResult.url;
        }
      }

      // Create content
      const content = new Content({
        ...contentData,
        fileUrl,
        fileKey,
        duration,
        authorId: userId,
        uploadedBy: userId,
        'metadata.thumbnailUrl': thumbnailUrl
      });

      await content.save({ session });

      // Create initial version
      const version = new ContentVersion({
        contentId: content._id,
        version: 1,
        isLatestVersion: true,
        fileUrl,
        fileKey,
        fileName,
        fileSize,
        mimeType,
        duration,
        title: contentData.title,
        description: contentData.description,
        subjectId: contentData.subjectId,
        topic: contentData.topic,
        subtopic: contentData.subtopic,
        grade: contentData.grade,
        tags: contentData.tags,
        changelog: 'Initial version',
        uploadedBy: userId,
        processingStatus: 'completed',
        thumbnailUrl
      });

      await version.save({ session });

      // Create audit log
      await this.createAuditLog({
        actorId: userId,
        action: 'create',
        contentId: content._id,
        resourceType: 'content',
        after: content.toObject(),
        metadata: {
          reason: 'Content created'
        }
      }, session);

      await session.commitTransaction();

      return await this.getContentById(content._id.toString(), userId);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get content by ID with access tracking
   */
  async getContentById(contentId: string, userId: string, userType?: string): Promise<ContentResponse> {
    const content = await Content.findById(contentId)
      .populate('authorId', 'name email')
      .populate('uploadedBy', 'name email')
      .populate('subjectId', 'name')
      .populate('reviewedBy', 'name email');

    if (!content) {
      throw new AppError('Content not found', 404);
    }

    // Check access permissions
    await this.checkContentAccess(content, userId, userType);

    // Track access
    await this.trackContentAccess(contentId, userId, 'view');

    // Get user-specific access data
    const userAccess = await ContentAccess.findOne({
      contentId: content._id,
      userId
    });

    return {
      ...content.toObject(),
      userAccess: userAccess?.toObject() || undefined
    } as unknown as ContentResponse;
  }

  /**
   * Get content list with filters and pagination
   */
  async getContentList(filters: ContentQuery, userId: string, userType?: string): Promise<ContentListResponse> {
    const { page = 1, limit = 12, ...filterParams } = filters;
    const skip = (page - 1) * limit;

    // Build query based on user type and permissions
    const query: any = { status: 'active' };

    if (userType === 'student') {
      // Students can only see content assigned to them or public content
      query.$or = [
        { isPublic: true },
        { assignedTo: { $in: await this.getStudentBatches(userId) } }
      ];
    } else if (userType === 'teacher') {
      // Teachers can see their own content, shared content, and public content
      query.$or = [
        { isPublic: true },
        { uploadedBy: userId },
        { sharedWith: userId }
      ];
    }
    // Admins can see all content

    // Apply filters
    if (filterParams.search) {
      query.$text = { $search: filterParams.search };
    }
    if (filterParams.subjectId) query.subjectId = filterParams.subjectId;
    if (filterParams.type) query.type = filterParams.type;
    if (filterParams.grade) query.grade = filterParams.grade;
    if (filterParams.tags && filterParams.tags.length > 0) {
      query.tags = { $in: filterParams.tags };
    }
    if (filterParams.dateFrom || filterParams.dateTo) {
      query.createdAt = {};
      if (filterParams.dateFrom) query.createdAt.$gte = new Date(filterParams.dateFrom);
      if (filterParams.dateTo) query.createdAt.$lte = new Date(filterParams.dateTo);
    }

    // Build sort
    const sort: any = {};
    if (filterParams.sortBy) {
      sort[filterParams.sortBy] = filterParams.sortOrder === 'desc' ? -1 : 1;
    } else {
      sort.createdAt = -1;
    }

    const [contents, total] = await Promise.all([
      Content.find(query)
        .populate('authorId', 'name email')
        .populate('subjectId', 'name')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Content.countDocuments(query)
    ]);

    // Get user access data for each content
    const contentIds = contents.map(c => c._id);
    const userAccess = await ContentAccess.find({
      contentId: { $in: contentIds },
      userId
    }).lean();

    const accessMap = new Map(userAccess.map(acc => [acc.contentId.toString(), acc]));

    const contentsWithAccess = contents.map(content => ({
      ...content,
      userAccess: accessMap.get(content._id.toString()) || undefined
    })) as unknown as ContentResponse[];

    return {
      contents: contentsWithAccess,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      filters: {
        applied: filterParams as any,
        available: {
          subjects: [],
          types: [],
          difficulties: [],
          languages: [],
          grades: [],
          tags: []
        }
      }
    };
  }

  /**
   * Update content
   */
  async updateContent(contentId: string, updateData: ContentUpdate, userId: string): Promise<ContentResponse> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const content = await Content.findById(contentId);
      if (!content) {
        throw new AppError('Content not found', 404);
      }

      // Check permissions
      if (content.uploadedBy.toString() !== userId && !(await this.isAdmin(userId))) {
        throw new AppError('Insufficient permissions', 403);
      }

      const beforeData = content.toObject();

      // Handle file replacement
      if (updateData.file) {
        // Archive current version
        const currentVersion = await ContentVersion.findOne({
          contentId: content._id,
          isLatestVersion: true
        });

        if (currentVersion) {
          currentVersion.isLatestVersion = false;
          await currentVersion.save({ session });
        }

        // Upload new file
        const uploadResult = await uploadToS3(updateData.file, content.type);
        
        // Delete old file from S3
        if (content.fileKey) {
          await deleteFromS3(content.fileKey);
        }

        // Update content with new file info
        content.fileUrl = uploadResult.url;
        content.fileKey = uploadResult.key;
        content.fileName = updateData.fileName || content.fileName;
        content.fileSize = updateData.fileSize || content.fileSize;
        content.mimeType = updateData.mimeType || content.mimeType;
        content.duration = uploadResult.duration;

        // Generate new thumbnail for videos
        if (content.type === 'video' && updateData.file) {
          const thumbnailBuffer = await generateVideoThumbnail(updateData.file.buffer, updateData.file.mimetype);
          const thumbnailUploadResult = await uploadToS3(
            { ...updateData.file, buffer: thumbnailBuffer },
            'image'
          );
          content.metadata.thumbnailUrl = thumbnailUploadResult.url;
        }

        // Create new version
        const newVersion = new ContentVersion({
          contentId: content._id,
          version: content.version + 1,
          isLatestVersion: true,
          fileUrl: uploadResult.url,
          fileKey: uploadResult.key,
          fileName: content.fileName,
          fileSize: content.fileSize,
          mimeType: content.mimeType,
          duration: uploadResult.duration,
          title: content.title,
          description: content.description,
          subjectId: content.subjectId,
          topic: content.topic,
          subtopic: content.subtopic,
          grade: content.grade,
          tags: content.tags,
          changelog: 'File updated',
          uploadedBy: userId,
          processingStatus: 'completed',
          thumbnailUrl: content.metadata.thumbnailUrl
        });

        await newVersion.save({ session });
        content.version += 1;
        if (currentVersion && currentVersion._id) {
          content.previousVersions.push(currentVersion._id);
        }
      }

      // Update other fields
      Object.assign(content, updateData);
      await content.save({ session });

      // Create audit log
      await this.createAuditLog({
        actorId: userId,
        action: 'update',
        contentId: content._id,
        resourceType: 'content',
        before: beforeData,
        after: content.toObject(),
        changes: this.getChanges(beforeData, content.toObject())
      }, session);

      await session.commitTransaction();

      return await this.getContentById(contentId, userId);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Delete content (soft delete)
   */
  async deleteContent(contentId: string, userId: string): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const content = await Content.findById(contentId);
      if (!content) {
        throw new AppError('Content not found', 404);
      }

      // Check permissions
      if (content.uploadedBy.toString() !== userId && !(await this.isAdmin(userId))) {
        throw new AppError('Insufficient permissions', 403);
      }

      const beforeData = content.toObject();

      // Soft delete
      content.status = 'archived';
      await content.save({ session });

      // Create audit log
      await this.createAuditLog({
        actorId: userId,
        action: 'archive',
        contentId: content._id,
        resourceType: 'content',
        before: beforeData,
        after: content.toObject(),
        metadata: {
          reason: 'Content archived'
        }
      }, session);

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // ============================================================================
  // CONTENT ACCESS OPERATIONS
  // ============================================================================

  /**
   * Handle content access actions (favorite, rate, progress)
   */
  async handleContentAccess(contentId: string, userId: string, action: string, data?: any): Promise<void> {
    const content = await Content.findById(contentId);
    if (!content) {
      throw new AppError('Content not found', 404);
    }

    // Check access permissions
    await this.checkContentAccess(content, userId);

    let userAccess = await ContentAccess.findOne({
      contentId: content._id,
      userId
    });

    if (!userAccess) {
      userAccess = new ContentAccess({
        contentId: content._id,
        userId,
        userType: await this.getUserType(userId)
      });
    }

    switch (action) {
      case 'favorite':
        userAccess.isFavorited = !userAccess.isFavorited;
        if (userAccess.isFavorited) {
          content.stats.favorites += 1;
        } else {
          content.stats.favorites = Math.max(0, content.stats.favorites - 1);
        }
        break;

      case 'rate':
        const oldRating = userAccess.rating || 0;
        const newRating = data.rating;
        userAccess.rating = newRating;
        
        // Update content average rating
        const totalRatings = content.stats.totalRatings;
        const currentTotal = content.stats.averageRating * totalRatings;
        const newTotal = currentTotal - oldRating + newRating;
        content.stats.averageRating = newTotal / totalRatings;
        break;

      case 'progress':
        userAccess.progress = {
          ...userAccess.progress,
          ...data.progress,
          lastUpdated: new Date()
        };
        break;

      case 'download':
        userAccess.downloadCount += 1;
        content.stats.downloads += 1;
        break;

      default:
        throw new AppError('Invalid action', 400);
    }

    await Promise.all([
      userAccess.save(),
      content.save()
    ]);

    // Track access
    await this.trackContentAccess(contentId, userId, action);
  }

  /**
   * Track content access for analytics
   */
  async trackContentAccess(contentId: string, userId: string, action: string): Promise<void> {
    const content = await Content.findById(contentId);
    if (!content) return;

    // Update content stats
    if (action === 'view') {
      content.stats.views += 1;
    } else if (action === 'download') {
      content.stats.downloads += 1;
    }

    await content.save();

    // Create audit log for tracking
    await this.createAuditLog({
      actorId: userId,
      action: action as any,
      contentId: content._id,
      resourceType: 'access'
    });
  }

  // ============================================================================
  // CONTENT ASSIGNMENT & SHARING
  // ============================================================================

  /**
   * Assign content to batches
   */
  async assignContentToBatches(assignmentRequest: ContentAssignmentRequest, userId: string): Promise<void> {
    const { contentId, batchIds } = assignmentRequest;

    const content = await Content.findById(contentId);
    if (!content) {
      throw new AppError('Content not found', 404);
    }

    // Check permissions
    if (content.uploadedBy.toString() !== userId && !(await this.isAdmin(userId))) {
      throw new AppError('Insufficient permissions', 403);
    }

    // Determine assignment type (limited to 'batch')
    const assignmentType: 'batch' = 'batch';

    // Create or update assignment
    const assignment = new ContentAssignment({
      contentId,
      assignedBy: userId,
      assignmentType,
      batchIds
    });

    await assignment.save();

    // Update content assignedTo field
    if (batchIds && batchIds.length > 0) {
      content.assignedTo = [...new Set([...(content.assignedTo as any[]), ...batchIds])] as any;
      await content.save();
    }

    // Create audit log
    await this.createAuditLog({
      actorId: userId,
      action: 'assign',
      contentId: content._id,
      resourceType: 'assignment',
      metadata: { batchIds }
    });
  }

  /**
   * Share content with teachers
   */
  async shareContentWithTeachers(sharingRequest: ContentSharingRequest, userId: string): Promise<void> {
    const { contentId, teacherIds, ...sharingData } = sharingRequest;

    const content = await Content.findById(contentId);
    if (!content) {
      throw new AppError('Content not found', 404);
    }

    // Check permissions
    if (content.uploadedBy.toString() !== userId && !(await this.isAdmin(userId))) {
      throw new AppError('Insufficient permissions', 403);
    }

    // Update content sharedWith field
    content.sharedWith = [...new Set([...(content.sharedWith as any[]), ...teacherIds])] as any;
    await content.save();

    // Create audit log
    await this.createAuditLog({
      actorId: userId,
      action: 'share',
      contentId: content._id,
      resourceType: 'content',
      metadata: { teacherIds }
    });
  }

  // ============================================================================
  // SEARCH OPERATIONS
  // ============================================================================

  /**
   * Search content
   */
  async searchContent(searchRequest: ContentSearchRequest, userId: string, userType?: string): Promise<ContentListResponse> {
    const { query, filters, page = 1, limit = 12 } = searchRequest;
    const skip = (page - 1) * limit;

    // Build search query
    const searchQuery: any = {
      $text: { $search: query },
      status: 'active'
    };

    // Apply user permissions
    if (userType === 'student') {
      searchQuery.$or = [
        { isPublic: true },
        { assignedTo: { $in: await this.getStudentBatches(userId) } }
      ];
    } else if (userType === 'teacher') {
      searchQuery.$or = [
        { isPublic: true },
        { uploadedBy: userId },
        { sharedWith: userId }
      ];
    }

    // Apply filters
    if (filters) {
      Object.assign(searchQuery, filters);
    }

    const [contents, total] = await Promise.all([
      Content.find(searchQuery)
        .populate('authorId', 'name email')
        .populate('subjectId', 'name')
        .sort({ score: { $meta: 'textScore' } })
        .skip(skip)
        .limit(limit)
        .lean(),
      Content.countDocuments(searchQuery)
    ]);

    // Get user access data
    const contentIds = contents.map(c => c._id);
    const userAccess = await ContentAccess.find({
      contentId: { $in: contentIds },
      userId
    }).lean();

    const accessMap = new Map(userAccess.map(acc => [acc.contentId.toString(), acc]));

    const contentsWithAccess = contents.map(content => ({
      ...content,
      userAccess: accessMap.get(content._id.toString()) || undefined
    })) as unknown as ContentResponse[];

    return {
      contents: contentsWithAccess,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      filters: {
        applied: (searchRequest.filters || {}) as any,
        available: {
          subjects: [],
          types: [],
          difficulties: [],
          languages: [],
          grades: [],
          tags: []
        }
      }
    };
  }

  /**
   * Get search suggestions
   */
  async getSearchSuggestions(query: string, userId: string, userType?: string): Promise<string[]> {
    const suggestions: string[] = [];

    // Get subject suggestions
    const subjects = await Content.distinct('subjectId', {
      $text: { $search: query },
      status: 'active'
    });
    suggestions.push(...subjects.map(s => `subject:${s}`));

    // Get topic suggestions
    const topics = await Content.distinct('topic', {
      $text: { $search: query },
      status: 'active'
    });
    suggestions.push(...topics.filter(t => t));

    // Get tag suggestions
    const tags = await Content.distinct('tags', {
      $text: { $search: query },
      status: 'active'
    });
    suggestions.push(...tags);

    return suggestions.slice(0, 10);
  }

  // ============================================================================
  // ANALYTICS & STATISTICS
  // ============================================================================

  /**
   * Get content statistics
   */
  async getContentStats(userId: string, userType?: string): Promise<any> {
    const baseQuery: any = { status: 'active' };

    // Apply user permissions
    if (userType === 'student') {
      baseQuery.$or = [
        { isPublic: true },
        { assignedTo: { $in: await this.getStudentBatches(userId) } }
      ];
    } else if (userType === 'teacher') {
      baseQuery.$or = [
        { isPublic: true },
        { uploadedBy: userId },
        { sharedWith: userId }
      ];
    }

    const [
      totalContent,
      totalViews,
      totalDownloads,
      totalFavorites,
      contentByType,
      topContent,
      recentUploads
    ] = await Promise.all([
      Content.countDocuments(baseQuery),
      Content.aggregate([
        { $match: baseQuery },
        { $group: { _id: null, total: { $sum: '$stats.views' } } }
      ]),
      Content.aggregate([
        { $match: baseQuery },
        { $group: { _id: null, total: { $sum: '$stats.downloads' } } }
      ]),
      Content.aggregate([
        { $match: baseQuery },
        { $group: { _id: null, total: { $sum: '$stats.favorites' } } }
      ]),
      Content.aggregate([
        { $match: baseQuery },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]),
      Content.find(baseQuery)
        .sort({ 'stats.views': -1 })
        .limit(10)
        .populate('authorId', 'name')
        .populate('subjectId', 'name')
        .lean(),
      Content.find(baseQuery)
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('authorId', 'name')
        .populate('subjectId', 'name')
        .lean()
    ]);

    return {
      totalContent,
      totalViews: totalViews[0]?.total || 0,
      totalDownloads: totalDownloads[0]?.total || 0,
      totalFavorites: totalFavorites[0]?.total || 0,
      contentByType: contentByType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {} as Record<string, number>),
      topContent: topContent as unknown as ContentResponse[],
      recentUploads: recentUploads as unknown as ContentResponse[]
    };
  }

  /**
   * Get content analytics
   */
  async getContentAnalytics(analyticsRequest: ContentAnalyticsRequest, userId: string): Promise<any> {
    const { dateFrom, dateTo, groupBy = 'day' } = analyticsRequest;

    const baseQuery: any = { status: 'active' };
    if (dateFrom || dateTo) {
      baseQuery.createdAt = {};
      if (dateFrom) baseQuery.createdAt.$gte = new Date(dateFrom);
      if (dateTo) baseQuery.createdAt.$lte = new Date(dateTo);
    }

    // Apply additional filters if needed

    // Apply user permissions
    const userType = await this.getUserType(userId);
    if (userType === 'student') {
      baseQuery.$or = [
        { isPublic: true },
        { assignedTo: { $in: await this.getStudentBatches(userId) } }
      ];
    } else if (userType === 'teacher') {
      baseQuery.$or = [
        { isPublic: true },
        { uploadedBy: userId },
        { sharedWith: userId }
      ];
    }

    const pipeline = [
      { $match: baseQuery },
      {
        $group: {
          _id: {
            $dateToString: {
              format: groupBy === 'day' ? '%Y-%m-%d' : '%Y-%m',
              date: '$createdAt'
            }
          },
          count: { $sum: 1 },
          views: { $sum: '$stats.views' },
          downloads: { $sum: '$stats.downloads' },
          favorites: { $sum: '$stats.favorites' }
        }
      },
      { $sort: { _id: 1 } }
    ];

    const analytics = await Content.aggregate(pipeline as any);

    return {
      analytics,
      dateRange: { dateFrom, dateTo },
      groupBy
    };
  }

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  /**
   * Bulk delete content
   */
  async bulkDeleteContent(bulkRequest: BulkOperationRequest, userId: string): Promise<void> {
    const { ids } = bulkRequest;

    // Check permissions (only admin can bulk delete)
    if (!(await this.isAdmin(userId))) {
      throw new AppError('Insufficient permissions', 403);
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const contents = await Content.find({ _id: { $in: ids } });
      
      for (const content of contents) {
        const beforeData = content.toObject();
        content.status = 'archived';
        await content.save({ session });

        // Create audit log for each content
        await this.createAuditLog({
          actorId: userId,
          action: 'archive',
          contentId: content._id,
          resourceType: 'content',
          before: beforeData,
          after: content.toObject(),
          metadata: { reason: 'Bulk archive operation' }
        }, session);
      }

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Bulk update content status
   */
  async bulkUpdateContentStatus(bulkRequest: BulkOperationRequest, userId: string): Promise<void> {
    const { ids, status } = bulkRequest;

    // Check permissions
    if (!(await this.isAdmin(userId))) {
      throw new AppError('Insufficient permissions', 403);
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const contents = await Content.find({ _id: { $in: ids } });
      
      for (const content of contents) {
        const beforeData = content.toObject();
        if (typeof status === 'string') {
          (content as any).status = status as any;
        }
        await content.save({ session });

        // Create audit log for each content
        await this.createAuditLog({
          actorId: userId,
          action: 'update',
          contentId: content._id,
          resourceType: 'content',
          before: beforeData,
          after: content.toObject(),
          changes: [{ field: 'status', oldValue: beforeData.status, newValue: status }],
          metadata: { reason: 'Bulk status update' }
        }, session);
      }

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // ============================================================================
  // VERSION MANAGEMENT
  // ============================================================================

  /**
   * Get content version history
   */
  async getContentVersions(contentId: string, userId: string): Promise<any[]> {
    const content = await Content.findById(contentId);
    if (!content) {
      throw new AppError('Content not found', 404);
    }

    // Check permissions
    await this.checkContentAccess(content, userId);

    const versions = await ContentVersion.find({ contentId })
      .populate('uploadedBy', 'name email')
      .sort({ version: -1 })
      .lean();

    return versions;
  }

  /**
   * Restore content version
   */
  async restoreContentVersion(contentId: string, versionNumber: number, userId: string): Promise<ContentResponse> {
    const content = await Content.findById(contentId);
    if (!content) {
      throw new AppError('Content not found', 404);
    }

    // Check permissions
    if (content.uploadedBy.toString() !== userId && !(await this.isAdmin(userId))) {
      throw new AppError('Insufficient permissions', 403);
    }

    const version = await ContentVersion.findOne({
      contentId: content._id,
      version: versionNumber
    });

    if (!version) {
      throw new AppError('Version not found', 404);
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const beforeData = content.toObject();

      // Archive current version
      const currentVersion = await ContentVersion.findOne({
        contentId: content._id,
        isLatestVersion: true
      });

      if (currentVersion) {
        currentVersion.isLatestVersion = false;
        await currentVersion.save({ session });
      }

      // Restore version data
      content.fileUrl = version.fileUrl;
      content.fileKey = version.fileKey;
      content.fileName = version.fileName;
      content.fileSize = version.fileSize;
      content.mimeType = version.mimeType;
      content.duration = version.duration;
      content.title = version.title;
      content.description = version.description;
      content.subjectId = version.subjectId;
      content.topic = version.topic;
      content.subtopic = version.subtopic;
      content.grade = version.grade;
      content.tags = version.tags;
      content.metadata.thumbnailUrl = version.thumbnailUrl;

      // Create new version entry
      const newVersion = new ContentVersion({
        contentId: content._id,
        version: content.version + 1,
        isLatestVersion: true,
        fileUrl: version.fileUrl,
        fileKey: version.fileKey,
        fileName: version.fileName,
        fileSize: version.fileSize,
        mimeType: version.mimeType,
        duration: version.duration,
        title: version.title,
        description: version.description,
        subjectId: version.subjectId,
        topic: version.topic,
        subtopic: version.subtopic,
        grade: version.grade,
        tags: version.tags,
        changelog: `Restored from version ${versionNumber}`,
        uploadedBy: userId,
        processingStatus: 'completed',
        thumbnailUrl: version.thumbnailUrl
      });

      await newVersion.save({ session });
      content.version += 1;
      await content.save({ session });

      // Create audit log
      await this.createAuditLog({
        actorId: userId,
        action: 'update',
        contentId: content._id,
        resourceType: 'content',
        before: beforeData,
        after: content.toObject(),
        changes: [{ field: 'version', oldValue: beforeData.version, newValue: content.version }],
        metadata: {
          reason: `Restored from version ${versionNumber}`
        }
      }, session);

      await session.commitTransaction();

      return await this.getContentById(contentId, userId);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // ============================================================================
  // CSV BATCH IMPORT
  // ============================================================================

  /**
   * Import content from CSV
   */
  async importContentFromCSV(filePath: string, userId: string): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    return new Promise((resolve, reject) => {
      const contents: any[] = [];

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row: any) => {
          contents.push(row);
        })
        .on('end', async () => {
          try {
            for (const row of contents) {
              try {
                // Validate required fields
                if (!row.title || !row.subjectId || !row.type) {
                  results.failed++;
                  results.errors.push(`Row ${contents.indexOf(row) + 1}: Missing required fields`);
                  continue;
                }

                // Create content data
                const contentData: any = {
                  title: row.title,
                  description: row.description || '',
                  type: row.type as any,
                  subjectId: row.subjectId,
                  topic: row.topic || '',
                  subtopic: row.subtopic || '',
                  grade: row.grade || '',
                  tags: row.tags ? row.tags.split(',').map((t: string) => t.trim()) : [],
                  isPublic: row.isPublic === 'true',
                  file: {
                    originalname: row.fileName || row.title,
                    buffer: Buffer.from(''),
                    size: parseInt(row.fileSize) || 0,
                    mimetype: row.mimeType || 'application/octet-stream'
                  }
                };

                await this.createContent(contentData, userId);
                results.success++;
              } catch (error: any) {
                results.failed++;
                results.errors.push(`Row ${contents.indexOf(row) + 1}: ${error.message}`);
              }
            }

            resolve(results);
          } catch (error) {
            reject(error);
          }
        })
        .on('error', reject);
    });
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Check content access permissions
   */
  private async checkContentAccess(content: any, userId: string, userType?: string): Promise<void> {
    if (!userType) {
      userType = await this.getUserType(userId);
    }

    if (userType === 'admin') return;

    if (userType === 'student') {
      const studentBatches = await this.getStudentBatches(userId);
      const hasAccess = content.isPublic ||
        (Array.isArray(content.assignedTo) && content.assignedTo.some((batchId: any) =>
          studentBatches.includes(batchId?.toString?.() ?? String(batchId))
        ));
      
      if (!hasAccess) {
        throw new AppError('Access denied', 403);
      }
    } else if (userType === 'teacher') {
      const hasAccess = content.isPublic || 
        content.uploadedBy.toString() === userId ||
        content.sharedWith.some((teacherId: any) => teacherId.toString() === userId);
      
      if (!hasAccess) {
        throw new AppError('Access denied', 403);
      }
    }
  }

  /**
   * Get student batches
   */
  private async getStudentBatches(studentId: string): Promise<string[]> {
    // This would typically query the student's batch assignments
    // For now, returning empty array as placeholder
    return [];
  }

  /**
   * Get user type
   */
  private async getUserType(userId: string): Promise<string> {
    // This would typically query the user's role
    // For now, returning 'student' as placeholder
    return 'student';
  }

  /**
   * Check if user is admin
   */
  private async isAdmin(userId: string): Promise<boolean> {
    // This would typically check the user's role
    // For now, returning false as placeholder
    return false;
  }

  /**
   * Create audit log
   */
  private async createAuditLog(auditData: any, session?: mongoose.ClientSession): Promise<void> {
    const audit = new ContentAudit({
      ...auditData,
      userAgent: auditData.userAgent || 'API',
      ipAddress: auditData.ipAddress || '127.0.0.1'
    });

    if (session) {
      await audit.save({ session });
    } else {
      await audit.save();
    }
  }

  /**
   * Get changes between two objects
   */
  private getChanges(before: any, after: any): Array<{ field: string; oldValue: any; newValue: any }> {
    const changes: Array<{ field: string; oldValue: any; newValue: any }> = [];
    
    for (const key in after) {
      if (before[key] !== after[key]) {
        changes.push({
          field: key,
          oldValue: before[key],
          newValue: after[key]
        });
      }
    }
    
    return changes;
  }
}

export const contentService = new ContentService();
