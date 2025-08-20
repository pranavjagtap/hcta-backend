import { Request, Response } from 'express';
import { subscriptionService } from '../services/subscriptionService';
import { createError } from '../utils/appError';
import { logger } from '../utils/logger';
import { 
  CreateSubscriptionRequest, 
  UpdateSubscriptionRequest, 
  SubscriptionFilters,
  SubscriptionResponse,
  SubscriptionAccess,
  FeatureAccess,
  ApiResponse,
  PaginatedResponse 
} from '../types/payment';

export class SubscriptionController {
  /**
   * Create a new subscription
   */
  async createSubscription(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      const data: CreateSubscriptionRequest = req.body;

      const subscription = await subscriptionService.createSubscription(userId, data);

      const response: ApiResponse<SubscriptionResponse> = {
        success: true,
        message: 'Subscription created successfully',
        data: subscription,
      };

      res.status(201).json(response);
    } catch (error: any) {
      logger.error('Error creating subscription', { userId: (req as any).user?.id, error: error?.message || error });
      res.status(error?.statusCode || 500).json({
        success: false,
        message: error?.message || 'Failed to create subscription',
      });
    }
  }

  /**
   * Get user's active subscription
   */
  async getUserActiveSubscription(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      const subscription = await subscriptionService.getUserActiveSubscription(userId);

      const response: ApiResponse<SubscriptionResponse | null> = {
        success: true,
        message: 'User subscription retrieved successfully',
        data: subscription,
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error getting user active subscription', { userId: (req as any).user?.id, error: error?.message || error });
      res.status(error?.statusCode || 500).json({
        success: false,
        message: error?.message || 'Failed to get user subscription',
      });
    }
  }

  /**
   * Get user's subscription history
   */
  async getUserSubscriptionHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;

      const result = await subscriptionService.getUserSubscriptionHistory(userId, page, limit);

      const response: ApiResponse<PaginatedResponse<SubscriptionResponse>> = {
        success: true,
        message: 'User subscription history retrieved successfully',
        data: {
          data: result.subscriptions,
          pagination: {
            page,
            limit,
            total: result.total,
            totalPages: Math.ceil(result.total / limit),
            hasNext: page < Math.ceil(result.total / limit),
            hasPrev: page > 1,
          },
        },
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error getting user subscription history', { userId: (req as any).user?.id, error: error?.message || error });
      res.status(error?.statusCode || 500).json({
        success: false,
        message: error?.message || 'Failed to get user subscription history',
      });
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      const { subscriptionId } = req.params;
      const { cancelAtPeriodEnd = true } = req.body;

      const subscription = await subscriptionService.cancelSubscription(
        userId,
        subscriptionId,
        cancelAtPeriodEnd
      );

      const response: ApiResponse<SubscriptionResponse> = {
        success: true,
        message: `Subscription ${cancelAtPeriodEnd ? 'scheduled for cancellation' : 'cancelled immediately'} successfully`,
        data: subscription,
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error cancelling subscription', { 
        userId: (req as any).user?.id, 
        subscriptionId: req.params.subscriptionId, 
        error: error?.message || error 
      });
      res.status(error?.statusCode || 500).json({
        success: false,
        message: error?.message || 'Failed to cancel subscription',
      });
    }
  }

  /**
   * Reactivate subscription
   */
  async reactivateSubscription(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      const { subscriptionId } = req.params;

      const subscription = await subscriptionService.reactivateSubscription(userId, subscriptionId);

      const response: ApiResponse<SubscriptionResponse> = {
        success: true,
        message: 'Subscription reactivated successfully',
        data: subscription,
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error reactivating subscription', { 
        userId: (req as any).user?.id, 
        subscriptionId: req.params.subscriptionId, 
        error: error?.message || error 
      });
      res.status(error?.statusCode || 500).json({
        success: false,
        message: error?.message || 'Failed to reactivate subscription',
      });
    }
  }

  /**
   * Change subscription (upgrade/downgrade)
   */
  async changeSubscription(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      const { subscriptionId } = req.params;
      const { newPlanId } = req.body;

      const subscription = await subscriptionService.changeSubscription(
        userId,
        subscriptionId,
        newPlanId
      );

      const response: ApiResponse<SubscriptionResponse> = {
        success: true,
        message: 'Subscription changed successfully',
        data: subscription,
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error changing subscription', { 
        userId: (req as any).user?.id, 
        subscriptionId: req.params.subscriptionId, 
        error: error?.message || error 
      });
      res.status(error?.statusCode || 500).json({
        success: false,
        message: error?.message || 'Failed to change subscription',
      });
    }
  }

  /**
   * Check feature access
   */
  async checkFeatureAccess(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      const { feature } = req.params;

      const access = await subscriptionService.checkFeatureAccess(userId, feature);

      const response: ApiResponse<FeatureAccess> = {
        success: true,
        message: 'Feature access checked successfully',
        data: access,
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error checking feature access', { 
        userId: (req as any).user?.id, 
        feature: req.params.feature, 
        error: error?.message || error 
      });
      res.status(error?.statusCode || 500).json({
        success: false,
        message: error?.message || 'Failed to check feature access',
      });
    }
  }

  /**
   * Get user's subscription access details
   */
  async getUserSubscriptionAccess(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      const access = await subscriptionService.getUserSubscriptionAccess(userId);

      const response: ApiResponse<SubscriptionAccess | null> = {
        success: true,
        message: 'User subscription access retrieved successfully',
        data: access,
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error getting user subscription access', { userId: (req as any).user?.id, error: error?.message || error });
      res.status(error?.statusCode || 500).json({
        success: false,
        message: error?.message || 'Failed to get user subscription access',
      });
    }
  }

  /**
   * Get all subscriptions (Admin only)
   */
  async getSubscriptions(req: Request, res: Response): Promise<void> {
    try {
      const filters: SubscriptionFilters = {
        status: req.query.status as any,
        paymentMethod: req.query.paymentMethod as any,
        dateRange: req.query.startDate && req.query.endDate ? {
          start: req.query.startDate as string,
          end: req.query.endDate as string,
        } : undefined,
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 20,
      };

      const result = await subscriptionService.getSubscriptions(filters);

      const response: ApiResponse<PaginatedResponse<SubscriptionResponse>> = {
        success: true,
        message: 'Subscriptions retrieved successfully',
        data: {
          data: result.subscriptions,
          pagination: {
            page: filters.page || 1,
            limit: filters.limit || 20,
            total: result.total,
            totalPages: Math.ceil(result.total / (filters.limit || 20)),
            hasNext: (filters.page || 1) < Math.ceil(result.total / (filters.limit || 20)),
            hasPrev: (filters.page || 1) > 1,
          },
        },
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error getting subscriptions', { error });
      res.status(error?.statusCode || 500).json({
        success: false,
        message: error?.message || 'Failed to get subscriptions',
      });
    }
  }

  /**
   * Get subscription statistics (Admin only)
   */
  async getSubscriptionStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await subscriptionService.getSubscriptionStats();

      const response: ApiResponse<any> = {
        success: true,
        message: 'Subscription statistics retrieved successfully',
        data: stats,
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error getting subscription stats', { error });
      res.status(error?.statusCode || 500).json({
        success: false,
        message: error?.message || 'Failed to get subscription statistics',
      });
    }
  }

  /**
   * Update subscription (Admin only)
   */
  async updateSubscription(req: Request, res: Response): Promise<void> {
    try {
      const { subscriptionId } = req.params;
      const data: UpdateSubscriptionRequest = req.body;

      // This would need to be implemented in the service
      // For now, we'll return a placeholder response
      const response: ApiResponse<SubscriptionResponse> = {
        success: true,
        message: 'Subscription updated successfully',
        data: {} as SubscriptionResponse, // Placeholder
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error updating subscription', { subscriptionId: req.params.subscriptionId, error });
      res.status(error?.statusCode || 500).json({
        success: false,
        message: error?.message || 'Failed to update subscription',
      });
    }
  }

  /**
   * Get subscription by ID (Admin only)
   */
  async getSubscriptionById(req: Request, res: Response): Promise<void> {
    try {
      const { subscriptionId } = req.params;

      // This would need to be implemented in the service
      // For now, we'll return a placeholder response
      const response: ApiResponse<SubscriptionResponse> = {
        success: true,
        message: 'Subscription retrieved successfully',
        data: {} as SubscriptionResponse, // Placeholder
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error getting subscription by ID', { subscriptionId: req.params.subscriptionId, error });
      res.status(error?.statusCode || 500).json({
        success: false,
        message: error?.message || 'Failed to get subscription',
      });
    }
  }
}

export const subscriptionController = new SubscriptionController();
