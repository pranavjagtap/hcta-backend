import mongoose, { Schema, Document } from 'mongoose';

export interface IMeeting extends Document {
  teacherId: mongoose.Types.ObjectId;
  studentIds: mongoose.Types.ObjectId[];
  startAt: Date;
  endAt: Date;
  roomId: string;
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  subject?: string;
  description?: string;
  meetingType: 'office-hours' | 'doubt-session' | 'group-study' | 'assessment';
  metadata?: {
    recordingUrl?: string;
    notes?: string;
    tags?: string[];
    duration?: number; // actual duration in minutes
  };
  notifications?: {
    reminderSent: boolean;
    reminderSentAt?: Date;
    startNotificationSent: boolean;
    startNotificationSentAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const meetingSchema = new Schema<IMeeting>({
  teacherId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  studentIds: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  startAt: {
    type: Date,
    required: true,
    index: true
  },
  endAt: {
    type: Date,
    required: true
  },
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled',
    index: true
  },
  subject: {
    type: String,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  meetingType: {
    type: String,
    enum: ['office-hours', 'doubt-session', 'group-study', 'assessment'],
    default: 'doubt-session'
  },
  metadata: {
    recordingUrl: String,
    notes: String,
    tags: [String],
    duration: {
      type: Number,
      min: 0
    }
  },
  notifications: {
    reminderSent: {
      type: Boolean,
      default: false
    },
    reminderSentAt: Date,
    startNotificationSent: {
      type: Boolean,
      default: false
    },
    startNotificationSentAt: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
meetingSchema.index({ teacherId: 1, startAt: 1 });
meetingSchema.index({ studentIds: 1, startAt: 1 });
meetingSchema.index({ status: 1, startAt: 1 });
meetingSchema.index({ roomId: 1 });

// Virtual for teacher info
meetingSchema.virtual('teacher', {
  ref: 'User',
  localField: 'teacherId',
  foreignField: '_id',
  justOne: true
});

// Virtual for students info
meetingSchema.virtual('students', {
  ref: 'User',
  localField: 'studentIds',
  foreignField: '_id'
});

// Virtual for duration
meetingSchema.virtual('scheduledDuration', function(this: any) {
  return Math.floor((this.endAt.getTime() - this.startAt.getTime()) / (1000 * 60));
});

// Method to check if meeting is currently active
meetingSchema.methods.isActive = function(): boolean {
  const now = new Date();
  return this.startAt <= now && this.endAt >= now && this.status === 'confirmed';
};

// Method to check if meeting is upcoming
meetingSchema.methods.isUpcoming = function(): boolean {
  const now = new Date();
  return this.startAt > now && this.status === 'scheduled';
};

// Method to start meeting
meetingSchema.methods.start = function() {
  this.status = 'in-progress';
  return this.save();
};

// Method to complete meeting
meetingSchema.methods.complete = function(duration?: number) {
  this.status = 'completed';
  if (duration) {
    this.metadata = { ...this.metadata, duration };
  }
  return this.save();
};

// Method to cancel meeting
meetingSchema.methods.cancel = function() {
  this.status = 'cancelled';
  return this.save();
};

// Method to mark as no-show
meetingSchema.methods.markAsNoShow = function() {
  this.status = 'no-show';
  return this.save();
};

// Method to confirm meeting
meetingSchema.methods.confirm = function() {
  this.status = 'confirmed';
  return this.save();
};

// Method to add recording URL
meetingSchema.methods.setRecordingUrl = function(url: string) {
  this.metadata = { ...this.metadata, recordingUrl: url };
  return this.save();
};

// Method to add notes
meetingSchema.methods.addNotes = function(notes: string) {
  this.metadata = { ...this.metadata, notes };
  return this.save();
};

// Static method to get upcoming meetings for user
meetingSchema.statics.getUpcomingMeetings = async function(
  userId: string,
  role: 'teacher' | 'student',
  limit: number = 10
) {
  const query: any = {
    startAt: { $gt: new Date() },
    status: { $in: ['scheduled', 'confirmed'] }
  };

  if (role === 'teacher') {
    query.teacherId = userId;
  } else {
    query.studentIds = userId;
  }

  return await this.find(query)
    .populate('teacher', 'name email avatar')
    .populate('students', 'name email avatar')
    .sort({ startAt: 1 })
    .limit(limit)
    .lean();
};

// Static method to get active meetings
meetingSchema.statics.getActiveMeetings = async function(userId: string) {
  const now = new Date();
  
  return await this.find({
    $or: [
      { teacherId: userId },
      { studentIds: userId }
    ],
    startAt: { $lte: now },
    endAt: { $gte: now },
    status: 'confirmed'
  })
  .populate('teacher', 'name email avatar')
  .populate('students', 'name email avatar')
  .lean();
};

// Static method to check for conflicts
meetingSchema.statics.checkConflicts = async function(
  teacherId: string,
  startAt: Date,
  endAt: Date,
  excludeMeetingId?: string
) {
  const query: any = {
    teacherId,
    status: { $in: ['scheduled', 'confirmed'] },
    $or: [
      {
        startAt: { $lt: endAt },
        endAt: { $gt: startAt }
      }
    ]
  };

  if (excludeMeetingId) {
    query._id = { $ne: excludeMeetingId };
  }

  return await this.find(query).lean();
};

// Static method to get meeting statistics
meetingSchema.statics.getMeetingStats = async function(
  userId: string,
  role: 'teacher' | 'student',
  dateRange?: { start: Date; end: Date }
) {
  const match: any = {
    status: { $in: ['completed', 'cancelled', 'no-show'] }
  };

  if (role === 'teacher') {
    match.teacherId = new mongoose.Types.ObjectId(userId);
  } else {
    match.studentIds = new mongoose.Types.ObjectId(userId);
  }

  if (dateRange) {
    match.startAt = {
      $gte: dateRange.start,
      $lte: dateRange.end
    };
  }

  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: null,
        totalMeetings: { $sum: 1 },
        completedMeetings: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        cancelledMeetings: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
        },
        noShowMeetings: {
          $sum: { $cond: [{ $eq: ['$status', 'no-show'] }, 1, 0] }
        },
        avgDuration: { $avg: '$metadata.duration' }
      }
    }
  ];

  const result = await this.aggregate(pipeline);
  return result[0] || {
    totalMeetings: 0,
    completedMeetings: 0,
    cancelledMeetings: 0,
    noShowMeetings: 0,
    avgDuration: 0
  };
};

export const Meeting = mongoose.model<IMeeting>('Meeting', meetingSchema);
