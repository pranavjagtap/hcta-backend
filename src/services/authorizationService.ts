import { User } from '../models';
import { createError } from '../utils/appError';
import { logger } from '../utils/logger';
import { auditService } from './auditService';

export class AuthorizationService {
  /**
   * Assign roles to a user
   */
  async assignRoles(data: {
    userId: string;
    roles: string[];
    assignedBy: string;
    reason?: string;
    ip: string;
    userAgent: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      const { userId, roles, assignedBy, reason, ip, userAgent } = data;

      // Validate user exists
      const user = await User.findById(userId);
      if (!user) {
        throw createError('User not found', 404);
      }

      // Validate assigner exists and has admin privileges
      const assigner = await User.findById(assignedBy);
      if (!assigner) {
        throw createError('Assigner not found', 404);
      }

      if (!['admin', 'superadmin'].includes(assigner.role)) {
        throw createError('Insufficient privileges to assign roles', 403);
      }

      // Validate roles
      const validRoles = ['admin', 'superadmin', 'support', 'auditor', 'teacher', 'student', 'parent'];
      const invalidRoles = roles.filter(role => !validRoles.includes(role));
      if (invalidRoles.length > 0) {
        throw createError(`Invalid roles: ${invalidRoles.join(', ')}`, 400);
      }

      // Prevent assigning superadmin role unless assigner is superadmin
      if (roles.includes('superadmin') && assigner.role !== 'superadmin') {
        throw createError('Only superadmin can assign superadmin role', 403);
      }

      // Prevent assigning admin role to non-admin assigner
      if (roles.includes('admin') && !['admin', 'superadmin'].includes(assigner.role)) {
        throw createError('Only admin or superadmin can assign admin role', 403);
      }

      const oldRoles = (user as any).roles || [];
      (user as any).roles = roles;
      await user.save();

      // Log the role assignment
      await auditService.logRoleChange({
        actorId: assignedBy,
        actorRole: assigner.role,
        targetUserId: userId,
        oldRoles,
        newRoles: roles,
        reason,
        ip,
        userAgent
      });

      logger.info('Roles assigned to user', {
        userId,
        userName: user.name,
        oldRoles,
        newRoles: roles,
        assignedBy,
        assignerName: assigner.name,
        reason
      });

      return {
        success: true,
        message: `Roles ${roles.join(', ')} assigned to ${user.name}`
      };

    } catch (error) {
      logger.error('Error assigning roles', { error, data });
      throw error;
    }
  }

  /**
   * Remove roles from a user
   */
  async removeRoles(data: {
    userId: string;
    roles: string[];
    removedBy: string;
    reason?: string;
    ip: string;
    userAgent: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      const { userId, roles, removedBy, reason, ip, userAgent } = data;

      // Validate user exists
      const user = await User.findById(userId);
      if (!user) {
        throw createError('User not found', 404);
      }

      // Validate remover exists and has admin privileges
      const remover = await User.findById(removedBy);
      if (!remover) {
        throw createError('Remover not found', 404);
      }

      if (!['admin', 'superadmin'].includes(remover.role)) {
        throw createError('Insufficient privileges to remove roles', 403);
      }

      // Prevent removing superadmin role unless remover is superadmin
      if (roles.includes('superadmin') && remover.role !== 'superadmin') {
        throw createError('Only superadmin can remove superadmin role', 403);
      }

      // Prevent removing admin role from non-admin remover
      if (roles.includes('admin') && !['admin', 'superadmin'].includes(remover.role)) {
        throw createError('Only admin or superadmin can remove admin role', 403);
      }

      const oldRoles = (user as any).roles || [];
      const newRoles = (oldRoles as string[]).filter((role: string) => !roles.includes(role));
      
      // Ensure user has at least one role
      if (newRoles.length === 0) {
        throw createError('User must have at least one role', 400);
      }

      (user as any).roles = newRoles;
      await user.save();

      // Log the role removal
      await auditService.logRoleChange({
        actorId: removedBy,
        actorRole: remover.role,
        targetUserId: userId,
        oldRoles,
        newRoles,
        reason,
        ip,
        userAgent
      });

      logger.info('Roles removed from user', {
        userId,
        userName: user.name,
        oldRoles,
        newRoles,
        removedBy,
        removerName: remover.name,
        reason
      });

      return {
        success: true,
        message: `Roles ${roles.join(', ')} removed from ${user.name}`
      };

    } catch (error) {
      logger.error('Error removing roles', { error, data });
      throw error;
    }
  }

  /**
   * Get user roles
   */
  async getUserRoles(userId: string): Promise<{ roles: string[]; user: any }> {
    try {
      const user = await User.findById(userId).select('name email roles');
      if (!user) {
        throw createError('User not found', 404);
      }

      return {
        roles: ((user as any).roles || []) as string[],
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      };

    } catch (error) {
      logger.error('Error getting user roles', { error, userId });
      throw error;
    }
  }

  /**
   * Check if user has specific role
   */
  async hasRole(userId: string, role: string): Promise<boolean> {
    try {
      const user = await User.findById(userId).select('roles');
      if (!user) {
        return false;
      }

      return (((user as any).roles || []) as string[]).includes(role);

    } catch (error) {
      logger.error('Error checking user role', { error, userId, role });
      return false;
    }
  }

  /**
   * Check if user has any of the specified roles
   */
  async hasAnyRole(userId: string, roles: string[]): Promise<boolean> {
    try {
      const user = await User.findById(userId).select('roles');
      if (!user) {
        return false;
      }

      const userRoles = ((user as any).roles || []) as string[];
      return roles.some((role: string) => userRoles.includes(role));

    } catch (error) {
      logger.error('Error checking user roles', { error, userId, roles });
      return false;
    }
  }

  /**
   * Check if user has all of the specified roles
   */
  async hasAllRoles(userId: string, roles: string[]): Promise<boolean> {
    try {
      const user = await User.findById(userId).select('roles');
      if (!user) {
        return false;
      }

      const userRoles = ((user as any).roles || []) as string[];
      return roles.every((role: string) => userRoles.includes(role));

    } catch (error) {
      logger.error('Error checking user roles', { error, userId, roles });
      return false;
    }
  }

  /**
   * Get users by role
   */
  async getUsersByRole(role: string, filters: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}): Promise<{
    users: Array<{ id: string; name: string; email: string; roles: string[] }>;
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const { page = 1, limit = 20, search } = filters;
      const skip = (page - 1) * limit;

      const query: any = { roles: role };
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      const [users, total] = await Promise.all([
        User.find(query)
          .select('name email roles')
          .sort({ name: 1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        User.countDocuments(query)
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        users: users.map((user: any) => ({
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          roles: (user.roles || []) as string[]
        })),
        total,
        page,
        totalPages
      };

    } catch (error) {
      logger.error('Error getting users by role', { error, role, filters });
      throw createError('Failed to get users by role', 500);
    }
  }

  /**
   * Get role statistics
   */
  async getRoleStats(): Promise<any> {
    try {
      const stats = await User.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            roles: { $push: '$roles' }
          }
        },
        {
          $project: {
            _id: 0,
            totalUsers: 1,
            roleCounts: {
              $reduce: {
                input: '$roles',
                initialValue: {},
                in: {
                  $mergeObjects: [
                    '$$value',
                    {
                      $arrayToObject: {
                        $map: {
                          input: '$$this',
                          as: 'role',
                          in: { k: '$$role', v: 1 }
                        }
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      ]);

      const roleCounts = stats[0]?.roleCounts || {};
      const totalUsers = stats[0]?.totalUsers || 0;

      return {
        totalUsers,
        roleCounts,
        rolePercentages: Object.keys(roleCounts).reduce((acc, role) => {
          acc[role] = ((roleCounts[role] / totalUsers) * 100).toFixed(2);
          return acc;
        }, {} as Record<string, string>)
      };

    } catch (error) {
      logger.error('Error getting role statistics', { error });
      throw createError('Failed to get role statistics', 500);
    }
  }

  /**
   * Get role hierarchy
   */
  getRoleHierarchy(): Record<string, { level: number; permissions: string[]; canManage: string[] }> {
    return {
      superadmin: {
        level: 5,
        permissions: ['*'],
        canManage: ['admin', 'superadmin', 'support', 'auditor', 'teacher', 'student', 'parent']
      },
      admin: {
        level: 4,
        permissions: ['manage_users', 'manage_content', 'view_reports', 'manage_settings'],
        canManage: ['support', 'auditor', 'teacher', 'student', 'parent']
      },
      support: {
        level: 3,
        permissions: ['view_users', 'view_content', 'view_reports', 'impersonate_users'],
        canManage: ['teacher', 'student', 'parent']
      },
      auditor: {
        level: 3,
        permissions: ['view_users', 'view_content', 'view_reports', 'view_audit_logs'],
        canManage: []
      },
      teacher: {
        level: 2,
        permissions: ['manage_own_content', 'view_own_students', 'manage_assignments'],
        canManage: ['student']
      },
      student: {
        level: 1,
        permissions: ['view_own_content', 'submit_assignments', 'view_own_progress'],
        canManage: []
      },
      parent: {
        level: 1,
        permissions: ['view_child_progress', 'view_child_content'],
        canManage: []
      }
    };
  }

  /**
   * Check if user can manage another user
   */
  async canManageUser(managerId: string, targetUserId: string): Promise<{
    canManage: boolean;
    reason?: string;
    allowedActions?: string[];
  }> {
    try {
      const [manager, target] = await Promise.all([
        User.findById(managerId).select('roles'),
        User.findById(targetUserId).select('roles')
      ]);

      if (!manager || !target) {
        return {
          canManage: false,
          reason: 'User not found'
        };
      }

      const hierarchy = this.getRoleHierarchy();
      const managerRoles = ((manager as any).roles || []) as string[];
      const targetRoles = ((target as any).roles || []) as string[];

      // Get highest level role for each user
      const managerLevel = Math.max(...managerRoles.map((role: string) => hierarchy[role]?.level || 0));
      const targetLevel = Math.max(...targetRoles.map((role: string) => hierarchy[role]?.level || 0));

      // Check if manager has higher level
      if (managerLevel <= targetLevel) {
        return {
          canManage: false,
          reason: 'Insufficient privileges'
        };
      }

      // Get allowed actions based on manager's roles
      const allowedActions = new Set<string>();
      managerRoles.forEach((role: string) => {
        const roleInfo = hierarchy[role];
        if (roleInfo) {
          roleInfo.permissions.forEach(permission => allowedActions.add(permission));
        }
      });

      return {
        canManage: true,
        allowedActions: Array.from(allowedActions)
      };

    } catch (error) {
      logger.error('Error checking user management permissions', { error, managerId, targetUserId });
      return {
        canManage: false,
        reason: 'Error checking permissions'
      };
    }
  }

  /**
   * Validate role assignment
   */
  validateRoleAssignment(assignerRoles: string[], targetRoles: string[]): {
    isValid: boolean;
    reason?: string;
  } {
    const hierarchy = this.getRoleHierarchy();
    
    // Check if assigner has permission to assign these roles
    for (const targetRole of targetRoles) {
      const canAssign = assignerRoles.some(assignerRole => {
        const roleInfo = hierarchy[assignerRole];
        return roleInfo && roleInfo.canManage.includes(targetRole);
      });

      if (!canAssign) {
        return {
          isValid: false,
          reason: `Cannot assign role: ${targetRole}`
        };
      }
    }

    return { isValid: true };
  }
}

export const authorizationService = new AuthorizationService();
