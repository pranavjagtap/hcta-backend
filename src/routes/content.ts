import express from 'express';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import {
  createContent,
  getContentById,
  getContentList,
  updateContent,
  deleteContent,
  handleContentAccess,
  downloadContent,
  assignContentToBatches,
  shareContentWithTeachers,
  searchContent,
  getSearchSuggestions,
  getContentStats,
  getContentAnalytics,
  bulkDeleteContent,
  bulkUpdateContentStatus,
  getContentPreview,
  getContentMetadata,
  getContentBySubject,
  getContentByType,
  getUserFavorites,
  getRecentContent,
  getContentVersions,
  restoreContentVersion,
  importContentFromCSV
} from '../controllers/content';

const router = express.Router();

// ============================================================================
// AUTHENTICATION & AUTHORIZATION
// ============================================================================

// All routes require authentication
router.use(authenticate);

// ============================================================================
// CONTENT CRUD OPERATIONS
// ============================================================================

/**
 * @route   POST /api/content
 * @desc    Create new content
 * @access  Private (Teachers, Admins)
 */
router.post(
  '/',
  authorize(['teacher', 'admin']),
  createContent
);

/**
 * @route   GET /api/content/:id
 * @desc    Get content by ID
 * @access  Private (All authenticated users)
 */
router.get(
  '/:id',
  getContentById
);

/**
 * @route   GET /api/content
 * @desc    Get content list with filters and pagination
 * @access  Private (All authenticated users)
 */
router.get(
  '/',
  getContentList
);

/**
 * @route   PUT /api/content/:id
 * @desc    Update content
 * @access  Private (Content author, Admins)
 */
router.put(
  '/:id',
  updateContent
);

/**
 * @route   DELETE /api/content/:id
 * @desc    Delete content
 * @access  Private (Content author, Admins)
 */
router.delete(
  '/:id',
  deleteContent
);

// ============================================================================
// CONTENT ACCESS OPERATIONS
// ============================================================================

/**
 * @route   POST /api/content/:id/access
 * @desc    Handle content access actions (favorite, rate, review, progress)
 * @access  Private (All authenticated users)
 */
router.post(
  '/:id/access',
  handleContentAccess
);

/**
 * @route   GET /api/content/:id/download
 * @desc    Download content (generate signed URL)
 * @access  Private (All authenticated users with access)
 */
router.get(
  '/:id/download',
  downloadContent
);

// ============================================================================
// CONTENT ASSIGNMENT & SHARING
// ============================================================================

/**
 * @route   POST /api/content/:id/assign
 * @desc    Assign content to batches
 * @access  Private (Teachers, Admins)
 */
router.post(
  '/:id/assign',
  authorize(['teacher', 'admin']),
  assignContentToBatches
);

/**
 * @route   POST /api/content/:id/share
 * @desc    Share content with teachers
 * @access  Private (Teachers, Admins)
 */
router.post(
  '/:id/share',
  authorize(['teacher', 'admin']),
  shareContentWithTeachers
);

// ============================================================================
// SEARCH OPERATIONS
// ============================================================================

/**
 * @route   POST /api/content/search
 * @desc    Search content
 * @access  Private (All authenticated users)
 */
router.post(
  '/search',
  searchContent
);

/**
 * @route   GET /api/content/suggestions
 * @desc    Get search suggestions
 * @access  Private (All authenticated users)
 */
router.get(
  '/suggestions',
  getSearchSuggestions
);

// ============================================================================
// ANALYTICS & STATISTICS
// ============================================================================

/**
 * @route   GET /api/content/stats
 * @desc    Get content statistics
 * @access  Private (All authenticated users)
 */
router.get(
  '/stats',
  getContentStats
);

/**
 * @route   POST /api/content/analytics
 * @desc    Get content analytics
 * @access  Private (Teachers, Admins)
 */
router.post(
  '/analytics',
  authorize(['teacher', 'admin']),
  getContentAnalytics
);

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * @route   DELETE /api/content/bulk
 * @desc    Bulk delete content
 * @access  Private (Admins only)
 */
router.delete(
  '/bulk',
  authorize(['admin']),
  bulkDeleteContent
);

/**
 * @route   PUT /api/content/bulk/status
 * @desc    Bulk update content status
 * @access  Private (Admins only)
 */
router.put(
  '/bulk/status',
  authorize(['admin']),
  bulkUpdateContentStatus
);

// ============================================================================
// CONTENT PREVIEW & METADATA
// ============================================================================

/**
 * @route   GET /api/content/:id/preview
 * @desc    Get content preview (metadata without full content)
 * @access  Private (All authenticated users)
 */
router.get(
  '/:id/preview',
  getContentPreview
);

/**
 * @route   GET /api/content/:id/metadata
 * @desc    Get content metadata
 * @access  Private (All authenticated users)
 */
router.get(
  '/:id/metadata',
  getContentMetadata
);

// ============================================================================
// CONTENT ORGANIZATION
// ============================================================================

/**
 * @route   GET /api/content/subject/:subjectId
 * @desc    Get content by subject
 * @access  Private (All authenticated users)
 */
router.get(
  '/subject/:subjectId',
  getContentBySubject
);

/**
 * @route   GET /api/content/type/:type
 * @desc    Get content by type
 * @access  Private (All authenticated users)
 */
router.get(
  '/type/:type',
  getContentByType
);

/**
 * @route   GET /api/content/favorites
 * @desc    Get user's favorite content
 * @access  Private (All authenticated users)
 */
router.get(
  '/favorites',
  getUserFavorites
);

/**
 * @route   GET /api/content/recent
 * @desc    Get recently accessed content
 * @access  Private (All authenticated users)
 */
router.get(
  '/recent',
  getRecentContent
);

// ============================================================================
// VERSION MANAGEMENT
// ============================================================================

/**
 * @route   GET /api/content/:id/versions
 * @desc    Get content version history
 * @access  Private (Content author, Admins)
 */
router.get(
  '/:id/versions',
  getContentVersions
);

/**
 * @route   POST /api/content/:id/versions/:versionNumber/restore
 * @desc    Restore content version
 * @access  Private (Content author, Admins)
 */
router.post(
  '/:id/versions/:versionNumber/restore',
  authorize(['teacher', 'admin']),
  restoreContentVersion
);

// ============================================================================
// CSV IMPORT
// ============================================================================

/**
 * @route   POST /api/content/import
 * @desc    Import content from CSV
 * @access  Private (Teachers, Admins)
 */
router.post(
  '/import',
  authorize(['teacher', 'admin']),
  importContentFromCSV
);

export default router;
