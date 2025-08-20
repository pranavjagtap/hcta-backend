import { Setting } from '../models';
import { createError } from '../utils/appError';
import { logger } from '../utils/logger';
import { auditService } from './auditService';
import { SettingData } from '../types/admin';

export class SettingsService {
  /**
   * Get settings by scope
   */
  async getSettingsByScope(scope: string, filters: {
    category?: string;
    isPublic?: boolean;
    key?: string;
  } = {}): Promise<SettingData[]> {
    try {
      const settings = await Setting.getSettingsByScope(scope, filters);
      
      return settings.map(setting => this.formatSetting(setting));

    } catch (error) {
      logger.error('Error getting settings by scope', { error, scope, filters });
      throw createError('Failed to get settings', 500);
    }
  }

  /**
   * Get a specific setting
   */
  async getSetting(scope: string, key: string): Promise<SettingData | null> {
    try {
      const setting = await Setting.getSetting(scope, key);
      
      if (!setting) {
        return null;
      }

      return this.formatSetting(setting);

    } catch (error) {
      logger.error('Error getting setting', { error, scope, key });
      throw createError('Failed to get setting', 500);
    }
  }

  /**
   * Set a setting
   */
  async setSetting(data: {
    scope: string;
    key: string;
    value: any;
    type: 'string' | 'number' | 'boolean' | 'json' | 'array';
    description?: string;
    category?: string;
    isPublic?: boolean;
    updatedBy: string;
  }): Promise<SettingData> {
    try {
      const { scope, key, value, type, description, category, isPublic, updatedBy } = data;

      // Validate value based on type
      this.validateSettingValue(value, type);

      const setting = await Setting.setSetting(
        scope,
        key,
        value,
        type,
        updatedBy,
        {
          description,
          category: category || 'general',
          isPublic: isPublic || false
        }
      );

      // Log the action
      await auditService.logSettingsChange({
        actorId: updatedBy,
        actorRole: 'admin', // This should come from user context
        settingKey: key,
        scope,
        newValue: value,
        ip: '127.0.0.1', // This should come from request
        userAgent: 'Admin Panel' // This should come from request
      });

      logger.info('Setting updated', {
        scope,
        key,
        type,
        updatedBy,
        isPublic
      });

      return this.formatSetting(setting);

    } catch (error) {
      logger.error('Error setting setting', { error, data });
      throw error;
    }
  }

  /**
   * Update a setting
   */
  async updateSetting(scope: string, key: string, updates: {
    value?: any;
    type?: 'string' | 'number' | 'boolean' | 'json' | 'array';
    description?: string;
    category?: string;
    isPublic?: boolean;
    updatedBy: string;
  }): Promise<SettingData> {
    try {
      const { value, type, description, category, isPublic, updatedBy } = updates;

      // Get current setting
      const currentSetting = await Setting.getSetting(scope, key);
      if (!currentSetting) {
        throw createError('Setting not found', 404);
      }

      // Validate new value if provided
      if (value !== undefined) {
        const valueType = type || currentSetting.type;
        this.validateSettingValue(value, valueType);
      }

      // Update setting
      const setting = await Setting.setSetting(
        scope,
        key,
        value !== undefined ? value : currentSetting.value,
        type || currentSetting.type,
        updatedBy,
        {
          description: description !== undefined ? description : currentSetting.description,
          category: category || currentSetting.category,
          isPublic: isPublic !== undefined ? isPublic : currentSetting.isPublic
        }
      );

      // Log the action
      await auditService.logSettingsChange({
        actorId: updatedBy,
        actorRole: 'admin', // This should come from user context
        settingKey: key,
        scope,
        oldValue: currentSetting.value,
        newValue: value !== undefined ? value : currentSetting.value,
        ip: '127.0.0.1', // This should come from request
        userAgent: 'Admin Panel' // This should come from request
      });

      logger.info('Setting updated', {
        scope,
        key,
        updatedBy,
        oldValue: currentSetting.value,
        newValue: value
      });

      return this.formatSetting(setting);

    } catch (error) {
      logger.error('Error updating setting', { error, scope, key, updates });
      throw error;
    }
  }

  /**
   * Get public settings
   */
  async getPublicSettings(scope: string): Promise<SettingData[]> {
    try {
      const settings = await Setting.getPublicSettings(scope);
      
      return settings.map(setting => this.formatSetting(setting));

    } catch (error) {
      logger.error('Error getting public settings', { error, scope });
      throw createError('Failed to get public settings', 500);
    }
  }

  /**
   * Get settings by category
   */
  async getSettingsByCategory(scope: string, category: string): Promise<SettingData[]> {
    try {
      const settings = await Setting.getSettingsByCategory(scope, category);
      
      return settings.map(setting => this.formatSetting(setting));

    } catch (error) {
      logger.error('Error getting settings by category', { error, scope, category });
      throw createError('Failed to get settings by category', 500);
    }
  }

  /**
   * Delete a setting
   */
  async deleteSetting(scope: string, key: string, updatedBy: string): Promise<void> {
    try {
      const setting = await Setting.findOneAndDelete({ scope, key });
      
      if (!setting) {
        throw createError('Setting not found', 404);
      }

      // Log the action
      await auditService.logSettingsChange({
        actorId: updatedBy,
        actorRole: 'admin', // This should come from user context
        settingKey: key,
        scope,
        oldValue: setting.value,
        newValue: null,
        ip: '127.0.0.1', // This should come from request
        userAgent: 'Admin Panel' // This should come from request
      });

      logger.info('Setting deleted', {
        scope,
        key,
        updatedBy
      });

    } catch (error) {
      logger.error('Error deleting setting', { error, scope, key });
      throw error;
    }
  }

  /**
   * Bulk update settings
   */
  async bulkUpdateSettings(scope: string, updates: Array<{
    key: string;
    value: any;
    type?: 'string' | 'number' | 'boolean' | 'json' | 'array';
    description?: string;
    category?: string;
    isPublic?: boolean;
  }>, updatedBy: string): Promise<SettingData[]> {
    try {
      const results: SettingData[] = [];

      for (const update of updates) {
        const { key, value, type, description, category, isPublic } = update;

        // Get current setting to preserve existing values
        const currentSetting = await Setting.getSetting(scope, key);
        
        if (currentSetting) {
          // Update existing setting
          const setting = await this.updateSetting(scope, key, {
            value,
            type: type || currentSetting.type,
            description: description !== undefined ? description : currentSetting.description,
            category: category || currentSetting.category,
            isPublic: isPublic !== undefined ? isPublic : currentSetting.isPublic,
            updatedBy
          });
          results.push(setting);
        } else {
          // Create new setting
          const setting = await this.setSetting({
            scope,
            key,
            value,
            type: type || 'string',
            description,
            category: category || 'general',
            isPublic: isPublic || false,
            updatedBy
          });
          results.push(setting);
        }
      }

      logger.info('Bulk settings update completed', {
        scope,
        updatedBy,
        count: updates.length
      });

      return results;

    } catch (error) {
      logger.error('Error bulk updating settings', { error, scope, updates });
      throw createError('Failed to bulk update settings', 500);
    }
  }

  /**
   * Get settings categories
   */
  async getSettingsCategories(scope: string): Promise<string[]> {
    try {
      const categories = await Setting.distinct('category', { scope });
      return categories.sort();

    } catch (error) {
      logger.error('Error getting settings categories', { error, scope });
      throw createError('Failed to get settings categories', 500);
    }
  }

  /**
   * Export settings
   */
  async exportSettings(scope: string, format: 'json' | 'csv' = 'json'): Promise<{ data: any; format: string }> {
    try {
      const settings = await Setting.getSettingsByScope(scope);
      
      if (format === 'json') {
        return {
          data: settings.map(setting => ({
            key: setting.key,
            value: setting.value,
            type: setting.type,
            description: setting.description,
            category: setting.category,
            isPublic: setting.isPublic
          })),
          format: 'json'
        };
      } else {
        // CSV format
        const csvData = settings.map(setting => ({
          key: setting.key,
          value: typeof setting.value === 'object' ? JSON.stringify(setting.value) : setting.value,
          type: setting.type,
          description: setting.description,
          category: setting.category,
          isPublic: setting.isPublic
        }));

        return {
          data: csvData,
          format: 'csv'
        };
      }

    } catch (error) {
      logger.error('Error exporting settings', { error, scope, format });
      throw createError('Failed to export settings', 500);
    }
  }

  /**
   * Import settings
   */
  async importSettings(scope: string, settings: Array<{
    key: string;
    value: any;
    type: 'string' | 'number' | 'boolean' | 'json' | 'array';
    description?: string;
    category?: string;
    isPublic?: boolean;
  }>, updatedBy: string, options: {
    overwrite?: boolean;
    skipExisting?: boolean;
  } = {}): Promise<{ imported: number; skipped: number; errors: number }> {
    try {
      const { overwrite = false, skipExisting = false } = options;
      let imported = 0;
      let skipped = 0;
      let errors = 0;

      for (const setting of settings) {
        try {
          const existingSetting = await Setting.getSetting(scope, setting.key);
          
          if (existingSetting) {
            if (skipExisting) {
              skipped++;
              continue;
            }
            if (!overwrite) {
              errors++;
              continue;
            }
          }

          await this.setSetting({
            scope,
            key: setting.key,
            value: setting.value,
            type: setting.type,
            description: setting.description,
            category: setting.category || 'general',
            isPublic: setting.isPublic || false,
            updatedBy
          });

          imported++;

        } catch (error) {
          logger.error('Error importing setting', { error, setting });
          errors++;
        }
      }

      logger.info('Settings import completed', {
        scope,
        updatedBy,
        imported,
        skipped,
        errors
      });

      return { imported, skipped, errors };

    } catch (error) {
      logger.error('Error importing settings', { error, scope });
      throw createError('Failed to import settings', 500);
    }
  }

  /**
   * Validate setting value based on type
   */
  private validateSettingValue(value: any, type: string): void {
    switch (type) {
      case 'string':
        if (typeof value !== 'string') {
          throw createError('Value must be a string', 400);
        }
        break;
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          throw createError('Value must be a valid number', 400);
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          throw createError('Value must be a boolean', 400);
        }
        break;
      case 'json':
        if (typeof value !== 'object' || value === null) {
          throw createError('Value must be a valid JSON object', 400);
        }
        break;
      case 'array':
        if (!Array.isArray(value)) {
          throw createError('Value must be an array', 400);
        }
        break;
      default:
        throw createError('Invalid setting type', 400);
    }
  }

  /**
   * Format setting for response
   */
  private formatSetting(setting: any): SettingData {
    return {
      id: setting._id.toString(),
      scope: setting.scope,
      key: setting.key,
      value: setting.value,
      type: setting.type,
      description: setting.description,
      category: setting.category,
      isPublic: setting.isPublic,
      updatedBy: {
        id: setting.updatedBy._id?.toString() || setting.updatedBy.toString(),
        name: setting.updatedBy.name || 'Unknown'
      },
      updatedAt: setting.updatedAt,
      formattedValue: setting.formattedValue
    };
  }
}

export const settingsService = new SettingsService();
