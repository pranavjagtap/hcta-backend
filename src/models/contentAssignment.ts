import mongoose, { Document, Schema } from 'mongoose';

export interface IContentAssignment extends Document {
  contentId: mongoose.Types.ObjectId;
  assignedBy: mongoose.Types.ObjectId;
  
  // Assignment scope
  assignmentType: 'batch' | 'grade' | 'subject' | 'individual';
  batchIds?: mongoose.Types.ObjectId[];
  gradeIds?: string[];
  subjectIds?: mongoose.Types.ObjectId[];
  studentIds?: mongoose.Types.ObjectId[];
  
  // Assignment details
  title?: string;
  description?: string;
  dueDate?: Date;
  isRequired: boolean;
  isActive: boolean;
  
  // Access control
  accessFrom: Date;
  accessUntil?: Date;
  maxAttempts?: number;
  
  // Progress tracking
  totalAssigned: number;
  completedCount: number;
  inProgressCount: number;
  notStartedCount: number;
  
  // Metadata
  tags: string[];
  priority: 'low' | 'medium' | 'high';
  notes?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const contentAssignmentSchema = new Schema<IContentAssignment>(
  {
    contentId: {
      type: Schema.Types.ObjectId,
      ref: 'Content',
      required: true,
      index: true
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    
    // Assignment scope
    assignmentType: {
      type: String,
      required: true,
      enum: ['batch', 'grade', 'subject', 'individual'],
      index: true
    },
    batchIds: [{
      type: Schema.Types.ObjectId,
      ref: 'Batch',
      index: true
    }],
    gradeIds: [{
      type: String,
      index: true
    }],
    subjectIds: [{
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      index: true
    }],
    studentIds: [{
      type: Schema.Types.ObjectId,
      ref: 'Student',
      index: true
    }],
    
    // Assignment details
    title: {
      type: String,
      trim: true,
      maxlength: 200
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    dueDate: {
      type: Date,
      index: true
    },
    isRequired: {
      type: Boolean,
      default: true,
      index: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    
    // Access control
    accessFrom: {
      type: Date,
      required: true,
      default: Date.now,
      index: true
    },
    accessUntil: {
      type: Date,
      index: true
    },
    maxAttempts: {
      type: Number,
      min: 1,
      max: 100
    },
    
    // Progress tracking
    totalAssigned: {
      type: Number,
      default: 0
    },
    completedCount: {
      type: Number,
      default: 0
    },
    inProgressCount: {
      type: Number,
      default: 0
    },
    notStartedCount: {
      type: Number,
      default: 0
    },
    
    // Metadata
    tags: [{
      type: String,
      trim: true,
      maxlength: 50
    }],
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
      index: true
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for efficient querying
contentAssignmentSchema.index({ contentId: 1, isActive: 1 });
contentAssignmentSchema.index({ assignedBy: 1, createdAt: -1 });
contentAssignmentSchema.index({ assignmentType: 1, isActive: 1 });
contentAssignmentSchema.index({ dueDate: 1, isActive: 1 });
contentAssignmentSchema.index({ accessFrom: 1, accessUntil: 1 });

// Virtual for completion percentage
contentAssignmentSchema.virtual('completionPercentage').get(function() {
  if (this.totalAssigned === 0) return 0;
  return Math.round((this.completedCount / this.totalAssigned) * 100);
});

// Virtual for progress percentage
contentAssignmentSchema.virtual('progressPercentage').get(function() {
  if (this.totalAssigned === 0) return 0;
  return Math.round(((this.completedCount + this.inProgressCount) / this.totalAssigned) * 100);
});

// Virtual for assignment status
contentAssignmentSchema.virtual('status').get(function() {
  if (!this.isActive) return 'inactive';
  if (this.accessUntil && new Date() > this.accessUntil) return 'expired';
  if (this.dueDate && new Date() > this.dueDate) return 'overdue';
  if (this.accessFrom && new Date() < this.accessFrom) return 'scheduled';
  return 'active';
});

// Virtual for formatted due date
contentAssignmentSchema.virtual('formattedDueDate').get(function() {
  if (!this.dueDate) return null;
  return this.dueDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Pre-save middleware to update counts
contentAssignmentSchema.pre('save', function(next) {
  // Calculate total assigned based on assignment type
  let total = 0;
  
  if (this.assignmentType === 'batch' && this.batchIds) {
    total = this.batchIds.length;
  } else if (this.assignmentType === 'grade' && this.gradeIds) {
    total = this.gradeIds.length;
  } else if (this.assignmentType === 'subject' && this.subjectIds) {
    total = this.subjectIds.length;
  } else if (this.assignmentType === 'individual' && this.studentIds) {
    total = this.studentIds.length;
  }
  
  this.totalAssigned = total;
  this.notStartedCount = total - this.completedCount - this.inProgressCount;
  
  next();
});

export const ContentAssignment = mongoose.model<IContentAssignment>('ContentAssignment', contentAssignmentSchema);
