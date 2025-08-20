import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAuditLog extends Document {
  actorId: mongoose.Types.ObjectId;
  actorRole: string;
  action: string;
  entity: string;
  entityId?: mongoose.Types.ObjectId;
  before?: any;
  after?: any;
  ip: string;
  userAgent: string;
  metadata?: {
    reason?: string;
    justification?: string;
    impersonatedUserId?: mongoose.Types.ObjectId;
    sessionId?: string;
    requestId?: string;
    duration?: number;
    affectedRecords?: number;
  };
  createdAt: Date;
}

export interface IAuditLogModel extends Model<IAuditLog> {
  logAction(data: {
    actorId: string;
    actorRole: string;
    action: string;
    entity: string;
    entityId?: string;
    before?: any;
    after?: any;
    ip: string;
    userAgent: string;
    metadata?: any;
  }): Promise<IAuditLog>;
  getAuditTrail(filters: {
    actorId?: string;
    action?: string;
    entity?: string;
    entityId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<{ logs: IAuditLog[]; total: number; page: number; totalPages: number }>;
  getAuditStats(dateRange?: { start: Date; end: Date }): Promise<any>;
}

const auditLogSchema = new Schema<IAuditLog>({
  actorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  actorRole: {
    type: String,
    required: true,
    enum: ['admin', 'superadmin', 'support', 'auditor'],
    index: true
  },
  action: {
    type: String,
    required: true,
    index: true
  },
  entity: {
    type: String,
    required: true,
    index: true
  },
  entityId: {
    type: Schema.Types.ObjectId,
    index: true
  },
  before: {
    type: Schema.Types.Mixed
  },
  after: {
    type: Schema.Types.Mixed
  },
  ip: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  metadata: {
    reason: String,
    justification: String,
    impersonatedUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    sessionId: String,
    requestId: String,
    duration: Number,
    affectedRecords: Number
  }
}, {
  timestamps: { createdAt: true, updatedAt: false },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient querying
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ actorId: 1, createdAt: -1 });
auditLogSchema.index({ entity: 1, entityId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ 'metadata.impersonatedUserId': 1, createdAt: -1 });

// Virtual for formatted action
auditLogSchema.virtual('formattedAction').get(function() {
  return `${this.action} on ${this.entity}`;
});

// Virtual for time ago
auditLogSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - this.createdAt.getTime()) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
});

// Static method to log an action
auditLogSchema.statics.logAction = async function(data: {
  actorId: string;
  actorRole: string;
  action: string;
  entity: string;
  entityId?: string;
  before?: any;
  after?: any;
  ip: string;
  userAgent: string;
  metadata?: any;
}) {
  const auditLog = new this({
    actorId: data.actorId,
    actorRole: data.actorRole,
    action: data.action,
    entity: data.entity,
    entityId: data.entityId,
    before: data.before,
    after: data.after,
    ip: data.ip,
    userAgent: data.userAgent,
    metadata: data.metadata
  });

  return await auditLog.save();
};

// Static method to get audit trail with filters
auditLogSchema.statics.getAuditTrail = async function(filters: {
  actorId?: string;
  action?: string;
  entity?: string;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}) {
  const {
    actorId,
    action,
    entity,
    entityId,
    startDate,
    endDate,
    page = 1,
    limit = 50
  } = filters;

  const query: any = {};

  if (actorId) query.actorId = actorId;
  if (action) query.action = action;
  if (entity) query.entity = entity;
  if (entityId) query.entityId = entityId;
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = startDate;
    if (endDate) query.createdAt.$lte = endDate;
  }

  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    this.find(query)
      .populate('actorId', 'name email')
      .populate('metadata.impersonatedUserId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    this.countDocuments(query)
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    logs,
    total,
    page,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
};

// Static method to get audit statistics
auditLogSchema.statics.getAuditStats = async function(dateRange?: { start: Date; end: Date }) {
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
        totalActions: { $sum: 1 },
        uniqueActors: { $addToSet: '$actorId' },
        actionsByRole: {
          $push: {
            role: '$actorRole',
            action: '$action'
          }
        },
        actionsByEntity: {
          $push: {
            entity: '$entity',
            action: '$action'
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        totalActions: 1,
        uniqueActors: { $size: '$uniqueActors' },
        actionsByRole: 1,
        actionsByEntity: 1
      }
    }
  ];

  const stats = await this.aggregate(pipeline);
  return stats[0] || {
    totalActions: 0,
    uniqueActors: 0,
    actionsByRole: [],
    actionsByEntity: []
  };
};

export const AuditLog = mongoose.model<IAuditLog, IAuditLogModel>('AuditLog', auditLogSchema);
