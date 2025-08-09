import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema(
  {
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      index: true,
    },
    topic: { type: String, index: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
    type: {
      type: String,
      enum: ["homework", "quiz", "test", "practice"],
      default: "homework",
    },
    dueDate: Date,
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    fileUrl: String,
    isOptional: Boolean,
    maxMarks: Number,
    approved: { type: Boolean, default: false },
    isLocked: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("Assignment", assignmentSchema);
