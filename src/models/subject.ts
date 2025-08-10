import mongoose, { Document, Schema } from "mongoose";
import { SubjectBase, SubjectDocument } from "../types/subject";

const subjectSchema = new Schema<SubjectDocument>(
  {
    name: { 
      type: String, 
      required: true,
      index: true 
    },
    board: { 
      type: String,
      index: true
    },
    classLevel: { 
      type: String,
      index: true
    },
    topics: [{ 
      type: String 
    }],
    syllabusCode: { 
      type: String,
      index: true
    },
    isElective: { 
      type: Boolean, 
      default: false,
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
subjectSchema.index({ name: 1, isDeleted: 1 });
subjectSchema.index({ board: 1, isDeleted: 1 });
subjectSchema.index({ classLevel: 1, isDeleted: 1 });
subjectSchema.index({ createdAt: -1, isDeleted: 1 });

export const Subject = mongoose.model<SubjectDocument>("Subject", subjectSchema);
