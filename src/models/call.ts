import mongoose, { Schema, Document } from 'mongoose';

export interface ICall extends Document {
  roomId: string;
  type: 'voice' | 'video' | 'group';
  participants: Array<{
    userId: mongoose.Types.ObjectId;
    role: 'initiator' | 'participant';
    joinedAt?: Date;
    leftAt?: Date;
    deviceInfo?: string;
  }>;
  status: 'ringing' | 'active' | 'ended' | 'missed' | 'declined';
  startedAt?: Date;
  endedAt?: Date;
  durationSec?: number;
  recordingUrl?: string;
  metadata?: {
    subject?: string;
    notes?: string;
    tags?: string[];
  };
  webrtcConfig?: {
    iceServers?: any[];
    maxBitrate?: number;
    recordingEnabled?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const callSchema = new Schema<ICall>({
  roomId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  type: {
    type: String,
    enum: ['voice', 'video', 'group'],
    required: true
  },
  participants: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['initiator', 'participant'],
      default: 'participant'
    },
    joinedAt: Date,
    leftAt: Date,
    deviceInfo: String
  }],
  status: {
    type: String,
    enum: ['ringing', 'active', 'ended', 'missed', 'declined'],
    default: 'ringing'
  },
  startedAt: Date,
  endedAt: Date,
  durationSec: {
    type: Number,
    min: 0
  },
  recordingUrl: String,
  metadata: {
    subject: String,
    notes: String,
    tags: [String]
  },
  webrtcConfig: {
    iceServers: [Schema.Types.Mixed],
    maxBitrate: {
      type: Number,
      default: 1000000 // 1 Mbps
    },
    recordingEnabled: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
callSchema.index({ 'participants.userId': 1, createdAt: -1 });
callSchema.index({ status: 1, createdAt: -1 });
callSchema.index({ roomId: 1 });

// Virtual for active participants
callSchema.virtual('activeParticipants', function (this: any) {
  return this.participants.filter((p: any) => !p.leftAt);
});

// Virtual for call duration
callSchema.virtual('duration', function (this: any) {
  if (!this.startedAt || !this.endedAt) return 0;
  return Math.floor((this.endedAt.getTime() - this.startedAt.getTime()) / 1000);
});

// Method to add participant
callSchema.methods.addParticipant = function (this: any, userId: string, role: 'initiator' | 'participant' = 'participant') {
  const existingParticipant = this.participants.find((p: any) => 
    p.userId.toString() === userId
  );
  
  if (!existingParticipant) {
    this.participants.push({
      userId: new mongoose.Types.ObjectId(userId),
      role,
      joinedAt: new Date()
    });
  }
  
  return this.save();
};

// Method to remove participant
callSchema.methods.removeParticipant = function (this: any, userId: string) {
  const participant = this.participants.find((p: any) => 
    p.userId.toString() === userId
  );
  
  if (participant) {
    participant.leftAt = new Date();
  }
  
  return this.save();
};

// Method to start call
callSchema.methods.start = function() {
  this.status = 'active';
  this.startedAt = new Date();
  return this.save();
};

// Method to end call
callSchema.methods.end = function() {
  this.status = 'ended';
  this.endedAt = new Date();
  this.durationSec = this.duration;
  return this.save();
};

// Method to decline call
callSchema.methods.decline = function() {
  this.status = 'declined';
  this.endedAt = new Date();
  return this.save();
};

// Method to mark as missed
callSchema.methods.markAsMissed = function() {
  this.status = 'missed';
  this.endedAt = new Date();
  return this.save();
};

// Method to set recording URL
callSchema.methods.setRecordingUrl = function(url: string) {
  this.recordingUrl = url;
  return this.save();
};

// Static method to get call history for user
callSchema.statics.getCallHistory = async function(
  userId: string,
  page: number = 1,
  limit: number = 20
) {
  const skip = (page - 1) * limit;
  
  return await this.find({
    'participants.userId': userId
  })
  .populate('participants.userId', 'name email avatar')
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit)
  .lean();
};

// Static method to get active calls for user
callSchema.statics.getActiveCalls = async function(userId: string) {
  return await this.find({
    'participants.userId': userId,
    status: { $in: ['ringing', 'active'] }
  })
  .populate('participants.userId', 'name email avatar')
  .lean();
};

// Static method to create call
callSchema.statics.createCall = async function(
  initiatorId: string,
  participantIds: string[],
  type: 'voice' | 'video' | 'group',
  roomId: string
) {
  const participants = [
    { userId: initiatorId, role: 'initiator', joinedAt: new Date() },
    ...participantIds.map(id => ({ userId: id, role: 'participant' }))
  ];
  
  const call = new this({
    roomId,
    type,
    participants
  });
  
  return await call.save();
};

export const Call = mongoose.model<ICall>('Call', callSchema);
