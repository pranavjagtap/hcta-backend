import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  type: 'text' | 'image' | 'file' | 'audio' | 'system';
  content: string;
  attachmentMeta?: {
    fileName: string;
    fileSize: number;
    mimeType: string;
    url: string;
    thumbnailUrl?: string;
    duration?: number; // for audio/video
  };
  replyTo?: mongoose.Types.ObjectId;
  editedAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  readBy: Array<{
    userId: mongoose.Types.ObjectId;
    readAt: Date;
  }>;
  metadata?: {
    clientMessageId?: string; // for deduplication
    deviceInfo?: string;
    location?: string;
  };
}

const messageSchema = new Schema<IMessage>({
  conversationId: {
    type: Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true
  },
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'audio', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 5000
  },
  attachmentMeta: {
    fileName: String,
    fileSize: Number,
    mimeType: String,
    url: String,
    thumbnailUrl: String,
    duration: Number
  },
  replyTo: {
    type: Schema.Types.ObjectId,
    ref: 'Message'
  },
  editedAt: Date,
  deletedAt: Date,
  readBy: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  metadata: {
    clientMessageId: String,
    deviceInfo: String,
    location: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, createdAt: -1 });
messageSchema.index({ 'readBy.userId': 1 });
messageSchema.index({ deletedAt: 1 });

// Virtual for reply message
messageSchema.virtual('replyMessage', {
  ref: 'Message',
  localField: 'replyTo',
  foreignField: '_id',
  justOne: true
});

// Virtual for sender info
messageSchema.virtual('sender', {
  ref: 'User',
  localField: 'senderId',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware to validate content based on type
messageSchema.pre('save', function(this: any, next) {
  if (this.type === 'text' && !this.content.trim()) {
    return next(new Error('Text messages cannot be empty'));
  }
  
  if (['image', 'file', 'audio'].includes(this.type) && !this.attachmentMeta) {
    return next(new Error('Attachment metadata required for file messages'));
  }
  
  next();
});

// Method to mark as read by user
messageSchema.methods.markAsRead = function(this: any, userId: string) {
  const existingRead = this.readBy.find((read: any) => 
    read.userId.toString() === userId
  );
  
  if (!existingRead) {
    this.readBy.push({
      userId: new mongoose.Types.ObjectId(userId),
      readAt: new Date()
    });
  }
  
  return this.save();
};

// Method to check if user has read the message
messageSchema.methods.isReadBy = function(this: any, userId: string): boolean {
  return this.readBy.some((read: any) => 
    read.userId.toString() === userId
  );
};

// Method to soft delete message
messageSchema.methods.softDelete = function() {
  this.deletedAt = new Date();
  this.content = '[Message deleted]';
  return this.save();
};

// Method to edit message
messageSchema.methods.edit = function(newContent: string) {
  this.content = newContent;
  this.editedAt = new Date();
  return this.save();
};

// Static method to get unread count for user in conversation
messageSchema.statics.getUnreadCount = async function(
  conversationId: string,
  userId: string
) {
  return await this.countDocuments({
    conversationId,
    senderId: { $ne: userId },
    'readBy.userId': { $ne: userId },
    deletedAt: { $exists: false }
  });
};

// Static method to mark all messages as read in conversation
messageSchema.statics.markAllAsRead = async function(
  conversationId: string,
  userId: string
) {
  return await this.updateMany(
    {
      conversationId,
      senderId: { $ne: userId },
      'readBy.userId': { $ne: userId },
      deletedAt: { $exists: false }
    },
    {
      $push: {
        readBy: {
          userId: new mongoose.Types.ObjectId(userId),
          readAt: new Date()
        }
      }
    }
  );
};

export const Message = mongoose.model<IMessage>('Message', messageSchema);
