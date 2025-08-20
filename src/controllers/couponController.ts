import { Request, Response } from 'express';
import { Coupon } from '../models';
import { createError } from '../utils/appError';
import { logger } from '../utils/logger';
import {
  ApiResponse,
  PaginatedResponse
} from '../types/payment';

export interface CreateCouponRequest {
  code: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed';
  value: number;
  currency: string;
  minAmount?: number;
  maxDiscount?: number;
  validFrom: Date;
  validUntil: Date;
  usageLimit: number;
  allowedPlans?: string[];
  excludedPlans?: string[];
  isFirstTimeOnly?: boolean;
  metadata?: {
    campaignId?: string;
    notes?: string;
  };
}

export interface UpdateCouponRequest {
  code?: string;
  name?: string;
  description?: string;
  value?: number;
  minAmount?: number;
  maxDiscount?: number;
  validFrom?: Date;
  validUntil?: Date;
  usageLimit?: number;
  allowedPlans?: string[];
  excludedPlans?: string[];
  isActive?: boolean;
  isFirstTimeOnly?: boolean;
  metadata?: {
    campaignId?: string;
    notes?: string;
  };
}

export interface CouponFilters {
  isActive?: boolean;
  type?: 'percentage' | 'fixed';
  currency?: string;
  validFrom?: Date;
  validUntil?: Date;
  search?: string;
  page?: number;
  limit?: number;
}

export class CouponController {
  /**
   * Create a new coupon (Admin only)
   */
  async createCoupon(req: Request, res: Response): Promise<void> {
    try {
      const couponData: CreateCouponRequest = req.body;
      const userId = req.user!._id;

      // Check if coupon code already exists
      const existingCoupon = await Coupon.getCouponByCode(couponData.code);
      if (existingCoupon) {
        throw createError('Coupon code already exists', 400);
      }

      // Create new coupon
      const coupon = new Coupon({
        ...couponData,
        metadata: {
          ...couponData.metadata,
          createdBy: userId
        }
      });

      await coupon.save();

      logger.info('Coupon created successfully', {
        couponId: coupon._id,
        code: coupon.code,
        createdBy: userId
      });

      res.status(201).json({
        success: true,
        message: 'Coupon created successfully',
        data: this.formatCouponResponse(coupon)
      });

    } catch (error: any) {
      logger.error('Error creating coupon', { error, userId: req.user!._id });
      res.status(error?.statusCode || 500).json({
        success: false,
        message: error?.message || 'Failed to create coupon'
      });
    }
  }

  /**
   * Get all coupons with filters (Admin only)
   */
  async getCoupons(req: Request, res: Response): Promise<void> {
    try {
      const filters: CouponFilters = req.query as any;
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      // Build query
      const query: any = {};
      
      if (filters.isActive !== undefined) {
        query.isActive = filters.isActive;
      }
      
      if (filters.type) {
        query.type = filters.type;
      }
      
      if (filters.currency) {
        query.currency = filters.currency;
      }
      
      if (filters.validFrom) {
        query.validFrom = { $gte: new Date(filters.validFrom) };
      }
      
      if (filters.validUntil) {
        query.validUntil = { $lte: new Date(filters.validUntil) };
      }
      
      if (filters.search) {
        query.$or = [
          { code: { $regex: filters.search, $options: 'i' } },
          { name: { $regex: filters.search, $options: 'i' } },
          { description: { $regex: filters.search, $options: 'i' } }
        ];
      }

      // Execute query
      const [coupons, total] = await Promise.all([
        Coupon.find(query)
          .populate('allowedPlans', 'name')
          .populate('excludedPlans', 'name')
          .populate('metadata.createdBy', 'name email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Coupon.countDocuments(query)
      ]);

      const totalPages = Math.ceil(total / limit);

      res.status(200).json({
        success: true,
        message: 'Coupons retrieved successfully',
        data: {
          coupons: coupons.map(coupon => this.formatCouponResponse(coupon)),
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }
      });

    } catch (error: any) {
      logger.error('Error retrieving coupons', { error });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve coupons'
      });
    }
  }

  /**
   * Get active coupons (Public)
   */
  async getActiveCoupons(req: Request, res: Response): Promise<void> {
    try {
      const coupons = await Coupon.getActiveCoupons();

      res.status(200).json({
        success: true,
        message: 'Active coupons retrieved successfully',
        data: {
          coupons: coupons.map(coupon => this.formatCouponResponse(coupon))
        }
      });

    } catch (error: any) {
      logger.error('Error retrieving active coupons', { error });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve active coupons'
      });
    }
  }

  /**
   * Get coupon by ID (Admin only)
   */
  async getCouponById(req: Request, res: Response): Promise<void> {
    try {
      const { couponId } = req.params;

      const coupon = await Coupon.findById(couponId)
        .populate('allowedPlans', 'name price')
        .populate('excludedPlans', 'name price')
        .populate('metadata.createdBy', 'name email')
        .lean();

      if (!coupon) {
        throw createError('Coupon not found', 404);
      }

      res.status(200).json({
        success: true,
        message: 'Coupon retrieved successfully',
        data: this.formatCouponResponse(coupon)
      });

    } catch (error: any) {
      logger.error('Error retrieving coupon', { error, couponId: req.params.couponId });
      res.status(error?.statusCode || 500).json({
        success: false,
        message: error?.message || 'Failed to retrieve coupon'
      });
    }
  }

  /**
   * Update coupon (Admin only)
   */
  async updateCoupon(req: Request, res: Response): Promise<void> {
    try {
      const { couponId } = req.params;
      const updateData: UpdateCouponRequest = req.body;

      const coupon = await Coupon.findById(couponId);
      if (!coupon) {
        throw createError('Coupon not found', 404);
      }

      // Check if code is being changed and if it already exists
      if (updateData.code && updateData.code !== coupon.code) {
        const existingCoupon = await Coupon.getCouponByCode(updateData.code);
        if (existingCoupon) {
          throw createError('Coupon code already exists', 400);
        }
      }

      // Update coupon
      Object.assign(coupon, updateData);
      await coupon.save();

      logger.info('Coupon updated successfully', {
        couponId: coupon._id,
        updatedBy: req.user!._id
      });

      res.status(200).json({
        success: true,
        message: 'Coupon updated successfully',
        data: this.formatCouponResponse(coupon)
      });

    } catch (error: any) {
      logger.error('Error updating coupon', { error, couponId: req.params.couponId });
      res.status(error?.statusCode || 500).json({
        success: false,
        message: error?.message || 'Failed to update coupon'
      });
    }
  }

  /**
   * Delete coupon (Admin only)
   */
  async deleteCoupon(req: Request, res: Response): Promise<void> {
    try {
      const { couponId } = req.params;

      const coupon = await Coupon.findById(couponId);
      if (!coupon) {
        throw createError('Coupon not found', 404);
      }

      // Check if coupon has been used
      if (coupon.usedCount > 0) {
        throw createError('Cannot delete coupon that has been used', 400);
      }

      await Coupon.findByIdAndDelete(couponId);

      logger.info('Coupon deleted successfully', {
        couponId: coupon._id,
        deletedBy: req.user!._id
      });

      res.status(200).json({
        success: true,
        message: 'Coupon deleted successfully'
      });

    } catch (error: any) {
      logger.error('Error deleting coupon', { error, couponId: req.params.couponId });
      res.status(error?.statusCode || 500).json({
        success: false,
        message: error?.message || 'Failed to delete coupon'
      });
    }
  }

  /**
   * Toggle coupon status (Admin only)
   */
  async toggleCouponStatus(req: Request, res: Response): Promise<void> {
    try {
      const { couponId } = req.params;

      const coupon = await Coupon.findById(couponId);
      if (!coupon) {
        throw createError('Coupon not found', 404);
      }

      coupon.isActive = !coupon.isActive;
      await coupon.save();

      logger.info('Coupon status toggled', {
        couponId: coupon._id,
        newStatus: coupon.isActive,
        toggledBy: req.user!._id
      });

      res.status(200).json({
        success: true,
        message: `Coupon ${coupon.isActive ? 'activated' : 'deactivated'} successfully`,
        data: {
          isActive: coupon.isActive
        }
      });

    } catch (error: any) {
      logger.error('Error toggling coupon status', { error, couponId: req.params.couponId });
      res.status(error?.statusCode || 500).json({
        success: false,
        message: error?.message || 'Failed to toggle coupon status'
      });
    }
  }

  /**
   * Validate coupon code (Public)
   */
  async validateCoupon(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.params;
      const { planId, amount } = req.query;
      const userId = req.user!._id;

      if (!planId || !amount) {
        throw createError('Plan ID and amount are required', 400);
      }

      const validation = await Coupon.validateCoupon(
        code,
        userId,
        planId as string,
        parseFloat(amount as string)
      );

      res.status(200).json({
        success: true,
        message: validation.valid ? 'Coupon is valid' : 'Coupon is invalid',
        data: {
          valid: validation.valid,
          message: validation.message,
          discount: validation.discount
        }
      });

    } catch (error: any) {
      logger.error('Error validating coupon', { error, code: req.params.code });
      res.status(error?.statusCode || 500).json({
        success: false,
        message: error?.message || 'Failed to validate coupon'
      });
    }
  }

  /**
   * Get coupon statistics (Admin only)
   */
  async getCouponStats(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;
      
      const filters: any = {};
      if (startDate && endDate) {
        filters.startDate = new Date(startDate as string);
        filters.endDate = new Date(endDate as string);
      }

      const stats = await Coupon.getCouponStats(filters);

      res.status(200).json({
        success: true,
        message: 'Coupon statistics retrieved successfully',
        data: stats
      });

    } catch (error: any) {
      logger.error('Error retrieving coupon statistics', { error });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve coupon statistics'
      });
    }
  }

  /**
   * Format coupon response
   */
  private formatCouponResponse(coupon: any) {
    return {
      id: coupon._id,
      code: coupon.code,
      name: coupon.name,
      description: coupon.description,
      type: coupon.type,
      value: coupon.value,
      currency: coupon.currency,
      minAmount: coupon.minAmount,
      maxDiscount: coupon.maxDiscount,
      validFrom: coupon.validFrom,
      validUntil: coupon.validUntil,
      usageLimit: coupon.usageLimit,
      usedCount: coupon.usedCount,
      remainingUsage: coupon.remainingUsage,
      allowedPlans: coupon.allowedPlans,
      excludedPlans: coupon.excludedPlans,
      isActive: coupon.isActive,
      isFirstTimeOnly: coupon.isFirstTimeOnly,
      isExpired: coupon.isExpired,
      isValid: coupon.isValid,
      usagePercentage: coupon.usagePercentage,
      metadata: coupon.metadata,
      createdAt: coupon.createdAt,
      updatedAt: coupon.updatedAt
    };
  }
}

export const couponController = new CouponController();
