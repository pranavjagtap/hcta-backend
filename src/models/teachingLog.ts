import mongoose, { Document, Schema } from "mongoose";
import { TeachingLogBase, TeachingLogDocument } from "../types/teachingLog";

const teachingLogSchema = new Schema<TeachingLogDocument>(
  {
    batchId: { 
      type: Schema.Types.ObjectId as any, 
      ref: "Batch", 
      required: true,
      index: true 
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
    date: { 
      type: Date, 
      required: true,
      index: true 
    },
    tutorId: { 
      type: Schema.Types.ObjectId as any, 
      ref: "User",
      required: true,
      index: true
    },
    durationMinutes: { 
      type: Number, 
      min: 0,
      default: 0
    },
    teachingMethod: { 
      type: String,
      index: true
    },
    status: {
      type: String,
      enum: ["pending", "completed", "cancelled"],
      default: "pending",
      index: true,
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
teachingLogSchema.index({ batchId: 1, isDeleted: 1 });
teachingLogSchema.index({ tutorId: 1, isDeleted: 1 });
teachingLogSchema.index({ batchId: 1, date: 1, isDeleted: 1 });
teachingLogSchema.index({ tutorId: 1, date: 1, isDeleted: 1 });
teachingLogSchema.index({ status: 1, isDeleted: 1 });
teachingLogSchema.index({ createdAt: -1, isDeleted: 1 });

export const TeachingLog = mongoose.model<TeachingLogDocument>("TeachingLog", teachingLogSchema);
