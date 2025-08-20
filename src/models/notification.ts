import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'message' | 'call' | 'meeting' | 'doubt' | 'system' | 'reminder';
  title: string;
  message: string;
  meta?: {
    conversationId?: mongoose.Types.ObjectId;
    messageId?: mongoose.Types.ObjectId;
    callId?: mongoose.Types.ObjectId;
    meetingId?: mongoose.Types.ObjectId;
    doubtId?: mongoose.Types.ObjectId;
    actionUrl?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  };
  status: 'unread' | 'read' | 'archived';
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  markAsRead(): Promise<INotification>;
  archive(): Promise<INotification>;
}

export interface INotificationModel extends Model<INotification> {
  getUserNotifications(
    userId: string,
    filters?: {
      status?: 'unread' | 'read' | 'archived';
      type?: string;
      limit?: number;
      page?: number;
    }
  ): Promise<INotification[]>;
  
  getUnreadCount(userId: string): Promise<number>;
  
  markAllAsRead(userId: string): Promise<any>;
  
  createNotification(
    userId: string,
    type: 'message' | 'call' | 'meeting' | 'doubt' | 'system' | 'reminder',
    title: string,
    message: string,
    meta?: any
  ): Promise<INotification>;
  
  createBulkNotifications(
    notifications: Array<{
      userId: string;
      type: 'message' | 'call' | 'meeting' | 'doubt' | 'system' | 'reminder';
      title: string;
      message: string;
      meta?: any;
    }>
  ): Promise<INotification[]>;
  
  getNotificationStats(
    userId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<any>;
  
  cleanOldNotifications(daysOld?: number): Promise<any>;
}

const notificationSchema = new Schema<INotification>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['message', 'call', 'meeting', 'doubt', 'system', 'reminder'],
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    maxlength: 1000
  },
  meta: {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation'
    },
    messageId: {
      type: Schema.Types.ObjectId,
      ref: 'Message'
    },
    callId: {
      type: Schema.Types.ObjectId,
      ref: 'Call'
    },
    meetingId: {
      type: Schema.Types.ObjectId,
      ref: 'Meeting'
    },
    doubtId: {
      type: Schema.Types.ObjectId,
      ref: 'Doubt'
    },
    actionUrl: String,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    }
  },
  status: {
    type: String,
    enum: ['unread', 'read', 'archived'],
    default: 'unread',
    index: true
  },
  readAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, status: 1 });
notificationSchema.index({ type: 1, createdAt: -1 });

// Virtual for user info
notificationSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.status = 'read';
  this.readAt = new Date();
  return this.save();
};

// Method to archive notification
notificationSchema.methods.archive = function() {
  this.status = 'archived';
  return this.save();
};

// Static method to get user notifications
notificationSchema.statics.getUserNotifications = async function(
  userId: string,
  filters: {
    status?: 'unread' | 'read' | 'archived';
    type?: string;
    limit?: number;
    page?: number;
  } = {}
) {
  const { status, type, limit = 20, page = 1 } = filters;
  const skip = (page - 1) * limit;
  
  const query: any = { userId };
  
  if (status) {
    query.status = status;
  }
  
  if (type) {
    query.type = type;
  }
  
  return await this.find(query)
    .populate('meta.conversationId', 'title type')
    .populate('meta.messageId', 'content type')
    .populate('meta.callId', 'type status')
    .populate('meta.meetingId', 'subject startAt')
    .populate('meta.doubtId', 'query subject')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(userId: string) {
  return await this.countDocuments({
    userId,
    status: 'unread'
  });
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = async function(userId: string) {
  return await this.updateMany(
    {
      userId,
      status: 'unread'
    },
    {
      status: 'read',
      readAt: new Date()
    }
  );
};

// Static method to create notification
notificationSchema.statics.createNotification = async function(
  userId: string,
  type: 'message' | 'call' | 'meeting' | 'doubt' | 'system' | 'reminder',
  title: string,
  message: string,
  meta?: any
) {
  const notification = new this({
    userId,
    type,
    title,
    message,
    meta
  });
  
  return await notification.save();
};

// Static method to create bulk notifications
notificationSchema.statics.createBulkNotifications = async function(
  notifications: Array<{
    userId: string;
    type: 'message' | 'call' | 'meeting' | 'doubt' | 'system' | 'reminder';
    title: string;
    message: string;
    meta?: any;
  }>
) {
  return await this.insertMany(notifications);
};

// Static method to get notification statistics
notificationSchema.statics.getNotificationStats = async function(
  userId: string,
  dateRange?: { start: Date; end: Date }
) {
  const match: any = { userId };
  
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
        totalNotifications: { $sum: 1 },
        unreadCount: {
          $sum: { $cond: [{ $eq: ['$status', 'unread'] }, 1, 0] }
        },
        readCount: {
          $sum: { $cond: [{ $eq: ['$status', 'read'] }, 1, 0] }
        },
        archivedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'archived'] }, 1, 0] }
        }
      }
    }
  ];
  
  const result = await this.aggregate(pipeline);
  return result[0] || {
    totalNotifications: 0,
    unreadCount: 0,
    readCount: 0,
    archivedCount: 0
  };
};

// Static method to clean old notifications
notificationSchema.statics.cleanOldNotifications = async function(
  daysOld: number = 30
) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return await this.deleteMany({
    createdAt: { $lt: cutoffDate },
    status: { $in: ['read', 'archived'] }
  });
};

export const Notification = mongoose.model<INotification, INotificationModel>('Notification', notificationSchema);
