import mongoose, { Schema, Document } from 'mongoose';

export interface IDoubt extends Document {
  userId: mongoose.Types.ObjectId;
  subject?: string;
  query: string;
  aiResponse: {
    answer: string;
    steps: string[];
    sources: Array<{
      contentId: mongoose.Types.ObjectId;
      title: string;
      section?: string;
      relevance: number;
    }>;
    followUps: string[];
    confidence: number;
  };
  mode: 'text' | 'voice';
  transcript?: string;
  ttsUrl?: string;
  feedback?: {
    helpful: boolean;
    notes?: string;
    rating?: number;
  };
  context?: {
    courseMaterials: mongoose.Types.ObjectId[];
    weakTopics: string[];
    recentChatContext?: string;
    performanceHints?: any;
  };
  metadata?: {
    processingTime?: number;
    tokensUsed?: number;
    modelVersion?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const doubtSchema = new Schema<IDoubt>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  subject: {
    type: String,
    trim: true
  },
  query: {
    type: String,
    required: true,
    maxlength: 2000
  },
  aiResponse: {
    answer: {
      type: String,
      required: true
    },
    steps: [{
      type: String,
      required: true
    }],
    sources: [{
      contentId: {
        type: Schema.Types.ObjectId,
        ref: 'Content'
      },
      title: {
        type: String,
        required: true
      },
      section: String,
      relevance: {
        type: Number,
        min: 0,
        max: 1,
        default: 0.5
      }
    }],
    followUps: [String],
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5
    }
  },
  mode: {
    type: String,
    enum: ['text', 'voice'],
    default: 'text'
  },
  transcript: String,
  ttsUrl: String,
  feedback: {
    helpful: Boolean,
    notes: String,
    rating: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  context: {
    courseMaterials: [{
      type: Schema.Types.ObjectId,
      ref: 'Content'
    }],
    weakTopics: [String],
    recentChatContext: String,
    performanceHints: Schema.Types.Mixed
  },
  metadata: {
    processingTime: Number,
    tokensUsed: Number,
    modelVersion: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
doubtSchema.index({ userId: 1, createdAt: -1 });
doubtSchema.index({ subject: 1, createdAt: -1 });
doubtSchema.index({ 'aiResponse.confidence': -1 });

// Virtual for user info
doubtSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Virtual for content sources
doubtSchema.virtual('contentSources', {
  ref: 'Content',
  localField: 'aiResponse.sources.contentId',
  foreignField: '_id'
});

// Method to add feedback
doubtSchema.methods.addFeedback = function(feedback: {
  helpful: boolean;
  notes?: string;
  rating?: number;
}) {
  this.feedback = feedback;
  return this.save();
};

// Method to update AI response
doubtSchema.methods.updateAIResponse = function(response: {
  answer: string;
  steps: string[];
  sources: any[];
  followUps: string[];
  confidence: number;
}) {
  this.aiResponse = response;
  return this.save();
};

// Method to set voice processing results
doubtSchema.methods.setVoiceResults = function(transcript: string, ttsUrl: string) {
  this.transcript = transcript;
  this.ttsUrl = ttsUrl;
  this.mode = 'voice';
  return this.save();
};

// Static method to get doubt history for user
doubtSchema.statics.getDoubtHistory = async function(
  userId: string,
  filters: {
    subject?: string;
    dateRange?: { start: Date; end: Date };
    helpful?: boolean;
  } = {},
  page: number = 1,
  limit: number = 20
) {
  const skip = (page - 1) * limit;
  const query: any = { userId };
  
  if (filters.subject) {
    query.subject = filters.subject;
  }
  
  if (filters.dateRange) {
    query.createdAt = {
      $gte: filters.dateRange.start,
      $lte: filters.dateRange.end
    };
  }
  
  if (filters.helpful !== undefined) {
    query['feedback.helpful'] = filters.helpful;
  }
  
  return await this.find(query)
    .populate('user', 'name email avatar')
    .populate('contentSources', 'title type')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

// Static method to get doubt analytics
doubtSchema.statics.getDoubtAnalytics = async function(
  userId?: string,
  dateRange?: { start: Date; end: Date }
) {
  const match: any = {};
  
  if (userId) {
    match.userId = new mongoose.Types.ObjectId(userId);
  }
  
  if (dateRange) {
    match.createdAt = {
      $gte: dateRange.start,
      $lte: dateRange.end
    };
  }
  
  const pipeline: any[] = [
    { $match: match },
    {
      $group: {
        _id: null,
        totalDoubts: { $sum: 1 },
        avgConfidence: { $avg: '$aiResponse.confidence' },
        helpfulCount: {
          $sum: { $cond: ['$feedback.helpful', 1, 0] }
        },
        voiceCount: {
          $sum: { $cond: [{ $eq: ['$mode', 'voice'] }, 1, 0] }
        },
        textCount: {
          $sum: { $cond: [{ $eq: ['$mode', 'text'] }, 1, 0] }
        }
      }
    }
  ];
  
  const result = await this.aggregate(pipeline as any);
  return result[0] || {
    totalDoubts: 0,
    avgConfidence: 0,
    helpfulCount: 0,
    voiceCount: 0,
    textCount: 0
  };
};

// Static method to get top doubt subjects
doubtSchema.statics.getTopSubjects = async function(
  userId?: string,
  limit: number = 10
) {
  const match: any = {};
  
  if (userId) {
    match.userId = new mongoose.Types.ObjectId(userId);
  }
  
  const pipeline: any[] = [
    { $match: match },
    { $group: { _id: '$subject', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit }
  ];
  
  return await this.aggregate(pipeline as any);
};

export const Doubt = mongoose.model<IDoubt>('Doubt', doubtSchema);
