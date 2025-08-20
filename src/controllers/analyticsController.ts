import { Request, Response } from 'express';
import { analyticsService } from '../services/analyticsService';
import { createError } from '../utils/appError';
import { logger } from '../utils/logger';

export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  planId?: string;
  currency?: string;
  status?: string;
}

export class AnalyticsController {
  /**
   * Get comprehensive dashboard metrics (Admin only)
   */
  async getDashboardMetrics(req: Request, res: Response): Promise<void> {
    try {
      const filters: AnalyticsFilters = req.query;
      
      // Parse date filters
      const analyticsFilters: any = {};
      if (filters.startDate) {
        analyticsFilters.startDate = new Date(filters.startDate);
      }
      if (filters.endDate) {
        analyticsFilters.endDate = new Date(filters.endDate);
      }
      if (filters.currency) {
        analyticsFilters.currency = filters.currency;
      }

      const metrics = await analyticsService.getDashboardMetrics(analyticsFilters);

      res.status(200).json({
        success: true,
        message: 'Dashboard metrics retrieved successfully',
        data: metrics
      });

    } catch (error) {
      logger.error('Error retrieving dashboard metrics', { error });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve dashboard metrics'
      });
    }
  }

  /**
   * Get revenue metrics (Admin only)
   */
  async getRevenueMetrics(req: Request, res: Response): Promise<void> {
    try {
      const filters: AnalyticsFilters = req.query;
      
      const analyticsFilters: any = {};
      if (filters.startDate) {
        analyticsFilters.startDate = new Date(filters.startDate);
      }
      if (filters.endDate) {
        analyticsFilters.endDate = new Date(filters.endDate);
      }
      if (filters.currency) {
        analyticsFilters.currency = filters.currency;
      }

      const metrics = await analyticsService.getRevenueMetrics(analyticsFilters);

      res.status(200).json({
        success: true,
        message: 'Revenue metrics retrieved successfully',
        data: metrics
      });

    } catch (error) {
      logger.error('Error retrieving revenue metrics', { error });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve revenue metrics'
      });
    }
  }

  /**
   * Get subscription metrics (Admin only)
   */
  async getSubscriptionMetrics(req: Request, res: Response): Promise<void> {
    try {
      const filters: AnalyticsFilters = req.query;
      
      const analyticsFilters: any = {};
      if (filters.startDate) {
        analyticsFilters.startDate = new Date(filters.startDate);
      }
      if (filters.endDate) {
        analyticsFilters.endDate = new Date(filters.endDate);
      }

      const metrics = await analyticsService.getSubscriptionMetrics(analyticsFilters);

      res.status(200).json({
        success: true,
        message: 'Subscription metrics retrieved successfully',
        data: metrics
      });

    } catch (error) {
      logger.error('Error retrieving subscription metrics', { error });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve subscription metrics'
      });
    }
  }

  /**
   * Get payment metrics (Admin only)
   */
  async getPaymentMetrics(req: Request, res: Response): Promise<void> {
    try {
      const filters: AnalyticsFilters = req.query;
      
      const analyticsFilters: any = {};
      if (filters.startDate) {
        analyticsFilters.startDate = new Date(filters.startDate);
      }
      if (filters.endDate) {
        analyticsFilters.endDate = new Date(filters.endDate);
      }
      if (filters.currency) {
        analyticsFilters.currency = filters.currency;
      }

      const metrics = await analyticsService.getPaymentMetrics(analyticsFilters);

      res.status(200).json({
        success: true,
        message: 'Payment metrics retrieved successfully',
        data: metrics
      });

    } catch (error) {
      logger.error('Error retrieving payment metrics', { error });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve payment metrics'
      });
    }
  }

  /**
   * Get plan metrics (Admin only)
   */
  async getPlanMetrics(req: Request, res: Response): Promise<void> {
    try {
      const filters: AnalyticsFilters = req.query;
      
      const analyticsFilters: any = {};
      if (filters.startDate) {
        analyticsFilters.startDate = new Date(filters.startDate);
      }
      if (filters.endDate) {
        analyticsFilters.endDate = new Date(filters.endDate);
      }

      const metrics = await analyticsService.getPlanMetrics(analyticsFilters);

      res.status(200).json({
        success: true,
        message: 'Plan metrics retrieved successfully',
        data: metrics
      });

    } catch (error) {
      logger.error('Error retrieving plan metrics', { error });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve plan metrics'
      });
    }
  }

  /**
   * Get coupon metrics (Admin only)
   */
  async getCouponMetrics(req: Request, res: Response): Promise<void> {
    try {
      const filters: AnalyticsFilters = req.query;
      
      const analyticsFilters: any = {};
      if (filters.startDate) {
        analyticsFilters.startDate = new Date(filters.startDate);
      }
      if (filters.endDate) {
        analyticsFilters.endDate = new Date(filters.endDate);
      }

      const metrics = await analyticsService.getCouponMetrics(analyticsFilters);

      res.status(200).json({
        success: true,
        message: 'Coupon metrics retrieved successfully',
        data: metrics
      });

    } catch (error) {
      logger.error('Error retrieving coupon metrics', { error });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve coupon metrics'
      });
    }
  }

  /**
   * Get MRR/ARR metrics (Admin only)
   */
  async getMRRARRMetrics(req: Request, res: Response): Promise<void> {
    try {
      const filters: AnalyticsFilters = req.query;
      
      const analyticsFilters: any = {};
      if (filters.startDate) {
        analyticsFilters.startDate = new Date(filters.startDate);
      }
      if (filters.endDate) {
        analyticsFilters.endDate = new Date(filters.endDate);
      }
      if (filters.currency) {
        analyticsFilters.currency = filters.currency;
      }

      const metrics = await analyticsService.getRevenueMetrics(analyticsFilters);

      res.status(200).json({
        success: true,
        message: 'Revenue metrics retrieved successfully',
        data: {
          mrr: metrics.mrr,
          arr: metrics.arr,
          totalRevenue: metrics.totalRevenue,
          averageRevenuePerUser: metrics.averageRevenuePerUser,
          revenueGrowth: metrics.revenueGrowth
        }
      });

    } catch (error) {
      logger.error('Error retrieving revenue metrics', { error });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve revenue metrics'
      });
    }
  }

  /**
   * Get churn analysis (Admin only)
   */
  async getChurnAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const filters: AnalyticsFilters = req.query;
      
      const analyticsFilters: any = {};
      if (filters.startDate) {
        analyticsFilters.startDate = new Date(filters.startDate);
      }
      if (filters.endDate) {
        analyticsFilters.endDate = new Date(filters.endDate);
      }

      const subscriptionMetrics = await analyticsService.getSubscriptionMetrics(analyticsFilters);

      res.status(200).json({
        success: true,
        message: 'Churn analysis retrieved successfully',
        data: {
          churnRate: subscriptionMetrics.churnRate,
          totalSubscriptions: subscriptionMetrics.totalSubscriptions,
          cancelledSubscriptions: subscriptionMetrics.cancelledSubscriptions,
          trialConversionRate: subscriptionMetrics.trialConversionRate
        }
      });

    } catch (error) {
      logger.error('Error retrieving churn analysis', { error });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve churn analysis'
      });
    }
  }

  /**
   * Get payment success analysis (Admin only)
   */
  async getPaymentSuccessAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const filters: AnalyticsFilters = req.query;
      
      const analyticsFilters: any = {};
      if (filters.startDate) {
        analyticsFilters.startDate = new Date(filters.startDate);
      }
      if (filters.endDate) {
        analyticsFilters.endDate = new Date(filters.endDate);
      }
      if (filters.currency) {
        analyticsFilters.currency = filters.currency;
      }

      const paymentMetrics = await analyticsService.getPaymentMetrics(analyticsFilters);

      res.status(200).json({
        success: true,
        message: 'Payment success analysis retrieved successfully',
        data: {
          paymentSuccessRate: paymentMetrics.paymentSuccessRate,
          totalPayments: paymentMetrics.totalPayments,
          successfulPayments: paymentMetrics.successfulPayments,
          failedPayments: paymentMetrics.failedPayments,
          refundRate: paymentMetrics.refundRate,
          paymentMethodDistribution: paymentMetrics.paymentMethodDistribution
        }
      });

    } catch (error) {
      logger.error('Error retrieving payment success analysis', { error });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve payment success analysis'
      });
    }
  }

  /**
   * Export analytics data (Admin only)
   */
  async exportAnalyticsData(req: Request, res: Response): Promise<void> {
    try {
      const { format = 'json', type = 'dashboard' } = req.query;
      const filters: AnalyticsFilters = req.query;
      
      const analyticsFilters: any = {};
      if (filters.startDate) {
        analyticsFilters.startDate = new Date(filters.startDate);
      }
      if (filters.endDate) {
        analyticsFilters.endDate = new Date(filters.endDate);
      }
      if (filters.currency) {
        analyticsFilters.currency = filters.currency;
      }

      let data: any;

      switch (type) {
        case 'dashboard':
          data = await analyticsService.getDashboardMetrics(analyticsFilters);
          break;
        case 'revenue':
          data = await analyticsService.getRevenueMetrics(analyticsFilters);
          break;
        case 'subscriptions':
          data = await analyticsService.getSubscriptionMetrics(analyticsFilters);
          break;
        case 'payments':
          data = await analyticsService.getPaymentMetrics(analyticsFilters);
          break;
        case 'plans':
          data = await analyticsService.getPlanMetrics(analyticsFilters);
          break;
        case 'coupons':
          data = await analyticsService.getCouponMetrics(analyticsFilters);
          break;
        default:
          throw createError('Invalid analytics type', 400);
      }

      if (format === 'csv') {
        // TODO: Implement CSV export
        res.status(200).json({
          success: true,
          message: 'CSV export not yet implemented',
          data: data
        });
      } else {
        res.status(200).json({
          success: true,
          message: 'Analytics data exported successfully',
          data: data
        });
      }

    } catch (error) {
      logger.error('Error exporting analytics data', { error });
      res.status(500).json({
        success: false,
        message: 'Failed to export analytics data'
      });
    }
  }
}

export const analyticsController = new AnalyticsController();
