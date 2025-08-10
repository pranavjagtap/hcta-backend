import mongoose, { Document, Schema } from "mongoose";
import { AssignmentBase, AssignmentDocument } from "../types/assignment";

const assignmentSchema = new Schema<AssignmentDocument>(
  {
    batchId: {
      type: Schema.Types.ObjectId as any,
      ref: "Batch",
      required: true,
      index: true,
    },
    topic: {
      type: String,
      required: true,
      index: true,
    },
    subjectId: {
      type: Schema.Types.ObjectId as any,
      ref: "Subject",
      index: true,
    },
    type: {
      type: String,
      enum: ["homework", "quiz", "test", "practice"],
      default: "homework",
      index: true,
    },
    dueDate: {
      type: Date,
      index: true,
    },
    assignedBy: {
      type: Schema.Types.ObjectId as any,
      ref: "User",
      required: true,
      index: true,
    },
    fileUrl: String,
    isOptional: {
      type: Boolean,
      default: false,
    },
    maxMarks: {
      type: Number,
      min: 0,
    },
    approved: {
      type: Boolean,
      default: false,
      index: true,
    },
    isLocked: {
      type: Boolean,
      default: false,
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
assignmentSchema.index({ batchId: 1, isDeleted: 1 });
assignmentSchema.index({ assignedBy: 1, isDeleted: 1 });
assignmentSchema.index({ batchId: 1, type: 1, isDeleted: 1 });
assignmentSchema.index({ batchId: 1, approved: 1, isDeleted: 1 });
assignmentSchema.index({ dueDate: 1, isDeleted: 1 });
assignmentSchema.index({ assignedBy: 1, dueDate: 1, isDeleted: 1 });
assignmentSchema.index({ topic: 1, isDeleted: 1 });
assignmentSchema.index({ createdAt: -1, isDeleted: 1 });

export const Assignment = mongoose.model<AssignmentDocument>("Assignment", assignmentSchema);
