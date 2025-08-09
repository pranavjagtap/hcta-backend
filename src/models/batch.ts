import mongoose from "mongoose";

const batchSchema = new mongoose.Schema(
  {
    tutorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, index: true },
    subjectIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subject" }],
    studentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }],
    academicYear: String,
    startDate: Date,
    endDate: Date,
    classDays: [String],
    maxStudents: Number,
    location: String,
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("Batch", batchSchema);
