import { Subscription, SubscriptionPlan } from '../models';
import { stripeService } from './stripeService';
import { razorpayService } from './razorpayService';
import { createError } from '../utils/appError';
import { logger } from '../utils/logger';
import { 
  CreateSubscriptionRequest, 
  SubscriptionResponse, 
  SubscriptionFilters,
  SubscriptionAccess,
  FeatureAccess 
} from '../types/payment';

export class SubscriptionService {
  /**
   * Create a new subscription
   */
  async createSubscription(
    userId: string,
    data: CreateSubscriptionRequest
  ): Promise<SubscriptionResponse> {
    try {
      // Get the plan
      const plan = await SubscriptionPlan.findById(data.planId);
      if (!plan) {
        throw createError('Subscription plan not found', 404);
      }

      if (!plan.isActive) {
        throw createError('Subscription plan is not active', 400);
      }

      // Check if user already has an active subscription
      const existingSubscription = await Subscription.getUserActiveSubscription(userId);
      if (existingSubscription) {
        throw createError('User already has an active subscription', 400);
      }

      // Calculate dates
      const now = new Date();
      const startDate = now;
      const endDate = new Date(now);
      
      if (plan.duration === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      // Calculate trial end date if applicable
      let trialEndDate: Date | undefined;
      if (plan.trialDays > 0) {
        trialEndDate = new Date(now);
        trialEndDate.setDate(trialEndDate.getDate() + plan.trialDays);
      }

      // Create subscription in payment gateway
      let gatewaySubscriptionId: string;
      let gatewayCustomerId: string;

      if (data.paymentMethod === 'stripe') {
        // Create or get Stripe customer
        const customer = await stripeService.createCustomer({
          email: data.metadata?.stripeCustomerId || '',
          name: data.metadata?.stripeCustomerId || '',
        });

        // Create Stripe subscription
        const stripeSubscription = await stripeService.createSubscription({
          customerId: customer.customerId,
          priceId: plan.metadata?.stripePriceId || '',
          paymentMethodId: data.paymentMethodId,
          trialDays: plan.trialDays,
          metadata: {
            userId,
            planId: plan._id.toString(),
          },
        });

        gatewaySubscriptionId = stripeSubscription.subscriptionId;
        gatewayCustomerId = customer.customerId;
      } else {
        // Create or get Razorpay customer
        const customer = await razorpayService.createCustomer({
          name: data.metadata?.razorpayCustomerId || '',
          email: data.metadata?.razorpayCustomerId || '',
        });

        // Create Razorpay subscription
        const razorpaySubscription = await razorpayService.createSubscription({
          planId: plan.metadata?.razorpayPlanId || '',
          customerId: customer.customerId,
          notes: {
            userId,
            planId: plan._id.toString(),
          },
        });

        gatewaySubscriptionId = razorpaySubscription.subscriptionId;
        gatewayCustomerId = customer.customerId;
      }

      // Create subscription in database
      const subscription = new Subscription({
        userId,
        planId: plan._id,
        status: plan.trialDays > 0 ? 'trial' : 'active',
        startDate,
        endDate,
        trialEndDate,
        currentPeriodStart: startDate,
        currentPeriodEnd: endDate,
        paymentMethod: data.paymentMethod,
        paymentMethodId: data.paymentMethodId,
        autoRenew: data.autoRenew ?? true,
        metadata: {
          [`${data.paymentMethod}SubscriptionId`]: gatewaySubscriptionId,
          [`${data.paymentMethod}CustomerId`]: gatewayCustomerId,
        },
      });

      await subscription.save();

      logger.info(`Subscription created for user ${userId}`, {
        subscriptionId: subscription._id,
        planId: plan._id,
        paymentMethod: data.paymentMethod,
      });

      return this.formatSubscriptionResponse(subscription);
    } catch (error) {
      logger.error('Error creating subscription', { userId, error });
      throw error;
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(
    userId: string,
    subscriptionId: string,
    cancelAtPeriodEnd: boolean = true
  ): Promise<SubscriptionResponse> {
    try {
      const subscription = await Subscription.findById(subscriptionId);
      if (!subscription) {
        throw createError('Subscription not found', 404);
      }

      if (subscription.userId.toString() !== userId) {
        throw createError('Unauthorized', 403);
      }

      // Cancel in payment gateway
      if (subscription.paymentMethod === 'stripe') {
        await stripeService.cancelSubscription(
          subscription.metadata?.stripeSubscriptionId || '',
          cancelAtPeriodEnd
        );
      } else {
        await razorpayService.cancelSubscription(
          subscription.metadata?.razorpaySubscriptionId || ''
        );
      }

      // Cancel in database
      const updatedSubscription = await Subscription.cancelSubscription(
        subscriptionId,
        cancelAtPeriodEnd
      );

      logger.info(`Subscription cancelled for user ${userId}`, {
        subscriptionId,
        cancelAtPeriodEnd,
      });

      return this.formatSubscriptionResponse(updatedSubscription);
    } catch (error) {
      logger.error('Error cancelling subscription', { userId, subscriptionId, error });
      throw error;
    }
  }

  /**
   * Reactivate a subscription
   */
  async reactivateSubscription(
    userId: string,
    subscriptionId: string
  ): Promise<SubscriptionResponse> {
    try {
      const subscription = await Subscription.findById(subscriptionId);
      if (!subscription) {
        throw createError('Subscription not found', 404);
      }

      if (subscription.userId.toString() !== userId) {
        throw createError('Unauthorized', 403);
      }

      // Reactivate in payment gateway
      if (subscription.paymentMethod === 'stripe') {
        await stripeService.reactivateSubscription(
          subscription.metadata?.stripeSubscriptionId || ''
        );
      }

      // Reactivate in database
      const updatedSubscription = await Subscription.reactivateSubscription(subscriptionId);

      logger.info(`Subscription reactivated for user ${userId}`, { subscriptionId });

      return this.formatSubscriptionResponse(updatedSubscription);
    } catch (error) {
      logger.error('Error reactivating subscription', { userId, subscriptionId, error });
      throw error;
    }
  }

  /**
   * Upgrade or downgrade subscription
   */
  async changeSubscription(
    userId: string,
    subscriptionId: string,
    newPlanId: string
  ): Promise<SubscriptionResponse> {
    try {
      const currentSubscription = await Subscription.findById(subscriptionId);
      if (!currentSubscription) {
        throw createError('Subscription not found', 404);
      }

      if (currentSubscription.userId.toString() !== userId) {
        throw createError('Unauthorized', 403);
      }

      const newPlan = await SubscriptionPlan.findById(newPlanId);
      if (!newPlan || !newPlan.isActive) {
        throw createError('New plan not found or inactive', 404);
      }

      // Calculate proration if needed
      const now = new Date();
      const daysRemaining = Math.ceil(
        (currentSubscription.currentPeriodEnd.getTime() - now.getTime()) / 
        (1000 * 60 * 60 * 24)
      );

      const currentPlan = await SubscriptionPlan.findById(currentSubscription.planId);
      const prorationAmount = currentPlan && daysRemaining > 0 
        ? (currentPlan.price / 30) * daysRemaining 
        : 0;

      // Create new subscription
      const newSubscription = await this.createSubscription(userId, {
        planId: newPlanId,
        paymentMethod: currentSubscription.paymentMethod,
        paymentMethodId: currentSubscription.paymentMethodId || '',
        autoRenew: currentSubscription.autoRenew,
        metadata: {
          upgradeFrom: currentSubscription._id.toString(),
          prorationAmount: prorationAmount.toString(),
        },
      });

      // Cancel old subscription
      await this.cancelSubscription(userId, subscriptionId, false);

      // Update new subscription metadata
      await Subscription.findByIdAndUpdate(newSubscription._id, {
        $set: {
          'metadata.downgradeTo': currentSubscription._id.toString(),
        },
      });

      logger.info(`Subscription changed for user ${userId}`, {
        fromPlanId: currentSubscription.planId,
        toPlanId: newPlanId,
        prorationAmount,
      });

      return newSubscription;
    } catch (error) {
      logger.error('Error changing subscription', { userId, subscriptionId, newPlanId, error });
      throw error;
    }
  }

  /**
   * Get user's active subscription
   */
  async getUserActiveSubscription(userId: string): Promise<SubscriptionResponse | null> {
    try {
      const subscription = await Subscription.getUserActiveSubscription(userId);
      return subscription ? this.formatSubscriptionResponse(subscription) : null;
    } catch (error) {
      logger.error('Error getting user active subscription', { userId, error });
      throw error;
    }
  }

  /**
   * Get user's subscription history
   */
  async getUserSubscriptionHistory(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ subscriptions: SubscriptionResponse[]; total: number }> {
    try {
      const subscriptions = await Subscription.getUserSubscriptionHistory(userId);
      const total = subscriptions.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedSubscriptions = subscriptions.slice(startIndex, endIndex);

      return {
        subscriptions: paginatedSubscriptions.map(sub => this.formatSubscriptionResponse(sub)),
        total,
      };
    } catch (error) {
      logger.error('Error getting user subscription history', { userId, error });
      throw error;
    }
  }

  /**
   * Get all subscriptions with filters
   */
  async getSubscriptions(filters: SubscriptionFilters = {}): Promise<{
    subscriptions: SubscriptionResponse[];
    total: number;
  }> {
    try {
      const query: any = {};

      if (filters.status) {
        query.status = filters.status;
      }

      if (filters.paymentMethod) {
        query.paymentMethod = filters.paymentMethod;
      }

      if (filters.dateRange) {
        query.createdAt = {
          $gte: new Date(filters.dateRange.start),
          $lte: new Date(filters.dateRange.end),
        };
      }

      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;

      const [subscriptions, total] = await Promise.all([
        Subscription.find(query)
          .populate('user', 'name email')
          .populate('plan')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Subscription.countDocuments(query),
      ]);

      return {
        subscriptions: subscriptions.map(sub => this.formatSubscriptionResponse(sub)),
        total,
      };
    } catch (error) {
      logger.error('Error getting subscriptions', { filters, error });
      throw error;
    }
  }

  /**
   * Get subscription statistics
   */
  async getSubscriptionStats(): Promise<any> {
    try {
      return await Subscription.getSubscriptionStats();
    } catch (error) {
      logger.error('Error getting subscription stats', { error });
      throw error;
    }
  }

  /**
   * Check user's access to a feature
   */
  async checkFeatureAccess(userId: string, feature: string): Promise<FeatureAccess> {
    try {
      const subscription = await Subscription.getUserActiveSubscription(userId);
      
      if (!subscription) {
        return {
          userId,
          feature,
          hasAccess: false,
        };
      }

      const plan = await SubscriptionPlan.findById(subscription.planId);
      if (!plan) {
        return {
          userId,
          feature,
          hasAccess: false,
        };
      }

      const hasAccess = plan.features.includes(feature);
      
      return {
        userId,
        feature,
        hasAccess,
        subscriptionId: subscription._id.toString(),
        expiresAt: subscription.currentPeriodEnd.toISOString(),
      };
    } catch (error) {
      logger.error('Error checking feature access', { userId, feature, error });
      throw error;
    }
  }

  /**
   * Get user's subscription access details
   */
  async getUserSubscriptionAccess(userId: string): Promise<SubscriptionAccess | null> {
    try {
      const subscription = await Subscription.getUserActiveSubscription(userId);
      
      if (!subscription) {
        return null;
      }

      const plan = await SubscriptionPlan.findById(subscription.planId);
      if (!plan) {
        return null;
      }

      const now = new Date();
      const daysRemaining = Math.ceil(
        (subscription.currentPeriodEnd.getTime() - now.getTime()) / 
        (1000 * 60 * 60 * 24)
      );

      return {
        userId,
        subscriptionId: subscription._id.toString(),
        planName: plan.name,
        features: plan.features,
        maxUsers: plan.maxUsers,
        maxStorage: plan.maxStorage,
        isActive: subscription.status === 'active' || subscription.status === 'trial',
        expiresAt: subscription.currentPeriodEnd.toISOString(),
        daysRemaining: Math.max(0, daysRemaining),
      };
    } catch (error) {
      logger.error('Error getting user subscription access', { userId, error });
      throw error;
    }
  }

  /**
   * Process subscription renewal
   */
  async processRenewal(subscriptionId: string): Promise<void> {
    try {
      const subscription = await Subscription.findById(subscriptionId);
      if (!subscription) {
        throw createError('Subscription not found', 404);
      }

      const plan = await SubscriptionPlan.findById(subscription.planId);
      if (!plan) {
        throw createError('Plan not found', 404);
      }

      // Calculate new period
      const newStartDate = new Date(subscription.currentPeriodEnd);
      const newEndDate = new Date(newStartDate);
      
      if (plan.duration === 'monthly') {
        newEndDate.setMonth(newEndDate.getMonth() + 1);
      } else {
        newEndDate.setFullYear(newEndDate.getFullYear() + 1);
      }

      // Update subscription
      subscription.currentPeriodStart = newStartDate;
      subscription.currentPeriodEnd = newEndDate;
      subscription.lastPaymentDate = new Date();
      subscription.nextBillingDate = newEndDate;
      subscription.retryCount = 0;

      await subscription.save();

      logger.info(`Subscription renewed`, { subscriptionId });
    } catch (error) {
      logger.error('Error processing subscription renewal', { subscriptionId, error });
      throw error;
    }
  }

  /**
   * Handle failed payment
   */
  async handleFailedPayment(subscriptionId: string, failureReason?: string): Promise<void> {
    try {
      const subscription = await Subscription.findById(subscriptionId);
      if (!subscription) {
        throw createError('Subscription not found', 404);
      }

      subscription.retryCount += 1;
      
      if (subscription.retryCount >= subscription.maxRetries) {
        subscription.status = 'past_due';
      }

      await subscription.save();

      logger.info(`Failed payment handled`, { 
        subscriptionId, 
        retryCount: subscription.retryCount,
        failureReason 
      });
    } catch (error) {
      logger.error('Error handling failed payment', { subscriptionId, error });
      throw error;
    }
  }

  /**
   * Format subscription response
   */
  private formatSubscriptionResponse(subscription: any): SubscriptionResponse {
    return {
      _id: subscription._id.toString(),
      userId: subscription.userId.toString(),
      user: subscription.user ? {
        _id: subscription.user._id.toString(),
        name: subscription.user.name,
        email: subscription.user.email,
      } : undefined,
      planId: subscription.planId.toString(),
      plan: subscription.plan ? {
        _id: subscription.plan._id.toString(),
        name: subscription.plan.name,
        description: subscription.plan.description,
        features: subscription.plan.features,
        duration: subscription.plan.duration,
        price: subscription.plan.price,
        currency: subscription.plan.currency,
        formattedPrice: subscription.plan.formattedPrice,
        annualPrice: subscription.plan.annualPrice,
        trialDays: subscription.plan.trialDays,
        maxUsers: subscription.plan.maxUsers,
        maxStorage: subscription.plan.maxStorage,
        isActive: subscription.plan.isActive,
        isPopular: subscription.plan.isPopular,
        sortOrder: subscription.plan.sortOrder,
        metadata: subscription.plan.metadata,
        createdAt: subscription.plan.createdAt.toISOString(),
        updatedAt: subscription.plan.updatedAt.toISOString(),
      } : undefined,
      status: subscription.status,
      startDate: subscription.startDate.toISOString(),
      endDate: subscription.endDate.toISOString(),
      trialEndDate: subscription.trialEndDate?.toISOString(),
      currentPeriodStart: subscription.currentPeriodStart.toISOString(),
      currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      cancelledAt: subscription.cancelledAt?.toISOString(),
      paymentMethod: subscription.paymentMethod,
      paymentMethodId: subscription.paymentMethodId,
      lastPaymentDate: subscription.lastPaymentDate?.toISOString(),
      nextBillingDate: subscription.nextBillingDate?.toISOString(),
      autoRenew: subscription.autoRenew,
      retryCount: subscription.retryCount,
      maxRetries: subscription.maxRetries,
      daysRemaining: subscription.daysRemaining || 0,
      isTrial: subscription.isTrial || false,
      isExpired: subscription.isExpired || false,
      metadata: subscription.metadata,
      createdAt: subscription.createdAt.toISOString(),
      updatedAt: subscription.updatedAt.toISOString(),
    };
  }
}

export const subscriptionService = new SubscriptionService();
