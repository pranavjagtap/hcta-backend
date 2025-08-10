import { Assignment } from "../models/assignment";
import { Batch } from "../models/batch";
import Subject from "../models/subject";
import { Submission } from "../models/submission";
import { FilterQuery } from "mongoose";
import { AssignmentBase, AssignmentUpdate, AssignmentStats, UpcomingAssignment, AssignmentQuery } from "../types/assignment";

// Create a new assignment
export const createAssignment = async (data: AssignmentBase) => {
  const assignment = new Assignment(data);
  const savedAssignment = await assignment.save();
  
  return await savedAssignment.populate([
    { path: "batchId", select: "name academicYear" },
    { path: "subjectId", select: "name board classLevel" },
    { path: "assignedBy", select: "name email" },
  ]);
};

// Get all assignments with pagination, search, and population
export const getAllAssignments = async (
  filters: FilterQuery<typeof Assignment> = {},
  options: {
    page?: number;
    limit?: number;
    search?: string;
    populate?: boolean;
  } = {}
) => {
  const { page = 1, limit = 10, search, populate = true } = options;

  // Always include isDeleted: false filter
  const finalFilters = { ...filters, isDeleted: false };

  // Build search filter
  if (search) {
    finalFilters.$or = [
      { topic: { $regex: search, $options: "i" } },
      { fileUrl: { $regex: search, $options: "i" } },
    ];
  }

  const query = Assignment.find(finalFilters);

  if (populate) {
    query.populate([
      { path: "batchId", select: "name academicYear" },
      { path: "subjectId", select: "name board classLevel" },
      { path: "assignedBy", select: "name email" },
    ]);
  }

  // Apply pagination
  const skip = (page - 1) * limit;
  const assignments = await query
    .skip(skip)
    .limit(limit)
    .sort({ dueDate: 1, createdAt: -1 });

  // Get total count for pagination
  const total = await Assignment.countDocuments(finalFilters);

  return {
    assignments,
    pagination: {
      current: page,
      pages: Math.ceil(total / limit),
      total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  };
};

// Get assignments for a specific tutor
export const getTutorAssignments = async (
  tutorId: string,
  filters: FilterQuery<typeof Assignment> = {},
  options: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}
) => {
  const tutorFilters = { ...filters, assignedBy: tutorId };
  return await getAllAssignments(tutorFilters, options);
};

// Get assignment by ID
export const getAssignmentById = async (id: string, tutorId?: string) => {
  const filters: any = { _id: id, isDeleted: false };
  if (tutorId) {
    filters.assignedBy = tutorId;
  }

  const assignment = await Assignment.findOne(filters).populate([
    { path: "batchId", select: "name academicYear" },
    { path: "subjectId", select: "name board classLevel" },
    { path: "assignedBy", select: "name email" },
  ]);

  return assignment;
};

// Update assignment
export const updateAssignment = async (id: string, data: AssignmentUpdate, tutorId?: string) => {
  const filters: any = { _id: id, isDeleted: false };
  if (tutorId) {
    filters.assignedBy = tutorId;
  }

  const assignment = await Assignment.findOneAndUpdate(
    filters,
    { ...data, updatedAt: new Date() },
    { new: true }
  ).populate([
    { path: "batchId", select: "name academicYear" },
    { path: "subjectId", select: "name board classLevel" },
    { path: "assignedBy", select: "name email" },
  ]);

  return assignment;
};

// Toggle assignment lock status
export const toggleAssignmentLock = async (id: string, isLocked: boolean, tutorId?: string) => {
  const filters: any = { _id: id, isDeleted: false };
  if (tutorId) {
    filters.assignedBy = tutorId;
  }

  const assignment = await Assignment.findOneAndUpdate(
    filters,
    { 
      isLocked, 
      updatedAt: new Date() 
    },
    { new: true }
  ).populate([
    { path: "batchId", select: "name academicYear" },
    { path: "subjectId", select: "name board classLevel" },
    { path: "assignedBy", select: "name email" },
  ]);

  return assignment;
};

// Soft delete assignment
export const softDeleteAssignment = async (id: string, tutorId?: string) => {
  const filters: any = { _id: id, isDeleted: false };
  if (tutorId) {
    filters.assignedBy = tutorId;
  }

  const assignment = await Assignment.findOneAndUpdate(
    filters,
    { isDeleted: true, updatedAt: new Date() },
    { new: true }
  );

  return assignment;
};

// Get upcoming assignments
export const getUpcomingAssignments = async (tutorId: string, days: number = 7, batchId?: string) => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  const filters: any = {
    assignedBy: tutorId,
    dueDate: { $gte: new Date(), $lte: futureDate }
  };

  if (batchId) {
    filters.batchId = batchId;
  }

  const assignments = await Assignment.find(filters)
    .where({ isDeleted: false })
    .populate([
      { path: "batchId", select: "name academicYear" },
      { path: "subjectId", select: "name board classLevel" },
    ])
    .sort({ dueDate: 1 });

  // Get submission counts for each assignment
  const assignmentsWithSubmissions = await Promise.all(
    assignments.map(async (assignment) => {
      const submissionCount = await Submission.countDocuments({
        assignmentId: assignment._id,
        isDeleted: false
      });

      const batch = assignment.batchId as any;
      const totalStudents = batch.studentIds ? batch.studentIds.length : 0;

      const daysUntilDue = Math.ceil(
        (new Date(assignment.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        _id: assignment._id.toString(),
        topic: assignment.topic,
        batchName: batch.name,
        subjectName: assignment.subjectId?.name,
        type: assignment.type,
        dueDate: assignment.dueDate.toISOString(),
        daysUntilDue,
        submissionCount,
        totalStudents
      };
    })
  );

  return assignmentsWithSubmissions;
};

// Get batch assignment statistics
export const getBatchAssignmentStats = async (batchId: string, tutorId: string, startDate?: Date, endDate?: Date) => {
  const filters: any = { 
    batchId, 
    assignedBy: tutorId
  };

  if (startDate || endDate) {
    filters.createdAt = {};
    if (startDate) filters.createdAt.$gte = startDate;
    if (endDate) filters.createdAt.$lte = endDate;
  }

  const stats = await Assignment.aggregate([
    { $match: { ...filters, isDeleted: false } },
    {
      $group: {
        _id: null,
        totalAssignments: { $sum: 1 },
        pendingAssignments: { $sum: { $cond: [{ $eq: ["$approved", false] }, 1, 0] } },
        approvedAssignments: { $sum: { $cond: [{ $eq: ["$approved", true] }, 1, 0] } },
        lockedAssignments: { $sum: { $cond: [{ $eq: ["$isLocked", true] }, 1, 0] } }
      }
    },
    {
      $project: {
        _id: 0,
        totalAssignments: 1,
        pendingAssignments: 1,
        approvedAssignments: 1,
        lockedAssignments: 1
      }
    }
  ]);

  const assignmentsByType = await Assignment.aggregate([
    { $match: { ...filters, isDeleted: false } },
    {
      $group: {
        _id: "$type",
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);

  const assignmentsByStatus = await Assignment.aggregate([
    { $match: { ...filters, isDeleted: false } },
    {
      $group: {
        _id: {
          $cond: [
            { $eq: ["$isLocked", true] },
            "locked",
            { $cond: [{ $eq: ["$approved", true] }, "approved", "pending"] }
          ]
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);

  // Get upcoming deadlines count
  const upcomingDeadlines = await Assignment.countDocuments({
    ...filters,
    isDeleted: false,
    dueDate: { $gte: new Date(), $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
  });

  // Calculate average completion rate
  const totalAssignments = stats[0]?.totalAssignments || 0;
  const completedAssignments = await Submission.aggregate([
    { $match: { assignmentId: { $in: await Assignment.find({ ...filters, isDeleted: false }).select("_id") } } },
    { $group: { _id: "$assignmentId" } },
    { $count: "total" }
  ]);

  const completionRate = totalAssignments > 0 
    ? ((completedAssignments[0]?.total || 0) / totalAssignments) * 100 
    : 0;

  return {
    ...stats[0],
    assignmentsByType,
    assignmentsByStatus,
    upcomingDeadlines,
    averageCompletionRate: Math.round(completionRate * 100) / 100
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
