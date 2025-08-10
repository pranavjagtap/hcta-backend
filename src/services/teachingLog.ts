import { TeachingLog } from "../models/teachingLog";
import { Batch } from "../models/batch";
import { Subject } from "../models/subject";
import { FilterQuery } from "mongoose";
import { TeachingLogBase, TeachingLogUpdate, TeachingLogStats, DailySchedule, TeachingLogQuery } from "../types/teachingLog";

// Create a new teaching log
export const createTeachingLog = async (data: TeachingLogBase) => {
  const teachingLog = new TeachingLog(data);
  const savedLog = await teachingLog.save();
  
  return await savedLog.populate([
    { path: "batchId", select: "name academicYear" },
    { path: "subjectId", select: "name board classLevel" },
    { path: "tutorId", select: "name email" },
  ]);
};

// Get all teaching logs with pagination, search, and population
export const getAllTeachingLogs = async (
  filters: FilterQuery<typeof TeachingLog> = {},
  options: {
    page?: number;
    limit?: number;
    search?: string;
    populate?: boolean;
  } = {}
) => {
  const { page = 1, limit = 10, search, populate = true } = options;

  // Ensure isDeleted filter is applied
  filters.isDeleted = false;

  // Build search filter
  if (search) {
    filters.$or = [
      { topic: { $regex: search, $options: "i" } },
      { teachingMethod: { $regex: search, $options: "i" } },
    ];
  }

  const query = TeachingLog.find(filters);

  if (populate) {
    query.populate([
      { path: "batchId", select: "name academicYear" },
      { path: "subjectId", select: "name board classLevel" },
      { path: "tutorId", select: "name email" },
    ]);
  }

  // Apply pagination
  const skip = (page - 1) * limit;
  const logs = await query
    .skip(skip)
    .limit(limit)
    .sort({ date: -1, createdAt: -1 });

  // Get total count for pagination
  const total = await TeachingLog.countDocuments(filters);

  return {
    logs,
    pagination: {
      current: page,
      pages: Math.ceil(total / limit),
      total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  };
};

// Get teaching logs for a specific tutor
export const getTutorTeachingLogs = async (
  tutorId: string,
  filters: FilterQuery<typeof TeachingLog> = {},
  options: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}
) => {
  const tutorFilters = { ...filters, tutorId, isDeleted: false };
  return await getAllTeachingLogs(tutorFilters, options);
};

// Get teaching log by ID
export const getTeachingLogById = async (id: string, tutorId?: string) => {
  const filters: any = { _id: id, isDeleted: false };
  if (tutorId) {
    filters.tutorId = tutorId;
  }

  const log = await TeachingLog.findOne(filters).populate([
    { path: "batchId", select: "name academicYear" },
    { path: "subjectId", select: "name board classLevel" },
    { path: "tutorId", select: "name email" },
  ]);

  return log;
};

// Update teaching log
export const updateTeachingLog = async (id: string, data: TeachingLogUpdate, tutorId?: string) => {
  const filters: any = { _id: id, isDeleted: false };
  if (tutorId) {
    filters.tutorId = tutorId;
  }

  const log = await TeachingLog.findOneAndUpdate(
    filters,
    { ...data, updatedAt: new Date() },
    { new: true }
  ).populate([
    { path: "batchId", select: "name academicYear" },
    { path: "subjectId", select: "name board classLevel" },
    { path: "tutorId", select: "name email" },
  ]);

  return log;
};

// Mark teaching log as completed or cancelled
export const markTeachingLogCompleted = async (id: string, status: "completed" | "cancelled", tutorId?: string) => {
  const filters: any = { _id: id, isDeleted: false };
  if (tutorId) {
    filters.tutorId = tutorId;
  }

  const log = await TeachingLog.findOneAndUpdate(
    filters,
    { 
      status, 
      updatedAt: new Date(),
      ...(status === "completed" && { completedAt: new Date() })
    },
    { new: true }
  ).populate([
    { path: "batchId", select: "name academicYear" },
    { path: "subjectId", select: "name board classLevel" },
    { path: "tutorId", select: "name email" },
  ]);

  return log;
};

// Soft delete teaching log
export const softDeleteTeachingLog = async (id: string, tutorId?: string) => {
  const filters: any = { _id: id, isDeleted: false };
  if (tutorId) {
    filters.tutorId = tutorId;
  }

  const log = await TeachingLog.findOneAndUpdate(
    filters,
    { isDeleted: true, updatedAt: new Date() },
    { new: true }
  );

  return log;
};

// Get batch teaching statistics
export const getBatchTeachingStats = async (batchId: string, tutorId: string, startDate?: Date, endDate?: Date) => {
  const filters: any = { 
    batchId, 
    tutorId, 
    isDeleted: false 
  };

  if (startDate || endDate) {
    filters.date = {};
    if (startDate) filters.date.$gte = startDate;
    if (endDate) filters.date.$lte = endDate;
  }

  const stats = await TeachingLog.aggregate([
    { $match: filters },
    {
      $group: {
        _id: null,
        totalLogs: { $sum: 1 },
        completedLogs: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
        pendingLogs: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
        cancelledLogs: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } },
        totalTeachingHours: { $sum: { $divide: ["$durationMinutes", 60] } },
        averageSessionDuration: { $avg: "$durationMinutes" }
      }
    },
    {
      $project: {
        _id: 0,
        totalLogs: 1,
        completedLogs: 1,
        pendingLogs: 1,
        cancelledLogs: 1,
        totalTeachingHours: { $round: ["$totalTeachingHours", 2] },
        averageSessionDuration: { $round: ["$averageSessionDuration", 2] }
      }
    }
  ]);

  const logsByStatus = await TeachingLog.aggregate([
    { $match: filters },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);

  const logsByMonth = await TeachingLog.aggregate([
    { $match: filters },
    {
      $group: {
        _id: {
          year: { $year: "$date" },
          month: { $month: "$date" }
        },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        month: {
          $concat: [
            { $toString: "$_id.year" },
            "-",
            { $toString: "$_id.month" }
          ]
        },
        count: 1
      }
    },
    { $sort: { month: -1 } }
  ]);

  return {
    ...stats[0],
    logsByStatus,
    logsByMonth
  };
};

// Get daily schedule
export const getDailySchedule = async (tutorId: string, date?: Date, batchId?: string) => {
  const targetDate = date || new Date();
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const filters: any = {
    tutorId,
    isDeleted: false,
    date: { $gte: startOfDay, $lte: endOfDay }
  };

  if (batchId) {
    filters.batchId = batchId;
  }

  const logs = await TeachingLog.find(filters)
    .populate([
      { path: "batchId", select: "name academicYear" },
      { path: "subjectId", select: "name board classLevel" },
    ])
    .sort({ date: 1 });

  const totalSessions = logs.length;
  const totalHours = logs.reduce((sum, log) => sum + (log.durationMinutes || 0), 0) / 60;

  return {
    date: targetDate.toISOString().split('T')[0],
    logs: logs.map(log => ({
      _id: (log as any)._id.toString(),
      topic: log.topic,
      batchName: (log.batchId as any).name,
      subjectName: (log.subjectId as any)?.name,
      startTime: log.date ? new Date(log.date).toISOString() : new Date().toISOString(),
      durationMinutes: log.durationMinutes || 0,
      status: log.status
    })),
    totalSessions,
    totalHours: Math.round(totalHours * 100) / 100
  };
};

// Check if batch exists and belongs to tutor
export const checkBatchAccess = async (batchId: string, tutorId: string) => {
  const batch = await Batch.findOne({
    _id: batchId,
    tutorId,
    isDeleted: false,
  });
  return batch;
};

// Check if subject exists
export const checkSubjectExists = async (subjectId: string) => {
  const subject = await Subject.findById(subjectId).where({ isDeleted: false });
  return subject;
};
