import mongoose, { Document, Schema } from 'mongoose';

export interface ILecture extends Document {
  userId: mongoose.Types.ObjectId;
  subject: string;
  topic: string;
  language: string;
  duration: number; // in minutes
  voice: 'male' | 'female' | 'neutral';
  script: string;
  audioUrl: string;
  audioKey?: string; // S3 key for deletion
  status: 'pending' | 'generating' | 'completed' | 'failed';
  errorMessage?: string;
  metadata?: {
    wordCount: number;
    estimatedDuration: number;
    generationTime: number;
    modelUsed: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const lectureSchema = new Schema<ILecture>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    subject: {
      type: String,
      required: true,
      trim: true
    },
    topic: {
      type: String,
      required: true,
      trim: true
    },
    language: {
      type: String,
      required: true,
      default: 'en',
      enum: ['en', 'hi', 'es', 'fr', 'de', 'zh', 'ja', 'ko']
    },
    duration: {
      type: Number,
      required: true,
      min: 1,
      max: 120 // max 2 hours
    },
    voice: {
      type: String,
      required: true,
      enum: ['male', 'female', 'neutral'],
      default: 'neutral'
    },
    script: {
      type: String,
      required: true
    },
    audioUrl: {
      type: String,
      required: true
    },
    audioKey: {
      type: String,
      required: false
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'generating', 'completed', 'failed'],
      default: 'pending'
    },
    errorMessage: {
      type: String,
      required: false
    },
    metadata: {
      wordCount: {
        type: Number,
        default: 0
      },
      estimatedDuration: {
        type: Number,
        default: 0
      },
      generationTime: {
        type: Number,
        default: 0
      },
      modelUsed: {
        type: String,
        default: 'gpt-3.5-turbo'
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
lectureSchema.index({ userId: 1, createdAt: -1 });
lectureSchema.index({ subject: 1, topic: 1 });
lectureSchema.index({ status: 1 });
lectureSchema.index({ language: 1 });

// Virtual for formatted duration
lectureSchema.virtual('formattedDuration').get(function() {
  const hours = Math.floor(this.duration / 60);
  const minutes = this.duration % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
});

// Virtual for formatted creation date
lectureSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

export const Lecture = mongoose.model<ILecture>('Lecture', lectureSchema);
