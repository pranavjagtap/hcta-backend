import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReportSchedule extends Document {
  name: string;
  type: 'attendance' | 'performance' | 'usage' | 'revenue' | 'custom';
  cron: string;
  filters: any;
  format: 'csv' | 'xlsx' | 'pdf';
  destination: {
    email?: string[];
    s3?: {
      bucket: string;
      key: string;
    };
  };
  isActive: boolean;
  lastRunAt?: Date;
  nextRunAt?: Date;
  lastRunStatus?: 'success' | 'failed' | 'partial';
  lastRunError?: string;
  runCount: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReportScheduleModel extends Model<IReportSchedule> {
  getActiveSchedules(): Promise<IReportSchedule[]>;
  getSchedulesByType(type: string): Promise<IReportSchedule[]>;
  updateLastRun(scheduleId: string, status: string, error?: string): Promise<IReportSchedule>;
  getNextRunSchedules(): Promise<IReportSchedule[]>;
}

const reportScheduleSchema = new Schema<IReportSchedule>({
  name: {
    type: String,
    required: true,
    maxlength: 100
  },
  type: {
    type: String,
    enum: ['attendance', 'performance', 'usage', 'revenue', 'custom'],
    required: true,
    index: true
  },
  cron: {
    type: String,
    required: true,
    validate: {
      validator: function(v: string) {
        // Basic cron validation (5 or 6 fields)
        const parts = v.split(' ');
        return parts.length >= 5 && parts.length <= 6;
      },
      message: 'Invalid cron expression'
    }
  },
  filters: {
    type: Schema.Types.Mixed,
    default: {}
  },
  format: {
    type: String,
    enum: ['csv', 'xlsx', 'pdf'],
    required: true
  },
  destination: {
    email: [{
      type: String,
      validate: {
        validator: function(v: string) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Invalid email address'
      }
    }],
    s3: {
      bucket: String,
      key: String
    }
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  lastRunAt: Date,
  nextRunAt: Date,
  lastRunStatus: {
    type: String,
    enum: ['success', 'failed', 'partial']
  },
  lastRunError: String,
  runCount: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
reportScheduleSchema.index({ isActive: 1, nextRunAt: 1 });
reportScheduleSchema.index({ type: 1, isActive: 1 });
reportScheduleSchema.index({ createdBy: 1, createdAt: -1 });

// Virtual for next run time
reportScheduleSchema.virtual('nextRunFormatted').get(function() {
  if (!this.nextRunAt) return 'Not scheduled';
  return this.nextRunAt.toLocaleString();
});

// Virtual for last run time
reportScheduleSchema.virtual('lastRunFormatted').get(function() {
  if (!this.lastRunAt) return 'Never run';
  return this.lastRunAt.toLocaleString();
});

// Virtual for status
reportScheduleSchema.virtual('status').get(function() {
  if (!this.isActive) return 'inactive';
  if (!this.lastRunStatus) return 'pending';
  return this.lastRunStatus;
});

// Static method to get active schedules
reportScheduleSchema.statics.getActiveSchedules = async function() {
  return await this.find({ isActive: true })
    .populate('createdBy', 'name email')
    .sort({ nextRunAt: 1 })
    .lean();
};

// Static method to get schedules by type
reportScheduleSchema.statics.getSchedulesByType = async function(type: string) {
  return await this.find({ type, isActive: true })
    .populate('createdBy', 'name email')
    .sort({ nextRunAt: 1 })
    .lean();
};

// Static method to update last run
reportScheduleSchema.statics.updateLastRun = async function(
  scheduleId: string, 
  status: string, 
  error?: string
) {
  const updateData: any = {
    lastRunAt: new Date(),
    lastRunStatus: status,
    runCount: { $inc: 1 }
  };

  if (error) {
    updateData.lastRunError = error;
  }

  const schedule = await this.findByIdAndUpdate(
    scheduleId,
    updateData,
    { new: true }
  ).populate('createdBy', 'name email');

  if (!schedule) {
    throw new Error('Report schedule not found');
  }

  return schedule;
};

// Static method to get schedules ready to run
reportScheduleSchema.statics.getNextRunSchedules = async function() {
  const now = new Date();
  return await this.find({
    isActive: true,
    nextRunAt: { $lte: now }
  }).lean();
};

// Pre-save middleware to calculate next run time
reportScheduleSchema.pre('save', function(this: any, next) {
  if (this.isModified('cron') || this.isNew) {
    // Calculate next run time based on cron expression
    // This is a simplified implementation - in production, use a proper cron library
    const nextRun = (this as any).calculateNextRun(this.cron);
    this.nextRunAt = nextRun;
  }
  next();
});

// Method to calculate next run time (simplified)
reportScheduleSchema.methods.calculateNextRun = function(cronExpression: string) {
  // This is a placeholder implementation
  // In production, use a library like 'node-cron' or 'cron-parser'
  const now = new Date();
  const nextRun = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Default to 24 hours from now
  return nextRun;
};

export const ReportSchedule = mongoose.model<IReportSchedule, IReportScheduleModel>('ReportSchedule', reportScheduleSchema);
