import mongoose, { Document, Schema } from "mongoose";
import { PerformanceBase, PerformanceDocument } from "../types/performance";

const performanceSchema = new Schema<PerformanceDocument>(
  {
    studentId: {
      type: Schema.Types.ObjectId as any,
      ref: "Student",
      required: true,
      index: true,
    },
    topic: { 
      type: String, 
      required: true,
      index: true 
    },
    subjectId: { 
      type: Schema.Types.ObjectId as any, 
      ref: "Subject",
      required: true,
      index: true
    },
    score: { 
      type: Number, 
      min: 0,
      required: true
    },
    maxScore: { 
      type: Number, 
      min: 0,
      required: true
    },
    remarks: String,
    assessmentType: {
      type: String,
      enum: ["test", "oral", "assignment", "project"],
      required: true,
      index: true,
    },
    date: { 
      type: Date, 
      required: true,
      index: true
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
performanceSchema.index({ studentId: 1, isDeleted: 1 });
performanceSchema.index({ subjectId: 1, isDeleted: 1 });
performanceSchema.index({ studentId: 1, date: 1, isDeleted: 1 });
performanceSchema.index({ assessmentType: 1, isDeleted: 1 });
performanceSchema.index({ date: -1, isDeleted: 1 });
performanceSchema.index({ createdAt: -1, isDeleted: 1 });

export const Performance = mongoose.model<PerformanceDocument>("Performance", performanceSchema);
