import { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import { Assignment } from "../models/assignment";
import { Batch } from "../models/batch";
import { Subject } from "../models/subject";
import { Submission } from "../models/submission";

// Create a new assignment
export const createAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      batchId,
      topic,
      subjectId,
      type,
      dueDate,
      fileUrl,
      isOptional,
      maxMarks,
    } = req.body;

    // Validate batch ID and ensure tutor owns the batch
    if (!isValidObjectId(batchId)) {
      res.status(400).json({ error: "Invalid batch ID" });
      return;
    }

    const batch = await Batch.findOne({
      _id: batchId,
      tutorId: req.user?._id,
      isDeleted: false,
    });

    if (!batch) {
      res.status(400).json({ error: "Batch not found or access denied" });
      return;
    }

    // Validate subject ID
    if (subjectId && !isValidObjectId(subjectId)) {
      res.status(400).json({ error: "Invalid subject ID" });
      return;
    }

    if (subjectId) {
      const subject = await Subject.findById(subjectId);
      if (!subject) {
        res.status(400).json({ error: "Subject not found" });
        return;
      }
    }

    const assignment = new Assignment({
      batchId,
      topic,
      subjectId,
      type: type || "homework",
      dueDate: new Date(dueDate),
      assignedBy: req.user?._id,
      fileUrl,
      isOptional: isOptional || false,
      maxMarks,
      createdBy: req.user?._id,
      updatedBy: req.user?._id,
    });

    const savedAssignment = await assignment.save();
    await savedAssignment.populate([
      { path: "batchId", select: "name academicYear" },
      { path: "subjectId", select: "name board classLevel" },
      { path: "assignedBy", select: "name email" },
    ]);

    res.status(201).json({
      success: true,
      data: savedAssignment,
      message: "Assignment created successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to create assignment",
      details: error,
    });
  }
};

// Get assignments for the authenticated tutor
export const getTutorAssignments = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      batchId,
      subjectId,
      type,
      status,
      startDate,
      endDate,
      topic,
    } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Get all batches for this tutor
    const tutorBatches = await Batch.find({
      tutorId: req.user?._id,
      isDeleted: false,
    }).select("_id");

    const tutorBatchIds = tutorBatches.map(batch => batch._id);

    const filter: any = {
      batchId: { $in: tutorBatchIds },
      isDeleted: false,
    };

    if (batchId && isValidObjectId(batchId)) {
      filter.batchId = batchId;
    }

    if (subjectId && isValidObjectId(subjectId)) {
      filter.subjectId = subjectId;
    }

    if (type) {
      filter.type = type;
    }

    if (topic) {
      filter.topic = { $regex: topic, $options: "i" };
    }

    // Date range filter
    if (startDate || endDate) {
      filter.dueDate = {};
      if (startDate) {
        filter.dueDate.$gte = new Date(startDate as string);
      }
      if (endDate) {
        filter.dueDate.$lte = new Date(endDate as string);
      }
    }

    const assignments = await Assignment.find(filter)
      .populate([
        { path: "batchId", select: "name academicYear" },
        { path: "subjectId", select: "name board classLevel" },
        { path: "assignedBy", select: "name email" },
      ])
      .skip(skip)
      .limit(Number(limit))
      .sort({ dueDate: -1, createdAt: -1 });

    const total = await Assignment.countDocuments(filter);

    // Get submission stats for each assignment
    const assignmentIds = assignments.map(a => a._id);
    const submissionStats = await Submission.aggregate([
      { $match: { assignmentId: { $in: assignmentIds }, isDeleted: false } },
      {
        $group: {
          _id: "$assignmentId",
          totalSubmissions: { $sum: 1 },
          checkedSubmissions: {
            $sum: { $cond: [{ $eq: ["$status", "checked"] }, 1, 0] },
          },
          lateSubmissions: {
            $sum: { $cond: [{ $eq: ["$status", "late"] }, 1, 0] },
          },
        },
      },
    ]);

    const statsMap = submissionStats.reduce((acc, stat) => {
      acc[stat._id.toString()] = stat;
      return acc;
    }, {});

    const assignmentsWithStats = assignments.map(assignment => ({
      ...assignment.toObject(),
      submissionStats: statsMap[(assignment as any)._id.toString()] || {
        totalSubmissions: 0,
        checkedSubmissions: 0,
        lateSubmissions: 0,
      },
    }));

    res.status(200).json({
      success: true,
      data: {
        assignments: assignmentsWithStats,
        pagination: {
          current: Number(page),
          pages: Math.ceil(total / Number(limit)),
          total,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch assignments",
      details: error,
    });
  }
};

// Get assignment by ID with submissions
export const getAssignmentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({ error: "Invalid assignment ID" });
      return;
    }

    const assignment = await Assignment.findOne({
      _id: id,
      isDeleted: false,
    }).populate([
      { path: "batchId", select: "name academicYear tutorId studentIds" },
      { path: "subjectId", select: "name board classLevel topics" },
      { path: "assignedBy", select: "name email" },
    ]);

    if (!assignment) {
      res.status(404).json({
        success: false,
        error: "Assignment not found",
      });
      return;
    }

    // Check if user has access to this assignment
    if ((assignment.batchId as any).tutorId.toString() !== req.user?._id) {
      res.status(403).json({
        success: false,
        error: "Access denied",
      });
      return;
    }

    // Get submissions for this assignment
    const submissions = await Submission.find({
      assignmentId: id,
      isDeleted: false,
    })
      .populate("studentId", "name rollNumber")
      .sort({ submittedAt: -1 });

    // Get students who haven't submitted
    const submittedStudentIds = submissions.map(s => (s.studentId as any)._id.toString());
    const allStudentIds = (assignment.batchId as any).studentIds;
    const notSubmittedStudentIds = allStudentIds.filter(
      (studentId: any) => !submittedStudentIds.includes(studentId.toString())
    );

    // Populate not submitted students
    const Student = require("../models/student").default;
    const notSubmittedStudents = await Student.find({
      _id: { $in: notSubmittedStudentIds },
      isDeleted: false,
    }).select("name rollNumber");

    res.status(200).json({
      success: true,
      data: {
        assignment,
        submissions,
        notSubmittedStudents,
        stats: {
          totalStudents: allStudentIds.length,
          totalSubmissions: submissions.length,
          checkedSubmissions: submissions.filter(s => s.status === "checked").length,
          lateSubmissions: submissions.filter(s => s.status === "late").length,
          pendingSubmissions: notSubmittedStudents.length,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch assignment",
      details: error,
    });
  }
};

// Update assignment
export const updateAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!isValidObjectId(id)) {
      res.status(400).json({ error: "Invalid assignment ID" });
      return;
    }

    // Validate subject ID if provided
    if (updates.subjectId && !isValidObjectId(updates.subjectId)) {
      res.status(400).json({ error: "Invalid subject ID" });
      return;
    }

    if (updates.subjectId) {
      const subject = await Subject.findById(updates.subjectId);
      if (!subject) {
        res.status(400).json({ error: "Subject not found" });
        return;
      }
    }

    const assignment = await Assignment.findOne({
      _id: id,
      isDeleted: false,
    }).populate("batchId", "tutorId");

    if (!assignment) {
      res.status(404).json({
        success: false,
        error: "Assignment not found",
      });
      return;
    }

    // Check if user has access to this assignment
    if ((assignment.batchId as any).tutorId.toString() !== req.user?._id) {
      res.status(403).json({
        success: false,
        error: "Access denied",
      });
      return;
    }

    // Check if assignment is locked
    if (assignment.isLocked) {
      res.status(400).json({
        success: false,
        error: "Cannot update locked assignment",
      });
      return;
    }

    const updatedAssignment = await Assignment.findByIdAndUpdate(
      id,
      { ...updates, updatedBy: req.user?._id },
      { new: true, runValidators: true }
    ).populate([
      { path: "batchId", select: "name academicYear" },
      { path: "subjectId", select: "name board classLevel" },
      { path: "assignedBy", select: "name email" },
    ]);

    res.status(200).json({
      success: true,
      data: updatedAssignment,
      message: "Assignment updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to update assignment",
      details: error,
    });
  }
};

// Lock/unlock assignment
export const toggleAssignmentLock = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({ error: "Invalid assignment ID" });
      return;
    }

    const assignment = await Assignment.findOne({
      _id: id,
      isDeleted: false,
    }).populate("batchId", "tutorId");

    if (!assignment) {
      res.status(404).json({ error: "Assignment not found" });
      return;
    }

    // Check access
    if ((assignment.batchId as any).tutorId.toString() !== req.user?._id) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    assignment.isLocked = !assignment.isLocked;
    assignment.updatedBy = req.user?._id;
    await assignment.save();

    await assignment.populate([
      { path: "batchId", select: "name academicYear" },
      { path: "subjectId", select: "name board classLevel" },
    ]);

    res.status(200).json({
      success: true,
      data: assignment,
      message: `Assignment ${assignment.isLocked ? "locked" : "unlocked"} successfully`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to toggle assignment lock",
      details: error,
    });
  }
};

// Delete assignment (soft delete)
export const deleteAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({ error: "Invalid assignment ID" });
      return;
    }

    const assignment = await Assignment.findOne({
      _id: id,
      isDeleted: false,
    }).populate("batchId", "tutorId");

    if (!assignment) {
      res.status(404).json({ error: "Assignment not found" });
      return;
    }

    // Check access
    if ((assignment.batchId as any).tutorId.toString() !== req.user?._id) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    assignment.isDeleted = true;
    assignment.updatedBy = req.user?._id;
    await assignment.save();

    res.status(200).json({
      success: true,
      message: "Assignment deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to delete assignment",
      details: error,
    });
  }
};

// Get upcoming assignments (due in next 7 days)
export const getUpcomingAssignments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { days = 7 } = req.query;
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + Number(days));

    // Get all batches for this tutor
    const tutorBatches = await Batch.find({
      tutorId: req.user?._id,
      isDeleted: false,
    }).select("_id");

    const tutorBatchIds = tutorBatches.map(batch => batch._id);

    const upcomingAssignments = await Assignment.find({
      batchId: { $in: tutorBatchIds },
      dueDate: {
        $gte: now,
        $lte: futureDate,
      },
      isDeleted: false,
    })
      .populate([
        { path: "batchId", select: "name academicYear" },
        { path: "subjectId", select: "name board classLevel" },
      ])
      .sort({ dueDate: 1 });

    res.status(200).json({
      success: true,
      data: upcomingAssignments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch upcoming assignments",
      details: error,
    });
  }
};

// Get assignment statistics for a batch
export const getBatchAssignmentStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { batchId } = req.params;
    const { startDate, endDate } = req.query;

    if (!isValidObjectId(batchId)) {
      res.status(400).json({ error: "Invalid batch ID" });
      return;
    }

    // Verify batch ownership
    const batch = await Batch.findOne({
      _id: batchId,
      tutorId: req.user?._id,
      isDeleted: false,
    });

    if (!batch) {
      res.status(400).json({ error: "Batch not found or access denied" });
      return;
    }

    const dateFilter: any = { batchId, isDeleted: false };

    if (startDate || endDate) {
      dateFilter.dueDate = {};
      if (startDate) {
        dateFilter.dueDate.$gte = new Date(startDate as string);
      }
      if (endDate) {
        dateFilter.dueDate.$lte = new Date(endDate as string);
      }
    }

    // Get assignment statistics
    const stats = await Assignment.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalAssignments: { $sum: 1 },
          homeworkCount: {
            $sum: { $cond: [{ $eq: ["$type", "homework"] }, 1, 0] },
          },
          quizCount: {
            $sum: { $cond: [{ $eq: ["$type", "quiz"] }, 1, 0] },
          },
          testCount: {
            $sum: { $cond: [{ $eq: ["$type", "test"] }, 1, 0] },
          },
          practiceCount: {
            $sum: { $cond: [{ $eq: ["$type", "practice"] }, 1, 0] },
          },
        },
      },
    ]);

    // Get subject-wise assignment distribution
    const subjectStats = await Assignment.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$subjectId",
          assignmentCount: { $sum: 1 },
          types: { $push: "$type" },
        },
      },
      {
        $lookup: {
          from: "subjects",
          localField: "_id",
          foreignField: "_id",
          as: "subject",
        },
      },
      {
        $unwind: "$subject",
      },
      {
        $project: {
          subjectName: "$subject.name",
          assignmentCount: 1,
          types: 1,
        },
      },
    ]);

    const result = {
      overall: stats[0] || {
        totalAssignments: 0,
        homeworkCount: 0,
        quizCount: 0,
        testCount: 0,
        practiceCount: 0,
      },
      subjectWise: subjectStats,
    };

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch assignment statistics",
      details: error,
    });
  }
};
