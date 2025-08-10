import mongoose, { Document, Schema } from "mongoose";
import { NoteBase, NoteDocument } from "../types/note";

const noteSchema = new Schema<NoteDocument>(
  {
    batchId: {
      type: Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
      index: true,
    },
    topic: {
      type: String,
      required: true,
      index: true,
    },
    fileURL: String,
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      index: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    noteType: {
      type: String,
      enum: ["handwritten", "typed", "video", "image"],
      default: "handwritten",
      index: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
      index: true,
    },
    approved: {
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
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Compound indexes for efficient queries
noteSchema.index({ batchId: 1, isDeleted: 1 });
noteSchema.index({ uploadedBy: 1, isDeleted: 1 });
noteSchema.index({ batchId: 1, noteType: 1, isDeleted: 1 });
noteSchema.index({ batchId: 1, isPublic: 1, isDeleted: 1 });
noteSchema.index({ batchId: 1, approved: 1, isDeleted: 1 });
noteSchema.index({ topic: 1, isDeleted: 1 });
noteSchema.index({ createdAt: -1, isDeleted: 1 });

export const Note = mongoose.model<NoteDocument>("Note", noteSchema);
