import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFeatureFlag extends Document {
  key: string;
  description?: string;
  enabled: boolean;
  audience?: {
    roles?: string[];
    tutorIds?: mongoose.Types.ObjectId[];
    cohorts?: string[];
    percentage?: number;
  };
  metadata?: {
    rolloutDate?: Date;
    expectedImpact?: string;
    owner?: string;
    tags?: string[];
  };
  updatedBy: mongoose.Types.ObjectId;
  updatedAt: Date;
}

export interface IFeatureFlagModel extends Model<IFeatureFlag> {
  getActiveFlags(): Promise<IFeatureFlag[]>;
  isEnabledForUser(key: string, user: any): Promise<boolean>;
  getFlagsByAudience(audienceType: string, audienceValue: string): Promise<IFeatureFlag[]>;
  toggleFlag(key: string, enabled: boolean, updatedBy: string): Promise<IFeatureFlag>;
  updateAudience(key: string, audience: any, updatedBy: string): Promise<IFeatureFlag>;
}

const featureFlagSchema = new Schema<IFeatureFlag>({
  key: {
    type: String,
    required: true,
    unique: true,
    maxlength: 100,
    index: true
  },
  description: {
    type: String,
    maxlength: 500
  },
  enabled: {
    type: Boolean,
    default: false,
    index: true
  },
  audience: {
    roles: [{
      type: String,
      enum: ['admin', 'superadmin', 'support', 'auditor', 'teacher', 'student', 'parent']
    }],
    tutorIds: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    cohorts: [String],
    percentage: {
      type: Number,
      min: 0,
      max: 100
    }
  },
  metadata: {
    rolloutDate: Date,
    expectedImpact: String,
    owner: String,
    tags: [String]
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: { createdAt: false, updatedAt: true },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
featureFlagSchema.index({ enabled: 1, key: 1 });
featureFlagSchema.index({ 'audience.roles': 1 });
featureFlagSchema.index({ 'audience.tutorIds': 1 });
featureFlagSchema.index({ 'audience.cohorts': 1 });

// Virtual for audience summary
featureFlagSchema.virtual('audienceSummary').get(function() {
  if (!this.audience) return 'All users';
  
  const parts = [];
  if (this.audience.roles && this.audience.roles.length > 0) {
    parts.push(`Roles: ${this.audience.roles.join(', ')}`);
  }
  if (this.audience.tutorIds && this.audience.tutorIds.length > 0) {
    parts.push(`${this.audience.tutorIds.length} specific tutors`);
  }
  if (this.audience.cohorts && this.audience.cohorts.length > 0) {
    parts.push(`Cohorts: ${this.audience.cohorts.join(', ')}`);
  }
  if (this.audience.percentage) {
    parts.push(`${this.audience.percentage}% of users`);
  }
  
  return parts.length > 0 ? parts.join(', ') : 'All users';
});

// Virtual for status
featureFlagSchema.virtual('status').get(function() {
  if (!this.enabled) return 'disabled';
  if (this.audience && (this.audience.roles || this.audience.tutorIds || this.audience.cohorts || this.audience.percentage)) {
    return 'targeted';
  }
  return 'enabled';
});

// Static method to get active flags
featureFlagSchema.statics.getActiveFlags = async function() {
  return await this.find({ enabled: true })
    .populate('updatedBy', 'name email')
    .sort({ key: 1 })
    .lean();
};

// Static method to check if a flag is enabled for a specific user
featureFlagSchema.statics.isEnabledForUser = async function(key: string, user: any) {
  const flag = await this.findOne({ key, enabled: true });
  if (!flag) return false;
  
  // If no audience restrictions, flag is enabled for everyone
  if (!flag.audience) return true;
  
  // Check role-based audience
  if (flag.audience.roles && flag.audience.roles.length > 0) {
    if (!flag.audience.roles.includes(user.role)) {
      return false;
    }
  }
  
  // Check tutor-specific audience
  if (flag.audience.tutorIds && flag.audience.tutorIds.length > 0) {
    if (!flag.audience.tutorIds.includes(user._id)) {
      return false;
    }
  }
  
  // Check cohort-based audience
  if (flag.audience.cohorts && flag.audience.cohorts.length > 0) {
    if (!flag.audience.cohorts.includes(user.cohort)) {
      return false;
    }
  }
  
  // Check percentage-based rollout
  if (flag.audience.percentage && flag.audience.percentage < 100) {
    const userHash = (this as any).hashUserId(user._id.toString());
    const percentage = userHash % 100;
    if (percentage >= flag.audience.percentage) {
      return false;
    }
  }
  
  return true;
};

// Static method to get flags by audience
featureFlagSchema.statics.getFlagsByAudience = async function(audienceType: string, audienceValue: string) {
  const query: any = { enabled: true };
  
  switch (audienceType) {
    case 'role':
      query['audience.roles'] = audienceValue;
      break;
    case 'tutor':
      query['audience.tutorIds'] = audienceValue;
      break;
    case 'cohort':
      query['audience.cohorts'] = audienceValue;
      break;
  }
  
  return await this.find(query)
    .populate('updatedBy', 'name email')
    .sort({ key: 1 })
    .lean();
};

// Static method to toggle a flag
featureFlagSchema.statics.toggleFlag = async function(key: string, enabled: boolean, updatedBy: string) {
  const flag = await this.findOneAndUpdate(
    { key },
    { enabled, updatedBy },
    { new: true }
  ).populate('updatedBy', 'name email');
  
  if (!flag) {
    throw new Error('Feature flag not found');
  }
  
  return flag;
};

// Static method to update audience
featureFlagSchema.statics.updateAudience = async function(key: string, audience: any, updatedBy: string) {
  const flag = await this.findOneAndUpdate(
    { key },
    { audience, updatedBy },
    { new: true }
  ).populate('updatedBy', 'name email');
  
  if (!flag) {
    throw new Error('Feature flag not found');
  }
  
  return flag;
};

// Helper method to hash user ID for percentage-based rollouts
featureFlagSchema.statics.hashUserId = function(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};

export const FeatureFlag = mongoose.model<IFeatureFlag, IFeatureFlagModel>('FeatureFlag', featureFlagSchema);
