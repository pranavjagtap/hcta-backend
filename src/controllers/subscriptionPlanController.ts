import { Request, Response } from 'express';
import { SubscriptionPlan } from '../models';
import { createError } from '../utils/appError';
import { logger } from '../utils/logger';
import { 
  CreateSubscriptionPlanRequest, 
  UpdateSubscriptionPlanRequest, 
  SubscriptionPlanFilters,
  SubscriptionPlanResponse,
  ApiResponse,
  PaginatedResponse 
} from '../types/payment';

export class SubscriptionPlanController {
  /**
   * Create a new subscription plan (Admin only)
   */
  async createPlan(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateSubscriptionPlanRequest = req.body;

      // Check if plan with same name already exists
      const existingPlan = await SubscriptionPlan.findOne({ name: data.name });
      if (existingPlan) {
        throw createError('Plan with this name already exists', 400);
      }

      const plan = new SubscriptionPlan(data);
      await plan.save();

      logger.info('Subscription plan created', { planId: plan._id, name: plan.name });

      const response: ApiResponse<SubscriptionPlanResponse> = {
        success: true,
        message: 'Subscription plan created successfully',
        data: this.formatPlanResponse(plan),
      };

      res.status(201).json(response);
    } catch (error: any) {
      logger.error('Error creating subscription plan', { error: error?.message || error });
      res.status(error?.statusCode || 500).json({
        success: false,
        message: error?.message || 'Failed to create subscription plan',
      });
    }
  }

  /**
   * Get all subscription plans
   */
  async getPlans(req: Request, res: Response): Promise<void> {
    try {
      const filters: SubscriptionPlanFilters = {
        isActive: req.query.isActive === 'true',
        duration: req.query.duration as 'monthly' | 'yearly',
        priceRange: req.query.minPrice && req.query.maxPrice ? {
          min: Number(req.query.minPrice),
          max: Number(req.query.maxPrice),
        } : undefined,
        search: req.query.search as string,
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 20,
      };

      const query: any = {};

      if (filters.isActive !== undefined) {
        query.isActive = filters.isActive;
      }

      if (filters.duration) {
        query.duration = filters.duration;
      }

      if (filters.priceRange) {
        query.price = {
          $gte: filters.priceRange.min,
          $lte: filters.priceRange.max,
        };
      }

      if (filters.search) {
        query.$or = [
          { name: { $regex: filters.search, $options: 'i' } },
          { description: { $regex: filters.search, $options: 'i' } },
        ];
      }

      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;

      const [plans, total] = await Promise.all([
        SubscriptionPlan.find(query)
          .sort({ sortOrder: 1, price: 1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        SubscriptionPlan.countDocuments(query),
      ]);

      const totalPages = Math.ceil(total / limit);

      const response: ApiResponse<PaginatedResponse<SubscriptionPlanResponse>> = {
        success: true,
        message: 'Subscription plans retrieved successfully',
        data: {
          data: plans.map(plan => this.formatPlanResponse(plan)),
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        },
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error getting subscription plans', { error: error?.message || error });
      res.status(error?.statusCode || 500).json({
        success: false,
        message: error?.message || 'Failed to get subscription plans',
      });
    }
  }

  /**
   * Get active subscription plans (for public display)
   */
  async getActivePlans(req: Request, res: Response): Promise<void> {
    try {
      const plans = await SubscriptionPlan.getActivePlans();

      const response: ApiResponse<SubscriptionPlanResponse[]> = {
        success: true,
        message: 'Active subscription plans retrieved successfully',
        data: plans.map(plan => this.formatPlanResponse(plan)),
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error getting active subscription plans', { error: error?.message || error });
      res.status(error?.statusCode || 500).json({
        success: false,
        message: error?.message || 'Failed to get active subscription plans',
      });
    }
  }

  /**
   * Get popular subscription plans
   */
  async getPopularPlans(req: Request, res: Response): Promise<void> {
    try {
      const plans = await SubscriptionPlan.getPopularPlans();

      const response: ApiResponse<SubscriptionPlanResponse[]> = {
        success: true,
        message: 'Popular subscription plans retrieved successfully',
        data: plans.map(plan => this.formatPlanResponse(plan)),
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error getting popular subscription plans', { error: error?.message || error });
      res.status(error?.statusCode || 500).json({
        success: false,
        message: error?.message || 'Failed to get popular subscription plans',
      });
    }
  }

  /**
   * Get subscription plan by ID
   */
  async getPlanById(req: Request, res: Response): Promise<void> {
    try {
      const { planId } = req.params;

      const plan = await SubscriptionPlan.findById(planId).lean();
      if (!plan) {
        throw createError('Subscription plan not found', 404);
      }

      const response: ApiResponse<SubscriptionPlanResponse> = {
        success: true,
        message: 'Subscription plan retrieved successfully',
        data: this.formatPlanResponse(plan),
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error getting subscription plan by ID', { planId: req.params.planId, error: error?.message || error });
      res.status(error?.statusCode || 500).json({
        success: false,
        message: error?.message || 'Failed to get subscription plan',
      });
    }
  }

  /**
   * Update subscription plan (Admin only)
   */
  async updatePlan(req: Request, res: Response): Promise<void> {
    try {
      const { planId } = req.params;
      const data: UpdateSubscriptionPlanRequest = req.body;

      const plan = await SubscriptionPlan.findById(planId);
      if (!plan) {
        throw createError('Subscription plan not found', 404);
      }

      // Check if name is being changed and if it conflicts with existing plan
      if (data.name && data.name !== plan.name) {
        const existingPlan = await SubscriptionPlan.findOne({ 
          name: data.name, 
          _id: { $ne: planId } 
        });
        if (existingPlan) {
          throw createError('Plan with this name already exists', 400);
        }
      }

      Object.assign(plan, data);
      await plan.save();

      logger.info('Subscription plan updated', { planId, name: plan.name });

      const response: ApiResponse<SubscriptionPlanResponse> = {
        success: true,
        message: 'Subscription plan updated successfully',
        data: this.formatPlanResponse(plan),
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error updating subscription plan', { planId: req.params.planId, error: error?.message || error });
      res.status(error?.statusCode || 500).json({
        success: false,
        message: error?.message || 'Failed to update subscription plan',
      });
    }
  }

  /**
   * Delete subscription plan (Admin only)
   */
  async deletePlan(req: Request, res: Response): Promise<void> {
    try {
      const { planId } = req.params;

      const plan = await SubscriptionPlan.findById(planId);
      if (!plan) {
        throw createError('Subscription plan not found', 404);
      }

      // Check if plan has active subscriptions
      const { Subscription } = await import('../models');
      const activeSubscriptions = await Subscription.countDocuments({ 
        planId, 
        status: { $in: ['active', 'trial'] } 
      });

      if (activeSubscriptions > 0) {
        throw createError('Cannot delete plan with active subscriptions', 400);
      }

      await SubscriptionPlan.findByIdAndDelete(planId);

      logger.info('Subscription plan deleted', { planId, name: plan.name });

      const response: ApiResponse<null> = {
        success: true,
        message: 'Subscription plan deleted successfully',
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error deleting subscription plan', { planId: req.params.planId, error: error?.message || error });
      res.status(error?.statusCode || 500).json({
        success: false,
        message: error?.message || 'Failed to delete subscription plan',
      });
    }
  }

  /**
   * Toggle plan active status (Admin only)
   */
  async togglePlanStatus(req: Request, res: Response): Promise<void> {
    try {
      const { planId } = req.params;

      const plan = await SubscriptionPlan.findById(planId);
      if (!plan) {
        throw createError('Subscription plan not found', 404);
      }

      plan.isActive = !plan.isActive;
      await plan.save();

      logger.info('Subscription plan status toggled', { 
        planId, 
        name: plan.name, 
        isActive: plan.isActive 
      });

      const response: ApiResponse<SubscriptionPlanResponse> = {
        success: true,
        message: `Subscription plan ${plan.isActive ? 'activated' : 'deactivated'} successfully`,
        data: this.formatPlanResponse(plan),
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error toggling subscription plan status', { planId: req.params.planId, error: error?.message || error });
      res.status(error?.statusCode || 500).json({
        success: false,
        message: error?.message || 'Failed to toggle subscription plan status',
      });
    }
  }

  /**
   * Set plan as popular (Admin only)
   */
  async setPopularPlan(req: Request, res: Response): Promise<void> {
    try {
      const { planId } = req.params;
      const { isPopular } = req.body;

      const plan = await SubscriptionPlan.findById(planId);
      if (!plan) {
        throw createError('Subscription plan not found', 404);
      }

      plan.isPopular = isPopular;
      await plan.save();

      logger.info('Subscription plan popularity updated', { 
        planId, 
        name: plan.name, 
        isPopular: plan.isPopular 
      });

      const response: ApiResponse<SubscriptionPlanResponse> = {
        success: true,
        message: `Subscription plan ${isPopular ? 'marked as popular' : 'removed from popular'} successfully`,
        data: this.formatPlanResponse(plan),
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error setting plan popularity', { planId: req.params.planId, error: error?.message || error });
      res.status(error?.statusCode || 500).json({
        success: false,
        message: error?.message || 'Failed to update plan popularity',
      });
    }
  }

  /**
   * Update plan sort order (Admin only)
   */
  async updatePlanSortOrder(req: Request, res: Response): Promise<void> {
    try {
      const { planId } = req.params;
      const { sortOrder } = req.body;

      const plan = await SubscriptionPlan.findById(planId);
      if (!plan) {
        throw createError('Subscription plan not found', 404);
      }

      plan.sortOrder = sortOrder;
      await plan.save();

      logger.info('Subscription plan sort order updated', { 
        planId, 
        name: plan.name, 
        sortOrder: plan.sortOrder 
      });

      const response: ApiResponse<SubscriptionPlanResponse> = {
        success: true,
        message: 'Subscription plan sort order updated successfully',
        data: this.formatPlanResponse(plan),
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error updating plan sort order', { planId: req.params.planId, error: error?.message || error });
      res.status(error?.statusCode || 500).json({
        success: false,
        message: error?.message || 'Failed to update plan sort order',
      });
    }
  }

  /**
   * Format plan response
   */
  private formatPlanResponse(plan: any): SubscriptionPlanResponse {
    return {
      _id: plan._id.toString(),
      name: plan.name,
      description: plan.description,
      features: plan.features,
      duration: plan.duration,
      price: plan.price,
      currency: plan.currency,
      formattedPrice: plan.formattedPrice || `${plan.currency} ${plan.price.toFixed(2)}`,
      annualPrice: plan.annualPrice || (plan.duration === 'monthly' ? plan.price * 12 : plan.price),
      trialDays: plan.trialDays,
      maxUsers: plan.maxUsers,
      maxStorage: plan.maxStorage,
      isActive: plan.isActive,
      isPopular: plan.isPopular,
      sortOrder: plan.sortOrder,
      metadata: plan.metadata,
      createdAt: plan.createdAt.toISOString(),
      updatedAt: plan.updatedAt.toISOString(),
    };
  }
}

export const subscriptionPlanController = new SubscriptionPlanController();
