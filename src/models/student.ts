import mongoose, { Document, Schema } from "mongoose";
import { StudentBase, StudentDocument } from "../types/student";

const studentSchema = new Schema<StudentDocument>(
  {
    name: {
      type: String,
      required: true,
      index: true,
    },
    parentName: String,
    parentPhone: String,
    whatsappNumber: String,
    schoolName: String,
    board: {
      type: String,
      index: true,
    },
    classLevel: {
      type: String,
      index: true,
    },
    batchId: {
      type: Schema.Types.ObjectId,
      ref: "Batch",
      index: true,
    },
    weaknesses: {
      type: [String],
      default: [],
    },
    rollNumber: {
      type: String,
      index: true,
    },
    admissionDate: Date,
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

// Compound indexes for efficient queries
studentSchema.index({ batchId: 1, isDeleted: 1 });
studentSchema.index({ board: 1, isDeleted: 1 });
studentSchema.index({ classLevel: 1, isDeleted: 1 });
studentSchema.index({ name: 1, isDeleted: 1 });
studentSchema.index({ rollNumber: 1, isDeleted: 1 });
studentSchema.index({ createdAt: -1, isDeleted: 1 });

export const Student = mongoose.model<StudentDocument>("Student", studentSchema);
