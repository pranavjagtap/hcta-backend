import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, index: true },
    parentName: String,
    parentPhone: String,
    whatsappNumber: String,
    schoolName: String,
    board: String,
    classLevel: String,
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      index: true,
    },
    weaknesses: [String],
    rollNumber: String,
    admissionDate: Date,
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Student", studentSchema);
