import { Submission } from "../models/submission";
import { Assignment } from "../models/assignment";
import { Student } from "../models/student";
import { Batch } from "../models/batch";
import { FilterQuery } from "mongoose";
import { SubmissionBase, SubmissionUpdate, SubmissionStats, AssignmentSubmissionSummary, SubmissionQuery } from "../types/submission";

// Create a new submission
export const createSubmission = async (data: SubmissionBase) => {
  const submission = new Submission(data);
  const savedSubmission = await submission.save();
  
  return await savedSubmission.populate([
    { 
      path: "assignmentId", 
      select: "topic type dueDate maxMarks",
      populate: { path: "batchId", select: "name" }
    },
    { path: "studentId", select: "name rollNumber" },
  ]);
};

// Get all submissions with pagination, search, and population
export const getAllSubmissions = async (
  filters: FilterQuery<typeof Submission> = {},
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
      { remarks: { $regex: search, $options: "i" } },
      { fileURL: { $regex: search, $options: "i" } },
    ];
  }

  const query = Submission.find(finalFilters);

  if (populate) {
    query.populate([
      { 
        path: "assignmentId", 
        select: "topic type dueDate maxMarks",
        populate: { path: "batchId", select: "name" }
      },
      { path: "studentId", select: "name rollNumber" },
    ]);
  }

  // Apply pagination
  const skip = (page - 1) * limit;
  const submissions = await query
    .skip(skip)
    .limit(limit)
    .sort({ submittedAt: -1, createdAt: -1 });

  // Get total count for pagination
  const total = await Submission.countDocuments(finalFilters);

  return {
    submissions,
    pagination: {
      current: page,
      pages: Math.ceil(total / limit),
      total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  };
};

// Get submissions for a specific tutor (through assignments)
export const getTutorSubmissions = async (
  tutorId: string,
  filters: FilterQuery<typeof Submission> = {},
  options: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}
) => {
  // Get all assignments by this tutor
  const tutorAssignments = await Assignment.find({
    assignedBy: tutorId,
    isDeleted: false,
  }).select("_id");

  const assignmentIds = tutorAssignments.map(assignment => assignment._id);
  
  const tutorFilters = { 
    ...filters, 
    assignmentId: { $in: assignmentIds }
  };
  
  return await getAllSubmissions(tutorFilters, options);
};

// Get submission by ID
export const getSubmissionById = async (id: string, tutorId?: string) => {
  const filters: any = { _id: id, isDeleted: false };
  
  if (tutorId) {
    // Get all assignments by this tutor
    const tutorAssignments = await Assignment.find({
      assignedBy: tutorId,
      isDeleted: false,
    }).select("_id");

    const assignmentIds = tutorAssignments.map(assignment => assignment._id);
    filters.assignmentId = { $in: assignmentIds };
  }

  const submission = await Submission.findOne(filters).populate([
    { 
      path: "assignmentId", 
      select: "topic type dueDate maxMarks",
      populate: { path: "batchId", select: "name" }
    },
    { path: "studentId", select: "name rollNumber" },
  ]);

  return submission;
};

// Update submission
export const updateSubmission = async (id: string, data: SubmissionUpdate, tutorId?: string) => {
  const filters: any = { _id: id, isDeleted: false };
  
  if (tutorId) {
    // Get all assignments by this tutor
    const tutorAssignments = await Assignment.find({
      assignedBy: tutorId,
      isDeleted: false,
    }).select("_id");

    const assignmentIds = tutorAssignments.map(assignment => assignment._id);
    filters.assignmentId = { $in: assignmentIds };
  }

  const submission = await Submission.findOneAndUpdate(
    filters,
    { ...data, updatedAt: new Date() },
    { new: true }
  ).populate([
    { 
      path: "assignmentId", 
      select: "topic type dueDate maxMarks",
      populate: { path: "batchId", select: "name" }
    },
    { path: "studentId", select: "name rollNumber" },
  ]);

  return submission;
};

// Grade a submission
export const gradeSubmission = async (id: string, marksAwarded: number, remarks?: string, status: "checked" | "late" = "checked", tutorId?: string) => {
  const filters: any = { _id: id, isDeleted: false };
  
  if (tutorId) {
    // Get all assignments by this tutor
    const tutorAssignments = await Assignment.find({
      assignedBy: tutorId,
      isDeleted: false,
    }).select("_id");

    const assignmentIds = tutorAssignments.map(assignment => assignment._id);
    filters.assignmentId = { $in: assignmentIds };
  }

  const submission = await Submission.findOneAndUpdate(
    filters,
    { 
      marksAwarded, 
      remarks, 
      status, 
      updatedAt: new Date() 
    },
    { new: true }
  ).populate([
    { 
      path: "assignmentId", 
      select: "topic type dueDate maxMarks",
      populate: { path: "batchId", select: "name" }
    },
    { path: "studentId", select: "name rollNumber" },
  ]);

  return submission;
};

// Bulk grade submissions
export const bulkGradeSubmissions = async (gradingData: Array<{
  submissionId: string;
  marksAwarded: number;
  remarks?: string;
  status: "checked" | "late";
}>, tutorId?: string) => {
  const results = [];

  for (const data of gradingData) {
    const result = await gradeSubmission(
      data.submissionId, 
      data.marksAwarded, 
      data.remarks, 
      data.status, 
      tutorId
    );
    results.push(result);
  }

  return results;
};

// Soft delete submission
export const softDeleteSubmission = async (id: string, tutorId?: string) => {
  const filters: any = { _id: id, isDeleted: false };
  
  if (tutorId) {
    // Get all assignments by this tutor
    const tutorAssignments = await Assignment.find({
      assignedBy: tutorId,
      isDeleted: false,
    }).select("_id");

    const assignmentIds = tutorAssignments.map(assignment => assignment._id);
    filters.assignmentId = { $in: assignmentIds };
  }

  const submission = await Submission.findOneAndUpdate(
    filters,
    { isDeleted: true, updatedAt: new Date() },
    { new: true }
  );

  return submission;
};

// Get submissions for a specific assignment
export const getAssignmentSubmissions = async (assignmentId: string, tutorId?: string) => {
  // Verify assignment belongs to tutor if tutorId provided
  if (tutorId) {
    const assignment = await Assignment.findOne({
      _id: assignmentId,
      assignedBy: tutorId,
      isDeleted: false,
    });

    if (!assignment) {
      return null;
    }
  }

  const submissions = await Submission.find({
    assignmentId,
    isDeleted: false,
  }).populate([
    { path: "studentId", select: "name rollNumber" },
  ]).sort({ submittedAt: -1 });

  return submissions;
};

// Get assignment submission summary
export const getAssignmentSubmissionSummary = async (assignmentId: string, tutorId?: string): Promise<AssignmentSubmissionSummary | null> => {
  // Verify assignment belongs to tutor if tutorId provided
  if (tutorId) {
    const assignment = await Assignment.findOne({
      _id: assignmentId,
      assignedBy: tutorId,
      isDeleted: false,
    }).populate("batchId", "name");

    if (!assignment) {
      return null;
    }

    // Get total students in the batch
    const batch = await Batch.findById(assignment.batchId).populate("studentIds", "name rollNumber");
    const totalStudents = batch?.studentIds?.length || 0;

    // Get submission statistics
    const stats = await Submission.aggregate([
      { $match: { assignmentId, isDeleted: false } },
      {
        $group: {
          _id: null,
          submittedCount: { $sum: 1 },
          checkedCount: { $sum: { $cond: [{ $eq: ["$status", "checked"] }, 1, 0] } },
          lateCount: { $sum: { $cond: [{ $eq: ["$status", "late"] }, 1, 0] } },
          averageMarks: { $avg: "$marksAwarded" }
        }
      }
    ]);

    const submissions = await Submission.find({
      assignmentId,
      isDeleted: false,
    }).populate("studentId", "name rollNumber").sort({ submittedAt: -1 });

    const submissionDetails = submissions.map(sub => ({
      _id: sub._id.toString(),
      studentName: (sub.studentId as any).name,
      studentRollNumber: (sub.studentId as any).rollNumber,
      submittedAt: sub.submittedAt?.toISOString() || "",
      marksAwarded: sub.marksAwarded,
      status: sub.status,
      remarks: sub.remarks,
    }));

    const submittedCount = stats[0]?.submittedCount || 0;
    const completionRate = totalStudents > 0 ? (submittedCount / totalStudents) * 100 : 0;

    return {
      assignmentId,
      assignmentName: assignment.topic,
      totalStudents,
      submittedCount,
      checkedCount: stats[0]?.checkedCount || 0,
      lateCount: stats[0]?.lateCount || 0,
      averageMarks: Math.round((stats[0]?.averageMarks || 0) * 100) / 100,
      completionRate: Math.round(completionRate * 100) / 100,
      submissions: submissionDetails,
    };
  }

  return null;
};

// Get submissions for a specific student
export const getStudentSubmissions = async (studentId: string, startDate?: Date, endDate?: Date) => {
  const filters: any = { studentId, isDeleted: false };

  if (startDate || endDate) {
    filters.submittedAt = {};
    if (startDate) filters.submittedAt.$gte = startDate;
    if (endDate) filters.submittedAt.$lte = endDate;
  }

  const submissions = await Submission.find(filters).populate([
    { 
      path: "assignmentId", 
      select: "topic type dueDate maxMarks",
      populate: { path: "batchId", select: "name" }
    },
  ]).sort({ submittedAt: -1 });

  return submissions;
};

// Get submission statistics for a tutor
export const getSubmissionStats = async (tutorId: string, startDate?: Date, endDate?: Date): Promise<SubmissionStats> => {
  // Get all assignments by this tutor
  const tutorAssignments = await Assignment.find({
    assignedBy: tutorId,
    isDeleted: false,
  }).select("_id");

  const assignmentIds = tutorAssignments.map(assignment => assignment._id);

  const filters: any = { 
    assignmentId: { $in: assignmentIds }
  };

  if (startDate || endDate) {
    filters.submittedAt = {};
    if (startDate) filters.submittedAt.$gte = startDate;
    if (endDate) filters.submittedAt.$lte = endDate;
  }

  const stats = await Submission.aggregate([
    { $match: { ...filters, isDeleted: false } },
    {
      $group: {
        _id: null,
        totalSubmissions: { $sum: 1 },
        submittedSubmissions: { $sum: { $cond: [{ $eq: ["$status", "submitted"] }, 1, 0] } },
        checkedSubmissions: { $sum: { $cond: [{ $eq: ["$status", "checked"] }, 1, 0] } },
        lateSubmissions: { $sum: { $cond: [{ $eq: ["$status", "late"] }, 1, 0] } },
        averageMarks: { $avg: "$marksAwarded" }
      }
    }
  ]);

  const submissionsByStatus = await Submission.aggregate([
    { $match: { ...filters, isDeleted: false } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);

  const submissionsByAssignment = await Submission.aggregate([
    { $match: { ...filters, isDeleted: false } },
    {
      $group: {
        _id: "$assignmentId",
        submissionCount: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: "assignments",
        localField: "_id",
        foreignField: "_id",
        as: "assignment"
      }
    },
    { $unwind: "$assignment" },
    {
      $project: {
        assignmentId: "$_id",
        assignmentName: "$assignment.topic",
        submissionCount: 1,
        totalStudents: "$assignment.totalStudents"
      }
    },
    { $sort: { submissionCount: -1 } }
  ]);

  // Get recent submissions (last 7 days)
  const recentSubmissions = await Submission.countDocuments({
    ...filters,
    isDeleted: false,
    submittedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
  });

  return {
    totalSubmissions: stats[0]?.totalSubmissions || 0,
    submittedSubmissions: stats[0]?.submittedSubmissions || 0,
    checkedSubmissions: stats[0]?.checkedSubmissions || 0,
    lateSubmissions: stats[0]?.lateSubmissions || 0,
    averageMarks: Math.round((stats[0]?.averageMarks || 0) * 100) / 100,
    submissionsByStatus,
    submissionsByAssignment,
    recentSubmissions,
  };
};

// Check if assignment exists and belongs to tutor
export const checkAssignmentAccess = async (assignmentId: string, tutorId: string) => {
  const assignment = await Assignment.findOne({
    _id: assignmentId,
    assignedBy: tutorId,
    isDeleted: false,
  });
  return assignment;
};

// Check if student exists
export const checkStudentExists = async (studentId: string) => {
  const student = await Student.findById(studentId).where({ isDeleted: false });
  return student;
};
