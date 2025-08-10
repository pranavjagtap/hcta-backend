import { Batch } from "../models/batch";
import { Student } from "../models/student";
import Subject from "../models/subject";
import { FilterQuery } from "mongoose";
import { BatchBase, BatchUpdate, BatchStats, BatchQuery } from "../types/batch";

// Create a new batch
export const createBatch = async (data: BatchBase) => {
  const batch = new Batch(data);
  const savedBatch = await batch.save();
  return await savedBatch.populate([
    { path: "subjectIds", select: "name board classLevel" },
    { path: "tutorId", select: "name email" },
  ]);
};

// Get all batches with pagination, search, and population
export const getAllBatches = async (
  filters: FilterQuery<typeof Batch> = {},
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
      { academicYear: { $regex: search, $options: "i" } },
      { location: { $regex: search, $options: "i" } },
    ];
  }

  const query = Batch.find(finalFilters);

  if (populate) {
    query.populate([
      { path: "subjectIds", select: "name board classLevel" },
      { path: "studentIds", select: "name rollNumber" },
      { path: "tutorId", select: "name email" },
    ]);
  }

  // Apply pagination
  const skip = (page - 1) * limit;
  const batches = await query
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  // Get total count for pagination
  const total = await Batch.countDocuments(finalFilters);

  return {
    batches,
    pagination: {
      current: page,
      pages: Math.ceil(total / limit),
      total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  };
};

// Get batch by ID with optional population
export const getBatchById = async (id: string, populate = true) => {
  const query = Batch.findById(id).where({ isDeleted: false });
  
  if (populate) {
    query.populate([
      { path: "subjectIds", select: "name board classLevel" },
      { path: "studentIds", select: "name rollNumber parentName whatsappNumber" },
      { path: "tutorId", select: "name email" },
    ]);
  }
  
  return await query.exec();
};

// Update batch
export const updateBatch = async (id: string, data: BatchUpdate, populate = true) => {
  const batch = await Batch.findByIdAndUpdate(
    id,
    { ...data, updatedAt: new Date() },
    { new: true }
  ).where({ isDeleted: false });

  if (populate && batch) {
    return await batch.populate([
      { path: "subjectIds", select: "name board classLevel" },
      { path: "studentIds", select: "name rollNumber" },
      { path: "tutorId", select: "name email" },
    ]);
  }

  return batch;
};

// Soft delete batch
export const softDeleteBatch = async (id: string) => {
  return await Batch.findByIdAndUpdate(
    id,
    { isDeleted: true, updatedAt: new Date() },
    { new: true }
  );
};

// Add students to batch
export const addStudentsToBatch = async (batchId: string, studentIds: string[]) => {
  // Validate that students exist
  const existingStudents = await Student.find({ _id: { $in: studentIds }, isDeleted: false });
  if (existingStudents.length !== studentIds.length) {
    throw new Error("One or more students not found");
  }

  const batch = await Batch.findByIdAndUpdate(
    batchId,
    { $addToSet: { studentIds: { $each: studentIds } } },
    { new: true }
  ).where({ isDeleted: false }).populate([
    { path: "subjectIds", select: "name board classLevel" },
    { path: "studentIds", select: "name rollNumber" },
    { path: "tutorId", select: "name email" },
  ]);

  return batch;
};

// Remove student from batch
export const removeStudentFromBatch = async (batchId: string, studentId: string) => {
  const batch = await Batch.findByIdAndUpdate(
    batchId,
    { $pull: { studentIds: studentId } },
    { new: true }
  ).where({ isDeleted: false }).populate([
    { path: "subjectIds", select: "name board classLevel" },
    { path: "studentIds", select: "name rollNumber" },
    { path: "tutorId", select: "name email" },
  ]);

  return batch;
};

// Get batch statistics
export const getBatchStats = async (tutorId?: string): Promise<BatchStats> => {
  const matchStage: any = { isDeleted: false };
  if (tutorId) {
    matchStage.tutorId = tutorId;
  }

  const stats = await Batch.aggregate([
    { $match: matchStage },
    {
      $facet: {
        totalBatches: [{ $count: "count" }],
        activeBatches: [{ $match: { isActive: true } }, { $count: "count" }],
        totalStudents: [
          { $unwind: "$studentIds" },
          { $group: { _id: null, count: { $sum: 1 } } }
        ],
        averageStudentsPerBatch: [
          { $addFields: { studentCount: { $size: "$studentIds" } } },
          { $group: { _id: null, avg: { $avg: "$studentCount" } } }
        ],
        batchesByAcademicYear: [
          { $group: { _id: "$academicYear", count: { $sum: 1 } } },
          { $sort: { _id: 1 } }
        ]
      }
    }
  ]);

  const result = stats[0];
  
  return {
    totalBatches: result.totalBatches[0]?.count || 0,
    activeBatches: result.activeBatches[0]?.count || 0,
    totalStudents: result.totalStudents[0]?.count || 0,
    averageStudentsPerBatch: Math.round((result.averageStudentsPerBatch[0]?.avg || 0) * 100) / 100,
    batchesByAcademicYear: result.batchesByAcademicYear.map((item: any) => ({
      academicYear: item._id || "Unknown",
      count: item.count
    }))
  };
};

// Check if batch name exists for tutor
export const checkBatchNameExists = async (name: string, tutorId: string, excludeId?: string) => {
  const filter: any = { name, tutorId, isDeleted: false };
  if (excludeId) {
    filter._id = { $ne: excludeId };
  }
  return await Batch.exists(filter);
};
