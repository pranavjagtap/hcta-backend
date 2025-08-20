import { AuditLog } from '../models';
import { createError } from '../utils/appError';
import { logger } from '../utils/logger';
import { AuditLogData, AuditLogFilters } from '../types/admin';

export class AuditService {
  /**
   * Log an admin action
   */
  async logAction(data: {
    actorId: string;
    actorRole: string;
    action: string;
    entity: string;
    entityId?: string;
    before?: any;
    after?: any;
    ip: string;
    userAgent: string;
    metadata?: any;
  }): Promise<AuditLogData> {
    try {
      const auditLog = await AuditLog.logAction(data);
      
      logger.info('Admin action logged', {
        actorId: data.actorId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId
      });

      return this.formatAuditLog(auditLog);

    } catch (error) {
      logger.error('Error logging admin action', { error, data });
      throw createError('Failed to log admin action', 500);
    }
  }

  /**
   * Get audit trail with filters
   */
  async getAuditTrail(filters: AuditLogFilters): Promise<{
    logs: AuditLogData[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const result = await AuditLog.getAuditTrail(filters);
      
      return {
        logs: result.logs.map(log => this.formatAuditLog(log)),
        total: result.total,
        page: result.page,
        totalPages: result.totalPages
      };

    } catch (error) {
      logger.error('Error getting audit trail', { error, filters });
      throw createError('Failed to get audit trail', 500);
    }
  }

  /**
   * Get audit statistics
   */
  async getAuditStats(dateRange?: { start: Date; end: Date }): Promise<any> {
    try {
      const stats = await AuditLog.getAuditStats(dateRange);
      
      // Process actions by role
      const actionsByRole = this.processActionsByRole(stats.actionsByRole);
      
      // Process actions by entity
      const actionsByEntity = this.processActionsByEntity(stats.actionsByEntity);

      return {
        totalActions: stats.totalActions,
        uniqueActors: stats.uniqueActors,
        actionsByRole,
        actionsByEntity
      };

    } catch (error) {
      logger.error('Error getting audit statistics', { error, dateRange });
      throw createError('Failed to get audit statistics', 500);
    }
  }

  /**
   * Log user impersonation
   */
  async logImpersonation(data: {
    impersonatedUserId: string;
    impersonatedBy: string;
    reason: string;
    ip: string;
    userAgent: string;
    sessionId: string;
  }): Promise<AuditLogData> {
    try {
      const auditLog = await AuditLog.logAction({
        actorId: data.impersonatedBy,
        actorRole: 'admin', // Assuming only admins can impersonate
        action: 'impersonate_user',
        entity: 'user',
        entityId: data.impersonatedUserId,
        ip: data.ip,
        userAgent: data.userAgent,
        metadata: {
          impersonatedUserId: data.impersonatedUserId,
          reason: data.reason,
          sessionId: data.sessionId
        }
      });

      logger.warn('User impersonation logged', {
        impersonatedBy: data.impersonatedBy,
        impersonatedUserId: data.impersonatedUserId,
        reason: data.reason,
        sessionId: data.sessionId
      });

      return this.formatAuditLog(auditLog);

    } catch (error) {
      logger.error('Error logging impersonation', { error, data });
      throw createError('Failed to log impersonation', 500);
    }
  }

  /**
   * Log role changes
   */
  async logRoleChange(data: {
    actorId: string;
    actorRole: string;
    targetUserId: string;
    oldRoles: string[];
    newRoles: string[];
    reason?: string;
    ip: string;
    userAgent: string;
  }): Promise<AuditLogData> {
    try {
      const auditLog = await AuditLog.logAction({
        actorId: data.actorId,
        actorRole: data.actorRole,
        action: 'change_user_roles',
        entity: 'user',
        entityId: data.targetUserId,
        before: { roles: data.oldRoles },
        after: { roles: data.newRoles },
        ip: data.ip,
        userAgent: data.userAgent,
        metadata: {
          reason: data.reason,
          targetUserId: data.targetUserId
        }
      });

      logger.info('Role change logged', {
        actorId: data.actorId,
        targetUserId: data.targetUserId,
        oldRoles: data.oldRoles,
        newRoles: data.newRoles,
        reason: data.reason
      });

      return this.formatAuditLog(auditLog);

    } catch (error) {
      logger.error('Error logging role change', { error, data });
      throw createError('Failed to log role change', 500);
    }
  }

  /**
   * Log content moderation actions
   */
  async logContentModeration(data: {
    actorId: string;
    actorRole: string;
    action: string;
    materialId: string;
    flagId?: string;
    reason?: string;
    ip: string;
    userAgent: string;
  }): Promise<AuditLogData> {
    try {
      const auditLog = await AuditLog.logAction({
        actorId: data.actorId,
        actorRole: data.actorRole,
        action: data.action,
        entity: 'content',
        entityId: data.materialId,
        ip: data.ip,
        userAgent: data.userAgent,
        metadata: {
          flagId: data.flagId,
          reason: data.reason,
          materialId: data.materialId
        }
      });

      logger.info('Content moderation action logged', {
        actorId: data.actorId,
        action: data.action,
        materialId: data.materialId,
        flagId: data.flagId,
        reason: data.reason
      });

      return this.formatAuditLog(auditLog);

    } catch (error) {
      logger.error('Error logging content moderation', { error, data });
      throw createError('Failed to log content moderation', 500);
    }
  }

  /**
   * Log tutor onboarding actions
   */
  async logTutorOnboarding(data: {
    actorId: string;
    actorRole: string;
    action: string;
    tutorId: string;
    status: 'approved' | 'rejected' | 'request_resubmission';
    reason?: string;
    ip: string;
    userAgent: string;
  }): Promise<AuditLogData> {
    try {
      const auditLog = await AuditLog.logAction({
        actorId: data.actorId,
        actorRole: data.actorRole,
        action: data.action,
        entity: 'tutor_onboarding',
        entityId: data.tutorId,
        ip: data.ip,
        userAgent: data.userAgent,
        metadata: {
          status: data.status,
          reason: data.reason,
          tutorId: data.tutorId
        }
      });

      logger.info('Tutor onboarding action logged', {
        actorId: data.actorId,
        action: data.action,
        tutorId: data.tutorId,
        status: data.status,
        reason: data.reason
      });

      return this.formatAuditLog(auditLog);

    } catch (error) {
      logger.error('Error logging tutor onboarding', { error, data });
      throw createError('Failed to log tutor onboarding', 500);
    }
  }

  /**
   * Log settings changes
   */
  async logSettingsChange(data: {
    actorId: string;
    actorRole: string;
    settingKey: string;
    scope: string;
    oldValue?: any;
    newValue: any;
    ip: string;
    userAgent: string;
  }): Promise<AuditLogData> {
    try {
      const auditLog = await AuditLog.logAction({
        actorId: data.actorId,
        actorRole: data.actorRole,
        action: 'change_setting',
        entity: 'setting',
        entityId: data.settingKey,
        before: { value: data.oldValue },
        after: { value: data.newValue },
        ip: data.ip,
        userAgent: data.userAgent,
        metadata: {
          settingKey: data.settingKey,
          scope: data.scope
        }
      });

      logger.info('Settings change logged', {
        actorId: data.actorId,
        settingKey: data.settingKey,
        scope: data.scope,
        oldValue: data.oldValue,
        newValue: data.newValue
      });

      return this.formatAuditLog(auditLog);

    } catch (error) {
      logger.error('Error logging settings change', { error, data });
      throw createError('Failed to log settings change', 500);
    }
  }

  /**
   * Log feature flag changes
   */
  async logFeatureFlagChange(data: {
    actorId: string;
    actorRole: string;
    flagKey: string;
    oldEnabled: boolean;
    newEnabled: boolean;
    oldAudience?: any;
    newAudience?: any;
    ip: string;
    userAgent: string;
  }): Promise<AuditLogData> {
    try {
      const auditLog = await AuditLog.logAction({
        actorId: data.actorId,
        actorRole: data.actorRole,
        action: 'change_feature_flag',
        entity: 'feature_flag',
        entityId: data.flagKey,
        before: { 
          enabled: data.oldEnabled,
          audience: data.oldAudience
        },
        after: { 
          enabled: data.newEnabled,
          audience: data.newAudience
        },
        ip: data.ip,
        userAgent: data.userAgent,
        metadata: {
          flagKey: data.flagKey
        }
      });

      logger.info('Feature flag change logged', {
        actorId: data.actorId,
        flagKey: data.flagKey,
        oldEnabled: data.oldEnabled,
        newEnabled: data.newEnabled
      });

      return this.formatAuditLog(auditLog);

    } catch (error) {
      logger.error('Error logging feature flag change', { error, data });
      throw createError('Failed to log feature flag change', 500);
    }
  }

  /**
   * Format audit log for response
   */
  private formatAuditLog(auditLog: any): AuditLogData {
    return {
      id: auditLog._id.toString(),
      actorId: auditLog.actorId._id?.toString() || auditLog.actorId.toString(),
      actorName: auditLog.actorId.name || 'Unknown',
      actorRole: auditLog.actorRole,
      action: auditLog.action,
      entity: auditLog.entity,
      entityId: auditLog.entityId?.toString(),
      before: auditLog.before,
      after: auditLog.after,
      ip: auditLog.ip,
      userAgent: auditLog.userAgent,
      metadata: auditLog.metadata,
      createdAt: auditLog.createdAt,
      timeAgo: auditLog.timeAgo,
      formattedAction: auditLog.formattedAction
    };
  }

  /**
   * Process actions by role
   */
  private processActionsByRole(actionsByRole: any[]): Array<{ role: string; count: number; actions: string[] }> {
    const roleMap = new Map<string, { count: number; actions: Set<string> }>();
    
    actionsByRole.forEach(({ role, action }) => {
      if (!roleMap.has(role)) {
        roleMap.set(role, { count: 0, actions: new Set() });
      }
      
      const roleData = roleMap.get(role)!;
      roleData.count++;
      roleData.actions.add(action);
    });

    return Array.from(roleMap.entries()).map(([role, data]) => ({
      role,
      count: data.count,
      actions: Array.from(data.actions)
    }));
  }

  /**
   * Process actions by entity
   */
  private processActionsByEntity(actionsByEntity: any[]): Array<{ entity: string; count: number; actions: string[] }> {
    const entityMap = new Map<string, { count: number; actions: Set<string> }>();
    
    actionsByEntity.forEach(({ entity, action }) => {
      if (!entityMap.has(entity)) {
        entityMap.set(entity, { count: 0, actions: new Set() });
      }
      
      const entityData = entityMap.get(entity)!;
      entityData.count++;
      entityData.actions.add(action);
    });

    return Array.from(entityMap.entries()).map(([entity, data]) => ({
      entity,
      count: data.count,
      actions: Array.from(data.actions)
    }));
  }
}

export const auditService = new AuditService();
