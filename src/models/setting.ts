import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISetting extends Document {
  scope: 'global' | 'institute' | 'tutor';
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'json' | 'array';
  description?: string;
  category: string;
  isPublic: boolean;
  updatedBy: mongoose.Types.ObjectId;
  updatedAt: Date;
}

export interface ISettingModel extends Model<ISetting> {
  getSettingsByScope(scope: string, filters?: any): Promise<ISetting[]>;
  getSetting(scope: string, key: string): Promise<ISetting | null>;
  setSetting(scope: string, key: string, value: any, type: string, updatedBy: string, options?: any): Promise<ISetting>;
  getPublicSettings(scope: string): Promise<ISetting[]>;
  getSettingsByCategory(scope: string, category: string): Promise<ISetting[]>;
}

const settingSchema = new Schema<ISetting>({
  scope: {
    type: String,
    enum: ['global', 'institute', 'tutor'],
    required: true,
    index: true
  },
  key: {
    type: String,
    required: true,
    maxlength: 100
  },
  value: {
    type: Schema.Types.Mixed,
    required: true
  },
  type: {
    type: String,
    enum: ['string', 'number', 'boolean', 'json', 'array'],
    required: true
  },
  description: {
    type: String,
    maxlength: 500
  },
  category: {
    type: String,
    required: true,
    maxlength: 50,
    index: true
  },
  isPublic: {
    type: Boolean,
    default: false,
    index: true
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

// Compound index for scope + key uniqueness
settingSchema.index({ scope: 1, key: 1 }, { unique: true });
settingSchema.index({ scope: 1, category: 1 });
settingSchema.index({ scope: 1, isPublic: 1 });

// Virtual for formatted value
settingSchema.virtual('formattedValue').get(function() {
  switch (this.type) {
    case 'boolean':
      return this.value ? 'Enabled' : 'Disabled';
    case 'json':
      return JSON.stringify(this.value, null, 2);
    case 'array':
      return Array.isArray(this.value) ? this.value.join(', ') : this.value;
    default:
      return this.value;
  }
});

// Static method to get settings by scope
settingSchema.statics.getSettingsByScope = async function(scope: string, filters: any = {}) {
  const query: any = { scope };
  
  if (filters.category) query.category = filters.category;
  if (filters.isPublic !== undefined) query.isPublic = filters.isPublic;
  if (filters.key) query.key = { $regex: filters.key, $options: 'i' };

  return await this.find(query)
    .populate('updatedBy', 'name email')
    .sort({ category: 1, key: 1 })
    .lean();
};

// Static method to get a specific setting
settingSchema.statics.getSetting = async function(scope: string, key: string) {
  return await this.findOne({ scope, key }).lean();
};

// Static method to set a setting
settingSchema.statics.setSetting = async function(
  scope: string, 
  key: string, 
  value: any, 
  type: string, 
  updatedBy: string, 
  options: any = {}
) {
  const settingData = {
    scope,
    key,
    value,
    type,
    description: options.description,
    category: options.category || 'general',
    isPublic: options.isPublic || false,
    updatedBy
  };

  const setting = await this.findOneAndUpdate(
    { scope, key },
    settingData,
    { upsert: true, new: true }
  ).populate('updatedBy', 'name email');

  return setting;
};

// Static method to get public settings
settingSchema.statics.getPublicSettings = async function(scope: string) {
  return await this.find({ scope, isPublic: true })
    .sort({ category: 1, key: 1 })
    .lean();
};

// Static method to get settings by category
settingSchema.statics.getSettingsByCategory = async function(scope: string, category: string) {
  return await this.find({ scope, category })
    .populate('updatedBy', 'name email')
    .sort({ key: 1 })
    .lean();
};

export const Setting = mongoose.model<ISetting, ISettingModel>('Setting', settingSchema);
