import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISubscriptionPlan extends Document {
  name: string;
  description: string;
  features: string[];
  duration: 'monthly' | 'yearly';
  price: number;
  currency: string;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface ISubscriptionPlanModel extends Model<ISubscriptionPlan> {
  getActivePlans(): Promise<ISubscriptionPlan[]>;
  getPlanByStripeId(stripePriceId: string): Promise<ISubscriptionPlan | null>;
  getPlanByRazorpayId(razorpayPlanId: string): Promise<ISubscriptionPlan | null>;
  getPopularPlans(): Promise<ISubscriptionPlan[]>;
}

const subscriptionPlanSchema = new Schema<ISubscriptionPlan>({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  features: [{
    type: String,
    required: true
  }],
  duration: {
    type: String,
    enum: ['monthly', 'yearly'],
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR']
  },
  trialDays: {
    type: Number,
    default: 0,
    min: 0,
    max: 30
  },
  maxUsers: {
    type: Number,
    min: 1
  },
  maxStorage: {
    type: Number, // in MB
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  metadata: {
    stripePriceId: String,
    razorpayPlanId: String,
    featuresList: [{
      name: String,
      description: String,
      included: Boolean
    }]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
subscriptionPlanSchema.index({ isActive: 1, sortOrder: 1 });
subscriptionPlanSchema.index({ 'metadata.stripePriceId': 1 });
subscriptionPlanSchema.index({ 'metadata.razorpayPlanId': 1 });

// Virtual for formatted price
subscriptionPlanSchema.virtual('formattedPrice').get(function() {
  return `${this.currency} ${this.price.toFixed(2)}`;
});

// Virtual for annual price (if monthly)
subscriptionPlanSchema.virtual('annualPrice').get(function() {
  if (this.duration === 'monthly') {
    return this.price * 12;
  }
  return this.price;
});

// Static method to get active plans
subscriptionPlanSchema.statics.getActivePlans = async function() {
  return await this.find({ isActive: true })
    .sort({ sortOrder: 1, price: 1 })
    .lean();
};

// Static method to get plan by Stripe ID
subscriptionPlanSchema.statics.getPlanByStripeId = async function(stripePriceId: string) {
  return await this.findOne({ 'metadata.stripePriceId': stripePriceId }).lean();
};

// Static method to get plan by Razorpay ID
subscriptionPlanSchema.statics.getPlanByRazorpayId = async function(razorpayPlanId: string) {
  return await this.findOne({ 'metadata.razorpayPlanId': razorpayPlanId }).lean();
};

// Static method to get popular plans
subscriptionPlanSchema.statics.getPopularPlans = async function() {
  return await this.find({ isActive: true, isPopular: true })
    .sort({ sortOrder: 1 })
    .lean();
};

export const SubscriptionPlan = mongoose.model<ISubscriptionPlan, ISubscriptionPlanModel>('SubscriptionPlan', subscriptionPlanSchema);
