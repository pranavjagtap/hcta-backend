import { User } from '../models';
import { createError } from '../utils/appError';
import { logger } from '../utils/logger';
import { auditService } from './auditService';
import { ImpersonationData } from '../types/admin';
import jwt from 'jsonwebtoken';

export class ImpersonationService {
  /**
   * Start user impersonation
   */
  async startImpersonation(data: {
    impersonatedUserId: string;
    impersonatedBy: string;
    reason: string;
    sessionId: string;
    ip: string;
    userAgent: string;
  }): Promise<ImpersonationData> {
    try {
      const { impersonatedUserId, impersonatedBy, reason, sessionId, ip, userAgent } = data;

      // Validate impersonated user exists
      const impersonatedUser = await User.findById(impersonatedUserId);
      if (!impersonatedUser) {
        throw createError('User to impersonate not found', 404);
      }

      // Validate impersonator exists and has admin privileges
      const impersonator = await User.findById(impersonatedBy);
      if (!impersonator) {
        throw createError('Impersonator not found', 404);
      }

      if (!['admin', 'superadmin', 'support'].includes(impersonator.role)) {
        throw createError('Insufficient privileges to impersonate users', 403);
      }

      // Check if impersonation is already active for this session
      const existingImpersonation = await this.getActiveImpersonation(sessionId);
      if (existingImpersonation) {
        throw createError('Impersonation already active for this session', 400);
      }

      // Create impersonation token
      const impersonationToken = this.createImpersonationToken(
        impersonatedUserId,
        impersonatedBy,
        sessionId
      );

      // Log the impersonation
      const auditLog = await auditService.logImpersonation({
        impersonatedUserId,
        impersonatedBy,
        reason,
        ip,
        userAgent,
        sessionId
      });

      const impersonationData: ImpersonationData = {
        token: impersonationToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        impersonatedUser: {
          id: impersonatedUser._id.toString(),
          name: impersonatedUser.name || '',
          email: impersonatedUser.email || '',
          role: impersonatedUser.role,
        },
        impersonatedBy: {
          id: impersonator._id.toString(),
          name: impersonator.name || '',
          email: impersonator.email || '',
          role: impersonator.role,
        },
        reason,
        sessionId,
      };

      logger.warn('User impersonation started', {
        impersonatedUserId,
        impersonatedUserName: impersonatedUser.name,
        impersonatedBy,
        impersonatorName: impersonator.name,
        reason,
        sessionId
      });

      return impersonationData;

    } catch (error) {
      logger.error('Error starting impersonation', { error, data });
      throw error;
    }
  }

  /**
   * End user impersonation
   */
  async endImpersonation(sessionId: string, endedBy: string): Promise<void> {
    try {
      // Get active impersonation for this session
      const activeImpersonation = await this.getActiveImpersonation(sessionId);
      if (!activeImpersonation) {
        throw createError('No active impersonation found for this session', 404);
      }

      // Log the end of impersonation
      await auditService.logAction({
        actorId: endedBy,
        actorRole: 'admin',
        action: 'end_impersonation',
        entity: 'user',
        entityId: activeImpersonation.impersonatedUser.id,
        ip: '127.0.0.1', // This should come from request
        userAgent: 'Admin Panel', // This should come from request
        metadata: {
          sessionId,
          impersonatedUserId: activeImpersonation.impersonatedUser.id,
          reason: 'Impersonation ended'
        }
      });

      logger.info('User impersonation ended', {
        sessionId,
        impersonatedUserId: activeImpersonation.impersonatedUser.id,
        endedBy
      });

    } catch (error) {
      logger.error('Error ending impersonation', { error, sessionId, endedBy });
      throw error;
    }
  }

  /**
   * Get active impersonation for a session
   */
  async getActiveImpersonation(sessionId: string): Promise<ImpersonationData | null> {
    try {
      // This would typically query a session store or database
      // For now, return null as placeholder
      return null;

    } catch (error) {
      logger.error('Error getting active impersonation', { error, sessionId });
      throw createError('Failed to get active impersonation', 500);
    }
  }

  /**
   * Validate impersonation token
   */
  async validateImpersonationToken(token: string): Promise<{
    isValid: boolean;
    impersonatedUserId?: string;
    impersonatedBy?: string;
    sessionId?: string;
    error?: string;
  }> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
      
      if (!decoded.impersonatedUserId || !decoded.impersonatedBy || !decoded.sessionId) {
        return {
          isValid: false,
          error: 'Invalid token structure'
        };
      }

      // Check if impersonation is still active
      const activeImpersonation = await this.getActiveImpersonation(decoded.sessionId);
      if (!activeImpersonation) {
        return {
          isValid: false,
          error: 'Impersonation session expired or ended'
        };
      }

      return {
        isValid: true,
        impersonatedUserId: decoded.impersonatedUserId,
        impersonatedBy: decoded.impersonatedBy,
        sessionId: decoded.sessionId
      };

    } catch (error) {
      logger.error('Error validating impersonation token', { error, token });
      return {
        isValid: false,
        error: 'Invalid token'
      };
    }
  }

  /**
   * Get impersonation history
   */
  async getImpersonationHistory(filters: {
    impersonatedBy?: string;
    impersonatedUserId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    impersonations: ImpersonationData[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const { page = 1, limit = 20, ...otherFilters } = filters;
      const skip = (page - 1) * limit;

      // Get audit logs for impersonation actions
      const auditResult = await auditService.getAuditTrail({
        action: 'impersonate_user',
        ...otherFilters,
        page,
        limit
      });

      const impersonations: ImpersonationData[] = auditResult.logs.map(log => ({
        token: '', // Tokens are not stored for security
        expiresAt: new Date(log.createdAt.getTime() + 24 * 60 * 60 * 1000), // 24 hours from creation
        impersonatedUser: {
          id: log.metadata?.impersonatedUserId || '',
          name: 'Unknown', // This would be populated from user data
          email: 'unknown@example.com', // This would be populated from user data
          role: 'student' // This would be populated from user data
        },
        impersonatedBy: {
          id: log.actorId,
          name: log.actorName,
          email: 'admin@example.com', // This would be populated from user data
          role: 'admin'
        },
        reason: log.metadata?.reason || '',
        sessionId: log.metadata?.sessionId || ''
      }));

      return {
        impersonations,
        total: auditResult.total,
        page: auditResult.page,
        totalPages: auditResult.totalPages
      };

    } catch (error) {
      logger.error('Error getting impersonation history', { error, filters });
      throw createError('Failed to get impersonation history', 500);
    }
  }

  /**
   * Get impersonation statistics
   */
  async getImpersonationStats(dateRange?: { start: Date; end: Date }): Promise<any> {
    try {
      const stats = await auditService.getAuditStats(dateRange);
      
      // Filter for impersonation actions
      const impersonationActions = stats.actionsByEntity.filter(
        (action: any) => action.action === 'impersonate_user'
      );

      return {
        totalImpersonations: impersonationActions.length,
        uniqueImpersonators: new Set(impersonationActions.map((a: any) => a.actorId)).size,
        uniqueImpersonatedUsers: new Set(impersonationActions.map((a: any) => a.entityId)).size,
        byImpersonator: this.groupByImpersonator(impersonationActions),
        byDate: this.groupByDate(impersonationActions)
      };

    } catch (error) {
      logger.error('Error getting impersonation statistics', { error, dateRange });
      throw createError('Failed to get impersonation statistics', 500);
    }
  }

  /**
   * Check if user can be impersonated
   */
  async canImpersonateUser(userId: string, impersonatorId: string): Promise<{
    canImpersonate: boolean;
    reason?: string;
  }> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return {
          canImpersonate: false,
          reason: 'User not found'
        };
      }

      const impersonator = await User.findById(impersonatorId);
      if (!impersonator) {
        return {
          canImpersonate: false,
          reason: 'Impersonator not found'
        };
      }

      // Check impersonator privileges
      if (!['admin', 'superadmin', 'support'].includes(impersonator.role)) {
        return {
          canImpersonate: false,
          reason: 'Insufficient privileges'
        };
      }

      // Prevent impersonating other admins unless superadmin
      if (['admin', 'superadmin'].includes(user.role) && impersonator.role !== 'superadmin') {
        return {
          canImpersonate: false,
          reason: 'Cannot impersonate other administrators'
        };
      }

      // Prevent self-impersonation
      if (userId === impersonatorId) {
        return {
          canImpersonate: false,
          reason: 'Cannot impersonate yourself'
        };
      }

      return {
        canImpersonate: true
      };

    } catch (error) {
      logger.error('Error checking impersonation permissions', { error, userId, impersonatorId });
      return {
        canImpersonate: false,
        reason: 'Error checking permissions'
      };
    }
  }

  /**
   * Create impersonation token
   */
  private createImpersonationToken(
    impersonatedUserId: string,
    impersonatedBy: string,
    sessionId: string
  ): string {
    const payload = {
      impersonatedUserId,
      impersonatedBy,
      sessionId,
      type: 'impersonation',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
    };

    return jwt.sign(payload, process.env.JWT_SECRET || 'fallback-secret');
  }

  /**
   * Group impersonations by impersonator
   */
  private groupByImpersonator(actions: any[]): Array<{ impersonatorId: string; count: number }> {
    const impersonatorMap = new Map<string, number>();
    
    actions.forEach(action => {
      const impersonatorId = action.actorId;
      impersonatorMap.set(impersonatorId, (impersonatorMap.get(impersonatorId) || 0) + 1);
    });

    return Array.from(impersonatorMap.entries()).map(([impersonatorId, count]) => ({
      impersonatorId,
      count
    }));
  }

  /**
   * Group impersonations by date
   */
  private groupByDate(actions: any[]): Array<{ date: string; count: number }> {
    const dateMap = new Map<string, number>();
    
    actions.forEach(action => {
      const date = new Date(action.createdAt).toISOString().split('T')[0];
      dateMap.set(date, (dateMap.get(date) || 0) + 1);
    });

    return Array.from(dateMap.entries()).map(([date, count]) => ({
      date,
      count
    }));
  }
}

export const impersonationService = new ImpersonationService();
