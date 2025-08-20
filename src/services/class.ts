import { Class } from "../models/class";
import { Subject } from "../models/subject";
import { User } from "../models/user";
import { Student } from "../models/student";
import { ClassBase, ClassUpdate, ClassQuery, ClassStats, PopulatedClassDocument } from "../types/class";
import { AppError } from "../utils/appError";
import { validateObjectId } from "../utils/validate";

export class ClassService {
  // Create a new class
  static async createClass(data: ClassBase, userId: string): Promise<PopulatedClassDocument> {
    // Validate subject IDs
    if (data.subjects && data.subjects.length > 0) {
      for (const subjectId of data.subjects) {
        if (!validateObjectId(subjectId)) {
          throw new AppError("Invalid subject ID", 400);
        }
        const subject = await Subject.findById(subjectId);
        if (!subject) {
          throw new AppError(`Subject with ID ${subjectId} not found`, 404);
        }
      }
    }

    // Validate teacher IDs
    if (data.assignedTeachers && data.assignedTeachers.length > 0) {
      for (const teacherId of data.assignedTeachers) {
        if (!validateObjectId(teacherId)) {
          throw new AppError("Invalid teacher ID", 400);
        }
        const teacher = await User.findById(teacherId);
        if (!teacher) {
          throw new AppError(`Teacher with ID ${teacherId} not found`, 404);
        }
        if (!["admin", "teacher"].includes(teacher.role)) {
          throw new AppError(`User with ID ${teacherId} is not a teacher`, 400);
        }
      }
    }

    const classData = {
      ...data,
      createdBy: userId,
      updatedBy: userId,
    };

    const newClass = await Class.create(classData);
    return await this.getClassById(newClass._id.toString());
  }

  // Get all classes with pagination and filters
  static async getClasses(query: ClassQuery, userId: string, userRole: string): Promise<{
    classes: PopulatedClassDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10, search, gradeLevel, isActive, assignedTeacher } = query;
    const skip = (page - 1) * limit;

    // Build filter conditions
    const filter: any = { isDeleted: false };

    // Role-based filtering
    if (userRole === "teacher") {
      filter.assignedTeachers = userId;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { gradeLevel: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (gradeLevel) {
      filter.gradeLevel = gradeLevel;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    if (assignedTeacher) {
      filter.assignedTeachers = assignedTeacher;
    }

    const [classes, total] = await Promise.all([
      Class.find(filter)
        .populate("subjects", "name board classLevel")
        .populate("assignedTeachers", "name email role")
        .populate("createdBy", "name")
        .populate("updatedBy", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Class.countDocuments(filter),
    ]);

    return {
      classes: (classes as unknown) as PopulatedClassDocument[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Get class by ID
  static async getClassById(classId: string, userId?: string, userRole?: string): Promise<PopulatedClassDocument> {
    if (!validateObjectId(classId)) {
      throw new AppError("Invalid class ID", 400);
    }

    const filter: any = { _id: classId, isDeleted: false };

    // Role-based filtering
    if (userRole === "teacher" && userId) {
      filter.assignedTeachers = userId;
    }

    const classData = await Class.findOne(filter)
      .populate("subjects", "name board classLevel")
      .populate("assignedTeachers", "name email role")
      .populate("createdBy", "name")
      .populate("updatedBy", "name")
      .lean();

    if (!classData) {
      throw new AppError("Class not found", 404);
    }

    return (classData as unknown) as PopulatedClassDocument;
  }

  // Update class
  static async updateClass(classId: string, data: ClassUpdate, userId: string, userRole: string): Promise<PopulatedClassDocument> {
    if (!validateObjectId(classId)) {
      throw new AppError("Invalid class ID", 400);
    }

    // Check if class exists and user has permission
    const existingClass = await this.getClassById(classId, userId, userRole);

    // Validate subject IDs if provided
    if (data.subjects && data.subjects.length > 0) {
      for (const subjectId of data.subjects) {
        if (!validateObjectId(subjectId)) {
          throw new AppError("Invalid subject ID", 400);
        }
        const subject = await Subject.findById(subjectId);
        if (!subject) {
          throw new AppError(`Subject with ID ${subjectId} not found`, 404);
        }
      }
    }

    // Validate teacher IDs if provided
    if (data.assignedTeachers && data.assignedTeachers.length > 0) {
      for (const teacherId of data.assignedTeachers) {
        if (!validateObjectId(teacherId)) {
          throw new AppError("Invalid teacher ID", 400);
        }
        const teacher = await User.findById(teacherId);
        if (!teacher) {
          throw new AppError(`Teacher with ID ${teacherId} not found`, 404);
        }
        if (!["admin", "teacher"].includes(teacher.role)) {
          throw new AppError(`User with ID ${teacherId} is not a teacher`, 400);
        }
      }
    }

    const updateData = {
      ...data,
      updatedBy: userId,
    };

    const updatedClass = await Class.findByIdAndUpdate(
      classId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedClass) {
      throw new AppError("Class not found", 404);
    }

    return await this.getClassById(classId);
  }

  // Delete class (soft delete)
  static async deleteClass(classId: string, userId: string, userRole: string): Promise<void> {
    if (!validateObjectId(classId)) {
      throw new AppError("Invalid class ID", 400);
    }

    // Check if class exists and user has permission
    await this.getClassById(classId, userId, userRole);

    // Check if there are students assigned to this class
    const studentCount = await Student.countDocuments({ classId, isDeleted: false });
    if (studentCount > 0) {
      throw new AppError("Cannot delete class with assigned students. Please reassign students first.", 400);
    }

    await Class.findByIdAndUpdate(classId, {
      isDeleted: true,
      updatedBy: userId,
    });
  }

  // Get class statistics
  static async getClassStats(userId: string, userRole: string): Promise<ClassStats> {
    const filter: any = { isDeleted: false };

    // Role-based filtering
    if (userRole === "teacher") {
      filter.assignedTeachers = userId;
    }

    const [totalClasses, activeClasses, classesByGradeLevel] = await Promise.all([
      Class.countDocuments(filter),
      Class.countDocuments({ ...filter, isActive: true }),
      Class.aggregate([
        { $match: filter },
        {
          $group: {
            _id: "$gradeLevel",
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    // Get total students in classes
    const classIds = await Class.find(filter).distinct("_id");
    const totalStudents = await Student.countDocuments({
      classId: { $in: classIds },
      isDeleted: false,
    });

    const averageStudentsPerClass = totalClasses > 0 ? totalStudents / totalClasses : 0;

    return {
      totalClasses,
      activeClasses,
      totalStudents,
      averageStudentsPerClass: Math.round(averageStudentsPerClass * 100) / 100,
      classesByGradeLevel: classesByGradeLevel.map((item) => ({
        gradeLevel: item._id,
        count: item.count,
      })),
    };
  }

  // Get students in a class
  static async getClassStudents(classId: string, query: any, userId: string, userRole: string): Promise<{
    students: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    if (!validateObjectId(classId)) {
      throw new AppError("Invalid class ID", 400);
    }

    // Check if class exists and user has permission
    await this.getClassById(classId, userId, userRole);

    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    const filter: any = { classId, isDeleted: false };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { rollNumber: { $regex: search, $options: "i" } },
        { parentName: { $regex: search, $options: "i" } },
      ];
    }

    const [students, total] = await Promise.all([
      Student.find(filter)
        .populate("classId", "name gradeLevel")
        .populate("batchId", "name academicYear")
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Student.countDocuments(filter),
    ]);

    return {
      students,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
