import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId;
  subscriptionId?: mongoose.Types.ObjectId;
  planId?: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  paymentMethod: 'stripe' | 'razorpay';
  paymentMethodId: string;
  paymentIntentId?: string;
  transactionId: string;
  description: string;
  receiptUrl?: string;
  refundAmount?: number;
  refundReason?: string;
  refundedAt?: Date;
  failureReason?: string;
  failureCode?: string;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface IPaymentModel extends Model<IPayment> {
  getUserPayments(userId: string, page?: number, limit?: number): Promise<{ payments: IPayment[]; total: number }>;
  getPaymentByTransactionId(transactionId: string): Promise<IPayment | null>;
  getPaymentByStripeIntentId(stripePaymentIntentId: string): Promise<IPayment | null>;
  getPaymentByRazorpayId(razorpayPaymentId: string): Promise<IPayment | null>;
  getPaymentStats(dateRange?: { start: Date; end: Date }): Promise<any>;
  getFailedPayments(): Promise<IPayment[]>;
  refundPayment(paymentId: string, amount?: number, reason?: string): Promise<IPayment>;
}

const paymentSchema = new Schema<IPayment>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  subscriptionId: {
    type: Schema.Types.ObjectId,
    ref: 'Subscription'
  },
  planId: {
    type: Schema.Types.ObjectId,
    ref: 'SubscriptionPlan'
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR']
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'pending',
    index: true
  },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'razorpay'],
    required: true
  },
  paymentMethodId: {
    type: String,
    required: true
  },
  paymentIntentId: String,
  transactionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  receiptUrl: String,
  refundAmount: {
    type: Number,
    min: 0
  },
  refundReason: String,
  refundedAt: Date,
  failureReason: String,
  failureCode: String,
  metadata: {
    stripePaymentIntentId: String,
    razorpayPaymentId: String,
    stripeCustomerId: String,
    razorpayCustomerId: String,
    cardLast4: String,
    cardBrand: String,
    cardCountry: String,
    billingAddress: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      postalCode: String,
      country: String
    },
    invoiceId: String,
    notes: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ 'metadata.stripePaymentIntentId': 1 });
paymentSchema.index({ 'metadata.razorpayPaymentId': 1 });
paymentSchema.index({ transactionId: 1 });

// Virtual for user info
paymentSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Virtual for subscription info
paymentSchema.virtual('subscription', {
  ref: 'Subscription',
  localField: 'subscriptionId',
  foreignField: '_id',
  justOne: true
});

// Virtual for plan info
paymentSchema.virtual('plan', {
  ref: 'SubscriptionPlan',
  localField: 'planId',
  foreignField: '_id',
  justOne: true
});

// Virtual for formatted amount
paymentSchema.virtual('formattedAmount').get(function() {
  return `${this.currency} ${this.amount.toFixed(2)}`;
});

// Virtual for is refundable
paymentSchema.virtual('isRefundable').get(function() {
  return this.status === 'completed' && !this.refundAmount;
});

// Virtual for refund amount remaining
paymentSchema.virtual('refundAmountRemaining').get(function() {
  if (this.status !== 'completed') return 0;
  return this.amount - (this.refundAmount || 0);
});

// Method to check if payment is successful
paymentSchema.methods.isSuccessful = function() {
  return this.status === 'completed';
};

// Method to check if payment is refundable
paymentSchema.methods.canRefund = function() {
  return this.status === 'completed' && this.refundAmountRemaining > 0;
};

// Static method to get user payments
paymentSchema.statics.getUserPayments = async function(
  userId: string,
  page: number = 1,
  limit: number = 20
) {
  const skip = (page - 1) * limit;
  
  const [payments, total] = await Promise.all([
    this.find({ userId })
      .populate('plan', 'name price currency')
      .populate('subscription', 'status currentPeriodEnd')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    this.countDocuments({ userId })
  ]);
  
  return { payments, total };
};

// Static method to get payment by transaction ID
paymentSchema.statics.getPaymentByTransactionId = async function(transactionId: string) {
  return await this.findOne({ transactionId })
    .populate('user', 'name email')
    .populate('plan')
    .populate('subscription')
    .lean();
};

// Static method to get payment by Stripe intent ID
paymentSchema.statics.getPaymentByStripeIntentId = async function(stripePaymentIntentId: string) {
  return await this.findOne({ 'metadata.stripePaymentIntentId': stripePaymentIntentId })
    .populate('user', 'name email')
    .populate('plan')
    .populate('subscription')
    .lean();
};

// Static method to get payment by Razorpay ID
paymentSchema.statics.getPaymentByRazorpayId = async function(razorpayPaymentId: string) {
  return await this.findOne({ 'metadata.razorpayPaymentId': razorpayPaymentId })
    .populate('user', 'name email')
    .populate('plan')
    .populate('subscription')
    .lean();
};

// Static method to get payment statistics
paymentSchema.statics.getPaymentStats = async function(dateRange?: { start: Date; end: Date }) {
  const match: any = {};
  
  if (dateRange) {
    match.createdAt = {
      $gte: dateRange.start,
      $lte: dateRange.end
    };
  }
  
  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        avgAmount: { $avg: '$amount' }
      }
    }
  ];
  
  const stats = await this.aggregate(pipeline);
  
  const result: any = {
    total: 0,
    totalAmount: 0,
    completed: 0,
    completedAmount: 0,
    failed: 0,
    failedAmount: 0,
    pending: 0,
    pendingAmount: 0,
    refunded: 0,
    refundedAmount: 0,
    avgAmount: 0
  };
  
  stats.forEach((stat: any) => {
    result.total += stat.count;
    result.totalAmount += stat.totalAmount;
    result[stat._id] = stat.count;
    result[`${stat._id}Amount`] = stat.totalAmount;
  });
  
  result.avgAmount = result.total > 0 ? result.totalAmount / result.total : 0;
  
  return result;
};

// Static method to get failed payments
paymentSchema.statics.getFailedPayments = async function() {
  return await this.find({ status: 'failed' })
    .populate('user', 'name email')
    .populate('plan', 'name price')
    .sort({ createdAt: -1 })
    .lean();
};

// Static method to refund payment
paymentSchema.statics.refundPayment = async function(
  paymentId: string,
  amount?: number,
  reason?: string
) {
  const payment = await this.findById(paymentId);
  if (!payment) {
    throw new Error('Payment not found');
  }
  
  if (!payment.canRefund()) {
    throw new Error('Payment cannot be refunded');
  }
  
  const refundAmount = amount || payment.refundAmountRemaining;
  
  if (refundAmount > payment.refundAmountRemaining) {
    throw new Error('Refund amount exceeds remaining amount');
  }
  
  payment.refundAmount = (payment.refundAmount || 0) + refundAmount;
  payment.refundReason = reason;
  payment.refundedAt = new Date();
  
  if (payment.refundAmount >= payment.amount) {
    payment.status = 'refunded';
  }
  
  return await payment.save();
};

export const Payment = mongoose.model<IPayment, IPaymentModel>('Payment', paymentSchema);
