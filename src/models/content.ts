import mongoose, { Document, Schema } from 'mongoose';

export interface IContent extends Document {
  title: string;
  description?: string;
  type: 'video' | 'pdf' | 'ppt' | 'doc' | 'image' | 'quiz' | 'audio' | 'other';
  fileUrl: string;
  fileKey?: string; // S3 key for deletion
  fileName: string;
  fileSize: number;
  mimeType: string;
  duration?: number; // for videos/audio in seconds
  
  // Content categorization
  subjectId: mongoose.Types.ObjectId;
  topic?: string;
  subtopic?: string;
  grade?: string;
  tags: string[];
  
  // Author and ownership
  authorId: mongoose.Types.ObjectId;
  uploadedBy: mongoose.Types.ObjectId;
  
  // Access control
  isPublic: boolean;
  sharedWith: mongoose.Types.ObjectId[]; // teachers who can access this content
  assignedTo: mongoose.Types.ObjectId[]; // batches/classes assigned this content
  
  // Versioning
  version: number;
  previousVersions: mongoose.Types.ObjectId[];
  isLatestVersion: boolean;
  
  // Quiz specific fields (if type is quiz)
  quizData?: {
    questions: Array<{
      question: string;
      options: string[];
      correctAnswer: number;
      explanation?: string;
    }>;
    timeLimit?: number; // in minutes
    passingScore?: number;
  };
  
  // Metadata
  metadata: {
    thumbnailUrl?: string;
    language: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimatedDuration?: number; // in minutes
    wordCount?: number;
    pageCount?: number;
  };
  
  // Statistics
  stats: {
    views: number;
    downloads: number;
    favorites: number;
    averageRating: number;
    totalRatings: number;
  };
  
  // Status
  status: 'active' | 'archived' | 'pending_review' | 'rejected';
  reviewNotes?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const contentSchema = new Schema<IContent>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    type: {
      type: String,
      required: true,
      enum: ['video', 'pdf', 'ppt', 'doc', 'image', 'quiz', 'audio', 'other']
    },
    fileUrl: {
      type: String,
      required: true
    },
    fileKey: {
      type: String
    },
    fileName: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    duration: {
      type: Number,
      min: 0
    },
    
    // Content categorization
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
      index: true
    },
    topic: {
      type: String,
      trim: true,
      maxlength: 100
    },
    subtopic: {
      type: String,
      trim: true,
      maxlength: 100
    },
    grade: {
      type: String,
      trim: true
    },
    tags: [{
      type: String,
      trim: true,
      maxlength: 50
    }],
    
    // Author and ownership
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    
    // Access control
    isPublic: {
      type: Boolean,
      default: true
    },
    sharedWith: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    assignedTo: [{
      type: Schema.Types.ObjectId,
      ref: 'Batch'
    }],
    
    // Versioning
    version: {
      type: Number,
      default: 1
    },
    previousVersions: [{
      type: Schema.Types.ObjectId,
      ref: 'Content'
    }],
    isLatestVersion: {
      type: Boolean,
      default: true
    },
    
    // Quiz specific fields
    quizData: {
      questions: [{
        question: {
          type: String,
          required: true
        },
        options: [{
          type: String,
          required: true
        }],
        correctAnswer: {
          type: Number,
          required: true
        },
        explanation: {
          type: String
        }
      }],
      timeLimit: {
        type: Number,
        min: 1
      },
      passingScore: {
        type: Number,
        min: 0,
        max: 100
      }
    },
    
    // Metadata
    metadata: {
      thumbnailUrl: {
        type: String
      },
      language: {
        type: String,
        default: 'en',
        enum: ['en', 'hi', 'es', 'fr', 'de', 'zh', 'ja', 'ko']
      },
      difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'intermediate'
      },
      estimatedDuration: {
        type: Number,
        min: 0
      },
      wordCount: {
        type: Number,
        min: 0
      },
      pageCount: {
        type: Number,
        min: 0
      }
    },
    
    // Statistics
    stats: {
      views: {
        type: Number,
        default: 0
      },
      downloads: {
        type: Number,
        default: 0
      },
      favorites: {
        type: Number,
        default: 0
      },
      averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
      },
      totalRatings: {
        type: Number,
        default: 0
      }
    },
    
    // Status
    status: {
      type: String,
      enum: ['active', 'archived', 'pending_review', 'rejected'],
      default: 'active'
    },
    reviewNotes: {
      type: String,
      maxlength: 500
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: {
      type: Date
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for efficient querying
contentSchema.index({ subjectId: 1, type: 1 });
contentSchema.index({ authorId: 1, createdAt: -1 });
contentSchema.index({ uploadedBy: 1, createdAt: -1 });
contentSchema.index({ status: 1 });
contentSchema.index({ tags: 1 });
contentSchema.index({ title: 'text', description: 'text', tags: 'text' });
contentSchema.index({ isPublic: 1, status: 1 });
contentSchema.index({ assignedTo: 1 });
contentSchema.index({ sharedWith: 1 });

// Virtual for formatted file size
contentSchema.virtual('formattedFileSize').get(function() {
  const bytes = this.fileSize;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
});

// Virtual for formatted duration
contentSchema.virtual('formattedDuration').get(function() {
  if (!this.duration) return null;
  const hours = Math.floor(this.duration / 3600);
  const minutes = Math.floor((this.duration % 3600) / 60);
  const seconds = this.duration % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

// Virtual for formatted creation date
contentSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Pre-save middleware to handle versioning
contentSchema.pre('save', function(next) {
  if (this.isModified('fileUrl') && !this.isNew) {
    // This is an update, increment version
    this.version += 1;
  }
  next();
});

export const Content = mongoose.model<IContent>('Content', contentSchema);
