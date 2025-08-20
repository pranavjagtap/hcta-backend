import mongoose, { Document, Schema } from 'mongoose';

export interface IContentAccess extends Document {
  contentId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  userType: 'student' | 'teacher' | 'admin';
  
  // Access tracking
  lastAccessed: Date;
  accessCount: number;
  
  // Progress tracking (for videos/audio)
  progress: {
    currentTime: number; // in seconds
    totalTime: number; // in seconds
    percentage: number; // 0-100
    isCompleted: boolean;
    completedAt?: Date;
  };
  
  // User interactions
  isFavorited: boolean;
  rating?: number; // 1-5 stars
  review?: string;
  reviewDate?: Date;
  
  // Download tracking
  downloadCount: number;
  lastDownloaded?: Date;
  
  // Quiz results (if content type is quiz)
  quizResults?: {
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    timeTaken: number; // in seconds
    completedAt: Date;
    answers: Array<{
      questionIndex: number;
      selectedAnswer: number;
      isCorrect: boolean;
      timeSpent: number; // in seconds
    }>;
  };
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const contentAccessSchema = new Schema<IContentAccess>(
  {
    contentId: {
      type: Schema.Types.ObjectId,
      ref: 'Content',
      required: true,
      index: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    userType: {
      type: String,
      required: true,
      enum: ['student', 'teacher', 'admin']
    },
    
    // Access tracking
    lastAccessed: {
      type: Date,
      default: Date.now
    },
    accessCount: {
      type: Number,
      default: 1
    },
    
    // Progress tracking
    progress: {
      currentTime: {
        type: Number,
        default: 0,
        min: 0
      },
      totalTime: {
        type: Number,
        default: 0,
        min: 0
      },
      percentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      },
      isCompleted: {
        type: Boolean,
        default: false
      },
      completedAt: {
        type: Date
      }
    },
    
    // User interactions
    isFavorited: {
      type: Boolean,
      default: false
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    review: {
      type: String,
      maxlength: 1000
    },
    reviewDate: {
      type: Date
    },
    
    // Download tracking
    downloadCount: {
      type: Number,
      default: 0
    },
    lastDownloaded: {
      type: Date
    },
    
    // Quiz results
    quizResults: {
      score: {
        type: Number,
        min: 0,
        max: 100
      },
      totalQuestions: {
        type: Number,
        min: 0
      },
      correctAnswers: {
        type: Number,
        min: 0
      },
      timeTaken: {
        type: Number,
        min: 0
      },
      completedAt: {
        type: Date
      },
      answers: [{
        questionIndex: {
          type: Number,
          required: true
        },
        selectedAnswer: {
          type: Number,
          required: true
        },
        isCorrect: {
          type: Boolean,
          required: true
        },
        timeSpent: {
          type: Number,
          min: 0
        }
      }]
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound index for unique user-content combination
contentAccessSchema.index({ contentId: 1, userId: 1 }, { unique: true });

// Indexes for efficient querying
contentAccessSchema.index({ userId: 1, lastAccessed: -1 });
contentAccessSchema.index({ contentId: 1, accessCount: -1 });
contentAccessSchema.index({ userId: 1, isFavorited: 1 });
contentAccessSchema.index({ contentId: 1, rating: -1 });
contentAccessSchema.index({ userType: 1, lastAccessed: -1 });

// Virtual for formatted time spent
contentAccessSchema.virtual('formattedTimeSpent').get(function() {
  if (!this.progress.currentTime) return '0:00';
  
  const hours = Math.floor(this.progress.currentTime / 3600);
  const minutes = Math.floor((this.progress.currentTime % 3600) / 60);
  const seconds = this.progress.currentTime % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

// Virtual for formatted total time
contentAccessSchema.virtual('formattedTotalTime').get(function() {
  if (!this.progress.totalTime) return '0:00';
  
  const hours = Math.floor(this.progress.totalTime / 3600);
  const minutes = Math.floor((this.progress.totalTime % 3600) / 60);
  const seconds = this.progress.totalTime % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

// Pre-save middleware to update progress percentage
contentAccessSchema.pre('save', function(next) {
  if (this.progress.totalTime > 0) {
    this.progress.percentage = Math.round((this.progress.currentTime / this.progress.totalTime) * 100);
    
    // Mark as completed if percentage is 90% or more
    if (this.progress.percentage >= 90 && !this.progress.isCompleted) {
      this.progress.isCompleted = true;
      this.progress.completedAt = new Date();
    }
  }
  next();
});

export const ContentAccess = mongoose.model<IContentAccess>('ContentAccess', contentAccessSchema);
