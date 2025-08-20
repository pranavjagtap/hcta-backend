import { FeatureFlag, User } from '../models';
import { createError } from '../utils/appError';
import { logger } from '../utils/logger';
import { auditService } from './auditService';
import { FeatureFlagData } from '../types/admin';
import mongoose from 'mongoose';

export class FeatureFlagService {
  /**
   * Create a new feature flag
   */
  async createFeatureFlag(data: {
    key: string;
    description?: string;
    enabled: boolean;
    audience?: {
      roles?: string[];
      tutorIds?: string[];
      cohorts?: string[];
      percentage?: number;
    };
    metadata?: {
      rolloutDate?: Date;
      expectedImpact?: string;
      owner?: string;
      tags?: string[];
    };
    updatedBy: string;
  }): Promise<FeatureFlagData> {
    try {
      const { key, description, enabled, audience, metadata, updatedBy } = data;

      // Check if flag already exists
      const existingFlag = await FeatureFlag.findOne({ key });
      if (existingFlag) {
        throw createError('Feature flag with this key already exists', 400);
      }

      const featureFlag = new FeatureFlag({
        key,
        description,
        enabled,
        audience,
        metadata,
        updatedBy
      });

      await featureFlag.save();
      await featureFlag.populate('updatedBy', 'name email');

      // Log the action
      await auditService.logFeatureFlagChange({
        actorId: updatedBy,
        actorRole: 'admin', // This should come from user context
        flagKey: key,
        oldEnabled: false,
        newEnabled: enabled,
        oldAudience: undefined,
        newAudience: audience,
        ip: '127.0.0.1', // This should come from request
        userAgent: 'Admin Panel' // This should come from request
      });

      logger.info('Feature flag created', {
        flagKey: key,
        enabled,
        updatedBy,
        audience: audience ? 'targeted' : 'all users'
      });

      return this.formatFeatureFlag(featureFlag);

    } catch (error) {
      logger.error('Error creating feature flag', { error, data });
      throw error;
    }
  }

  /**
   * Get all active feature flags
   */
  async getActiveFlags(): Promise<FeatureFlagData[]> {
    try {
      const flags = await FeatureFlag.getActiveFlags();
      
      return flags.map(flag => this.formatFeatureFlag(flag));

    } catch (error) {
      logger.error('Error getting active feature flags', { error });
      throw createError('Failed to get active feature flags', 500);
    }
  }

  /**
   * Check if a feature flag is enabled for a specific user
   */
  async isEnabledForUser(key: string, user: any): Promise<boolean> {
    try {
      const isEnabled = await FeatureFlag.isEnabledForUser(key, user);
      
      logger.debug('Feature flag check', {
        flagKey: key,
        userId: user._id,
        userRole: user.role,
        isEnabled
      });

      return isEnabled;

    } catch (error) {
      logger.error('Error checking feature flag for user', { error, key, userId: user._id });
      // Default to disabled if there's an error
      return false;
    }
  }

  /**
   * Get feature flags by audience
   */
  async getFlagsByAudience(audienceType: string, audienceValue: string): Promise<FeatureFlagData[]> {
    try {
      const flags = await FeatureFlag.getFlagsByAudience(audienceType, audienceValue);
      
      return flags.map(flag => this.formatFeatureFlag(flag));

    } catch (error) {
      logger.error('Error getting feature flags by audience', { error, audienceType, audienceValue });
      throw createError('Failed to get feature flags by audience', 500);
    }
  }

  /**
   * Toggle a feature flag
   */
  async toggleFlag(key: string, enabled: boolean, updatedBy: string): Promise<FeatureFlagData> {
    try {
      const flag = await FeatureFlag.findOne({ key });
      if (!flag) {
        throw createError('Feature flag not found', 404);
      }

      const oldEnabled = flag.enabled;
      const updatedFlag = await FeatureFlag.toggleFlag(key, enabled, updatedBy);

      // Log the action
      await auditService.logFeatureFlagChange({
        actorId: updatedBy,
        actorRole: 'admin', // This should come from user context
        flagKey: key,
        oldEnabled,
        newEnabled: enabled,
        oldAudience: flag.audience,
        newAudience: flag.audience,
        ip: '127.0.0.1', // This should come from request
        userAgent: 'Admin Panel' // This should come from request
      });

      logger.info('Feature flag toggled', {
        flagKey: key,
        oldEnabled,
        newEnabled: enabled,
        updatedBy
      });

      return this.formatFeatureFlag(updatedFlag);

    } catch (error) {
      logger.error('Error toggling feature flag', { error, key, enabled });
      throw error;
    }
  }

  /**
   * Update feature flag audience
   */
  async updateAudience(key: string, audience: any, updatedBy: string): Promise<FeatureFlagData> {
    try {
      const flag = await FeatureFlag.findOne({ key });
      if (!flag) {
        throw createError('Feature flag not found', 404);
      }

      const oldAudience = flag.audience;
      const updatedFlag = await FeatureFlag.updateAudience(key, audience, updatedBy);

      // Log the action
      await auditService.logFeatureFlagChange({
        actorId: updatedBy,
        actorRole: 'admin', // This should come from user context
        flagKey: key,
        oldEnabled: flag.enabled,
        newEnabled: flag.enabled,
        oldAudience,
        newAudience: audience,
        ip: '127.0.0.1', // This should come from request
        userAgent: 'Admin Panel' // This should come from request
      });

      logger.info('Feature flag audience updated', {
        flagKey: key,
        oldAudience,
        newAudience: audience,
        updatedBy
      });

      return this.formatFeatureFlag(updatedFlag);

    } catch (error) {
      logger.error('Error updating feature flag audience', { error, key, audience });
      throw error;
    }
  }

  /**
   * Get feature flag by key
   */
  async getFeatureFlagByKey(key: string): Promise<FeatureFlagData | null> {
    try {
      const flag = await FeatureFlag.findOne({ key })
        .populate('updatedBy', 'name email')
        .lean();

      if (!flag) {
        return null;
      }

      return this.formatFeatureFlag(flag);

    } catch (error) {
      logger.error('Error getting feature flag by key', { error, key });
      throw createError('Failed to get feature flag', 500);
    }
  }

  /**
   * Get all feature flags with pagination
   */
  async getFeatureFlags(filters: {
    enabled?: boolean;
    key?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    flags: FeatureFlagData[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const { page = 1, limit = 20, ...otherFilters } = filters;
      const skip = (page - 1) * limit;

      const query: any = {};
      Object.assign(query, otherFilters);

      const [flags, total] = await Promise.all([
        FeatureFlag.find(query)
          .populate('updatedBy', 'name email')
          .sort({ key: 1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        FeatureFlag.countDocuments(query)
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        flags: flags.map(flag => this.formatFeatureFlag(flag)),
        total,
        page,
        totalPages
      };

    } catch (error) {
      logger.error('Error getting feature flags', { error, filters });
      throw createError('Failed to get feature flags', 500);
    }
  }

  /**
   * Update feature flag
   */
  async updateFeatureFlag(key: string, updates: {
    description?: string;
    enabled?: boolean;
    audience?: any;
    metadata?: any;
    updatedBy: string;
  }): Promise<FeatureFlagData> {
    try {
      const { description, enabled, audience, metadata, updatedBy } = updates;

      const flag = await FeatureFlag.findOne({ key });
      if (!flag) {
        throw createError('Feature flag not found', 404);
      }

      const oldEnabled = flag.enabled;
      const oldAudience = flag.audience;

      // Update fields
      if (description !== undefined) flag.description = description;
      if (enabled !== undefined) flag.enabled = enabled;
      if (audience !== undefined) flag.audience = audience;
      if (metadata !== undefined) flag.metadata = metadata;
      flag.updatedBy = new mongoose.Types.ObjectId(updatedBy);

      await flag.save();
      await flag.populate('updatedBy', 'name email');

      // Log the action
      await auditService.logFeatureFlagChange({
        actorId: updatedBy,
        actorRole: 'admin', // This should come from user context
        flagKey: key,
        oldEnabled,
        newEnabled: enabled !== undefined ? enabled : oldEnabled,
        oldAudience,
        newAudience: audience !== undefined ? audience : oldAudience,
        ip: '127.0.0.1', // This should come from request
        userAgent: 'Admin Panel' // This should come from request
      });

      logger.info('Feature flag updated', {
        flagKey: key,
        updatedBy,
        changes: Object.keys(updates).filter(k => k !== 'updatedBy')
      });

      return this.formatFeatureFlag(flag);

    } catch (error) {
      logger.error('Error updating feature flag', { error, key, updates });
      throw error;
    }
  }

  /**
   * Delete feature flag
   */
  async deleteFeatureFlag(key: string, updatedBy: string): Promise<void> {
    try {
      const flag = await FeatureFlag.findOne({ key });
      
      if (!flag) {
        throw createError('Feature flag not found', 404);
      }

      const oldEnabled = flag.enabled;
      const oldAudience = flag.audience;

      await flag.deleteOne();

      // Log the action
      await auditService.logFeatureFlagChange({
        actorId: updatedBy,
        actorRole: 'admin', // This should come from user context
        flagKey: key,
        oldEnabled,
        newEnabled: false,
        oldAudience,
        newAudience: undefined,
        ip: '127.0.0.1', // This should come from request
        userAgent: 'Admin Panel' // This should come from request
      });

      logger.info('Feature flag deleted', {
        flagKey: key,
        updatedBy
      });

    } catch (error) {
      logger.error('Error deleting feature flag', { error, key });
      throw error;
    }
  }

  /**
   * Get feature flags for a specific user
   */
  async getFlagsForUser(userId: string): Promise<FeatureFlagData[]> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw createError('User not found', 404);
      }

      const activeFlags = await FeatureFlag.getActiveFlags();
      const userFlags: FeatureFlagData[] = [];

      for (const flag of activeFlags) {
        const isEnabled = await FeatureFlag.isEnabledForUser(flag.key, user);
        if (isEnabled) {
          userFlags.push(this.formatFeatureFlag(flag));
        }
      }

      return userFlags;

    } catch (error) {
      logger.error('Error getting feature flags for user', { error, userId });
      throw createError('Failed to get feature flags for user', 500);
    }
  }

  /**
   * Bulk update feature flags
   */
  async bulkUpdateFlags(updates: Array<{
    key: string;
    enabled?: boolean;
    audience?: any;
    description?: string;
    metadata?: any;
  }>, updatedBy: string): Promise<FeatureFlagData[]> {
    try {
      const results: FeatureFlagData[] = [];

      for (const update of updates) {
        const { key, ...updateData } = update;
        
        try {
          const flag = await this.updateFeatureFlag(key, {
            ...updateData,
            updatedBy
          });
          results.push(flag);
        } catch (error) {
          logger.error('Error updating feature flag in bulk', { error, key, updateData });
          // Continue with other updates
        }
      }

      logger.info('Bulk feature flag update completed', {
        updatedBy,
        total: updates.length,
        successful: results.length
      });

      return results;

    } catch (error) {
      logger.error('Error bulk updating feature flags', { error, updates });
      throw createError('Failed to bulk update feature flags', 500);
    }
  }

  /**
   * Get feature flag statistics
   */
  async getFeatureFlagStats(): Promise<any> {
    try {
      const [totalFlags, enabledFlags, targetedFlags] = await Promise.all([
        FeatureFlag.countDocuments(),
        FeatureFlag.countDocuments({ enabled: true }),
        FeatureFlag.countDocuments({ 
          enabled: true, 
          $or: [
            { 'audience.roles': { $exists: true, $ne: [] } },
            { 'audience.tutorIds': { $exists: true, $ne: [] } },
            { 'audience.cohorts': { $exists: true, $ne: [] } },
            { 'audience.percentage': { $exists: true, $ne: null } }
          ]
        })
      ]);

      return {
        totalFlags,
        enabledFlags,
        targetedFlags,
        globalFlags: enabledFlags - targetedFlags
      };

    } catch (error) {
      logger.error('Error getting feature flag statistics', { error });
      throw createError('Failed to get feature flag statistics', 500);
    }
  }

  /**
   * Format feature flag for response
   */
  private formatFeatureFlag(flag: any): FeatureFlagData {
    return {
      id: flag._id.toString(),
      key: flag.key,
      description: flag.description,
      enabled: flag.enabled,
      audience: flag.audience,
      metadata: flag.metadata,
      updatedBy: flag.updatedBy._id?.toString() || flag.updatedBy.toString(),
      updatedAt: flag.updatedAt,
      audienceSummary: flag.audienceSummary,
      status: flag.status
    };
  }
}

export const featureFlagService = new FeatureFlagService();
