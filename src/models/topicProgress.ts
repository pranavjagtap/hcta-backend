import mongoose, { Document, Schema } from "mongoose";

export interface TopicProgressBase {
  studentId: string;
  topicId: string;
  batchId: string;
  subjectId: string;
  status: "not_started" | "in_progress" | "completed" | "review_needed";
  completionPercentage: number;
  timeSpent: number; // in minutes
  lastAccessed: Date;
  completedAt?: Date;
  notes?: string;
  isDeleted?: boolean;
  createdBy: string;
  updatedBy: string;
}

export interface TopicProgressDocument extends Document, TopicProgressBase {
  createdAt: Date;
  updatedAt: Date;
}

const topicProgressSchema = new Schema<TopicProgressDocument>(
  {
    studentId: { 
      type: Schema.Types.ObjectId as any, 
      ref: "Student",
      required: true,
      index: true 
    },
    topicId: { 
      type: Schema.Types.ObjectId as any, 
      ref: "Topic",
      required: true,
      index: true 
    },
    batchId: { 
      type: Schema.Types.ObjectId as any, 
      ref: "Batch",
      required: true,
      index: true 
    },
    subjectId: { 
      type: Schema.Types.ObjectId as any, 
      ref: "Subject",
      required: true,
      index: true 
    },
    status: { 
      type: String,
      enum: ["not_started", "in_progress", "completed", "review_needed"],
      default: "not_started",
      index: true 
    },
    completionPercentage: { 
      type: Number,
      min: 0,
      max: 100,
      default: 0 
    },
    timeSpent: { 
      type: Number,
      min: 0,
      default: 0 
    },
    lastAccessed: { 
      type: Date,
      default: Date.now 
    },
    completedAt: { 
      type: Date 
    },
    notes: { 
      type: String 
    },
    isDeleted: { 
      type: Boolean, 
      default: false,
      index: true 
    },
    createdBy: { 
      type: Schema.Types.ObjectId as any, 
      ref: "User",
      required: true
    },
    updatedBy: { 
      type: Schema.Types.ObjectId as any, 
      ref: "User",
      required: true
    },
  },
  { timestamps: true }
);

// Compound indexes for efficient queries
topicProgressSchema.index({ studentId: 1, topicId: 1, isDeleted: 1 });
topicProgressSchema.index({ batchId: 1, subjectId: 1, isDeleted: 1 });
topicProgressSchema.index({ studentId: 1, status: 1, isDeleted: 1 });
topicProgressSchema.index({ topicId: 1, status: 1, isDeleted: 1 });

export const TopicProgress = mongoose.model<TopicProgressDocument>("TopicProgress", topicProgressSchema);

