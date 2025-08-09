import mongoose from "mongoose";

const teachingLogSchema = new mongoose.Schema({
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", index: true },
  topic: { type: String, index: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
  date: { type: Date, index: true },
  tutorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  durationMinutes: Number,
  teachingMethod: String,
  status: {
    type: String,
    enum: ["pending", "completed", "cancelled"],
    default: "pending",
  },
  isDeleted: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

export default mongoose.model("TeachingLog", teachingLogSchema);
