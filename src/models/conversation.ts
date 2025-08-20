import mongoose, { Schema, Document } from 'mongoose';

export interface IConversation extends Document {
  type: 'direct' | 'group';
  participants: mongoose.Types.ObjectId[];
  title?: string;
  batchId?: mongoose.Types.ObjectId;
  subject?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt?: Date;
  lastMessage?: {
    content: string;
    senderId: mongoose.Types.ObjectId;
    type: 'text' | 'image' | 'file' | 'audio';
    timestamp: Date;
  };
  settings?: {
    allowFileSharing: boolean;
    allowVoiceMessages: boolean;
    moderationEnabled: boolean;
  };
  metadata?: {
    description?: string;
    avatar?: string;
    tags?: string[];
  };
}

const conversationSchema = new Schema<IConversation>({
  type: {
    type: String,
    enum: ['direct', 'group'],
    required: true
  },
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  title: {
    type: String,
    trim: true,
    maxlength: 100
  },
  batchId: {
    type: Schema.Types.ObjectId,
    ref: 'Batch'
  },
  subject: {
    type: String,
    trim: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  lastMessage: {
    content: String,
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    type: {
      type: String,
      enum: ['text', 'image', 'file', 'audio']
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  settings: {
    allowFileSharing: {
      type: Boolean,
      default: true
    },
    allowVoiceMessages: {
      type: Boolean,
      default: true
    },
    moderationEnabled: {
      type: Boolean,
      default: false
    }
  },
  metadata: {
    description: String,
    avatar: String,
    tags: [String]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
conversationSchema.index({ participants: 1 });
conversationSchema.index({ type: 1, batchId: 1 });
conversationSchema.index({ lastMessageAt: -1 });
conversationSchema.index({ createdBy: 1 });

// Virtual for unread message count (will be populated when needed)
conversationSchema.virtual('unreadCount', {
  ref: 'Message',
  localField: '_id',
  foreignField: 'conversationId',
  count: true
});

// Pre-save middleware to ensure direct conversations have exactly 2 participants
conversationSchema.pre('save', function(next) {
  if (this.type === 'direct' && this.participants.length !== 2) {
    return next(new Error('Direct conversations must have exactly 2 participants'));
  }
  next();
});

// Method to check if user is participant
conversationSchema.methods.isParticipant = function(userId: string): boolean {
  return this.participants.some((participant: any) => 
    participant.toString() === userId
  );
};

// Method to get other participant in direct conversation
conversationSchema.methods.getOtherParticipant = function(userId: string) {
  if (this.type !== 'direct') return null;
  return this.participants.find((participant: any) => 
    participant.toString() !== userId
  );
};

// Static method to find or create direct conversation
conversationSchema.statics.findOrCreateDirect = async function(
  participant1: string,
  participant2: string
) {
  const participants = [participant1, participant2].sort();
  
  let conversation = await this.findOne({
    type: 'direct',
    participants: { $all: participants }
  });

  if (!conversation) {
    conversation = new this({
      type: 'direct',
      participants,
      createdBy: participant1
    });
    await conversation.save();
  }

  return conversation;
};

export const Conversation = mongoose.model<IConversation>('Conversation', conversationSchema);
