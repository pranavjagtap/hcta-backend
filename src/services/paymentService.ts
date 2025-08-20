import { Payment, SubscriptionPlan } from '../models';
import { stripeService } from './stripeService';
import { razorpayService } from './razorpayService';
import { createError } from '../utils/appError';
import { logger } from '../utils/logger';
import { 
  CreatePaymentRequest, 
  PaymentResponse, 
  PaymentFilters,
  RefundPaymentRequest 
} from '../types/payment';
import { v4 as uuidv4 } from 'uuid';

export class PaymentService {
  private computeRefundAmountRemaining(payment: any): number {
    const totalAmount = Number(payment.amount ?? 0);
    const alreadyRefunded = Number(payment.refundAmount ?? 0);
    const remaining = totalAmount - alreadyRefunded;
    return remaining > 0 ? remaining : 0;
  }

  /**
   * Create a payment intent
   */
  async createPaymentIntent(
    userId: string,
    data: CreatePaymentRequest
  ): Promise<{
    paymentIntentId?: string;
    clientSecret?: string;
    orderId?: string;
    keyId?: string;
  }> {
    try {
      // Validate plan if provided
      if (data.planId) {
        const plan = await SubscriptionPlan.findById(data.planId);
        if (!plan || !plan.isActive) {
          throw createError('Invalid or inactive plan', 400);
        }
      }

      const transactionId = uuidv4();

      if (data.paymentMethod === 'stripe') {
        // Create Stripe payment intent
        const paymentIntent = await stripeService.createPaymentIntent({
          amount: data.amount,
          currency: data.currency || 'USD',
          paymentMethodId: data.paymentMethodId,
          customerId: data.metadata?.stripeCustomerId,
          description: data.description,
          metadata: {
            userId,
            transactionId,
            planId: data.planId || '',
            subscriptionId: data.subscriptionId || '',
          },
        });

        return {
          paymentIntentId: paymentIntent.paymentIntentId,
          clientSecret: paymentIntent.clientSecret,
        };
      } else {
        // Create Razorpay order
        const order = await razorpayService.createOrder({
          amount: data.amount,
          currency: data.currency || 'INR',
          receipt: transactionId,
          notes: {
            userId,
            planId: data.planId || '',
            subscriptionId: data.subscriptionId || '',
          },
        });

        return {
          orderId: order.orderId,
          keyId: process.env.RAZORPAY_KEY_ID,
        };
      }
    } catch (error) {
      logger.error('Error creating payment intent', { userId, error });
      throw error;
    }
  }

  /**
   * Process payment
   */
  async processPayment(
    userId: string,
    data: CreatePaymentRequest
  ): Promise<PaymentResponse> {
    try {
      // Validate plan if provided
      let plan = null;
      if (data.planId) {
        plan = await SubscriptionPlan.findById(data.planId);
        if (!plan || !plan.isActive) {
          throw createError('Invalid or inactive plan', 400);
        }
      }

      const transactionId = uuidv4();

      // Process payment in gateway
      let gatewayPaymentId: string;
      let gatewayCustomerId: string;
      let cardDetails: any = {};

      if (data.paymentMethod === 'stripe') {
        // Process Stripe payment
        const paymentIntent = await stripeService.createPaymentIntent({
          amount: data.amount,
          currency: data.currency || 'USD',
          paymentMethodId: data.paymentMethodId,
          customerId: data.metadata?.stripeCustomerId,
          description: data.description,
          metadata: {
            userId,
            transactionId,
            planId: data.planId || '',
            subscriptionId: data.subscriptionId || '',
          },
        });

        gatewayPaymentId = paymentIntent.paymentIntentId;
        gatewayCustomerId = data.metadata?.stripeCustomerId || '';

        // Get payment method details for card info
        if (data.paymentMethodId) {
          try {
            const paymentMethod = await stripeService.createPaymentMethod({
              type: 'card',
              card: { token: data.paymentMethodId },
            });
            cardDetails = paymentMethod.card || {};
          } catch (error) {
            logger.warn('Could not retrieve card details', { error });
          }
        }
      } else {
        // Process Razorpay payment
        const order = await razorpayService.createOrder({
          amount: data.amount,
          currency: data.currency || 'INR',
          receipt: transactionId,
          notes: {
            userId,
            planId: data.planId || '',
            subscriptionId: data.subscriptionId || '',
          },
        });

        const payment = await razorpayService.createPayment({
          amount: data.amount,
          currency: data.currency || 'INR',
          orderId: order.orderId,
          paymentMethod: 'card', // This would be dynamic based on user selection
          email: data.metadata?.razorpayCustomerId || '',
        });

        gatewayPaymentId = payment.paymentId;
        gatewayCustomerId = data.metadata?.razorpayCustomerId || '';
      }

      // Create payment record in database
      const payment = new Payment({
        userId,
        subscriptionId: data.subscriptionId,
        planId: data.planId,
        amount: data.amount,
        currency: data.currency || (data.paymentMethod === 'stripe' ? 'USD' : 'INR'),
        status: 'completed', // Assuming successful for now
        paymentMethod: data.paymentMethod,
        paymentMethodId: data.paymentMethodId,
        transactionId,
        description: data.description,
        metadata: {
          [`${data.paymentMethod}PaymentId`]: gatewayPaymentId,
          [`${data.paymentMethod}CustomerId`]: gatewayCustomerId,
          cardLast4: cardDetails.last4,
          cardBrand: cardDetails.brand,
          cardCountry: cardDetails.country,
          billingAddress: data.metadata?.billingAddress,
        },
      });

      await payment.save();

      logger.info(`Payment processed for user ${userId}`, {
        paymentId: payment._id,
        amount: payment.amount,
        currency: payment.currency,
        paymentMethod: payment.paymentMethod,
      });

      return this.formatPaymentResponse(payment);
    } catch (error) {
      logger.error('Error processing payment', { userId, error });
      throw error;
    }
  }

  /**
   * Handle payment webhook
   */
  async handlePaymentWebhook(
    paymentMethod: 'stripe' | 'razorpay',
    event: any,
    signature?: string
  ): Promise<void> {
    try {
      if (paymentMethod === 'stripe') {
        // Verify webhook signature
        const stripeEvent = stripeService.verifyWebhookSignature(
          JSON.stringify(event),
          signature || ''
        );

        switch (stripeEvent.type) {
          case 'payment_intent.succeeded':
            await this.handleStripePaymentSuccess(stripeEvent.data.object);
            break;
          case 'payment_intent.payment_failed':
            await this.handleStripePaymentFailure(stripeEvent.data.object);
            break;
          case 'invoice.payment_succeeded':
            await this.handleStripeSubscriptionPayment(stripeEvent.data.object);
            break;
          case 'invoice.payment_failed':
            await this.handleStripeSubscriptionFailure(stripeEvent.data.object);
            break;
        }
      } else {
        // Verify Razorpay webhook signature
        const isValid = razorpayService.verifyWebhookSignature(
          JSON.stringify(event),
          signature || ''
        );

        if (!isValid) {
          throw createError('Invalid webhook signature', 400);
        }

        switch (event.event) {
          case 'payment.captured':
            await this.handleRazorpayPaymentSuccess(event.payload.payment.entity);
            break;
          case 'payment.failed':
            await this.handleRazorpayPaymentFailure(event.payload.payment.entity);
            break;
          case 'subscription.activated':
            await this.handleRazorpaySubscriptionSuccess(event.payload.subscription.entity);
            break;
          case 'subscription.charged':
            await this.handleRazorpaySubscriptionPayment(event.payload.subscription.entity);
            break;
        }
      }
    } catch (error) {
      logger.error('Error handling payment webhook', { paymentMethod, error });
      throw error;
    }
  }

  /**
   * Handle Stripe payment success
   */
  private async handleStripePaymentSuccess(paymentIntent: any): Promise<void> {
    try {
      const payment = await Payment.getPaymentByStripeIntentId(paymentIntent.id);
      if (payment) {
        payment.status = 'completed';
        payment.receiptUrl = paymentIntent.charges?.data[0]?.receipt_url;
        await payment.save();

        logger.info('Stripe payment succeeded', { paymentId: payment._id });
      }
    } catch (error) {
      logger.error('Error handling Stripe payment success', { error });
    }
  }

  /**
   * Handle Stripe payment failure
   */
  private async handleStripePaymentFailure(paymentIntent: any): Promise<void> {
    try {
      const payment = await Payment.getPaymentByStripeIntentId(paymentIntent.id);
      if (payment) {
        payment.status = 'failed';
        payment.failureReason = paymentIntent.last_payment_error?.message;
        payment.failureCode = paymentIntent.last_payment_error?.code;
        await payment.save();

        logger.info('Stripe payment failed', { paymentId: payment._id });
      }
    } catch (error) {
      logger.error('Error handling Stripe payment failure', { error });
    }
  }

  /**
   * Handle Stripe subscription payment
   */
  private async handleStripeSubscriptionPayment(invoice: any): Promise<void> {
    try {
      // Create payment record for subscription
      const payment = new Payment({
        userId: invoice.customer, // This should be mapped to actual user ID
        subscriptionId: invoice.subscription,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: 'completed',
        paymentMethod: 'stripe',
        paymentMethodId: invoice.payment_intent,
        transactionId: invoice.payment_intent,
        description: `Subscription payment for ${invoice.subscription}`,
        receiptUrl: invoice.hosted_invoice_url,
        metadata: {
          stripePaymentIntentId: invoice.payment_intent,
          stripeCustomerId: invoice.customer,
          stripeInvoiceId: invoice.id,
        },
      });

      await payment.save();

      logger.info('Stripe subscription payment processed', { paymentId: payment._id });
    } catch (error) {
      logger.error('Error handling Stripe subscription payment', { error });
    }
  }

  /**
   * Handle Stripe subscription failure
   */
  private async handleStripeSubscriptionFailure(invoice: any): Promise<void> {
    try {
      logger.info('Stripe subscription payment failed', { 
        subscriptionId: invoice.subscription,
        invoiceId: invoice.id 
      });
    } catch (error) {
      logger.error('Error handling Stripe subscription failure', { error });
    }
  }

  /**
   * Handle Razorpay payment success
   */
  private async handleRazorpayPaymentSuccess(payment: any): Promise<void> {
    try {
      const dbPayment = await Payment.getPaymentByRazorpayId(payment.id);
      if (dbPayment) {
        dbPayment.status = 'completed';
        dbPayment.receiptUrl = payment.receipt;
        await dbPayment.save();

        logger.info('Razorpay payment succeeded', { paymentId: dbPayment._id });
      }
    } catch (error) {
      logger.error('Error handling Razorpay payment success', { error });
    }
  }

  /**
   * Handle Razorpay payment failure
   */
  private async handleRazorpayPaymentFailure(payment: any): Promise<void> {
    try {
      const dbPayment = await Payment.getPaymentByRazorpayId(payment.id);
      if (dbPayment) {
        dbPayment.status = 'failed';
        dbPayment.failureReason = payment.error_description;
        dbPayment.failureCode = payment.error_code;
        await dbPayment.save();

        logger.info('Razorpay payment failed', { paymentId: dbPayment._id });
      }
    } catch (error) {
      logger.error('Error handling Razorpay payment failure', { error });
    }
  }

  /**
   * Handle Razorpay subscription success
   */
  private async handleRazorpaySubscriptionSuccess(subscription: any): Promise<void> {
    try {
      logger.info('Razorpay subscription activated', { subscriptionId: subscription.id });
    } catch (error) {
      logger.error('Error handling Razorpay subscription success', { error });
    }
  }

  /**
   * Handle Razorpay subscription payment
   */
  private async handleRazorpaySubscriptionPayment(subscription: any): Promise<void> {
    try {
      // Create payment record for subscription
      const payment = new Payment({
        userId: subscription.customer_id, // This should be mapped to actual user ID
        subscriptionId: subscription.id,
        amount: subscription.plan_id ? 0 : 0, // Amount would be from plan
        currency: 'INR',
        status: 'completed',
        paymentMethod: 'razorpay',
        paymentMethodId: subscription.id,
        transactionId: subscription.id,
        description: `Subscription payment for ${subscription.id}`,
        metadata: {
          razorpayPaymentId: subscription.id,
          razorpayCustomerId: subscription.customer_id,
          razorpaySubscriptionId: subscription.id,
        },
      });

      await payment.save();

      logger.info('Razorpay subscription payment processed', { paymentId: payment._id });
    } catch (error) {
      logger.error('Error handling Razorpay subscription payment', { error });
    }
  }

  /**
   * Refund payment
   */
  async refundPayment(
    paymentId: string,
    data: RefundPaymentRequest
  ): Promise<PaymentResponse> {
    try {
      const payment = await Payment.findById(paymentId);
      if (!payment) {
        throw createError('Payment not found', 404);
      }

      const refundRemaining = this.computeRefundAmountRemaining(payment);
      const isRefundable = payment.status === 'completed' && refundRemaining > 0;
      if (!isRefundable) {
        throw createError('Payment cannot be refunded', 400);
      }

      const refundAmount = data.amount ?? refundRemaining;

      if (refundAmount > refundRemaining) {
        throw createError('Refund amount exceeds remaining amount', 400);
      }

      // Process refund in payment gateway
      if (payment.paymentMethod === 'stripe') {
        await stripeService.processRefund(
          payment.metadata?.stripePaymentIntentId || '',
          refundAmount,
          data.reason
        );
      } else {
        await razorpayService.processRefund(
          payment.metadata?.razorpayPaymentId || '',
          refundAmount,
          data.reason
        );
      }

      // Update payment record
      const updatedPayment = await Payment.refundPayment(paymentId, refundAmount, data.reason);

      logger.info(`Payment refunded`, { 
        paymentId, 
        refundAmount, 
        reason: data.reason 
      });

      return this.formatPaymentResponse(updatedPayment);
    } catch (error) {
      logger.error('Error refunding payment', { paymentId, error });
      throw error;
    }
  }

  /**
   * Get user payments
   */
  async getUserPayments(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ payments: PaymentResponse[]; total: number }> {
    try {
      const result = await Payment.getUserPayments(userId, page, limit);
      
      return {
        payments: result.payments.map(payment => this.formatPaymentResponse(payment)),
        total: result.total,
      };
    } catch (error) {
      logger.error('Error getting user payments', { userId, error });
      throw error;
    }
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(paymentId: string): Promise<PaymentResponse> {
    try {
      const payment = await Payment.findById(paymentId)
        .populate('user', 'name email')
        .populate('plan')
        .populate('subscription')
        .lean();

      if (!payment) {
        throw createError('Payment not found', 404);
      }

      return this.formatPaymentResponse(payment);
    } catch (error) {
      logger.error('Error getting payment by ID', { paymentId, error });
      throw error;
    }
  }

  /**
   * Get all payments with filters
   */
  async getPayments(filters: PaymentFilters = {}): Promise<{
    payments: PaymentResponse[];
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

      const [payments, total] = await Promise.all([
        Payment.find(query)
          .populate('user', 'name email')
          .populate('plan')
          .populate('subscription')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Payment.countDocuments(query),
      ]);

      return {
        payments: payments.map(payment => this.formatPaymentResponse(payment)),
        total,
      };
    } catch (error) {
      logger.error('Error getting payments', { filters, error });
      throw error;
    }
  }

  /**
   * Get payment statistics
   */
  async getPaymentStats(dateRange?: { start: Date; end: Date }): Promise<any> {
    try {
      return await Payment.getPaymentStats(dateRange);
    } catch (error) {
      logger.error('Error getting payment stats', { error });
      throw error;
    }
  }

  /**
   * Format payment response
   */
  private formatPaymentResponse(payment: any): PaymentResponse {
    const refundAmountRemaining = this.computeRefundAmountRemaining(payment);
    return {
      _id: payment._id.toString(),
      userId: payment.userId.toString(),
      user: payment.user ? {
        _id: payment.user._id.toString(),
        name: payment.user.name,
        email: payment.user.email,
      } : undefined,
      subscriptionId: payment.subscriptionId?.toString(),
      subscription: undefined,
      planId: payment.planId?.toString(),
      plan: undefined,
      amount: payment.amount,
      currency: payment.currency,
      formattedAmount: payment.formattedAmount || `${payment.currency} ${payment.amount.toFixed(2)}`,
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      paymentMethodId: payment.paymentMethodId,
      paymentIntentId: payment.paymentIntentId,
      transactionId: payment.transactionId,
      description: payment.description,
      receiptUrl: payment.receiptUrl,
      refundAmount: payment.refundAmount,
      refundReason: payment.refundReason,
      refundedAt: payment.refundedAt?.toISOString(),
      failureReason: payment.failureReason,
      failureCode: payment.failureCode,
      isRefundable: payment.isRefundable || false,
      refundAmountRemaining,
      metadata: payment.metadata,
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt.toISOString(),
    };
  }
}

export const paymentService = new PaymentService();
