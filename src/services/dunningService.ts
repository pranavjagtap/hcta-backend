import { Subscription, Payment } from '../models';
import { createError } from '../utils/appError';
import { logger } from '../utils/logger';
import { NotificationService } from './notificationService';

export interface DunningConfig {
  retrySchedule: number[]; // Days after failure to retry (e.g., [0, 3, 7, 14])
  gracePeriodDays: number; // Days before cancelling subscription
  maxRetries: number;
  notificationTemplates: {
    firstRetry: string;
    secondRetry: string;
    finalWarning: string;
    cancellation: string;
  };
}

export interface DunningEvent {
  subscriptionId: string;
  userId: string;
  eventType: 'payment_failed' | 'retry_scheduled' | 'retry_attempted' | 'grace_period_started' | 'subscription_cancelled';
  retryNumber: number;
  scheduledDate: Date;
  amount: number;
  currency: string;
  paymentMethod: string;
  metadata?: any;
}

export class DunningService {
  private config: DunningConfig;
  private notificationService: NotificationService;

  constructor(config?: Partial<DunningConfig>) {
    this.notificationService = new NotificationService();
    this.config = {
      retrySchedule: [0, 3, 7, 14],
      gracePeriodDays: 7,
      maxRetries: 3,
      notificationTemplates: {
        firstRetry: 'Your payment failed. We\'ll retry in 3 days.',
        secondRetry: 'Payment retry failed. We\'ll try again in 4 days.',
        finalWarning: 'Final payment attempt failed. Your subscription will be cancelled in 7 days.',
        cancellation: 'Your subscription has been cancelled due to payment failure.'
      },
      ...config
    };
  }

  /**
   * Handle payment failure and schedule retries
   */
  async handlePaymentFailure(
    subscriptionId: string,
    paymentId: string,
    failureReason: string
  ): Promise<void> {
    try {
      const subscription = await Subscription.findById(subscriptionId);
      if (!subscription) {
        throw createError('Subscription not found', 404);
      }

      const payment = await Payment.findById(paymentId);
      if (!payment) {
        throw createError('Payment not found', 404);
      }

      // Update subscription status
      subscription.status = 'past_due';
      subscription.retryCount = (subscription.retryCount || 0) + 1;
      await subscription.save();

      // Schedule next retry
      await this.scheduleRetry(subscription, payment);

      // Send notification
      await this.sendFailureNotification(subscription, payment, failureReason);

      logger.info('Payment failure handled', {
        subscriptionId,
        paymentId,
        retryCount: subscription.retryCount,
        failureReason
      });

    } catch (error) {
      logger.error('Error handling payment failure', {
        subscriptionId,
        paymentId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Schedule next retry attempt
   */
  private async scheduleRetry(subscription: any, payment: any): Promise<void> {
    const retryNumber = subscription.retryCount;
    
    if (retryNumber > this.config.maxRetries) {
      // Max retries exceeded, start grace period
      await this.startGracePeriod(subscription);
      return;
    }

    const daysToWait = this.config.retrySchedule[retryNumber - 1] || 
                      this.config.retrySchedule[this.config.retrySchedule.length - 1];
    
    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + daysToWait);

    // Store retry schedule in subscription metadata
    subscription.metadata = subscription.metadata || {};
    (subscription.metadata as any).nextRetryDate = scheduledDate;
    (subscription.metadata as any).nextRetryNumber = retryNumber;
    await subscription.save();

    // In a real implementation, you would use a job queue (like BullMQ)
    // to schedule the actual retry attempt
    logger.info('Retry scheduled', {
      subscriptionId: subscription._id,
      retryNumber,
      scheduledDate,
      daysToWait
    });
  }

  /**
   * Start grace period before cancellation
   */
  private async startGracePeriod(subscription: any): Promise<void> {
    const graceEndDate = new Date();
    graceEndDate.setDate(graceEndDate.getDate() + this.config.gracePeriodDays);

    subscription.metadata = subscription.metadata || {};
    subscription.metadata.gracePeriodEnd = graceEndDate;
    subscription.metadata.gracePeriodStarted = new Date();
    await subscription.save();

    // Send final warning notification
    await this.sendGracePeriodNotification(subscription);

    logger.info('Grace period started', {
      subscriptionId: subscription._id,
      graceEndDate
    });
  }

  /**
   * Attempt payment retry
   */
  async attemptRetry(subscriptionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const subscription = await Subscription.findById(subscriptionId);
      if (!subscription) {
        throw createError('Subscription not found', 404);
      }

      // Check if retry is due
      const now = new Date();
      const nextRetryDate = (subscription.metadata as any)?.nextRetryDate as Date | undefined;
      
      if (nextRetryDate && now < nextRetryDate) {
        return { success: false, error: 'Retry not due yet' };
      }

      // Get the last failed payment
      const lastPayment = await Payment.findOne({
        subscriptionId: subscription._id,
        status: 'failed'
      }).sort({ createdAt: -1 });

      if (!lastPayment) {
        return { success: false, error: 'No failed payment found' };
      }

      // Attempt to retry payment
      // In a real implementation, you would call the payment gateway
      // to retry the payment using the stored payment method
      const retryResult = await this.processRetryPayment(subscription, lastPayment);

      if (retryResult.success) {
        // Payment successful, reset retry count
        subscription.status = 'active';
        subscription.retryCount = 0;
        subscription.metadata = subscription.metadata || {};
        delete (subscription.metadata as any).nextRetryDate;
        delete (subscription.metadata as any).nextRetryNumber;
        await subscription.save();

        // Send success notification
        await this.sendRetrySuccessNotification(subscription);

        logger.info('Payment retry successful', {
          subscriptionId: subscription._id,
          paymentId: lastPayment._id
        });
      } else {
        // Retry failed, schedule next attempt
        await this.handlePaymentFailure(
          subscription._id.toString(),
          lastPayment._id.toString(),
          retryResult.error || 'Retry failed'
        );
      }

      return retryResult;

    } catch (error) {
      logger.error('Error attempting retry', {
        subscriptionId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Process retry payment (placeholder implementation)
   */
  private async processRetryPayment(subscription: any, payment: any): Promise<{ success: boolean; error?: string }> {
    // This is a placeholder implementation
    // In a real system, you would:
    // 1. Get the payment method from the subscription
    // 2. Call the payment gateway to retry the payment
    // 3. Update the payment record with the result
    
    try {
      // Simulate payment processing
      const success = Math.random() > 0.3; // 70% success rate for demo
      
      if (success) {
        // Update payment status
        payment.status = 'completed';
        payment.metadata = payment.metadata || {};
        payment.metadata.retryAttempt = subscription.retryCount;
        payment.metadata.retryDate = new Date();
        await payment.save();

        return { success: true };
      } else {
        return { success: false, error: 'Payment gateway declined retry' };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Check and process grace period expirations
   */
  async processGracePeriodExpirations(): Promise<void> {
    try {
      const now = new Date();
      
      // Find subscriptions in grace period that have expired
      const expiredSubscriptions = await Subscription.find({
        status: 'past_due',
        'metadata.gracePeriodEnd': { $lt: now },
        'metadata.gracePeriodStarted': { $exists: true }
      });

      for (const subscription of expiredSubscriptions) {
        await this.cancelSubscription(subscription);
      }

      logger.info('Processed grace period expirations', {
        count: expiredSubscriptions.length
      });

    } catch (error) {
      logger.error('Error processing grace period expirations', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Cancel subscription due to payment failure
   */
  private async cancelSubscription(subscription: any): Promise<void> {
    subscription.status = 'cancelled';
    subscription.cancelledAt = new Date();
    subscription.metadata = subscription.metadata || {};
    subscription.metadata.cancelledReason = 'payment_failure';
    subscription.metadata.cancelledBy = 'system';
    await subscription.save();

    // Send cancellation notification
    await this.sendCancellationNotification(subscription);

    logger.info('Subscription cancelled due to payment failure', {
      subscriptionId: subscription._id,
      userId: subscription.userId
    });
  }

  /**
   * Send failure notification
   */
  private async sendFailureNotification(subscription: any, payment: any, reason: string): Promise<void> {
    const retryNumber = subscription.retryCount;
    let message = '';

    if (retryNumber === 1) {
      message = this.config.notificationTemplates.firstRetry;
    } else if (retryNumber === 2) {
      message = this.config.notificationTemplates.secondRetry;
    } else {
      message = this.config.notificationTemplates.finalWarning;
    }

    await this.notificationService.createNotification(
      subscription.userId.toString(),
      'system',
      'Payment Failed',
      message,
      {
        subscriptionId: subscription._id.toString(),
        paymentId: payment._id.toString(),
        retryNumber,
        amount: payment.amount,
        currency: payment.currency,
        reason
      }
    );
  }

  /**
   * Send grace period notification
   */
  private async sendGracePeriodNotification(subscription: any): Promise<void> {
    await this.notificationService.createNotification(
      subscription.userId.toString(),
      'system',
      'Subscription Grace Period',
      `Your subscription is in grace period. It will be cancelled in ${this.config.gracePeriodDays} days if payment is not received.`,
      {
        subscriptionId: subscription._id.toString(),
        gracePeriodDays: this.config.gracePeriodDays,
        subtype: 'grace_period',
      }
    );
  }

  /**
   * Send retry success notification
   */
  private async sendRetrySuccessNotification(subscription: any): Promise<void> {
    await this.notificationService.createNotification(
      subscription.userId.toString(),
      'system',
      'Payment Successful',
      'Your payment has been processed successfully. Your subscription is now active.',
      {
        subscriptionId: subscription._id.toString(),
        subtype: 'payment_success',
      }
    );
  }

  /**
   * Send cancellation notification
   */
  private async sendCancellationNotification(subscription: any): Promise<void> {
    await this.notificationService.createNotification(
      subscription.userId.toString(),
      'system',
      'Subscription Cancelled',
      this.config.notificationTemplates.cancellation,
      {
        subscriptionId: subscription._id.toString(),
        reason: 'payment_failure',
        subtype: 'subscription_cancelled',
      }
    );
  }

  /**
   * Get dunning statistics
   */
  async getDunningStats(dateRange?: { start: Date; end: Date }): Promise<any> {
    const match: any = {};
    
    if (dateRange) {
      match.createdAt = {
        $gte: dateRange.start,
        $lte: dateRange.end
      };
    }

    const pipeline = [
      { $match: { status: 'past_due', ...match } },
      {
        $group: {
          _id: null,
          totalPastDue: { $sum: 1 },
          avgRetryCount: { $avg: '$retryCount' },
          maxRetryCount: { $max: '$retryCount' }
        }
      }
    ];

    const stats = await Subscription.aggregate(pipeline);
    
    // Get grace period subscriptions
    const gracePeriodCount = await Subscription.countDocuments({
      status: 'past_due',
      'metadata.gracePeriodStarted': { $exists: true }
    });

    return {
      ...stats[0],
      gracePeriodCount,
      retrySchedule: this.config.retrySchedule,
      gracePeriodDays: this.config.gracePeriodDays
    };
  }

  /**
   * Update dunning configuration
   */
  updateConfig(newConfig: Partial<DunningConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('Dunning configuration updated', { config: this.config });
  }
}

export const dunningService = new DunningService();
