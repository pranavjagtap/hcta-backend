import mongoose, { Document, Schema } from 'mongoose';

export interface IContentAudit extends Document {
  actorId: mongoose.Types.ObjectId;
  action: 'create' | 'update' | 'delete' | 'archive' | 'restore' | 'assign' | 'share' | 'view' | 'download' | 'favorite' | 'rate';
  contentId: mongoose.Types.ObjectId;
  resourceType: 'content' | 'assignment' | 'access';
  
  // Change tracking
  before?: any;
  after?: any;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  
  // Context
  userAgent?: string;
  ipAddress?: string;
  sessionId?: string;
  
  // Metadata
  metadata?: {
    batchIds?: mongoose.Types.ObjectId[];
    teacherIds?: mongoose.Types.ObjectId[];
    reason?: string;
    notes?: string;
  };
  
  // Timestamps
  createdAt: Date;
}

const contentAuditSchema = new Schema<IContentAudit>(
  {
    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    action: {
      type: String,
      required: true,
      enum: ['create', 'update', 'delete', 'archive', 'restore', 'assign', 'share', 'view', 'download', 'favorite', 'rate'],
      index: true
    },
    contentId: {
      type: Schema.Types.ObjectId,
      ref: 'Content',
      required: true,
      index: true
    },
    resourceType: {
      type: String,
      required: true,
      enum: ['content', 'assignment', 'access'],
      index: true
    },
    
    // Change tracking
    before: {
      type: Schema.Types.Mixed
    },
    after: {
      type: Schema.Types.Mixed
    },
    changes: [{
      field: {
        type: String,
        required: true
      },
      oldValue: Schema.Types.Mixed,
      newValue: Schema.Types.Mixed
    }],
    
    // Context
    userAgent: {
      type: String,
      maxlength: 500
    },
    ipAddress: {
      type: String,
      maxlength: 45
    },
    sessionId: {
      type: String,
      maxlength: 100
    },
    
    // Metadata
    metadata: {
      batchIds: [{
        type: Schema.Types.ObjectId,
        ref: 'Batch'
      }],
      teacherIds: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
      }],
      reason: {
        type: String,
        maxlength: 200
      },
      notes: {
        type: String,
        maxlength: 500
      }
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for efficient querying
contentAuditSchema.index({ contentId: 1, action: 1, createdAt: -1 });
contentAuditSchema.index({ actorId: 1, createdAt: -1 });
contentAuditSchema.index({ action: 1, createdAt: -1 });
contentAuditSchema.index({ resourceType: 1, createdAt: -1 });

// Virtual for formatted date
contentAuditSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
});

// Virtual for action description
contentAuditSchema.virtual('actionDescription').get(function() {
  const actionMap = {
    create: 'Created',
    update: 'Updated',
    delete: 'Deleted',
    archive: 'Archived',
    restore: 'Restored',
    assign: 'Assigned',
    share: 'Shared',
    view: 'Viewed',
    download: 'Downloaded',
    favorite: 'Favorited',
    rate: 'Rated'
  };
  return actionMap[this.action] || this.action;
});

export const ContentAudit = mongoose.model<IContentAudit>('ContentAudit', contentAuditSchema);
