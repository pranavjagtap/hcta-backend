import Razorpay from 'razorpay';
import crypto from 'crypto';
import { createError } from '../utils/appError';

export class RazorpayService {
  private razorpay: Razorpay;
  private webhookSecret: string;

  constructor() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    
    if (!keyId || !keySecret) {
      throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required');
    }

    this.razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    this.webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
  }

  /**
   * Create a Razorpay order
   */
  async createOrder(data: {
    amount: number;
    currency: string;
    receipt: string;
    notes?: Record<string, string>;
  }): Promise<{
    orderId: string;
    amount: number;
    currency: string;
    receipt: string;
  }> {
    try {
      const order = await this.razorpay.orders.create({
        amount: data.amount,
        currency: data.currency,
        receipt: data.receipt,
        notes: data.notes,
      });

      return {
        orderId: order.id,
        amount: Number(order.amount),
        currency: order.currency,
        receipt: order.receipt || '',
      };
    } catch (error) {
      console.error('Razorpay Order Creation Error:', error);
      throw createError('Failed to create order', 500);
    }
  }

  /**
   * Create a payment
   */
  async createPayment(data: {
    amount: number;
    currency: string;
    orderId: string;
    paymentMethod: string;
    email: string;
    contact?: string;
    name?: string;
    notes?: Record<string, string>;
  }): Promise<{
    paymentId: string;
    orderId: string;
    amount: number;
    currency: string;
    status: string;
  }> {
    try {
      const payment = await (this.razorpay as any).payments.create({
        amount: data.amount,
        currency: data.currency,
        order_id: data.orderId,
        method: data.paymentMethod,
        email: data.email,
        contact: data.contact,
        name: data.name,
        notes: data.notes,
      });

      return {
        paymentId: payment.id,
        orderId: payment.order_id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
      };
    } catch (error) {
      console.error('Razorpay Payment Creation Error:', error);
      throw createError('Failed to create payment', 500);
    }
  }

  /**
   * Create a subscription
   */
  async createSubscription(data: {
    planId: string;
    customerId: string;
    totalCount?: number;
    notes?: Record<string, string>;
  }): Promise<{
    subscriptionId: string;
    planId: string;
    customerId: string;
    status: string;
    currentStart: Date;
    currentEnd: Date;
  }> {
    try {
      const subscription = await this.razorpay.subscriptions.create({
        plan_id: data.planId,
        customer_notify: 1,
        total_count: data.totalCount || 0,
        notes: data.notes,
      });

      return {
        subscriptionId: subscription.id,
        planId: subscription.plan_id,
        customerId: subscription.customer_id || '',
        status: subscription.status,
        currentStart: new Date(((subscription.current_start ?? subscription.start_at) as number) * 1000),
        currentEnd: new Date(((subscription.current_end ?? subscription.end_at) as number) * 1000),
      };
    } catch (error) {
      console.error('Razorpay Subscription Creation Error:', error);
      throw createError('Failed to create subscription', 500);
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<{
    subscriptionId: string;
    status: string;
    canceledAt: Date;
  }> {
    try {
      const subscription = await this.razorpay.subscriptions.cancel(subscriptionId);

      return {
        subscriptionId: subscription.id,
        status: subscription.status,
        canceledAt: new Date(((subscription as any).canceled_at as number) * 1000),
      };
    } catch (error) {
      console.error('Razorpay Subscription Cancellation Error:', error);
      throw createError('Failed to cancel subscription', 500);
    }
  }

  /**
   * Create a plan
   */
  async createPlan(data: {
    period: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    item: {
      name: string;
      amount: number;
      currency: string;
      description?: string;
    };
    notes?: Record<string, string>;
  }): Promise<{
    planId: string;
    period: string;
    interval: number;
    item: {
      name: string;
      amount: number;
      currency: string;
    };
  }> {
    try {
      const plan = await this.razorpay.plans.create({
        period: data.period,
        interval: data.interval,
        item: data.item,
        notes: data.notes,
      });

      return {
        planId: plan.id,
        period: plan.period,
        interval: plan.interval,
        item: {
          name: plan.item.name,
          amount: Number(plan.item.amount),
          currency: plan.item.currency,
        },
      };
    } catch (error) {
      console.error('Razorpay Plan Creation Error:', error);
      throw createError('Failed to create plan', 500);
    }
  }

  /**
   * Process refund
   */
  async processRefund(paymentId: string, amount?: number, notes?: string): Promise<{
    refundId: string;
    paymentId: string;
    amount: number;
    status: string;
  }> {
    try {
      const params: any = {};
      if (amount) {
        params.amount = amount;
      }
      if (notes) {
        params.notes = { reason: notes };
      }

      const refund = await (this.razorpay as any).payments.refund(paymentId, params);

      return {
        refundId: refund.id,
        paymentId: refund.payment_id,
        amount: refund.amount,
        status: refund.status,
      };
    } catch (error) {
      console.error('Razorpay Refund Error:', error);
      throw createError('Failed to process refund', 500);
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(payload)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return false;
    }
  }

  /**
   * Get payment details
   */
  async getPayment(paymentId: string): Promise<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    orderId: string;
    email: string;
    contact?: string;
    method: string;
    description?: string;
    notes?: Record<string, string>;
  }> {
    try {
      const payment = await this.razorpay.payments.fetch(paymentId);

      return {
        id: payment.id,
        amount: Number(payment.amount),
        currency: payment.currency,
        status: payment.status,
        orderId: payment.order_id,
        email: payment.email,
        contact: payment.contact != null ? String(payment.contact) : undefined,
        method: payment.method,
        description: payment.description,
        notes: payment.notes as unknown as Record<string, string> | undefined,
      };
    } catch (error) {
      console.error('Razorpay Payment Retrieval Error:', error);
      throw createError('Failed to retrieve payment', 500);
    }
  }

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionId: string): Promise<{
    id: string;
    status: string;
    planId: string;
    customerId: string;
    currentStart: Date;
    currentEnd: Date;
    startAt: Date;
    endAt: Date;
    canceledAt?: Date;
  }> {
    try {
      const subscription = await this.razorpay.subscriptions.fetch(subscriptionId);

      return {
        id: subscription.id,
        status: subscription.status,
        planId: subscription.plan_id,
        customerId: subscription.customer_id || '',
        currentStart: new Date(((subscription.current_start ?? subscription.start_at) as number) * 1000),
        currentEnd: new Date(((subscription.current_end ?? subscription.end_at) as number) * 1000),
        startAt: new Date(subscription.start_at * 1000),
        endAt: new Date(subscription.end_at * 1000),
        canceledAt: (subscription as any).canceled_at 
          ? new Date(((subscription as any).canceled_at as number) * 1000)
          : undefined,
      };
    } catch (error) {
      console.error('Razorpay Subscription Retrieval Error:', error);
      throw createError('Failed to retrieve subscription', 500);
    }
  }

  /**
   * Create a customer
   */
  async createCustomer(data: {
    name: string;
    email: string;
    contact?: string;
    notes?: Record<string, string>;
  }): Promise<{
    customerId: string;
    name: string;
    email: string;
    contact?: string;
  }> {
    try {
      const customer = await this.razorpay.customers.create({
        name: data.name,
        email: data.email,
        contact: data.contact,
        notes: data.notes,
      });

      return {
        customerId: customer.id,
        name: customer.name || '',
        email: customer.email || '',
        contact: customer.contact != null ? String(customer.contact) : undefined,
      };
    } catch (error) {
      console.error('Razorpay Customer Creation Error:', error);
      throw createError('Failed to create customer', 500);
    }
  }

  /**
   * Get customer details
   */
  async getCustomer(customerId: string): Promise<{
    id: string;
    name: string;
    email: string;
    contact?: string;
    notes?: Record<string, string>;
  }> {
    try {
      const customer = await this.razorpay.customers.fetch(customerId);

      return {
        id: customer.id,
        name: customer.name || '',
        email: customer.email || '',
        contact: customer.contact != null ? String(customer.contact) : undefined,
        notes: customer.notes as unknown as Record<string, string> | undefined,
      };
    } catch (error) {
      console.error('Razorpay Customer Retrieval Error:', error);
      throw createError('Failed to retrieve customer', 500);
    }
  }

  /**
   * Get all payments for a customer
   */
  async getCustomerPayments(customerId: string): Promise<Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    method: string;
    createdAt: Date;
  }>> {
    try {
      const payments: any = await (this.razorpay as any).payments.all({
        'customer_id': customerId,
      });

      return (payments.items as any[]).map((payment: any) => ({
        id: payment.id,
        amount: Number(payment.amount),
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        createdAt: new Date(payment.created_at * 1000),
      }));
    } catch (error) {
      console.error('Razorpay Customer Payments Retrieval Error:', error);
      throw createError('Failed to retrieve customer payments', 500);
    }
  }
}

export const razorpayService = new RazorpayService();
