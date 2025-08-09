import mongoose from "mongoose";

const performanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    index: true,
  },
  topic: { type: String, index: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
  score: Number,
  maxScore: Number,
  remarks: String,
  assessmentType: {
    type: String,
    enum: ["test", "oral", "assignment", "project"],
  },
  date: Date,
  isDeleted: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

export default mongoose.model("Performance", performanceSchema);
