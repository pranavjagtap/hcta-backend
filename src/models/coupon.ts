import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICoupon extends Document {
  code: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed';
  value: number;
  currency: string;
  minAmount?: number;
  maxDiscount?: number;
  validFrom: Date;
  validUntil: Date;
  usageLimit: number;
  usedCount: number;
  allowedPlans?: mongoose.Types.ObjectId[];
  excludedPlans?: mongoose.Types.ObjectId[];
  isActive: boolean;
  isFirstTimeOnly: boolean;
  metadata?: {
    createdBy?: mongoose.Types.ObjectId;
    campaignId?: string;
    notes?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ICouponModel extends Model<ICoupon> {
  getActiveCoupons(): Promise<ICoupon[]>;
  getCouponByCode(code: string): Promise<ICoupon | null>;
  validateCoupon(code: string, userId: string, planId: string, amount: number): Promise<{ valid: boolean; message?: string; discount?: number }>;
  incrementUsage(couponId: string): Promise<void>;
  getCouponStats(dateRange?: { start: Date; end: Date }): Promise<any>;
}

const couponSchema = new Schema<ICoupon>({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: 20,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  type: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },
  value: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR']
  },
  minAmount: {
    type: Number,
    min: 0
  },
  maxDiscount: {
    type: Number,
    min: 0
  },
  validFrom: {
    type: Date,
    required: true,
    index: true
  },
  validUntil: {
    type: Date,
    required: true,
    index: true
  },
  usageLimit: {
    type: Number,
    required: true,
    min: 1
  },
  usedCount: {
    type: Number,
    default: 0,
    min: 0
  },
  allowedPlans: [{
    type: Schema.Types.ObjectId,
    ref: 'SubscriptionPlan'
  }],
  excludedPlans: [{
    type: Schema.Types.ObjectId,
    ref: 'SubscriptionPlan'
  }],
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isFirstTimeOnly: {
    type: Boolean,
    default: false
  },
  metadata: {
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    campaignId: String,
    notes: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
couponSchema.index({ code: 1, isActive: 1 });
couponSchema.index({ validFrom: 1, validUntil: 1 });
couponSchema.index({ isActive: 1, validUntil: 1 });

// Virtual for remaining usage
couponSchema.virtual('remainingUsage').get(function() {
  return Math.max(0, this.usageLimit - this.usedCount);
});

// Virtual for is expired
couponSchema.virtual('isExpired').get(function() {
  return new Date() > this.validUntil;
});

// Virtual for is valid
couponSchema.virtual('isValid').get(function() {
  const now = new Date();
  return this.isActive && 
         now >= this.validFrom && 
         now <= this.validUntil && 
         this.usedCount < this.usageLimit;
});

// Virtual for usage percentage
couponSchema.virtual('usagePercentage').get(function() {
  return (this.usedCount / this.usageLimit) * 100;
});

// Static method to get active coupons
couponSchema.statics.getActiveCoupons = async function() {
  const now = new Date();
  return await this.find({
    isActive: true,
    validFrom: { $lte: now },
    validUntil: { $gte: now },
    $expr: { $lt: ['$usedCount', '$usageLimit'] }
  }).sort({ validUntil: 1 }).lean();
};

// Static method to get coupon by code
couponSchema.statics.getCouponByCode = async function(code: string) {
  return await this.findOne({ 
    code: code.toUpperCase(),
    isActive: true 
  }).lean();
};

// Static method to validate coupon
couponSchema.statics.validateCoupon = async function(
  code: string, 
  userId: string, 
  planId: string, 
  amount: number
) {
  const coupon = await this.findOne({ 
    code: code.toUpperCase(),
    isActive: true 
  });

  if (!coupon) {
    return { valid: false, message: 'Invalid coupon code' };
  }

  const now = new Date();
  
  // Check validity period
  if (now < coupon.validFrom || now > coupon.validUntil) {
    return { valid: false, message: 'Coupon is not valid at this time' };
  }

  // Check usage limit
  if (coupon.usedCount >= coupon.usageLimit) {
    return { valid: false, message: 'Coupon usage limit exceeded' };
  }

  // Check minimum amount
  if (coupon.minAmount && amount < coupon.minAmount) {
    return { 
      valid: false, 
      message: `Minimum amount required: ${coupon.currency} ${coupon.minAmount}` 
    };
  }

  // Check allowed/excluded plans
  if (coupon.allowedPlans && coupon.allowedPlans.length > 0) {
    if (!coupon.allowedPlans.includes(planId as any)) {
      return { valid: false, message: 'Coupon not valid for this plan' };
    }
  }

  if (coupon.excludedPlans && coupon.excludedPlans.includes(planId as any)) {
    return { valid: false, message: 'Coupon not valid for this plan' };
  }

  // Check first-time only
  if (coupon.isFirstTimeOnly) {
    // TODO: Check if user has made any previous payments
    // This would require checking the Payment model
  }

  // Calculate discount
  let discount = 0;
  if (coupon.type === 'percentage') {
    discount = (amount * coupon.value) / 100;
  } else {
    discount = coupon.value;
  }

  // Apply max discount limit
  if (coupon.maxDiscount && discount > coupon.maxDiscount) {
    discount = coupon.maxDiscount;
  }

  return { 
    valid: true, 
    discount: Math.min(discount, amount) // Ensure discount doesn't exceed amount
  };
};

// Static method to increment usage
couponSchema.statics.incrementUsage = async function(couponId: string) {
  await this.findByIdAndUpdate(couponId, {
    $inc: { usedCount: 1 }
  });
};

// Static method to get coupon statistics
couponSchema.statics.getCouponStats = async function(dateRange?: { start: Date; end: Date }) {
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
        _id: null,
        totalCoupons: { $sum: 1 },
        activeCoupons: {
          $sum: {
            $cond: [
              { $and: [
                '$isActive',
                { $gte: ['$validUntil', new Date()] },
                { $lt: ['$usedCount', '$usageLimit'] }
              ]},
              1,
              0
            ]
          }
        },
        totalUsage: { $sum: '$usedCount' },
        avgUsage: { $avg: '$usedCount' }
      }
    }
  ];

  const stats = await this.aggregate(pipeline);
  return stats[0] || {
    totalCoupons: 0,
    activeCoupons: 0,
    totalUsage: 0,
    avgUsage: 0
  };
};

export const Coupon = mongoose.model<ICoupon, ICouponModel>('Coupon', couponSchema);
