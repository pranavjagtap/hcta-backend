import mongoose from "mongoose";

const noteSchema = new mongoose.Schema({
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", index: true },
  topic: { type: String, index: true },
  fileURL: String,
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  noteType: {
    type: String,
    enum: ["handwritten", "typed", "video", "image"],
    default: "handwritten",
  },
  isPublic: { type: Boolean, default: false },
  approved: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

export default mongoose.model("Note", noteSchema);
