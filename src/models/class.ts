import mongoose, { Document, Schema } from "mongoose";
import { ClassBase, ClassDocument } from "../types/class";

const classSchema = new Schema<ClassDocument>(
  {
    name: {
      type: String,
      required: true,
      index: true,
    },
    gradeLevel: {
      type: String,
      required: true,
      index: true,
    },
    subjects: [{
      type: Schema.Types.ObjectId as any,
      ref: "Subject",
      index: true,
    }],
    assignedTeachers: [{
      type: Schema.Types.ObjectId as any,
      ref: "User",
      index: true,
    }],
    description: String,
    maxStudents: {
      type: Number,
      min: 1,
    },
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
classSchema.index({ gradeLevel: 1, isDeleted: 1 });
classSchema.index({ isActive: 1, isDeleted: 1 });
classSchema.index({ assignedTeachers: 1, isDeleted: 1 });
classSchema.index({ name: 1, gradeLevel: 1, isDeleted: 1 });
classSchema.index({ createdAt: -1, isDeleted: 1 });

export const Class = mongoose.model<ClassDocument>("Class", classSchema);
