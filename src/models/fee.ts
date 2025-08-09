import mongoose from "mongoose";

const feeSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    index: true,
  },
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: "Batch" },
  monthYear: { type: String, index: true },
  amountDue: Number,
  amountPaid: Number,
  paymentStatus: {
    type: String,
    enum: ["paid", "partial", "unpaid"],
    default: "unpaid",
    index: true,
  },
  paymentMode: String,
  paymentDate: Date,
  receiptNumber: String,
  isLocked: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

export default mongoose.model("Fee", feeSchema);
