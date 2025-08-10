import mongoose, { Document, Schema } from "mongoose";
import { BatchBase, BatchDocument } from "../types/batch";

const batchSchema = new Schema<BatchDocument>(
  {
    tutorId: {
      type: Schema.Types.ObjectId as any,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      index: true,
    },
    subjectIds: [{
      type: Schema.Types.ObjectId as any,
      ref: "Subject",
      index: true,
    }],
    studentIds: [{
      type: Schema.Types.ObjectId as any,
      ref: "Student",
      index: true,
    }],
    academicYear: {
      type: String,
      index: true,
    },
    startDate: Date,
    endDate: Date,
    classDays: {
      type: [String],
      default: [],
    },
    maxStudents: {
      type: Number,
      min: 1,
    },
    location: String,
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId as any,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId as any,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Compound indexes for efficient queries
batchSchema.index({ tutorId: 1, isDeleted: 1 });
batchSchema.index({ tutorId: 1, isActive: 1, isDeleted: 1 });
batchSchema.index({ academicYear: 1, isDeleted: 1 });
batchSchema.index({ name: 1, tutorId: 1, isDeleted: 1 });
batchSchema.index({ createdAt: -1, isDeleted: 1 });

export const Batch = mongoose.model<BatchDocument>("Batch", batchSchema);
