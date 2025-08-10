import mongoose, { Document, Schema } from "mongoose";
import { SubmissionBase, SubmissionDocument } from "../types/submission";

const submissionSchema = new Schema<SubmissionDocument>(
  {
    assignmentId: {
      type: Schema.Types.ObjectId as any,
      ref: "Assignment",
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId as any,
      ref: "Student",
      required: true,
      index: true,
    },
    fileURL: String,
    submittedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    marksAwarded: {
      type: Number,
      min: 0,
    },
    remarks: String,
    status: {
      type: String,
      enum: ["submitted", "checked", "late"],
      default: "submitted",
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
submissionSchema.index({ assignmentId: 1, isDeleted: 1 });
submissionSchema.index({ studentId: 1, isDeleted: 1 });
submissionSchema.index({ assignmentId: 1, studentId: 1, isDeleted: 1 });
submissionSchema.index({ assignmentId: 1, status: 1, isDeleted: 1 });
submissionSchema.index({ submittedAt: -1, isDeleted: 1 });
submissionSchema.index({ status: 1, isDeleted: 1 });
submissionSchema.index({ createdAt: -1, isDeleted: 1 });

export const Submission = mongoose.model<SubmissionDocument>("Submission", submissionSchema);
