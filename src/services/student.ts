import { Student } from "../models/student";
import { Class } from "../models/class";
import { Batch } from "../models/batch";
import { FilterQuery } from "mongoose";
import { StudentBase, StudentUpdate, StudentStats, StudentQuery, PopulatedStudentDocument } from "../types/student";
import { AppError } from "../utils/appError";
import { validateObjectId } from "../utils/validate";
import { uploadToS3, deleteFromS3 } from "../middlewares/fileUpload";

// Create a new student
export const createStudent = async (data: StudentBase, profilePictureFile?: Express.Multer.File): Promise<PopulatedStudentDocument> => {
  // Validate class ID if provided
  if (data.classId) {
    if (!validateObjectId(data.classId)) {
      throw new AppError("Invalid class ID", 400);
    }
    const classExists = await Class.findById(data.classId);
    if (!classExists) {
      throw new AppError("Class not found", 404);
    }
  }

  // Validate batch ID if provided
  if (data.batchId) {
    if (!validateObjectId(data.batchId)) {
      throw new AppError("Invalid batch ID", 400);
    }
    const batchExists = await Batch.findById(data.batchId);
    if (!batchExists) {
      throw new AppError("Batch not found", 404);
    }
  }

  // Check if roll number already exists
  const existingStudent = await Student.findOne({ rollNumber: data.rollNumber, isDeleted: false });
  if (existingStudent) {
    throw new AppError("Student with this roll number already exists", 400);
  }

  // Handle profile picture upload
  let profilePicture = undefined;
  if (profilePictureFile) {
    const useS3 = process.env.USE_S3_STORAGE === "true";

    if (useS3) {
      profilePicture = await uploadToS3(profilePictureFile, "student-profiles");
    } else {
      profilePicture = {
        url: `/uploads/${profilePictureFile.filename}`,
        key: profilePictureFile.filename,
      };
    }
  }

  const studentData = {
    ...data,
    profilePicture,
  };

  const student = new Student(studentData);
  const savedStudent = await student.save();

  // Add student to batch if batchId provided
  if (data.batchId) {
    await Batch.findByIdAndUpdate(data.batchId, {
      $addToSet: { studentIds: savedStudent._id },
    });
  }

  return await getStudentById(savedStudent._id.toString());
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
export const getStudentById = async (id: string, populate = true): Promise<PopulatedStudentDocument> => {
  if (!validateObjectId(id)) {
    throw new AppError("Invalid student ID", 400);
  }

  const query = Student.findById(id).where({ isDeleted: false });

  if (populate) {
    query.populate("classId", "name gradeLevel")
      .populate("batchId", "name academicYear");
  }

  const student = await query.exec();

  if (!student) {
    throw new AppError("Student not found", 404);
  }

  return student as PopulatedStudentDocument;
};

// Update student
export const updateStudent = async (id: string, data: StudentUpdate, profilePictureFile?: Express.Multer.File, populate = true): Promise<PopulatedStudentDocument> => {
  if (!validateObjectId(id)) {
    throw new AppError("Invalid student ID", 400);
  }

  // Check if student exists
  const existingStudent = await Student.findById(id).where({ isDeleted: false });
  if (!existingStudent) {
    throw new AppError("Student not found", 404);
  }

  // Validate class ID if provided
  if (data.classId) {
    if (!validateObjectId(data.classId)) {
      throw new AppError("Invalid class ID", 400);
    }
    const classExists = await Class.findById(data.classId);
    if (!classExists) {
      throw new AppError("Class not found", 404);
    }
  }

  // Validate batch ID if provided
  if (data.batchId) {
    if (!validateObjectId(data.batchId)) {
      throw new AppError("Invalid batch ID", 400);
    }
    const batchExists = await Batch.findById(data.batchId);
    if (!batchExists) {
      throw new AppError("Batch not found", 404);
    }
  }

  // Check if roll number already exists (if being updated)
  if (data.rollNumber && data.rollNumber !== existingStudent.rollNumber) {
    const duplicateStudent = await Student.findOne({ rollNumber: data.rollNumber, isDeleted: false, _id: { $ne: id } });
    if (duplicateStudent) {
      throw new AppError("Student with this roll number already exists", 400);
    }
  }

  // Handle profile picture upload
  let profilePicture = existingStudent.profilePicture;
  if (profilePictureFile) {
    // Delete old profile picture if exists
    if (existingStudent.profilePicture?.key) {
      const useS3 = process.env.USE_S3_STORAGE === "true";
      if (useS3) {
        await deleteFromS3(existingStudent.profilePicture.key);
      }
    }

    const useS3 = process.env.USE_S3_STORAGE === "true";

    if (useS3) {
      profilePicture = await uploadToS3(profilePictureFile, "student-profiles");
    } else {
      profilePicture = {
        url: `/uploads/${profilePictureFile.filename}`,
        key: profilePictureFile.filename,
      };
    }
  }

  const updateData = {
    ...data,
    profilePicture,
    updatedAt: new Date(),
  };

  const student = await Student.findByIdAndUpdate(
    id,
    updateData,
    { new: true }
  ).where({ isDeleted: false });

  if (populate && student) {
    await student.populate([
      { path: "classId", select: "name gradeLevel" },
      { path: "batchId", select: "name academicYear" },
    ]);
    return student as PopulatedStudentDocument;
  }

  return student as PopulatedStudentDocument;
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

// Bulk upload students from CSV
export const bulkUploadStudents = async (studentsData: StudentBase[]): Promise<{
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
}> => {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as Array<{ row: number; error: string }>,
  };

  for (let i = 0; i < studentsData.length; i++) {
    try {
      const studentData = studentsData[i];

      // Validate required fields
      if (!studentData.name || !studentData.rollNumber) {
        results.errors.push({ row: i + 1, error: "Name and roll number are required" });
        results.failed++;
        continue;
      }

      // Check if roll number already exists
      const existingStudent = await Student.findOne({ rollNumber: studentData.rollNumber, isDeleted: false });
      if (existingStudent) {
        results.errors.push({ row: i + 1, error: `Roll number ${studentData.rollNumber} already exists` });
        results.failed++;
        continue;
      }

      // Validate class ID if provided
      if (studentData.classId) {
        if (!validateObjectId(studentData.classId)) {
          results.errors.push({ row: i + 1, error: "Invalid class ID" });
          results.failed++;
          continue;
        }
        const classExists = await Class.findById(studentData.classId);
        if (!classExists) {
          results.errors.push({ row: i + 1, error: "Class not found" });
          results.failed++;
          continue;
        }
      }

      // Validate batch ID if provided
      if (studentData.batchId) {
        if (!validateObjectId(studentData.batchId)) {
          results.errors.push({ row: i + 1, error: "Invalid batch ID" });
          results.failed++;
          continue;
        }
        const batchExists = await Batch.findById(studentData.batchId);
        if (!batchExists) {
          results.errors.push({ row: i + 1, error: "Batch not found" });
          results.failed++;
          continue;
        }
      }

      // Create student
      const student = new Student(studentData);
      await student.save();

      // Add student to batch if batchId provided
      if (studentData.batchId) {
        await Batch.findByIdAndUpdate(studentData.batchId, {
          $addToSet: { studentIds: student._id },
        });
      }

      results.success++;
    } catch (error) {
      results.errors.push({ row: i + 1, error: error instanceof Error ? error.message : "Unknown error" });
      results.failed++;
    }
  }

  return results;
};
