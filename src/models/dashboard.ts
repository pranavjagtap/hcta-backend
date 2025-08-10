import mongoose, { Document, Schema } from "mongoose";
import { DashboardBase, DashboardDocument } from "../types/dashboard";

const dashboardSchema = new Schema<DashboardDocument>(
  {
    tutorId: {
      type: Schema.Types.ObjectId as any,
      ref: "User",
      required: true,
      index: true,
    },
    batchId: {
      type: Schema.Types.ObjectId as any,
      ref: "Batch",
      index: true,
    },
    period: {
      type: String,
      enum: ["day", "week", "month", "quarter", "year"],
      default: "month",
      required: true,
    },
    data: {
      overview: {
        totalBatches: { type: Number, default: 0 },
        totalStudents: { type: Number, default: 0 },
        monthlyAssignments: { type: Number, default: 0 },
        monthlyTeachingSessions: { type: Number, default: 0 },
        monthlyNotes: { type: Number, default: 0 },
      },
      today: {
        totalSessions: { type: Number, default: 0 },
        completedSessions: { type: Number, default: 0 },
        pendingSessions: { type: Number, default: 0 },
        schedule: [{ type: Schema.Types.Mixed }],
      },
      thisWeek: {
        totalSessions: { type: Number, default: 0 },
        completedSessions: { type: Number, default: 0 },
        completionRate: { type: Number, default: 0 },
      },
      upcoming: {
        assignments: [{ type: Schema.Types.Mixed }],
      },
      recent: {
        submissions: [{ type: Schema.Types.Mixed }],
        notes: [{ type: Schema.Types.Mixed }],
      },
      pending: {
        submissions: [{ type: Schema.Types.Mixed }],
      },
      performance: {
        batchOverview: [{ type: Schema.Types.Mixed }],
      },
      batches: [{ type: Schema.Types.Mixed }],
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Compound indexes for efficient queries
dashboardSchema.index({ tutorId: 1, batchId: 1, period: 1 });
dashboardSchema.index({ tutorId: 1, lastUpdated: -1 });
dashboardSchema.index({ tutorId: 1, isDeleted: 1 });
dashboardSchema.index({ batchId: 1, isDeleted: 1 });
dashboardSchema.index({ period: 1, isDeleted: 1 });
dashboardSchema.index({ createdAt: -1, isDeleted: 1 });

// Pre-save middleware to update lastUpdated
dashboardSchema.pre("save", function (next) {
  this.lastUpdated = new Date();
  next();
});

export const Dashboard = mongoose.model<DashboardDocument>("Dashboard", dashboardSchema);
