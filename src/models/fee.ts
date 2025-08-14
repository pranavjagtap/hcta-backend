import mongoose, { Document, Schema } from "mongoose";
import { FeeBase, FeeDocument } from "../types/fee";

const feeSchema = new Schema<FeeDocument>(
  {
    studentId: {
      type: Schema.Types.ObjectId as any,
      ref: "Student",
      required: true,
      index: true,
    },
    batchId: {
      type: Schema.Types.ObjectId as any,
      ref: "Batch",
      required: true,
      index: true,
    },
    monthYear: {
      type: String,
      required: true,
      index: true,
    },
    amountDue: {
      type: Number,
      required: true,
      min: 0,
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["paid", "partial", "unpaid"],
      default: "unpaid",
      index: true,
    },
    paymentMode: String,
    paymentDate: Date,
    receiptNumber: String,
    isLocked: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId as any,
      ref: "User",
    },
    updatedBy: {
      type: Schema.Types.ObjectId as any,
      ref: "User",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Compound indexes for efficient queries
feeSchema.index({ studentId: 1, batchId: 1, monthYear: 1 }, { unique: true });
feeSchema.index({ batchId: 1, monthYear: 1 });
feeSchema.index({ paymentStatus: 1, monthYear: 1 });

// Pre-save middleware to update payment status
feeSchema.pre("save", function (next) {
  const doc = this as any;
  if (doc.amountPaid >= doc.amountDue) {
    doc.paymentStatus = "paid";
  } else if (doc.amountPaid > 0) {
    doc.paymentStatus = "partial";
  } else {
    doc.paymentStatus = "unpaid";
  }
  next();
});

export const Fee = mongoose.model<FeeDocument>("Fee", feeSchema);
