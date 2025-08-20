import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId;
  planId: mongoose.Types.ObjectId;
  status: 'active' | 'inactive' | 'cancelled' | 'expired' | 'trial' | 'past_due';
  startDate: Date;
  endDate: Date;
  trialEndDate?: Date;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: Date;
  paymentMethod: 'stripe' | 'razorpay';
  paymentMethodId?: string;
  lastPaymentDate?: Date;
  nextBillingDate?: Date;
  autoRenew: boolean;
  retryCount: number;
  maxRetries: number;
  metadata?: {
    stripeSubscriptionId?: string;
    razorpaySubscriptionId?: string;
    stripeCustomerId?: string;
    razorpayCustomerId?: string;
    upgradeFrom?: mongoose.Types.ObjectId;
    downgradeTo?: mongoose.Types.ObjectId;
    prorationAmount?: number;
    notes?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ISubscriptionModel extends Model<ISubscription> {
  getUserActiveSubscription(userId: string): Promise<ISubscription | null>;
  getUserSubscriptionHistory(userId: string): Promise<ISubscription[]>;
  getExpiringSubscriptions(daysAhead: number): Promise<ISubscription[]>;
  getFailedPaymentSubscriptions(): Promise<ISubscription[]>;
  getSubscriptionStats(): Promise<any>;
  cancelSubscription(subscriptionId: string, cancelAtPeriodEnd?: boolean): Promise<ISubscription>;
  reactivateSubscription(subscriptionId: string): Promise<ISubscription>;
}

const subscriptionSchema = new Schema<ISubscription>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  planId: {
    type: Schema.Types.ObjectId,
    ref: 'SubscriptionPlan',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'cancelled', 'expired', 'trial', 'past_due'],
    default: 'trial',
    index: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  trialEndDate: Date,
  currentPeriodStart: {
    type: Date,
    required: true
  },
  currentPeriodEnd: {
    type: Date,
    required: true
  },
  cancelAtPeriodEnd: {
    type: Boolean,
    default: false
  },
  cancelledAt: Date,
  paymentMethod: {
    type: String,
    enum: ['stripe', 'razorpay'],
    required: true
  },
  paymentMethodId: String,
  lastPaymentDate: Date,
  nextBillingDate: Date,
  autoRenew: {
    type: Boolean,
    default: true
  },
  retryCount: {
    type: Number,
    default: 0
  },
  maxRetries: {
    type: Number,
    default: 3
  },
  metadata: {
    stripeSubscriptionId: String,
    razorpaySubscriptionId: String,
    stripeCustomerId: String,
    razorpayCustomerId: String,
    upgradeFrom: {
      type: Schema.Types.ObjectId,
      ref: 'Subscription'
    },
    downgradeTo: {
      type: Schema.Types.ObjectId,
      ref: 'Subscription'
    },
    prorationAmount: Number,
    notes: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ status: 1, currentPeriodEnd: 1 });
subscriptionSchema.index({ 'metadata.stripeSubscriptionId': 1 });
subscriptionSchema.index({ 'metadata.razorpaySubscriptionId': 1 });
subscriptionSchema.index({ nextBillingDate: 1 });

// Virtual for user info
subscriptionSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Virtual for plan info
subscriptionSchema.virtual('plan', {
  ref: 'SubscriptionPlan',
  localField: 'planId',
  foreignField: '_id',
  justOne: true
});

// Virtual for days remaining
subscriptionSchema.virtual('daysRemaining').get(function() {
  if (this.status === 'active' || this.status === 'trial') {
    const now = new Date();
    const end = this.currentPeriodEnd;
    const diffTime = end.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Virtual for is trial
subscriptionSchema.virtual('isTrial').get(function() {
  return this.status === 'trial' && this.trialEndDate && new Date() < this.trialEndDate;
});

// Virtual for is expired
subscriptionSchema.virtual('isExpired').get(function() {
  return this.currentPeriodEnd < new Date();
});

// Method to check if subscription is active
subscriptionSchema.methods.isActive = function() {
  return ['active', 'trial'].includes(this.status) && this.currentPeriodEnd > new Date();
};

// Method to get subscription status
subscriptionSchema.methods.getStatus = function() {
  if (this.status === 'cancelled') return 'cancelled';
  if (this.isExpired) return 'expired';
  if (this.isTrial) return 'trial';
  return this.status;
};

// Static method to get user's active subscription
subscriptionSchema.statics.getUserActiveSubscription = async function(userId: string) {
  return await this.findOne({
    userId,
    status: { $in: ['active', 'trial'] },
    currentPeriodEnd: { $gt: new Date() }
  })
  .populate('plan')
  .populate('user', 'name email')
  .sort({ createdAt: -1 })
  .lean();
};

// Static method to get user's subscription history
subscriptionSchema.statics.getUserSubscriptionHistory = async function(userId: string) {
  return await this.find({ userId })
    .populate('plan')
    .sort({ createdAt: -1 })
    .lean();
};

// Static method to get expiring subscriptions
subscriptionSchema.statics.getExpiringSubscriptions = async function(daysAhead: number = 7) {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + daysAhead);
  
  return await this.find({
    status: { $in: ['active', 'trial'] },
    currentPeriodEnd: { $lte: targetDate, $gt: new Date() }
  })
  .populate('user', 'name email')
  .populate('plan')
  .lean();
};

// Static method to get failed payment subscriptions
subscriptionSchema.statics.getFailedPaymentSubscriptions = async function() {
  return await this.find({
    status: 'past_due',
    retryCount: { $lt: 3 }
  })
  .populate('user', 'name email')
  .populate('plan')
  .lean();
};

// Static method to get subscription statistics
subscriptionSchema.statics.getSubscriptionStats = async function() {
  const pipeline = [
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalRevenue: {
          $sum: {
            $cond: [
              { $eq: ['$status', 'active'] },
              { $ifNull: ['$plan.price', 0] },
              0
            ]
          }
        }
      }
    }
  ];
  
  const stats = await this.aggregate(pipeline);
  
  const result: any = {
    total: 0,
    active: 0,
    trial: 0,
    cancelled: 0,
    expired: 0,
    pastDue: 0,
    totalRevenue: 0
  };
  
  stats.forEach((stat: any) => {
    result.total += stat.count;
    result[stat._id] = stat.count;
    result.totalRevenue += stat.totalRevenue || 0;
  });
  
  return result;
};

// Static method to cancel subscription
subscriptionSchema.statics.cancelSubscription = async function(
  subscriptionId: string,
  cancelAtPeriodEnd: boolean = true
) {
  const subscription = await this.findById(subscriptionId);
  if (!subscription) {
    throw new Error('Subscription not found');
  }
  
  subscription.cancelAtPeriodEnd = cancelAtPeriodEnd;
  subscription.cancelledAt = new Date();
  
  if (!cancelAtPeriodEnd) {
    subscription.status = 'cancelled';
    subscription.currentPeriodEnd = new Date();
  }
  
  return await subscription.save();
};

// Static method to reactivate subscription
subscriptionSchema.statics.reactivateSubscription = async function(subscriptionId: string) {
  const subscription = await this.findById(subscriptionId);
  if (!subscription) {
    throw new Error('Subscription not found');
  }
  
  subscription.cancelAtPeriodEnd = false;
  subscription.cancelledAt = undefined;
  subscription.status = 'active';
  
  return await subscription.save();
};

export const Subscription = mongoose.model<ISubscription, ISubscriptionModel>('Subscription', subscriptionSchema);
