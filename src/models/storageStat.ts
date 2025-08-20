import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IStorageStat extends Document {
  ownerType: 'tutor' | 'institute';
  ownerId: mongoose.Types.ObjectId;
  bytesUsed: number;
  filesCount: number;
  breakdown: {
    documents: { bytes: number; count: number };
    images: { bytes: number; count: number };
    videos: { bytes: number; count: number };
    audio: { bytes: number; count: number };
    other: { bytes: number; count: number };
  };
  metadata?: {
    lastCalculated: Date;
    calculationMethod: string;
    notes?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IStorageStatModel extends Model<IStorageStat> {
  getStatsByOwner(ownerType: string, ownerId: string): Promise<IStorageStat | null>;
  getTopStorageUsers(ownerType: string, limit: number): Promise<IStorageStat[]>;
  getStorageStatsByDateRange(ownerType: string, startDate: Date, endDate: Date): Promise<IStorageStat[]>;
  updateStorageStats(ownerType: string, ownerId: string, stats: any): Promise<IStorageStat>;
  getTotalStorageUsage(ownerType?: string): Promise<{ totalBytes: number; totalFiles: number }>;
}

const storageStatSchema = new Schema<IStorageStat>({
  ownerType: {
    type: String,
    enum: ['tutor', 'institute'],
    required: true,
    index: true
  },
  ownerId: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true
  },
  bytesUsed: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  filesCount: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  breakdown: {
    documents: {
      bytes: { type: Number, default: 0 },
      count: { type: Number, default: 0 }
    },
    images: {
      bytes: { type: Number, default: 0 },
      count: { type: Number, default: 0 }
    },
    videos: {
      bytes: { type: Number, default: 0 },
      count: { type: Number, default: 0 }
    },
    audio: {
      bytes: { type: Number, default: 0 },
      count: { type: Number, default: 0 }
    },
    other: {
      bytes: { type: Number, default: 0 },
      count: { type: Number, default: 0 }
    }
  },
  metadata: {
    lastCalculated: {
      type: Date,
      default: Date.now
    },
    calculationMethod: {
      type: String,
      default: 'aggregation'
    },
    notes: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index for owner lookup
storageStatSchema.index({ ownerType: 1, ownerId: 1 }, { unique: true });
storageStatSchema.index({ bytesUsed: -1 });
storageStatSchema.index({ filesCount: -1 });

// Virtual for formatted storage size
storageStatSchema.virtual('formattedSize').get(function() {
  const bytes = this.bytesUsed;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 B';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
});

// Virtual for storage percentage (assuming limits)
storageStatSchema.virtual('storagePercentage').get(function() {
  // This would be calculated based on the owner's storage limit
  // For now, return a placeholder
  return 0;
});

// Virtual for is over limit
storageStatSchema.virtual('isOverLimit').get(function() {
  // This would be calculated based on the owner's storage limit
  // For now, return false
  return false;
});

// Static method to get stats by owner
storageStatSchema.statics.getStatsByOwner = async function(ownerType: string, ownerId: string) {
  return await this.findOne({ ownerType, ownerId })
    .populate('ownerId', 'name email')
    .lean();
};

// Static method to get top storage users
storageStatSchema.statics.getTopStorageUsers = async function(ownerType: string, limit: number = 10) {
  return await this.find({ ownerType })
    .populate('ownerId', 'name email')
    .sort({ bytesUsed: -1 })
    .limit(limit)
    .lean();
};

// Static method to get storage stats by date range
storageStatSchema.statics.getStorageStatsByDateRange = async function(
  ownerType: string, 
  startDate: Date, 
  endDate: Date
) {
  return await this.find({
    ownerType,
    updatedAt: { $gte: startDate, $lte: endDate }
  })
    .populate('ownerId', 'name email')
    .sort({ updatedAt: -1 })
    .lean();
};

// Static method to update storage stats
storageStatSchema.statics.updateStorageStats = async function(
  ownerType: string, 
  ownerId: string, 
  stats: any
) {
  const updateData = {
    ...stats,
    'metadata.lastCalculated': new Date()
  };

  const storageStat = await this.findOneAndUpdate(
    { ownerType, ownerId },
    updateData,
    { upsert: true, new: true }
  ).populate('ownerId', 'name email');

  return storageStat;
};

// Static method to get total storage usage
storageStatSchema.statics.getTotalStorageUsage = async function(ownerType?: string) {
  const match: any = {};
  if (ownerType) match.ownerType = ownerType;

  const result = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalBytes: { $sum: '$bytesUsed' },
        totalFiles: { $sum: '$filesCount' }
      }
    }
  ]);

  return result[0] || { totalBytes: 0, totalFiles: 0 };
};

export const StorageStat = mongoose.model<IStorageStat, IStorageStatModel>('StorageStat', storageStatSchema);
