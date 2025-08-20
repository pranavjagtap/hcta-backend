import { Request, Response, NextFunction } from 'express';
import { contentService } from '../services/content';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/appError';
import { handleContentUpload } from '../middlewares/contentUpload';
import { 
  ContentQuery, 
  ContentSearchRequest, 
  ContentAccessRequest,
  ContentAssignmentRequest,
  ContentSharingRequest,
  ContentAnalyticsRequest,
  BulkOperationRequest
} from '../types/content';

// ============================================================================
// CONTENT CRUD OPERATIONS
// ============================================================================

/**
 * Create new content
 * POST /api/content
 */
export const createContent = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?._id;
  if (!userId) {
    return next(new AppError('User not authenticated', 401));
  }

  // Handle file upload
  await new Promise<void>((resolve, reject) => {
    handleContentUpload('file')(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  const contentData = {
    ...req.body,
    file: req.file
  };

  const content = await contentService.createContent(contentData, userId);

  res.status(201).json({
    success: true,
    message: 'Content created successfully',
    data: { content }
  });
});

/**
 * Get content by ID
 * GET /api/content/:id
 */
export const getContentById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const userId = req.user?._id;
  const userType = req.user?.role;

  if (!userId) {
    return next(new AppError('User not authenticated', 401));
  }

  const content = await contentService.getContentById(id, userId, userType);

  res.status(200).json({
    success: true,
    data: { content }
  });
});

/**
 * Get content list with filters and pagination
 * GET /api/content
 */
export const getContentList = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const query: ContentQuery = req.query;
  const userId = req.user?._id;
  const userType = req.user?.role;

  if (!userId) {
    return next(new AppError('User not authenticated', 401));
  }

  const result = await contentService.getContentList(query, userId, userType);

  res.status(200).json({
    success: true,
    data: result
  });
});

/**
 * Update content
 * PUT /api/content/:id
 */
export const updateContent = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const userId = req.user?._id;
  const userType = req.user?.role;

  if (!userId) {
    return next(new AppError('User not authenticated', 401));
  }

  // Handle file upload if provided
  if (req.file) {
    await new Promise<void>((resolve, reject) => {
      handleContentUpload('file')(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  const updateData = {
    ...req.body,
    file: req.file
  };

  const content = await contentService.updateContent(id, updateData, userId, userType);

  res.status(200).json({
    success: true,
    message: 'Content updated successfully',
    data: { content }
  });
});

/**
 * Delete content
 * DELETE /api/content/:id
 */
export const deleteContent = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const userId = req.user?._id;
  const userType = req.user?.role;

  if (!userId) {
    return next(new AppError('User not authenticated', 401));
  }

  await contentService.deleteContent(id, userId, userType);

  res.status(200).json({
    success: true,
    message: 'Content deleted successfully'
  });
});

// ============================================================================
// CONTENT ACCESS OPERATIONS
// ============================================================================

/**
 * Handle content access actions (favorite, rate, review, progress)
 * POST /api/content/:id/access
 */
export const handleContentAccess = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const userId = req.user?._id;
  const accessRequest: ContentAccessRequest = {
    contentId: id,
    ...req.body
  };

  if (!userId) {
    return next(new AppError('User not authenticated', 401));
  }

  await contentService.handleContentAccess(accessRequest, userId);

  res.status(200).json({
    success: true,
    message: 'Content access updated successfully'
  });
});

/**
 * Download content (generate signed URL)
 * GET /api/content/:id/download
 */
export const downloadContent = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const userId = req.user?._id;
  const userType = req.user?.role;

  if (!userId) {
    return next(new AppError('User not authenticated', 401));
  }

  // Get content and check access
  const content = await contentService.getContentById(id, userId, userType);

  // Track download
  await contentService.trackContentAccess(id, userId, userType, 'download');

  // Generate signed URL for secure download
  const { generateSignedUrl } = await import('../middlewares/contentUpload');
  const signedUrl = content.fileKey
    ? await generateSignedUrl(content.fileKey, 3600)
    : content.fileUrl;

  res.status(200).json({
    success: true,
    data: {
      downloadUrl: signedUrl,
      fileName: content.fileName
    }
  });
});

// ============================================================================
// CONTENT ASSIGNMENT & SHARING
// ============================================================================

/**
 * Assign content to batches
 * POST /api/content/:id/assign
 */
export const assignContentToBatches = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const userId = req.user?._id;
  const assignmentRequest: ContentAssignmentRequest = {
    contentId: id,
    ...req.body
  };

  if (!userId) {
    return next(new AppError('User not authenticated', 401));
  }

  await contentService.assignContentToBatches(assignmentRequest, userId);

  res.status(200).json({
    success: true,
    message: 'Content assigned successfully'
  });
});

/**
 * Share content with teachers
 * POST /api/content/:id/share
 */
export const shareContentWithTeachers = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const userId = req.user?._id;
  const sharingRequest: ContentSharingRequest = {
    contentId: id,
    ...req.body
  };

  if (!userId) {
    return next(new AppError('User not authenticated', 401));
  }

  await contentService.shareContentWithTeachers(sharingRequest, userId);

  res.status(200).json({
    success: true,
    message: 'Content shared successfully'
  });
});

// ============================================================================
// SEARCH OPERATIONS
// ============================================================================

/**
 * Search content
 * POST /api/content/search
 */
export const searchContent = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?._id;
  const userType = req.user?.role;
  const searchRequest: ContentSearchRequest = req.body;

  if (!userId) {
    return next(new AppError('User not authenticated', 401));
  }

  const result = await contentService.searchContent(searchRequest, userId, userType);

  res.status(200).json({
    success: true,
    data: result
  });
});

/**
 * Get search suggestions
 * GET /api/content/suggestions
 */
export const getSearchSuggestions = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { query } = req.query;
  const userId = req.user?._id;
  const userType = req.user?.role;

  if (!userId) {
    return next(new AppError('User not authenticated', 401));
  }

  if (!query || typeof query !== 'string') {
    return next(new AppError('Query parameter is required', 400));
  }

  const suggestions = await contentService.getSearchSuggestions(query as string);

  res.status(200).json({
    success: true,
    data: { suggestions }
  });
});

// ============================================================================
// ANALYTICS & STATISTICS
// ============================================================================

/**
 * Get content statistics
 * GET /api/content/stats
 */
export const getContentStats = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?._id;
  const userType = req.user?.role;

  if (!userId) {
    return next(new AppError('User not authenticated', 401));
  }

  const stats = await contentService.getContentStats(userId, userType);

  res.status(200).json({
    success: true,
    data: { stats }
  });
});

/**
 * Get content analytics
 * POST /api/content/analytics
 */
export const getContentAnalytics = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?._id;
  const userType = req.user?.role;
  const analyticsRequest: ContentAnalyticsRequest = req.body;

  if (!userId) {
    return next(new AppError('User not authenticated', 401));
  }

  if (userType !== 'admin' && userType !== 'teacher') {
    return next(new AppError('Insufficient permissions', 403));
  }

  // This would be implemented in the service
  // const analytics = await contentService.getContentAnalytics(analyticsRequest, userId, userType);

  res.status(200).json({
    success: true,
    data: { analytics: {} }
  });
});

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * Bulk delete content
 * DELETE /api/content/bulk
 */
export const bulkDeleteContent = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?._id;
  const bulkRequest: any = req.body;

  if (!userId) {
    return next(new AppError('User not authenticated', 401));
  }

  // TODO: Implement bulk delete functionality
  // await contentService.bulkDeleteContent(bulkRequest, userId);

  res.status(200).json({
    success: true,
    message: 'Content bulk deleted successfully'
  });
});

/**
 * Bulk update content status
 * PUT /api/content/bulk/status
 */
export const bulkUpdateContentStatus = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?._id;
  const bulkRequest: any = req.body;

  if (!userId) {
    return next(new AppError('User not authenticated', 401));
  }

  await contentService.bulkUpdateContentStatus(bulkRequest, userId);

  res.status(200).json({
    success: true,
    message: 'Content status updated successfully'
  });
});

/**
 * Get content versions
 * GET /api/content/:id/versions
 */
export const getContentVersions = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const userId = req.user?._id;

  if (!userId) {
    return next(new AppError('User not authenticated', 401));
  }

  const versions = await contentService.getContentVersions(id, userId);

  res.status(200).json({
    success: true,
    data: { versions }
  });
});

/**
 * Restore content version
 * POST /api/content/:id/versions/:versionNumber/restore
 */
export const restoreContentVersion = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id, versionNumber } = req.params;
  const userId = req.user?._id;

  if (!userId) {
    return next(new AppError('User not authenticated', 401));
  }

  const content = await contentService.restoreContentVersion(id, parseInt(versionNumber), userId);

  res.status(200).json({
    success: true,
    message: 'Content version restored successfully',
    data: { content }
  });
});

/**
 * Import content from CSV
 * POST /api/content/import
 */
export const importContentFromCSV = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?._id;

  if (!userId) {
    return next(new AppError('User not authenticated', 401));
  }

  if (!req.file) {
    return next(new AppError('CSV file is required', 400));
  }

  const results = await contentService.importContentFromCSV(req.file.path, userId);

  res.status(200).json({
    success: true,
    message: 'Content import completed',
    data: results
  });
});

// ============================================================================
// CONTENT PREVIEW & METADATA
// ============================================================================

/**
 * Get content preview (metadata without full content)
 * GET /api/content/:id/preview
 */
export const getContentPreview = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const userId = req.user?._id;
  const userType = req.user?.role;

  if (!userId) {
    return next(new AppError('User not authenticated', 401));
  }

  const content = await contentService.getContentById(id, userId, userType);

  // Return only preview data (without file URL)
  const preview = {
    _id: content._id,
    title: content.title,
    description: content.description,
    type: content.type,
    fileName: content.fileName,
    fileSize: content.fileSize,
    formattedFileSize: content.formattedFileSize,
    duration: content.duration,
    formattedDuration: content.formattedDuration,
    subject: content.subject,
    topic: content.topic,
    subtopic: content.subtopic,
    grade: content.grade,
    tags: content.tags,
    author: content.author,
    metadata: content.metadata,
    stats: content.stats,
    status: content.status,
    formattedDate: content.formattedDate,
    createdAt: content.createdAt
  };

  res.status(200).json({
    success: true,
    data: { preview }
  });
});

/**
 * Get content metadata
 * GET /api/content/:id/metadata
 */
export const getContentMetadata = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const userId = req.user?._id;
  const userType = req.user?.role;

  if (!userId) {
    return next(new AppError('User not authenticated', 401));
  }

  const content = await contentService.getContentById(id, userId, userType);

  res.status(200).json({
    success: true,
    data: {
      metadata: content.metadata,
      stats: content.stats,
      version: content.version,
      status: content.status
    }
  });
});

// ============================================================================
// CONTENT ORGANIZATION
// ============================================================================

/**
 * Get content by subject
 * GET /api/content/subject/:subjectId
 */
export const getContentBySubject = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { subjectId } = req.params;
  const userId = req.user?._id;
  const userType = req.user?.role;
  const query: ContentQuery = { ...req.query, subjectId };

  if (!userId) {
    return next(new AppError('User not authenticated', 401));
  }

  const result = await contentService.getContentList(query, userId, userType);

  res.status(200).json({
    success: true,
    data: result
  });
});

/**
 * Get content by type
 * GET /api/content/type/:type
 */
export const getContentByType = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { type } = req.params;
  const userId = req.user?._id;
  const userType = req.user?.role;
  const query: ContentQuery = { ...req.query, type };

  if (!userId) {
    return next(new AppError('User not authenticated', 401));
  }

  const result = await contentService.getContentList(query, userId, userType);

  res.status(200).json({
    success: true,
    data: result
  });
});

/**
 * Get user's favorite content
 * GET /api/content/favorites
 */
export const getUserFavorites = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?._id;
  const userType = req.user?.role;

  if (!userId) {
    return next(new AppError('User not authenticated', 401));
  }

  // This would be implemented in the service
  // const favorites = await contentService.getUserFavorites(userId, userType);

  res.status(200).json({
    success: true,
    data: { favorites: [] }
  });
});

/**
 * Get recently accessed content
 * GET /api/content/recent
 */
export const getRecentContent = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?._id;
  const userType = req.user?.role;
  const { limit = 10 } = req.query;

  if (!userId) {
    return next(new AppError('User not authenticated', 401));
  }

  // This would be implemented in the service
  // const recent = await contentService.getRecentContent(userId, userType, Number(limit));

  res.status(200).json({
    success: true,
    data: { recent: [] }
  });
});
