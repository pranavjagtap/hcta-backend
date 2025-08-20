import Stripe from 'stripe';
import { createError } from '../utils/appError';

export class StripeService {
  private stripe: Stripe;
  private webhookSecret: string;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is required');
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2023-08-16',
    });

    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
  }

  /**
   * Create a payment intent
   */
  async createPaymentIntent(data: {
    amount: number;
    currency: string;
    paymentMethodId: string;
    customerId?: string;
    description: string;
    metadata?: Record<string, string>;
  }): Promise<{
    paymentIntentId: string;
    clientSecret: string;
    status: string;
  }> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: data.amount,
        currency: data.currency.toLowerCase(),
        payment_method: data.paymentMethodId,
        customer: data.customerId,
        description: data.description,
        metadata: data.metadata,
        confirm: true,
        return_url: `${process.env.FRONTEND_URL}/payment/success`,
      });

      return {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret!,
        status: paymentIntent.status,
      };
    } catch (error) {
      console.error('Stripe Payment Intent Error:', error);
      throw createError('Failed to create payment intent', 500);
    }
  }

  /**
   * Create a customer
   */
  async createCustomer(data: {
    email: string;
    name?: string;
    phone?: string;
    metadata?: Record<string, string>;
  }): Promise<{
    customerId: string;
    email: string;
  }> {
    try {
      const customer = await this.stripe.customers.create({
        email: data.email,
        name: data.name,
        phone: data.phone,
        metadata: data.metadata,
      });

      return {
        customerId: customer.id,
        email: customer.email!,
      };
    } catch (error) {
      console.error('Stripe Customer Creation Error:', error);
      throw createError('Failed to create customer', 500);
    }
  }

  /**
   * Create a subscription
   */
  async createSubscription(data: {
    customerId: string;
    priceId: string;
    paymentMethodId?: string;
    trialDays?: number;
    metadata?: Record<string, string>;
  }): Promise<{
    subscriptionId: string;
    status: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    trialEnd?: Date;
  }> {
    try {
      const subscriptionData: Stripe.SubscriptionCreateParams = {
        customer: data.customerId,
        items: [{ price: data.priceId }],
        metadata: data.metadata,
      };

      if (data.paymentMethodId) {
        subscriptionData.default_payment_method = data.paymentMethodId;
      }

      if (data.trialDays && data.trialDays > 0) {
        subscriptionData.trial_period_days = data.trialDays;
      }

      const subscription = await this.stripe.subscriptions.create(subscriptionData);

      return {
        subscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        trialEnd: subscription.trial_end 
          ? new Date(subscription.trial_end * 1000)
          : undefined,
      };
    } catch (error) {
      console.error('Stripe Subscription Creation Error:', error);
      throw createError('Failed to create subscription', 500);
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd: boolean = true): Promise<{
    subscriptionId: string;
    status: string;
    canceledAt: Date;
  }> {
    try {
      const subscription = await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: cancelAtPeriodEnd,
      });

      return {
        subscriptionId: subscription.id,
        status: subscription.status,
        canceledAt: new Date(subscription.canceled_at! * 1000),
      };
    } catch (error) {
      console.error('Stripe Subscription Cancellation Error:', error);
      throw createError('Failed to cancel subscription', 500);
    }
  }

  /**
   * Reactivate a subscription
   */
  async reactivateSubscription(subscriptionId: string): Promise<{
    subscriptionId: string;
    status: string;
  }> {
    try {
      const subscription = await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
      });

      return {
        subscriptionId: subscription.id,
        status: subscription.status,
      };
    } catch (error) {
      console.error('Stripe Subscription Reactivation Error:', error);
      throw createError('Failed to reactivate subscription', 500);
    }
  }

  /**
   * Update subscription payment method
   */
  async updateSubscriptionPaymentMethod(
    subscriptionId: string,
    paymentMethodId: string
  ): Promise<{
    subscriptionId: string;
    status: string;
  }> {
    try {
      const subscription = await this.stripe.subscriptions.update(subscriptionId, {
        default_payment_method: paymentMethodId,
      });

      return {
        subscriptionId: subscription.id,
        status: subscription.status,
      };
    } catch (error) {
      console.error('Stripe Subscription Payment Method Update Error:', error);
      throw createError('Failed to update payment method', 500);
    }
  }

  /**
   * Create a price for a subscription plan
   */
  async createPrice(data: {
    productId: string;
    unitAmount: number;
    currency: string;
    recurring: {
      interval: 'day' | 'week' | 'month' | 'year';
      intervalCount?: number;
    };
    metadata?: Record<string, string>;
  }): Promise<{
    priceId: string;
    unitAmount: number;
    currency: string;
  }> {
    try {
      const price = await this.stripe.prices.create({
        product: data.productId,
        unit_amount: data.unitAmount,
        currency: data.currency.toLowerCase(),
        recurring: data.recurring,
        metadata: data.metadata,
      });

      return {
        priceId: price.id,
        unitAmount: price.unit_amount!,
        currency: price.currency,
      };
    } catch (error) {
      console.error('Stripe Price Creation Error:', error);
      throw createError('Failed to create price', 500);
    }
  }

  /**
   * Create a product
   */
  async createProduct(data: {
    name: string;
    description?: string;
    metadata?: Record<string, string>;
  }): Promise<{
    productId: string;
    name: string;
  }> {
    try {
      const product = await this.stripe.products.create({
        name: data.name,
        description: data.description,
        metadata: data.metadata,
      });

      return {
        productId: product.id,
        name: product.name,
      };
    } catch (error) {
      console.error('Stripe Product Creation Error:', error);
      throw createError('Failed to create product', 500);
    }
  }

  /**
   * Process refund
   */
  async processRefund(paymentIntentId: string, amount?: number, reason?: string): Promise<{
    refundId: string;
    amount: number;
    status: string;
  }> {
    try {
      const refundData: Stripe.RefundCreateParams = {
        payment_intent: paymentIntentId,
      };

      if (amount) {
        refundData.amount = amount;
      }

      if (reason) {
        refundData.reason = reason as 'duplicate' | 'fraudulent' | 'requested_by_customer';
      }

      const refund = await this.stripe.refunds.create(refundData);

      return {
        refundId: refund.id,
        amount: refund.amount,
        status: String(refund.status ?? 'unknown'),
      };
    } catch (error) {
      console.error('Stripe Refund Error:', error);
      throw createError('Failed to process refund', 500);
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): Stripe.Event {
    try {
      return this.stripe.webhooks.constructEvent(payload, signature, this.webhookSecret);
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      throw createError('Invalid webhook signature', 400);
    }
  }

  /**
   * Get payment intent details
   */
  async getPaymentIntent(paymentIntentId: string): Promise<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    customerId?: string;
    paymentMethodId?: string;
    metadata: Record<string, string>;
  }> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

      return {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        customerId: paymentIntent.customer as string,
        paymentMethodId: paymentIntent.payment_method as string,
        metadata: paymentIntent.metadata,
      };
    } catch (error) {
      console.error('Stripe Payment Intent Retrieval Error:', error);
      throw createError('Failed to retrieve payment intent', 500);
    }
  }

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionId: string): Promise<{
    id: string;
    status: string;
    customerId: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    trialEnd?: Date;
    canceledAt?: Date;
    cancelAtPeriodEnd: boolean;
  }> {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);

      return {
        id: subscription.id,
        status: subscription.status,
        customerId: subscription.customer as string,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        trialEnd: subscription.trial_end 
          ? new Date(subscription.trial_end * 1000)
          : undefined,
        canceledAt: subscription.canceled_at 
          ? new Date(subscription.canceled_at * 1000)
          : undefined,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      };
    } catch (error) {
      console.error('Stripe Subscription Retrieval Error:', error);
      throw createError('Failed to retrieve subscription', 500);
    }
  }

  /**
   * Create a payment method
   */
  async createPaymentMethod(data: {
    type: 'card';
    card: {
      token?: string;
      number?: string;
      expMonth?: number;
      expYear?: number;
      cvc?: string;
    };
    billingDetails?: {
      name?: string;
      email?: string;
      phone?: string;
      address?: {
        line1?: string;
        line2?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        country?: string;
      };
    };
  }): Promise<{
    paymentMethodId: string;
    type: string;
    card?: {
      brand: string;
      last4: string;
      expMonth: number;
      expYear: number;
    };
  }> {
    try {
      const params: Stripe.PaymentMethodCreateParams = {
        type: 'card',
        card: data.card.token
          ? { token: data.card.token }
          : {
              number: data.card.number!,
              exp_month: data.card.expMonth!,
              exp_year: data.card.expYear!,
              cvc: data.card.cvc,
            },
        billing_details: data.billingDetails
          ? {
              name: data.billingDetails.name,
              email: data.billingDetails.email,
              phone: data.billingDetails.phone,
              address: data.billingDetails.address
                ? {
                    line1: data.billingDetails.address.line1,
                    line2: data.billingDetails.address.line2,
                    city: data.billingDetails.address.city,
                    state: data.billingDetails.address.state,
                    postal_code: data.billingDetails.address.postalCode,
                    country: data.billingDetails.address.country,
                  }
                : undefined,
            }
          : undefined,
      };

      const paymentMethod = await this.stripe.paymentMethods.create(params);

      return {
        paymentMethodId: paymentMethod.id,
        type: paymentMethod.type,
        card: paymentMethod.card
          ? {
              brand: paymentMethod.card.brand,
              last4: paymentMethod.card.last4,
              expMonth: paymentMethod.card.exp_month ?? 0,
              expYear: paymentMethod.card.exp_year ?? 0,
            }
          : undefined,
      };
    } catch (error) {
      console.error('Stripe Payment Method Creation Error:', error);
      throw createError('Failed to create payment method', 500);
    }
  }

  /**
   * Attach payment method to customer
   */
  async attachPaymentMethodToCustomer(
    paymentMethodId: string,
    customerId: string
  ): Promise<void> {
    try {
      await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });
    } catch (error) {
      console.error('Stripe Payment Method Attachment Error:', error);
      throw createError('Failed to attach payment method to customer', 500);
    }
  }

  /**
   * Detach payment method from customer
   */
  async detachPaymentMethod(paymentMethodId: string): Promise<void> {
    try {
      await this.stripe.paymentMethods.detach(paymentMethodId);
    } catch (error) {
      console.error('Stripe Payment Method Detachment Error:', error);
      throw createError('Failed to detach payment method', 500);
    }
  }
}

export const stripeService = new StripeService();
