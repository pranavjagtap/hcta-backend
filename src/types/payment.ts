import { Request } from 'express';

// ============================================================================
// SUBSCRIPTION PLAN TYPES
// ============================================================================

export interface SubscriptionPlanResponse {
  _id: string;
  name: string;
  description: string;
  features: string[];
  duration: 'monthly' | 'yearly';
  price: number;
  currency: string;
  formattedPrice: string;
  annualPrice: number;
  trialDays: number;
  maxUsers?: number;
  maxStorage?: number;
  isActive: boolean;
  isPopular?: boolean;
  sortOrder: number;
  metadata?: {
    stripePriceId?: string;
    razorpayPlanId?: string;
    featuresList?: Array<{
      name: string;
      description: string;
      included: boolean;
    }>;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubscriptionPlanRequest {
  name: string;
  description: string;
  features: string[];
  duration: 'monthly' | 'yearly';
  price: number;
  currency?: string;
  trialDays?: number;
  maxUsers?: number;
  maxStorage?: number;
  isPopular?: boolean;
  sortOrder?: number;
  metadata?: {
    stripePriceId?: string;
    razorpayPlanId?: string;
    featuresList?: Array<{
      name: string;
      description: string;
      included: boolean;
    }>;
  };
}

export interface UpdateSubscriptionPlanRequest extends Partial<CreateSubscriptionPlanRequest> {
  isActive?: boolean;
}

export interface SubscriptionPlanFilters {
  isActive?: boolean;
  duration?: 'monthly' | 'yearly';
  priceRange?: {
    min: number;
    max: number;
  };
  search?: string;
  page?: number;
  limit?: number;
}

// ============================================================================
// SUBSCRIPTION TYPES
// ============================================================================

export interface SubscriptionResponse {
  _id: string;
  userId: string;
  user?: {
    _id: string;
    name: string;
    email: string;
  };
  planId: string;
  plan?: SubscriptionPlanResponse;
  status: 'active' | 'inactive' | 'cancelled' | 'expired' | 'trial' | 'past_due';
  startDate: string;
  endDate: string;
  trialEndDate?: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: string;
  paymentMethod: 'stripe' | 'razorpay';
  paymentMethodId?: string;
  lastPaymentDate?: string;
  nextBillingDate?: string;
  autoRenew: boolean;
  retryCount: number;
  maxRetries: number;
  daysRemaining: number;
  isTrial: boolean;
  isExpired: boolean;
  metadata?: {
    stripeSubscriptionId?: string;
    razorpaySubscriptionId?: string;
    stripeCustomerId?: string;
    razorpayCustomerId?: string;
    upgradeFrom?: string;
    downgradeTo?: string;
    prorationAmount?: number;
    notes?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubscriptionRequest {
  planId: string;
  paymentMethod: 'stripe' | 'razorpay';
  paymentMethodId: string;
  autoRenew?: boolean;
  metadata?: {
    stripeCustomerId?: string;
    razorpayCustomerId?: string;
    upgradeFrom?: string;
    prorationAmount?: string;
  };
}

export interface UpdateSubscriptionRequest {
  autoRenew?: boolean;
  paymentMethodId?: string;
  metadata?: {
    notes?: string;
  };
}

export interface SubscriptionFilters {
  status?: 'active' | 'inactive' | 'cancelled' | 'expired' | 'trial' | 'past_due';
  paymentMethod?: 'stripe' | 'razorpay';
  dateRange?: {
    start: string;
    end: string;
  };
  page?: number;
  limit?: number;
}

// ============================================================================
// PAYMENT TYPES
// ============================================================================

export interface PaymentResponse {
  _id: string;
  userId: string;
  user?: {
    _id: string;
    name: string;
    email: string;
  };
  subscriptionId?: string;
  subscription?: SubscriptionResponse;
  planId?: string;
  plan?: SubscriptionPlanResponse;
  amount: number;
  currency: string;
  formattedAmount: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  paymentMethod: 'stripe' | 'razorpay';
  paymentMethodId: string;
  paymentIntentId?: string;
  transactionId: string;
  description: string;
  receiptUrl?: string;
  refundAmount?: number;
  refundReason?: string;
  refundedAt?: string;
  failureReason?: string;
  failureCode?: string;
  isRefundable: boolean;
  refundAmountRemaining: number;
  metadata?: {
    stripePaymentIntentId?: string;
    razorpayPaymentId?: string;
    stripeCustomerId?: string;
    razorpayCustomerId?: string;
    cardLast4?: string;
    cardBrand?: string;
    cardCountry?: string;
    billingAddress?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
    invoiceId?: string;
    notes?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentRequest {
  amount: number;
  currency?: string;
  paymentMethod: 'stripe' | 'razorpay';
  paymentMethodId: string;
  description: string;
  subscriptionId?: string;
  planId?: string;
  metadata?: {
    stripeCustomerId?: string;
    razorpayCustomerId?: string;
    billingAddress?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
  };
}

export interface PaymentFilters {
  status?: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  paymentMethod?: 'stripe' | 'razorpay';
  dateRange?: {
    start: string;
    end: string;
  };
  page?: number;
  limit?: number;
}

export interface RefundPaymentRequest {
  amount?: number;
  reason?: string;
}

// ============================================================================
// INVOICE TYPES
// ============================================================================

export interface InvoiceResponse {
  _id: string;
  invoiceNumber: string;
  userId: string;
  user?: {
    _id: string;
    name: string;
    email: string;
  };
  paymentId: string;
  payment?: PaymentResponse;
  subscriptionId?: string;
  subscription?: SubscriptionResponse;
  planId?: string;
  plan?: SubscriptionPlanResponse;
  amount: number;
  currency: string;
  formattedAmount: string;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  formattedTotalAmount: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate: string;
  paidAt?: string;
  isOverdue: boolean;
  daysOverdue: number;
  billingAddress: {
    name: string;
    email: string;
    phone?: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
  };
  items: Array<{
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    type: 'subscription' | 'one_time' | 'addon';
  }>;
  notes?: string;
  terms?: string;
  pdfUrl?: string;
  metadata?: {
    stripeInvoiceId?: string;
    razorpayInvoiceId?: string;
    generatedAt?: string;
    sentAt?: string;
    notes?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceRequest {
  paymentId: string;
  subscriptionId?: string;
  planId?: string;
  amount: number;
  currency?: string;
  taxAmount?: number;
  discountAmount?: number;
  totalAmount: number;
  dueDate: string;
  billingAddress: {
    name: string;
    email: string;
    phone?: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
  };
  items: Array<{
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    type: 'subscription' | 'one_time' | 'addon';
  }>;
  notes?: string;
  terms?: string;
}

export interface InvoiceFilters {
  status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dateRange?: {
    start: string;
    end: string;
  };
  page?: number;
  limit?: number;
}

// ============================================================================
// PAYMENT GATEWAY TYPES
// ============================================================================

export interface StripePaymentIntentRequest {
  amount: number;
  currency: string;
  paymentMethodId: string;
  customerId?: string;
  description: string;
  metadata?: Record<string, string>;
}

export interface RazorpayOrderRequest {
  amount: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface PaymentGatewayResponse {
  success: boolean;
  paymentIntentId?: string;
  clientSecret?: string;
  orderId?: string;
  error?: string;
}

export interface WebhookEvent {
  type: string;
  data: any;
  signature?: string;
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

export interface SubscriptionAnalytics {
  totalSubscriptions: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
  cancelledSubscriptions: number;
  expiredSubscriptions: number;
  pastDueSubscriptions: number;
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  churnRate: number;
  averageRevenuePerUser: number;
  planDistribution: Array<{
    planName: string;
    count: number;
    percentage: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    newSubscriptions: number;
    cancellations: number;
    revenue: number;
  }>;
}

export interface PaymentAnalytics {
  totalPayments: number;
  totalAmount: number;
  completedPayments: number;
  completedAmount: number;
  failedPayments: number;
  failedAmount: number;
  pendingPayments: number;
  pendingAmount: number;
  refundedPayments: number;
  refundedAmount: number;
  averageAmount: number;
  paymentMethodDistribution: Array<{
    method: string;
    count: number;
    amount: number;
    percentage: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    payments: number;
    amount: number;
    successRate: number;
  }>;
}

export interface InvoiceAnalytics {
  totalInvoices: number;
  totalAmount: number;
  paidInvoices: number;
  paidAmount: number;
  overdueInvoices: number;
  overdueAmount: number;
  draftInvoices: number;
  draftAmount: number;
  sentInvoices: number;
  sentAmount: number;
  averageAmount: number;
  collectionRate: number;
  averageDaysToPay: number;
  monthlyTrends: Array<{
    month: string;
    invoices: number;
    amount: number;
    collected: number;
  }>;
}

// ============================================================================
// REQUEST TYPES
// ============================================================================

export interface AuthenticatedRequest extends Request {
  user?: {
    _id: string;
    uid: string;
    name?: string;
    email?: string;
    role: any;
    permissions?: string[];
  };
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export interface PaymentNotification {
  type: 'payment_success' | 'payment_failed' | 'subscription_renewal' | 'subscription_expired' | 'invoice_overdue';
  userId: string;
  data: {
    paymentId?: string;
    subscriptionId?: string;
    invoiceId?: string;
    amount?: number;
    currency?: string;
    dueDate?: string;
    failureReason?: string;
  };
}

// ============================================================================
// ACCESS CONTROL TYPES
// ============================================================================

export interface SubscriptionAccess {
  userId: string;
  subscriptionId: string;
  planName: string;
  features: string[];
  maxUsers?: number;
  maxStorage?: number;
  isActive: boolean;
  expiresAt: string;
  daysRemaining: number;
}

export interface FeatureAccess {
  userId: string;
  feature: string;
  hasAccess: boolean;
  subscriptionId?: string;
  expiresAt?: string;
}
