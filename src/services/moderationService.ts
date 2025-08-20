import { Flag, Content, User } from '../models';
import { createError } from '../utils/appError';
import { logger } from '../utils/logger';
import { auditService } from './auditService';
import { FlagData } from '../types/admin';

export class ModerationService {
  /**
   * Create a new content flag
   */
  async createFlag(data: {
    materialId: string;
    reporterId: string;
    reason: string;
    category: 'inappropriate' | 'copyright' | 'spam' | 'quality' | 'other';
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    context?: string;
    evidence?: string[];
  }): Promise<FlagData> {
    try {
      // Validate material exists
      const material = await Content.findById(data.materialId);
      if (!material) {
        throw createError('Material not found', 404);
      }

      // Validate reporter exists
      const reporter = await User.findById(data.reporterId);
      if (!reporter) {
        throw createError('Reporter not found', 404);
      }

      // Check if similar flag already exists
      const existingFlag = await Flag.findOne({
        materialId: data.materialId,
        reporterId: data.reporterId,
        status: 'open',
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      });

      if (existingFlag) {
        throw createError('You have already flagged this content recently', 400);
      }

      // Determine priority if not provided
      let priority = data.priority || 'medium';
      if (data.category === 'inappropriate' || data.category === 'copyright') {
        priority = 'high';
      }

      const flag = new Flag({
        materialId: data.materialId,
        reporterId: data.reporterId,
        reason: data.reason,
        category: data.category,
        priority,
        metadata: {
          context: data.context,
          evidence: data.evidence
        }
      });

      await flag.save();

      // Populate references
      await flag.populate([
        { path: 'materialId', select: 'title type uploadedBy' },
        { path: 'reporterId', select: 'name email' }
      ]);

      logger.info('Content flag created', {
        flagId: flag._id,
        materialId: data.materialId,
        reporterId: data.reporterId,
        category: data.category,
        priority
      });

      return this.formatFlag(flag);

    } catch (error) {
      logger.error('Error creating content flag', { error, data });
      throw error;
    }
  }

  /**
   * Get flags by status
   */
  async getFlagsByStatus(status: string, filters: {
    category?: string;
    priority?: string;
    materialId?: string;
    reporterId?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    flags: FlagData[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const { page = 1, limit = 20, ...otherFilters } = filters;
      const skip = (page - 1) * limit;

      const query: any = { status };
      Object.assign(query, otherFilters);

      const [flags, total] = await Promise.all([
        Flag.find(query)
          .populate('materialId', 'title type uploadedBy')
          .populate('reporterId', 'name email')
          .populate('notes.adminId', 'name email')
          .populate('resolvedBy', 'name email')
          .sort({ priority: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Flag.countDocuments(query)
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        flags: flags.map(flag => this.formatFlag(flag)),
        total,
        page,
        totalPages
      };

    } catch (error) {
      logger.error('Error getting flags by status', { error, status, filters });
      throw createError('Failed to get flags', 500);
    }
  }

  /**
   * Get flag statistics
   */
  async getFlagStats(dateRange?: { start: Date; end: Date }): Promise<any> {
    try {
      const stats = await Flag.getFlagStats(dateRange);
      
      // Process by category
      const byCategory = this.processByCategory(stats.byCategory);
      
      // Process by priority
      const byPriority = this.processByPriority(stats.byPriority);

      return {
        totalFlags: stats.totalFlags,
        openFlags: stats.openFlags,
        resolvedFlags: stats.resolvedFlags,
        dismissedFlags: stats.dismissedFlags,
        byCategory,
        byPriority
      };

    } catch (error) {
      logger.error('Error getting flag statistics', { error, dateRange });
      throw createError('Failed to get flag statistics', 500);
    }
  }

  /**
   * Add note to a flag
   */
  async addNote(flagId: string, adminId: string, note: string): Promise<FlagData> {
    try {
      const flag = await Flag.addNote(flagId, adminId, note);
      
      await flag.populate([
        { path: 'materialId', select: 'title type uploadedBy' },
        { path: 'reporterId', select: 'name email' },
        { path: 'notes.adminId', select: 'name email' },
        { path: 'resolvedBy', select: 'name email' }
      ]);

      // Log the action
      await auditService.logContentModeration({
        actorId: adminId,
        actorRole: 'admin',
        action: 'add_note_to_flag',
        materialId: flag.materialId.toString(),
        flagId: flagId,
        reason: note,
        ip: '127.0.0.1', // This should come from request
        userAgent: 'Admin Panel' // This should come from request
      });

      logger.info('Note added to flag', {
        flagId,
        adminId,
        noteLength: note.length
      });

      return this.formatFlag(flag);

    } catch (error) {
      logger.error('Error adding note to flag', { error, flagId, adminId });
      throw error;
    }
  }

  /**
   * Resolve a flag
   */
  async resolveFlag(flagId: string, adminId: string, resolution: 'resolved' | 'dismissed', note?: string): Promise<FlagData> {
    try {
      const flag = await Flag.resolveFlag(flagId, adminId, resolution, note);
      
      await flag.populate([
        { path: 'materialId', select: 'title type uploadedBy' },
        { path: 'reporterId', select: 'name email' },
        { path: 'notes.adminId', select: 'name email' },
        { path: 'resolvedBy', select: 'name email' }
      ]);

      // Log the action
      await auditService.logContentModeration({
        actorId: adminId,
        actorRole: 'admin',
        action: `resolve_flag_${resolution}`,
        materialId: flag.materialId.toString(),
        flagId: flagId,
        reason: note,
        ip: '127.0.0.1', // This should come from request
        userAgent: 'Admin Panel' // This should come from request
      });

      logger.info('Flag resolved', {
        flagId,
        adminId,
        resolution,
        noteLength: note?.length || 0
      });

      return this.formatFlag(flag);

    } catch (error) {
      logger.error('Error resolving flag', { error, flagId, adminId, resolution });
      throw error;
    }
  }

  /**
   * Get flag by ID
   */
  async getFlagById(flagId: string): Promise<FlagData> {
    try {
      const flag = await Flag.findById(flagId)
        .populate('materialId', 'title type uploadedBy')
        .populate('reporterId', 'name email')
        .populate('notes.adminId', 'name email')
        .populate('resolvedBy', 'name email')
        .lean();

      if (!flag) {
        throw createError('Flag not found', 404);
      }

      return this.formatFlag(flag);

    } catch (error) {
      logger.error('Error getting flag by ID', { error, flagId });
      throw error;
    }
  }

  /**
   * Get related flags for a material
   */
  async getRelatedFlags(materialId: string): Promise<FlagData[]> {
    try {
      const flags = await Flag.find({ materialId })
        .populate('materialId', 'title type uploadedBy')
        .populate('reporterId', 'name email')
        .populate('notes.adminId', 'name email')
        .populate('resolvedBy', 'name email')
        .sort({ createdAt: -1 })
        .lean();

      return flags.map(flag => this.formatFlag(flag));

    } catch (error) {
      logger.error('Error getting related flags', { error, materialId });
      throw createError('Failed to get related flags', 500);
    }
  }

  /**
   * Get flags by reporter
   */
  async getFlagsByReporter(reporterId: string, filters: {
    status?: string;
    category?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    flags: FlagData[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const { page = 1, limit = 20, ...otherFilters } = filters;
      const skip = (page - 1) * limit;

      const query: any = { reporterId };
      Object.assign(query, otherFilters);

      const [flags, total] = await Promise.all([
        Flag.find(query)
          .populate('materialId', 'title type uploadedBy')
          .populate('reporterId', 'name email')
          .populate('notes.adminId', 'name email')
          .populate('resolvedBy', 'name email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Flag.countDocuments(query)
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        flags: flags.map(flag => this.formatFlag(flag)),
        total,
        page,
        totalPages
      };

    } catch (error) {
      logger.error('Error getting flags by reporter', { error, reporterId, filters });
      throw createError('Failed to get flags by reporter', 500);
    }
  }

  /**
   * Get urgent flags (high priority or old open flags)
   */
  async getUrgentFlags(): Promise<FlagData[]> {
    try {
      const urgentFlags = await Flag.find({
        $or: [
          { priority: 'urgent', status: 'open' },
          { priority: 'high', status: 'open' },
          {
            status: 'open',
            createdAt: { $lte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Older than 24 hours
          }
        ]
      })
        .populate('materialId', 'title type uploadedBy')
        .populate('reporterId', 'name email')
        .populate('notes.adminId', 'name email')
        .populate('resolvedBy', 'name email')
        .sort({ priority: -1, createdAt: -1 })
        .lean();

      return urgentFlags.map(flag => this.formatFlag(flag));

    } catch (error) {
      logger.error('Error getting urgent flags', { error });
      throw createError('Failed to get urgent flags', 500);
    }
  }

  /**
   * Format flag for response
   */
  private formatFlag(flag: any): FlagData {
    return {
      id: flag._id.toString(),
      materialId: flag.materialId._id?.toString() || flag.materialId.toString(),
      materialTitle: flag.materialId.title || 'Unknown',
      materialType: flag.materialId.type || 'unknown',
      reporterId: flag.reporterId._id?.toString() || flag.reporterId.toString(),
      reporterName: flag.reporterId.name || 'Unknown',
      reason: flag.reason,
      status: flag.status,
      category: flag.category,
      priority: flag.priority,
      notes: flag.notes?.map((note: any) => ({
        id: note._id?.toString(),
        adminId: note.adminId._id?.toString() || note.adminId.toString(),
        adminName: note.adminId.name || 'Unknown',
        note: note.note,
        createdAt: note.createdAt
      })) || [],
      metadata: flag.metadata,
      createdAt: flag.createdAt,
      updatedAt: flag.updatedAt,
      resolvedAt: flag.resolvedAt,
      resolvedBy: flag.resolvedBy ? {
        id: flag.resolvedBy._id?.toString() || flag.resolvedBy.toString(),
        name: flag.resolvedBy.name || 'Unknown'
      } : null,
      timeSinceCreation: flag.timeSinceCreation,
      isUrgent: flag.isUrgent
    };
  }

  /**
   * Process flags by category
   */
  private processByCategory(byCategory: any[]): Array<{ category: string; total: number; open: number; resolved: number; dismissed: number }> {
    const categoryMap = new Map<string, { total: number; open: number; resolved: number; dismissed: number }>();
    
    byCategory.forEach(({ category, status }) => {
      if (!categoryMap.has(category)) {
        categoryMap.set(category, { total: 0, open: 0, resolved: 0, dismissed: 0 });
      }
      
      const categoryData = categoryMap.get(category)!;
      categoryData.total++;
      
      switch (status) {
        case 'open':
          categoryData.open++;
          break;
        case 'resolved':
          categoryData.resolved++;
          break;
        case 'dismissed':
          categoryData.dismissed++;
          break;
      }
    });

    return Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      ...data
    }));
  }

  /**
   * Process flags by priority
   */
  private processByPriority(byPriority: any[]): Array<{ priority: string; total: number; open: number; resolved: number; dismissed: number }> {
    const priorityMap = new Map<string, { total: number; open: number; resolved: number; dismissed: number }>();
    
    byPriority.forEach(({ priority, status }) => {
      if (!priorityMap.has(priority)) {
        priorityMap.set(priority, { total: 0, open: 0, resolved: 0, dismissed: 0 });
      }
      
      const priorityData = priorityMap.get(priority)!;
      priorityData.total++;
      
      switch (status) {
        case 'open':
          priorityData.open++;
          break;
        case 'resolved':
          priorityData.resolved++;
          break;
        case 'dismissed':
          priorityData.dismissed++;
          break;
      }
    });

    return Array.from(priorityMap.entries()).map(([priority, data]) => ({
      priority,
      ...data
    }));
  }
}

export const moderationService = new ModerationService();
