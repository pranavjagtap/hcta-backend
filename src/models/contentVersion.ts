import mongoose, { Document, Schema } from 'mongoose';

export interface IContentVersion extends Document {
  contentId: mongoose.Types.ObjectId;
  version: number;
  isLatestVersion: boolean;
  
  // File information
  fileUrl: string;
  fileKey?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  duration?: number;
  
  // Content metadata
  title: string;
  description?: string;
  subjectId: mongoose.Types.ObjectId;
  topic?: string;
  subtopic?: string;
  grade?: string;
  tags: string[];
  
  // Version metadata
  changelog: string;
  uploadedBy: mongoose.Types.ObjectId;
  uploadReason?: string;
  
  // Processing status
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  processingErrors?: string[];
  
  // Thumbnail and preview
  thumbnailUrl?: string;
  previewUrl?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const contentVersionSchema = new Schema<IContentVersion>(
  {
    contentId: {
      type: Schema.Types.ObjectId,
      ref: 'Content',
      required: true,
      index: true
    },
    version: {
      type: Number,
      required: true,
      min: 1
    },
    isLatestVersion: {
      type: Boolean,
      default: false,
      index: true
    },
    
    // File information
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
    
    // Content metadata
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
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: true
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
    
    // Version metadata
    changelog: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    uploadReason: {
      type: String,
      trim: true,
      maxlength: 200
    },
    
    // Processing status
    processingStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true
    },
    processingErrors: [{
      type: String,
      maxlength: 500
    }],
    
    // Thumbnail and preview
    thumbnailUrl: {
      type: String
    },
    previewUrl: {
      type: String
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for efficient querying
contentVersionSchema.index({ contentId: 1, version: -1 });
contentVersionSchema.index({ uploadedBy: 1, createdAt: -1 });
contentVersionSchema.index({ processingStatus: 1, createdAt: -1 });

// Compound index for version queries
contentVersionSchema.index({ contentId: 1, isLatestVersion: 1 });

// Virtual for formatted file size
contentVersionSchema.virtual('formattedFileSize').get(function() {
  const bytes = this.fileSize;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
});

// Virtual for formatted duration
contentVersionSchema.virtual('formattedDuration').get(function() {
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
contentVersionSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Pre-save middleware to ensure version uniqueness
contentVersionSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Check if version already exists for this content
    const existingVersion = await mongoose.model('ContentVersion').findOne({
      contentId: this.contentId,
      version: this.version
    });
    
    if (existingVersion) {
      return next(new Error(`Version ${this.version} already exists for this content`));
    }
  }
  next();
});

export const ContentVersion = mongoose.model<IContentVersion>('ContentVersion', contentVersionSchema);
