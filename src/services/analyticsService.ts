import { Subscription, Payment, SubscriptionPlan, Coupon } from '../models';
import { createError } from '../utils/appError';
import { logger } from '../utils/logger';

export interface RevenueMetrics {
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue
  totalRevenue: number;
  averageRevenuePerUser: number;
  revenueGrowth: number; // Percentage growth from previous period
}

export interface SubscriptionMetrics {
  totalSubscriptions: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
  cancelledSubscriptions: number;
  churnRate: number; // Monthly churn rate
  trialConversionRate: number;
  averageSubscriptionValue: number;
  subscriptionGrowth: number;
}

export interface PaymentMetrics {
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  paymentSuccessRate: number;
  averagePaymentValue: number;
  refundRate: number;
  paymentMethodDistribution: {
    stripe: number;
    razorpay: number;
  };
}

export interface PlanMetrics {
  planDistribution: Array<{
    planId: string;
    planName: string;
    count: number;
    revenue: number;
    percentage: number;
  }>;
  popularPlans: Array<{
    planId: string;
    planName: string;
    subscriptions: number;
  }>;
}

export interface CouponMetrics {
  totalCoupons: number;
  activeCoupons: number;
  totalUsage: number;
  averageUsage: number;
  totalDiscount: number;
  averageDiscount: number;
}

export interface AnalyticsFilters {
  startDate?: Date;
  endDate?: Date;
  planId?: string;
  currency?: string;
  status?: string;
}

export class AnalyticsService {
  /**
   * Get comprehensive revenue metrics
   */
  async getRevenueMetrics(filters: AnalyticsFilters = {}): Promise<RevenueMetrics> {
    try {
      const { startDate, endDate, currency = 'INR' } = filters;
      
      // Get current period metrics
      const currentMetrics = await this.calculateRevenueMetrics(startDate, endDate, currency);
      
      // Get previous period metrics for growth calculation
      const previousStartDate = startDate ? new Date(startDate.getTime() - (endDate?.getTime() || Date.now() - startDate.getTime())) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const previousEndDate = startDate || new Date();
      const previousMetrics = await this.calculateRevenueMetrics(previousStartDate, previousEndDate, currency);
      
      // Calculate growth
      const revenueGrowth = previousMetrics.totalRevenue > 0 
        ? ((currentMetrics.totalRevenue - previousMetrics.totalRevenue) / previousMetrics.totalRevenue) * 100
        : 0;

      return {
        ...currentMetrics,
        revenueGrowth
      };

    } catch (error) {
      logger.error('Error calculating revenue metrics', { error, filters });
      throw createError('Failed to calculate revenue metrics', 500);
    }
  }

  /**
   * Get subscription metrics
   */
  async getSubscriptionMetrics(filters: AnalyticsFilters = {}): Promise<SubscriptionMetrics> {
    try {
      const { startDate, endDate } = filters;
      
      const match: any = {};
      if (startDate && endDate) {
        match.createdAt = { $gte: startDate, $lte: endDate };
      }

      // Get subscription counts by status
      const statusPipeline = [
        { $match: match },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ];

      const statusStats = await Subscription.aggregate(statusPipeline);
      
      // Calculate totals
      const totalSubscriptions = statusStats.reduce((sum, stat) => sum + stat.count, 0);
      const activeSubscriptions = statusStats.find(s => s._id === 'active')?.count || 0;
      const trialSubscriptions = statusStats.find(s => s._id === 'trial')?.count || 0;
      const cancelledSubscriptions = statusStats.find(s => s._id === 'cancelled')?.count || 0;

      // Calculate churn rate (cancelled / total active at start of period)
      const churnRate = totalSubscriptions > 0 ? (cancelledSubscriptions / totalSubscriptions) * 100 : 0;

      // Calculate trial conversion rate
      const conversionPipeline = [
        { $match: { status: 'trial', ...match } },
        {
          $lookup: {
            from: 'subscriptions',
            localField: 'userId',
            foreignField: 'userId',
            as: 'conversions'
          }
        },
        {
          $match: {
            'conversions.status': 'active'
          }
        },
        {
          $count: 'convertedTrials'
        }
      ];

      const conversionResult = await Subscription.aggregate(conversionPipeline);
      const convertedTrials = conversionResult[0]?.convertedTrials || 0;
      const trialConversionRate = trialSubscriptions > 0 ? (convertedTrials / trialSubscriptions) * 100 : 0;

      // Calculate average subscription value
      const avgValuePipeline = [
        { $match: { status: 'active', ...match } },
        {
          $lookup: {
            from: 'subscriptionplans',
            localField: 'planId',
            foreignField: '_id',
            as: 'plan'
          }
        },
        {
          $unwind: '$plan'
        },
        {
          $group: {
            _id: null,
            averageValue: { $avg: '$plan.price' }
          }
        }
      ];

      const avgValueResult = await Subscription.aggregate(avgValuePipeline);
      const averageSubscriptionValue = avgValueResult[0]?.averageValue || 0;

      // Calculate growth
      const previousStartDate = startDate ? new Date(startDate.getTime() - (endDate?.getTime() || Date.now() - startDate.getTime())) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const previousEndDate = startDate || new Date();
      const previousCount = await Subscription.countDocuments({
        createdAt: { $gte: previousStartDate, $lte: previousEndDate }
      });
      
      const subscriptionGrowth = previousCount > 0 
        ? ((totalSubscriptions - previousCount) / previousCount) * 100
        : 0;

      return {
        totalSubscriptions,
        activeSubscriptions,
        trialSubscriptions,
        cancelledSubscriptions,
        churnRate,
        trialConversionRate,
        averageSubscriptionValue,
        subscriptionGrowth
      };

    } catch (error) {
      logger.error('Error calculating subscription metrics', { error, filters });
      throw createError('Failed to calculate subscription metrics', 500);
    }
  }

  /**
   * Get payment metrics
   */
  async getPaymentMetrics(filters: AnalyticsFilters = {}): Promise<PaymentMetrics> {
    try {
      const { startDate, endDate, currency = 'INR' } = filters;
      
      const match: any = { currency };
      if (startDate && endDate) {
        match.createdAt = { $gte: startDate, $lte: endDate };
      }

      const pipeline = [
        { $match: match },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ];

      const statusStats = await Payment.aggregate(pipeline);
      
      const totalPayments = statusStats.reduce((sum, stat) => sum + stat.count, 0);
      const successfulPayments = statusStats.find(s => s._id === 'completed')?.count || 0;
      const failedPayments = statusStats.find(s => s._id === 'failed')?.count || 0;
      const totalRevenue = statusStats.find(s => s._id === 'completed')?.totalAmount || 0;

      const paymentSuccessRate = totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0;
      const averagePaymentValue = successfulPayments > 0 ? totalRevenue / successfulPayments : 0;

      // Calculate refund rate
      const refundedPayments = statusStats.find(s => s._id === 'refunded')?.count || 0;
      const refundRate = successfulPayments > 0 ? (refundedPayments / successfulPayments) * 100 : 0;

      // Get payment method distribution
      const methodPipeline = [
        { $match: { status: 'completed', ...match } },
        {
          $group: {
            _id: '$paymentMethod',
            count: { $sum: 1 }
          }
        }
      ];

      const methodStats = await Payment.aggregate(methodPipeline);
      const stripeCount = methodStats.find(s => s._id === 'stripe')?.count || 0;
      const razorpayCount = methodStats.find(s => s._id === 'razorpay')?.count || 0;

      return {
        totalPayments,
        successfulPayments,
        failedPayments,
        paymentSuccessRate,
        averagePaymentValue,
        refundRate,
        paymentMethodDistribution: {
          stripe: stripeCount,
          razorpay: razorpayCount
        }
      };

    } catch (error) {
      logger.error('Error calculating payment metrics', { error, filters });
      throw createError('Failed to calculate payment metrics', 500);
    }
  }

  /**
   * Get plan distribution metrics
   */
  async getPlanMetrics(filters: AnalyticsFilters = {}): Promise<PlanMetrics> {
    try {
      const { startDate, endDate } = filters;
      
      const match: any = { status: 'active' };
      if (startDate && endDate) {
        match.createdAt = { $gte: startDate, $lte: endDate };
      }

      // Get plan distribution
      const planPipeline = [
        { $match: match },
        {
          $lookup: {
            from: 'subscriptionplans',
            localField: 'planId',
            foreignField: '_id',
            as: 'plan'
          }
        },
        {
          $unwind: '$plan'
        },
        {
          $group: {
            _id: '$planId',
            planName: { $first: '$plan.name' },
            count: { $sum: 1 },
            revenue: { $sum: '$plan.price' }
          }
        },
        {
          $sort: { count: -1 }
        }
      ];

      const planStats = await Subscription.aggregate(planPipeline as any);
      const totalSubscriptions = planStats.reduce((sum, stat) => sum + stat.count, 0);

      const planDistribution = planStats.map(stat => ({
        planId: stat._id.toString(),
        planName: stat.planName,
        count: stat.count,
        revenue: stat.revenue,
        percentage: totalSubscriptions > 0 ? (stat.count / totalSubscriptions) * 100 : 0
      }));

      // Get popular plans (top 5)
      const popularPlans = planStats.slice(0, 5).map(stat => ({
        planId: stat._id.toString(),
        planName: stat.planName,
        subscriptions: stat.count
      }));

      return {
        planDistribution,
        popularPlans
      };

    } catch (error) {
      logger.error('Error calculating plan metrics', { error, filters });
      throw createError('Failed to calculate plan metrics', 500);
    }
  }

  /**
   * Get coupon metrics
   */
  async getCouponMetrics(filters: AnalyticsFilters = {}): Promise<CouponMetrics> {
    try {
      const { startDate, endDate } = filters;
      
      const match: any = {};
      if (startDate && endDate) {
        match.createdAt = { $gte: startDate, $lte: endDate };
      }

      const pipeline = [
        { $match: match },
        {
          $group: {
            _id: null,
            totalCoupons: { $sum: 1 },
            totalUsage: { $sum: '$usedCount' },
            avgUsage: { $avg: '$usedCount' }
          }
        }
      ];

      const stats = await this.aggregate(pipeline);
      const result = stats[0] || {
        totalCoupons: 0,
        totalUsage: 0,
        avgUsage: 0
      };

      // Get active coupons count
      const now = new Date();
      const activeCoupons = await Coupon.countDocuments({
        isActive: true,
        validFrom: { $lte: now },
        validUntil: { $gte: now },
        $expr: { $lt: ['$usedCount', '$usageLimit'] }
      });

      // Calculate total discount (this would require payment data)
      // For now, we'll estimate based on coupon usage and average discount
      const totalDiscount = result.totalUsage * 100; // Placeholder calculation
      const averageDiscount = result.totalUsage > 0 ? totalDiscount / result.totalUsage : 0;

      return {
        totalCoupons: result.totalCoupons,
        activeCoupons,
        totalUsage: result.totalUsage,
        averageUsage: result.avgUsage,
        totalDiscount,
        averageDiscount
      };

    } catch (error) {
      logger.error('Error calculating coupon metrics', { error, filters });
      throw createError('Failed to calculate coupon metrics', 500);
    }
  }

  /**
   * Get comprehensive dashboard metrics
   */
  async getDashboardMetrics(filters: AnalyticsFilters = {}): Promise<{
    revenue: RevenueMetrics;
    subscriptions: SubscriptionMetrics;
    payments: PaymentMetrics;
    plans: PlanMetrics;
    coupons: CouponMetrics;
  }> {
    try {
      const [revenue, subscriptions, payments, plans, coupons] = await Promise.all([
        this.getRevenueMetrics(filters),
        this.getSubscriptionMetrics(filters),
        this.getPaymentMetrics(filters),
        this.getPlanMetrics(filters),
        this.getCouponMetrics(filters)
      ]);

      return {
        revenue,
        subscriptions,
        payments,
        plans,
        coupons
      };

    } catch (error) {
      logger.error('Error getting dashboard metrics', { error, filters });
      throw createError('Failed to get dashboard metrics', 500);
    }
  }

  /**
   * Calculate revenue metrics for a specific period
   */
  private async calculateRevenueMetrics(startDate?: Date, endDate?: Date, currency: string = 'INR'): Promise<RevenueMetrics> {
    const match: any = { currency };
    if (startDate && endDate) {
      match.createdAt = { $gte: startDate, $lte: endDate };
    }

    // Get active subscriptions with their plan prices
    const subscriptionPipeline = [
      { $match: { status: 'active', ...match } },
      {
        $lookup: {
          from: 'subscriptionplans',
          localField: 'planId',
          foreignField: '_id',
          as: 'plan'
        }
      },
      {
        $unwind: '$plan'
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$plan.price' },
          subscriptionCount: { $sum: 1 }
        }
      }
    ];

    const subscriptionResult = await Subscription.aggregate(subscriptionPipeline);
    const subscriptionRevenue = subscriptionResult[0]?.totalRevenue || 0;
    const subscriptionCount = subscriptionResult[0]?.subscriptionCount || 0;

    // Get one-time payments
    const paymentPipeline = [
      { $match: { status: 'completed', currency, ...match } },
      {
        $group: {
          _id: null,
          totalPayments: { $sum: '$amount' }
        }
      }
    ];

    const paymentResult = await Payment.aggregate(paymentPipeline);
    const paymentRevenue = paymentResult[0]?.totalPayments || 0;

    const totalRevenue = subscriptionRevenue + paymentRevenue;
    const averageRevenuePerUser = subscriptionCount > 0 ? totalRevenue / subscriptionCount : 0;

    // Calculate MRR (Monthly Recurring Revenue)
    const mrr = subscriptionRevenue;

    // Calculate ARR (Annual Recurring Revenue)
    const arr = mrr * 12;

    return {
      mrr,
      arr,
      totalRevenue,
      averageRevenuePerUser,
      revenueGrowth: 0 // Will be calculated by calling method
    };
  }

  /**
   * Helper method for aggregation (placeholder)
   */
  private async aggregate(pipeline: any[]): Promise<any[]> {
    // This is a placeholder - in real implementation, you'd use the appropriate model
    return [];
  }
}

export const analyticsService = new AnalyticsService();
