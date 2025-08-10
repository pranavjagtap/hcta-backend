import { Subject } from "../models/subject";
import { FilterQuery } from "mongoose";
import { SubjectBase, SubjectUpdate, SubjectStats, CurriculumStructure } from "../types/subject";

// Create a new subject
export const createSubject = async (data: SubjectBase) => {
  const subject = new Subject(data);
  return await subject.save();
};

// Get all subjects with pagination, search, and filtering
export const getAllSubjects = async (
  filters: FilterQuery<typeof Subject> = {},
  options: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}
) => {
  const { page = 1, limit = 10, search } = options;

  // Build search filter
  if (search) {
    filters.$or = [
      { name: { $regex: search, $options: "i" } },
      { syllabusCode: { $regex: search, $options: "i" } },
    ];
  }

  const query = Subject.find(filters);

  // Apply pagination
  const skip = (page - 1) * limit;
  const subjects = await query
    .skip(skip)
    .limit(limit)
    .sort({ name: 1 });

  // Get total count for pagination
  const total = await Subject.countDocuments(filters);

  return {
    subjects,
    pagination: {
      current: page,
      pages: Math.ceil(total / limit),
      total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  };
};

// Get subject by ID
export const getSubjectById = async (id: string) => {
  return await Subject.findById(id);
};

// Update subject
export const updateSubject = async (id: string, data: SubjectUpdate) => {
  return await Subject.findByIdAndUpdate(
    id,
    { ...data, updatedAt: new Date() },
    { new: true }
  );
};

// Delete subject
export const deleteSubject = async (id: string) => {
  return await Subject.findByIdAndDelete(id);
};

// Add topic to subject
export const addTopic = async (subjectId: string, topic: string) => {
  return await Subject.findByIdAndUpdate(
    subjectId,
    { $addToSet: { topics: topic } },
    { new: true }
  );
};

// Remove topic from subject
export const removeTopic = async (subjectId: string, topic: string) => {
  return await Subject.findByIdAndUpdate(
    subjectId,
    { $pull: { topics: topic } },
    { new: true }
  );
};

// Get subjects by board and class level
export const getSubjectsByBoardAndClass = async (board: string, classLevel: string) => {
  return await Subject.find({
    board,
    classLevel,
  }).sort({ name: 1 });
};

// Get curriculum structure
export const getCurriculumStructure = async (): Promise<CurriculumStructure[]> => {
  const subjects = await Subject.find({}).sort({ board: 1, classLevel: 1, name: 1 });

  const structureMap = new Map<string, Map<string, any[]>>();

  subjects.forEach(subject => {
    const board = subject.board || "Unknown";
    const classLevel = subject.classLevel || "Unknown";

    if (!structureMap.has(board)) {
      structureMap.set(board, new Map());
    }

    const boardMap = structureMap.get(board)!;
    if (!boardMap.has(classLevel)) {
      boardMap.set(classLevel, []);
    }

    boardMap.get(classLevel)!.push({
      _id: subject._id,
      name: subject.name,
      isElective: subject.isElective || false,
      topicCount: subject.topics?.length || 0,
    });
  });

  return Array.from(structureMap.entries()).map(([board, classLevels]) => ({
    board,
    classLevels: Array.from(classLevels.entries()).map(([classLevel, subjects]) => ({
      classLevel,
      subjects,
    })),
  }));
};

// Get subject statistics
export const getSubjectStats = async (): Promise<SubjectStats> => {
  const stats = await Subject.aggregate([
    {
      $facet: {
        totalSubjects: [{ $count: "count" }],
        subjectsByBoard: [
          { $group: { _id: "$board", count: { $sum: 1 } } },
          { $sort: { _id: 1 } }
        ],
        subjectsByClassLevel: [
          { $group: { _id: "$classLevel", count: { $sum: 1 } } },
          { $sort: { _id: 1 } }
        ],
        electiveSubjects: [
          { $match: { isElective: true } },
          { $count: "count" }
        ],
        coreSubjects: [
          { $match: { isElective: false } },
          { $count: "count" }
        ],
        averageTopicsPerSubject: [
          { $addFields: { topicCount: { $size: "$topics" } } },
          { $group: { _id: null, avg: { $avg: "$topicCount" } } }
        ]
      }
    }
  ]);

  const result = stats[0];
  
  return {
    totalSubjects: result.totalSubjects[0]?.count || 0,
    subjectsByBoard: result.subjectsByBoard.map((item: any) => ({
      board: item._id || "Unknown",
      count: item.count
    })),
    subjectsByClassLevel: result.subjectsByClassLevel.map((item: any) => ({
      classLevel: item._id || "Unknown",
      count: item.count
    })),
    electiveSubjects: result.electiveSubjects[0]?.count || 0,
    coreSubjects: result.coreSubjects[0]?.count || 0,
    averageTopicsPerSubject: Math.round((result.averageTopicsPerSubject[0]?.avg || 0) * 100) / 100
  };
};

// Check if subject name exists
export const checkSubjectNameExists = async (name: string, excludeId?: string) => {
  const filter: any = { name };
  if (excludeId) {
    filter._id = { $ne: excludeId };
  }
  return await Subject.exists(filter);
};
