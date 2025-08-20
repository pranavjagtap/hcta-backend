import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFlag extends Document {
  materialId: mongoose.Types.ObjectId;
  reporterId: mongoose.Types.ObjectId;
  reason: string;
  status: 'open' | 'resolved' | 'dismissed';
  notes: Array<{
    adminId: mongoose.Types.ObjectId;
    note: string;
    createdAt: Date;
  }>;
  category: 'inappropriate' | 'copyright' | 'spam' | 'quality' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  metadata?: {
    originalContent?: string;
    context?: string;
    evidence?: string[];
    relatedFlags?: mongoose.Types.ObjectId[];
  };
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  resolvedBy?: mongoose.Types.ObjectId;
}

export interface IFlagModel extends Model<IFlag> {
  getFlagsByStatus(status: string, filters?: any): Promise<IFlag[]>;
  getFlagStats(dateRange?: { start: Date; end: Date }): Promise<any>;
  addNote(flagId: string, adminId: string, note: string): Promise<IFlag>;
  resolveFlag(flagId: string, adminId: string, resolution: 'resolved' | 'dismissed', note?: string): Promise<IFlag>;
}

const flagSchema = new Schema<IFlag>({
  materialId: {
    type: Schema.Types.ObjectId,
    ref: 'Content',
    required: true,
    index: true
  },
  reporterId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  reason: {
    type: String,
    required: true,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['open', 'resolved', 'dismissed'],
    default: 'open',
    index: true
  },
  notes: [{
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    note: {
      type: String,
      required: true,
      maxlength: 2000
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  category: {
    type: String,
    enum: ['inappropriate', 'copyright', 'spam', 'quality', 'other'],
    required: true,
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    index: true
  },
  metadata: {
    originalContent: String,
    context: String,
    evidence: [String],
    relatedFlags: [{
      type: Schema.Types.ObjectId,
      ref: 'Flag'
    }]
  },
  resolvedAt: Date,
  resolvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
flagSchema.index({ status: 1, priority: 1, createdAt: -1 });
flagSchema.index({ materialId: 1, status: 1 });
flagSchema.index({ reporterId: 1, createdAt: -1 });
flagSchema.index({ category: 1, status: 1 });

// Virtual for time since creation
flagSchema.virtual('timeSinceCreation').get(function() {
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - this.createdAt.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 24) return `${diffInHours}h`;
  return `${Math.floor(diffInHours / 24)}d`;
});

// Virtual for is urgent
flagSchema.virtual('isUrgent').get(function() {
  return this.priority === 'urgent' || 
         (this.priority === 'high' && this.status === 'open' && 
          new Date().getTime() - this.createdAt.getTime() > 24 * 60 * 60 * 1000);
});

// Static method to get flags by status
flagSchema.statics.getFlagsByStatus = async function(status: string, filters: any = {}) {
  const query: any = { status };
  
  if (filters.category) query.category = filters.category;
  if (filters.priority) query.priority = filters.priority;
  if (filters.materialId) query.materialId = filters.materialId;
  if (filters.reporterId) query.reporterId = filters.reporterId;

  return await this.find(query)
    .populate('materialId', 'title type uploadedBy')
    .populate('reporterId', 'name email')
    .populate('notes.adminId', 'name email')
    .populate('resolvedBy', 'name email')
    .sort({ priority: -1, createdAt: -1 })
    .lean();
};

// Static method to get flag statistics
flagSchema.statics.getFlagStats = async function(dateRange?: { start: Date; end: Date }) {
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
        totalFlags: { $sum: 1 },
        openFlags: {
          $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] }
        },
        resolvedFlags: {
          $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
        },
        dismissedFlags: {
          $sum: { $cond: [{ $eq: ['$status', 'dismissed'] }, 1, 0] }
        },
        byCategory: {
          $push: {
            category: '$category',
            status: '$status'
          }
        },
        byPriority: {
          $push: {
            priority: '$priority',
            status: '$status'
          }
        }
      }
    }
  ];

  const stats = await this.aggregate(pipeline);
  return stats[0] || {
    totalFlags: 0,
    openFlags: 0,
    resolvedFlags: 0,
    dismissedFlags: 0,
    byCategory: [],
    byPriority: []
  };
};

// Static method to add a note to a flag
flagSchema.statics.addNote = async function(flagId: string, adminId: string, note: string) {
  const flag = await this.findById(flagId);
  if (!flag) {
    throw new Error('Flag not found');
  }

  flag.notes.push({
    adminId,
    note,
    createdAt: new Date()
  });

  return await flag.save();
};

// Static method to resolve a flag
flagSchema.statics.resolveFlag = async function(
  flagId: string, 
  adminId: string, 
  resolution: 'resolved' | 'dismissed', 
  note?: string
) {
  const flag = await this.findById(flagId);
  if (!flag) {
    throw new Error('Flag not found');
  }

  flag.status = resolution;
  flag.resolvedAt = new Date();
  flag.resolvedBy = adminId;

  if (note) {
    flag.notes.push({
      adminId,
      note,
      createdAt: new Date()
    });
  }

  return await flag.save();
};

export const Flag = mongoose.model<IFlag, IFlagModel>('Flag', flagSchema);
