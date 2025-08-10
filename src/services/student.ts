import { Student } from "../models/student";
import Batch from "../models/batch";
import { FilterQuery } from "mongoose";
import { StudentBase, StudentUpdate, StudentStats, StudentQuery } from "../types/student";

// Create a new student
export const createStudent = async (data: StudentBase) => {
  const student = new Student(data);
  const savedStudent = await student.save();

  // Add student to batch if batchId provided
  if (data.batchId) {
    await Batch.findByIdAndUpdate(data.batchId, {
      $addToSet: { studentIds: savedStudent._id },
    });
  }

  return await savedStudent.populate("batchId", "name academicYear");
};

// Get all students with pagination, search, and population
export const getAllStudents = async (
  filters: FilterQuery<typeof Student> = {},
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
      { name: { $regex: search, $options: "i" } },
      { parentName: { $regex: search, $options: "i" } },
      { schoolName: { $regex: search, $options: "i" } },
      { rollNumber: { $regex: search, $options: "i" } },
    ];
  }

  const query = Student.find(finalFilters);

  if (populate) {
    query.populate("batchId", "name academicYear");
  }

  // Apply pagination
  const skip = (page - 1) * limit;
  const students = await query
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  // Get total count for pagination
  const total = await Student.countDocuments(finalFilters);

  return {
    students,
    pagination: {
      current: page,
      pages: Math.ceil(total / limit),
      total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  };
};

// Get students for a specific tutor
export const getTutorStudents = async (
  tutorId: string,
  filters: FilterQuery<typeof Student> = {},
  options: {
    page?: number;
    limit?: number;
    search?: string;
    populate?: boolean;
  } = {}
) => {
  // First get all batches for this tutor
  const tutorBatches = await Batch.find({
    tutorId,
    isDeleted: false,
  }).select("_id");

  const tutorBatchIds = tutorBatches.map(batch => batch._id);

  const tutorFilters = {
    ...filters,
    $or: [
      { batchId: { $in: tutorBatchIds } },
      { batchId: { $exists: false } }, // Students not assigned to any batch yet
    ],
  };

  return await getAllStudents(tutorFilters, options);
};

// Get student by ID with optional population
export const getStudentById = async (id: string, populate = true) => {
  const query = Student.findById(id).where({ isDeleted: false });
  
  if (populate) {
    query.populate("batchId", "name academicYear");
  }
  
  return await query.exec();
};

// Update student
export const updateStudent = async (id: string, data: StudentUpdate, populate = true) => {
  const student = await Student.findByIdAndUpdate(
    id,
    { ...data, updatedAt: new Date() },
    { new: true }
  ).where({ isDeleted: false });

  if (populate && student) {
    return await student.populate("batchId", "name academicYear");
  }

  return student;
};

// Soft delete student
export const softDeleteStudent = async (id: string) => {
  return await Student.findByIdAndUpdate(
    id,
    { isDeleted: true, updatedAt: new Date() },
    { new: true }
  );
};

// Add weakness to student
export const addWeakness = async (studentId: string, weakness: string) => {
  const student = await Student.findByIdAndUpdate(
    studentId,
    { $addToSet: { weaknesses: weakness } },
    { new: true }
  ).where({ isDeleted: false }).populate("batchId", "name academicYear");

  return student;
};

// Remove weakness from student
export const removeWeakness = async (studentId: string, weakness: string) => {
  const student = await Student.findByIdAndUpdate(
    studentId,
    { $pull: { weaknesses: weakness } },
    { new: true }
  ).where({ isDeleted: false }).populate("batchId", "name academicYear");

  return student;
};

// Get unassigned students for a tutor
export const getUnassignedStudents = async (
  tutorId: string,
  options: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}
) => {
  // Get all batches for this tutor
  const tutorBatches = await Batch.find({
    tutorId,
    isDeleted: false,
  }).select("_id");

  const tutorBatchIds = tutorBatches.map(batch => batch._id);

  const filters = {
    $or: [
      { batchId: { $nin: tutorBatchIds } },
      { batchId: { $exists: false } },
    ],
  };

  return await getAllStudents(filters, options);
};

// Get student statistics
export const getStudentStats = async (tutorId?: string): Promise<StudentStats> => {
  let matchStage: any = { isDeleted: false };
  
  if (tutorId) {
    // Get all batches for this tutor
    const tutorBatches = await Batch.find({
      tutorId,
      isDeleted: false,
    }).select("_id");

    const tutorBatchIds = tutorBatches.map(batch => batch._id);

    matchStage.$or = [
      { batchId: { $in: tutorBatchIds } },
      { batchId: { $exists: false } },
    ];
  }

  const stats = await Student.aggregate([
    { $match: matchStage },
    {
      $facet: {
        totalStudents: [{ $count: "count" }],
        assignedStudents: [
          { $match: { batchId: { $exists: true, $ne: null } } },
          { $count: "count" }
        ],
        unassignedStudents: [
          { $match: { $or: [{ batchId: { $exists: false } }, { batchId: null }] } },
          { $count: "count" }
        ],
        studentsByBoard: [
          { $group: { _id: "$board", count: { $sum: 1 } } },
          { $sort: { _id: 1 } }
        ],
        studentsByClassLevel: [
          { $group: { _id: "$classLevel", count: { $sum: 1 } } },
          { $sort: { _id: 1 } }
        ],
        recentAdmissions: [
          { $match: { admissionDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
          { $count: "count" }
        ]
      }
    }
  ]);

  const result = stats[0];
  
  return {
    totalStudents: result.totalStudents[0]?.count || 0,
    assignedStudents: result.assignedStudents[0]?.count || 0,
    unassignedStudents: result.unassignedStudents[0]?.count || 0,
    studentsByBoard: result.studentsByBoard.map((item: any) => ({
      board: item._id || "Unknown",
      count: item.count
    })),
    studentsByClassLevel: result.studentsByClassLevel.map((item: any) => ({
      classLevel: item._id || "Unknown",
      count: item.count
    })),
    recentAdmissions: result.recentAdmissions[0]?.count || 0
  };
};

// Check if student name exists
export const checkStudentNameExists = async (name: string, excludeId?: string) => {
  const filter: any = { name, isDeleted: false };
  if (excludeId) {
    filter._id = { $ne: excludeId };
  }
  return await Student.exists(filter);
};
