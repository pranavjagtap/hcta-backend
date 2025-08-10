import { Performance } from "../models/performance";
import { Student } from "../models/student";
import { Subject } from "../models/subject";
import { Batch } from "../models/batch";
import { FilterQuery } from "mongoose";
import { 
  PerformanceBase, 
  PerformanceUpdate, 
  PerformanceStats, 
  StudentPerformanceSummary, 
  BatchPerformanceSummary, 
  PerformanceComparison, 
  PerformanceHeatmapData,
  PerformanceQuery
} from "../types/performance";

// Create a new performance record
export const createPerformance = async (data: PerformanceBase) => {
  const performance = new Performance(data);
  const savedPerformance = await performance.save();
  
  return await savedPerformance.populate([
    { 
      path: "studentId", 
      select: "name rollNumber",
      populate: { path: "batchId", select: "name" }
    },
    { path: "subjectId", select: "name board classLevel" },
  ]);
};

// Get all performance records with pagination, search, and population
export const getAllPerformances = async (
  filters: FilterQuery<typeof Performance> = {},
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
      { remarks: { $regex: search, $options: "i" } },
    ];
  }

  const query = Performance.find(filters);

  if (populate) {
    query.populate([
      { 
        path: "studentId", 
        select: "name rollNumber",
        populate: { path: "batchId", select: "name" }
      },
      { path: "subjectId", select: "name board classLevel" },
    ]);
  }

  // Apply pagination
  const skip = (page - 1) * limit;
  const performances = await query
    .skip(skip)
    .limit(limit)
    .sort({ date: -1, createdAt: -1 });

  // Get total count for pagination
  const total = await Performance.countDocuments(filters);

  return {
    performances,
    pagination: {
      current: page,
      pages: Math.ceil(total / limit),
      total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  };
};

// Get performances for a specific tutor (through students in batches)
export const getTutorPerformances = async (
  tutorId: string,
  filters: FilterQuery<typeof Performance> = {},
  options: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}
) => {
  // Get all batches by this tutor
  const tutorBatches = await Batch.find({
    tutorId,
    isDeleted: false,
  }).select("_id");

  const batchIds = tutorBatches.map(batch => batch._id);
  
  // Get all students in these batches
  const students = await Student.find({
    batchId: { $in: batchIds },
    isDeleted: false,
  }).select("_id");

  const studentIds = students.map(student => student._id);
  
  const tutorFilters = { 
    ...filters, 
    studentId: { $in: studentIds }, 
    isDeleted: false 
  };
  
  return await getAllPerformances(tutorFilters, options);
};

// Get performance by ID
export const getPerformanceById = async (id: string, tutorId?: string) => {
  const filters: any = { _id: id, isDeleted: false };
  
  if (tutorId) {
    // Get all batches by this tutor
    const tutorBatches = await Batch.find({
      tutorId,
      isDeleted: false,
    }).select("_id");

    const batchIds = tutorBatches.map(batch => batch._id);
    
    // Get all students in these batches
    const students = await Student.find({
      batchId: { $in: batchIds },
      isDeleted: false,
    }).select("_id");

    const studentIds = students.map(student => student._id);
    filters.studentId = { $in: studentIds };
  }

  const performance = await Performance.findOne(filters).populate([
    { 
      path: "studentId", 
      select: "name rollNumber",
      populate: { path: "batchId", select: "name" }
    },
    { path: "subjectId", select: "name board classLevel" },
  ]);

  return performance;
};

// Update performance
export const updatePerformance = async (id: string, data: PerformanceUpdate, tutorId?: string) => {
  const filters: any = { _id: id, isDeleted: false };
  
  if (tutorId) {
    // Get all batches by this tutor
    const tutorBatches = await Batch.find({
      tutorId,
      isDeleted: false,
    }).select("_id");

    const batchIds = tutorBatches.map(batch => batch._id);
    
    // Get all students in these batches
    const students = await Student.find({
      batchId: { $in: batchIds },
      isDeleted: false,
    }).select("_id");

    const studentIds = students.map(student => student._id);
    filters.studentId = { $in: studentIds };
  }

  const performance = await Performance.findOneAndUpdate(
    filters,
    { ...data, updatedAt: new Date() },
    { new: true }
  ).populate([
    { 
      path: "studentId", 
      select: "name rollNumber",
      populate: { path: "batchId", select: "name" }
    },
    { path: "subjectId", select: "name board classLevel" },
  ]);

  return performance;
};

// Soft delete performance
export const softDeletePerformance = async (id: string, tutorId?: string) => {
  const filters: any = { _id: id, isDeleted: false };
  
  if (tutorId) {
    // Get all batches by this tutor
    const tutorBatches = await Batch.find({
      tutorId,
      isDeleted: false,
    }).select("_id");

    const batchIds = tutorBatches.map(batch => batch._id);
    
    // Get all students in these batches
    const students = await Student.find({
      batchId: { $in: batchIds },
      isDeleted: false,
    }).select("_id");

    const studentIds = students.map(student => student._id);
    filters.studentId = { $in: studentIds };
  }

  const performance = await Performance.findOneAndUpdate(
    filters,
    { isDeleted: true, updatedAt: new Date() },
    { new: true }
  );

  return performance;
};

// Bulk create performance records
export const bulkCreatePerformances = async (performances: PerformanceBase[]) => {
  const performanceDocs = performances.map(data => new Performance(data));
  const savedPerformances = await Performance.insertMany(performanceDocs);
  
  // Populate the saved performances
  const populatedPerformances = await Performance.populate(savedPerformances, [
    { 
      path: "studentId", 
      select: "name rollNumber",
      populate: { path: "batchId", select: "name" }
    },
    { path: "subjectId", select: "name board classLevel" },
  ]);

  return populatedPerformances;
};

// Get performances for a specific student
export const getStudentPerformances = async (studentId: string, filters: any = {}) => {
  const studentFilters = { 
    studentId, 
    isDeleted: false,
    ...filters
  };

  const performances = await Performance.find(studentFilters)
    .populate([
      { path: "subjectId", select: "name board classLevel" },
    ])
    .sort({ date: -1 });

  return performances;
};

// Get student performance summary
export const getStudentPerformanceSummary = async (studentId: string, startDate?: Date, endDate?: Date): Promise<StudentPerformanceSummary | null> => {
  const student = await Student.findById(studentId).populate("batchId", "name");
  if (!student) {
    return null;
  }

  const filters: any = { studentId, isDeleted: false };
  if (startDate || endDate) {
    filters.date = {};
    if (startDate) filters.date.$gte = startDate;
    if (endDate) filters.date.$lte = endDate;
  }

  // Get performance statistics
  const stats = await Performance.aggregate([
    { $match: filters },
    {
      $group: {
        _id: null,
        totalAssessments: { $sum: 1 },
        averageScore: { $avg: { $divide: ["$score", "$maxScore"] } },
        highestScore: { $max: { $divide: ["$score", "$maxScore"] } },
        lowestScore: { $min: { $divide: ["$score", "$maxScore"] } },
        passCount: { $sum: { $cond: [{ $gte: [{ $divide: ["$score", "$maxScore"] }, 0.4] }, 1, 0] } }
      }
    }
  ]);

  const performanceBySubject = await Performance.aggregate([
    { $match: filters },
    {
      $group: {
        _id: "$subjectId",
        count: { $sum: 1 },
        averageScore: { $avg: { $divide: ["$score", "$maxScore"] } },
        highestScore: { $max: { $divide: ["$score", "$maxScore"] } }
      }
    },
    {
      $lookup: {
        from: "subjects",
        localField: "_id",
        foreignField: "_id",
        as: "subject"
      }
    },
    { $unwind: "$subject" },
    {
      $project: {
        subjectId: "$_id",
        subjectName: "$subject.name",
        count: 1,
        averageScore: 1,
        highestScore: 1
      }
    },
    { $sort: { averageScore: -1 } }
  ]);

  const performanceByType = await Performance.aggregate([
    { $match: filters },
    {
      $group: {
        _id: "$assessmentType",
        count: { $sum: 1 },
        averageScore: { $avg: { $divide: ["$score", "$maxScore"] } }
      }
    },
    { $sort: { count: -1 } }
  ]);

  // Get recent assessments
  const recentAssessments = await Performance.find(filters)
    .populate("subjectId", "name")
    .sort({ date: -1 })
    .limit(10);

  const recentAssessmentsData = recentAssessments.map(perf => ({
    _id: perf._id.toString(),
    topic: perf.topic,
    subjectName: (perf.subjectId as any).name,
    score: perf.score,
    maxScore: perf.maxScore,
    assessmentType: perf.assessmentType,
    date: perf.date.toISOString(),
    percentage: Math.round((perf.score / perf.maxScore) * 100),
  }));

  // Calculate improvement areas (subjects with lowest scores)
  const improvementAreas = performanceBySubject
    .filter(subject => subject.averageScore < 0.6)
    .map(subject => ({
      subjectId: subject.subjectId,
      subjectName: subject.subjectName,
      averageScore: Math.round(subject.averageScore * 100),
      recommendation: subject.averageScore < 0.4 ? "Needs immediate attention" : "Requires improvement",
    }));

  const totalAssessments = stats[0]?.totalAssessments || 0;
  const averageScore = stats[0]?.averageScore || 0;
  const passRate = totalAssessments > 0 ? (stats[0]?.passCount / totalAssessments) * 100 : 0;

  return {
    studentId,
    studentName: student.name,
    totalAssessments,
    averageScore: Math.round(averageScore * 100),
    highestScore: Math.round((stats[0]?.highestScore || 0) * 100),
    lowestScore: Math.round((stats[0]?.lowestScore || 0) * 100),
    passRate: Math.round(passRate),
    performanceBySubject: performanceBySubject.map(subject => ({
      ...subject,
      averageScore: Math.round(subject.averageScore * 100),
      highestScore: Math.round(subject.highestScore * 100),
    })),
    performanceByType: performanceByType.map(type => ({
      ...type,
      averageScore: Math.round(type.averageScore * 100),
    })),
    recentAssessments: recentAssessmentsData,
    improvementAreas,
  };
};

// Get batch performance summary
export const getBatchPerformanceSummary = async (batchId: string, startDate?: Date, endDate?: Date): Promise<BatchPerformanceSummary | null> => {
  const batch = await Batch.findById(batchId);
  if (!batch) {
    return null;
  }

  // Get all students in the batch
  const students = await Student.find({ batchId, isDeleted: false }).select("_id name");
  const studentIds = students.map(student => student._id);

  const filters: any = { 
    studentId: { $in: studentIds }, 
    isDeleted: false 
  };
  if (startDate || endDate) {
    filters.date = {};
    if (startDate) filters.date.$gte = startDate;
    if (endDate) filters.date.$lte = endDate;
  }

  // Get performance statistics
  const stats = await Performance.aggregate([
    { $match: filters },
    {
      $group: {
        _id: null,
        totalAssessments: { $sum: 1 },
        averageScore: { $avg: { $divide: ["$score", "$maxScore"] } },
        highestScore: { $max: { $divide: ["$score", "$maxScore"] } },
        lowestScore: { $min: { $divide: ["$score", "$maxScore"] } },
        passCount: { $sum: { $cond: [{ $gte: [{ $divide: ["$score", "$maxScore"] }, 0.4] }, 1, 0] } }
      }
    }
  ]);

  // Get top performers
  const topPerformers = await Performance.aggregate([
    { $match: filters },
    {
      $group: {
        _id: "$studentId",
        averageScore: { $avg: { $divide: ["$score", "$maxScore"] } },
        totalAssessments: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: "students",
        localField: "_id",
        foreignField: "_id",
        as: "student"
      }
    },
    { $unwind: "$student" },
    {
      $project: {
        studentId: "$_id",
        studentName: "$student.name",
        averageScore: 1,
        totalAssessments: 1
      }
    },
    { $sort: { averageScore: -1 } },
    { $limit: 5 }
  ]);

  const performanceBySubject = await Performance.aggregate([
    { $match: filters },
    {
      $group: {
        _id: "$subjectId",
        averageScore: { $avg: { $divide: ["$score", "$maxScore"] } },
        totalAssessments: { $sum: 1 },
        passCount: { $sum: { $cond: [{ $gte: [{ $divide: ["$score", "$maxScore"] }, 0.4] }, 1, 0] } }
      }
    },
    {
      $lookup: {
        from: "subjects",
        localField: "_id",
        foreignField: "_id",
        as: "subject"
      }
    },
    { $unwind: "$subject" },
    {
      $project: {
        subjectId: "$_id",
        subjectName: "$subject.name",
        averageScore: 1,
        totalAssessments: 1,
        passRate: { $multiply: [{ $divide: ["$passCount", "$totalAssessments"] }, 100] }
      }
    },
    { $sort: { averageScore: -1 } }
  ]);

  const performanceByType = await Performance.aggregate([
    { $match: filters },
    {
      $group: {
        _id: "$assessmentType",
        count: { $sum: 1 },
        averageScore: { $avg: { $divide: ["$score", "$maxScore"] } }
      }
    },
    { $sort: { count: -1 } }
  ]);

  // Get recent trends (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentTrends = await Performance.aggregate([
    { 
      $match: { 
        ...filters, 
        date: { $gte: thirtyDaysAgo } 
      } 
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
        averageScore: { $avg: { $divide: ["$score", "$maxScore"] } },
        assessmentCount: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const totalAssessments = stats[0]?.totalAssessments || 0;
  const averageScore = stats[0]?.averageScore || 0;
  const passRate = totalAssessments > 0 ? (stats[0]?.passCount / totalAssessments) * 100 : 0;

  return {
    batchId,
    batchName: batch.name,
    totalStudents: students.length,
    totalAssessments,
    averageScore: Math.round(averageScore * 100),
    highestScore: Math.round((stats[0]?.highestScore || 0) * 100),
    lowestScore: Math.round((stats[0]?.lowestScore || 0) * 100),
    passRate: Math.round(passRate),
    topPerformers: topPerformers.map(performer => ({
      ...performer,
      averageScore: Math.round(performer.averageScore * 100),
    })),
    performanceBySubject: performanceBySubject.map(subject => ({
      ...subject,
      averageScore: Math.round(subject.averageScore * 100),
      passRate: Math.round(subject.passRate),
    })),
    performanceByType: performanceByType.map(type => ({
      ...type,
      averageScore: Math.round(type.averageScore * 100),
    })),
    recentTrends: recentTrends.map(trend => ({
      date: trend._id,
      averageScore: Math.round(trend.averageScore * 100),
      assessmentCount: trend.assessmentCount,
    })),
  };
};

// Get performance comparison between two periods
export const getPerformanceComparison = async (
  studentId: string,
  currentStartDate: Date,
  currentEndDate: Date,
  previousStartDate: Date,
  previousEndDate: Date
): Promise<PerformanceComparison | null> => {
  const student = await Student.findById(studentId);
  if (!student) {
    return null;
  }

  // Get current period performance
  const currentStats = await Performance.aggregate([
    {
      $match: {
        studentId,
        date: { $gte: currentStartDate, $lte: currentEndDate },
        isDeleted: false
      }
    },
    {
      $group: {
        _id: null,
        averageScore: { $avg: { $divide: ["$score", "$maxScore"] } },
        totalAssessments: { $sum: 1 }
      }
    }
  ]);

  // Get previous period performance
  const previousStats = await Performance.aggregate([
    {
      $match: {
        studentId,
        date: { $gte: previousStartDate, $lte: previousEndDate },
        isDeleted: false
      }
    },
    {
      $group: {
        _id: null,
        averageScore: { $avg: { $divide: ["$score", "$maxScore"] } },
        totalAssessments: { $sum: 1 }
      }
    }
  ]);

  // Get subject-wise comparison
  const subjectComparison = await Performance.aggregate([
    {
      $match: {
        studentId,
        date: { $gte: previousStartDate, $lte: currentEndDate },
        isDeleted: false
      }
    },
    {
      $group: {
        _id: {
          subjectId: "$subjectId",
          period: {
            $cond: {
              if: { $and: [{ $gte: ["$date", currentStartDate] }, { $lte: ["$date", currentEndDate] }] },
              then: "current",
              else: "previous"
            }
          }
        },
        averageScore: { $avg: { $divide: ["$score", "$maxScore"] } }
      }
    },
    {
      $lookup: {
        from: "subjects",
        localField: "_id.subjectId",
        foreignField: "_id",
        as: "subject"
      }
    },
    { $unwind: "$subject" },
    {
      $group: {
        _id: "$_id.subjectId",
        subjectName: { $first: "$subject.name" },
        currentScore: {
          $avg: {
            $cond: [
              { $eq: ["$_id.period", "current"] },
              "$averageScore",
              null
            ]
          }
        },
        previousScore: {
          $avg: {
            $cond: [
              { $eq: ["$_id.period", "previous"] },
              "$averageScore",
              null
            ]
          }
        }
      }
    },
    {
      $project: {
        subjectId: "$_id",
        subjectName: 1,
        currentScore: { $ifNull: ["$currentScore", 0] },
        previousScore: { $ifNull: ["$previousScore", 0] },
        improvement: {
          $subtract: [
            { $ifNull: ["$currentScore", 0] },
            { $ifNull: ["$previousScore", 0] }
          ]
        }
      }
    }
  ]);

  const currentAverage = currentStats[0]?.averageScore || 0;
  const previousAverage = previousStats[0]?.averageScore || 0;
  const improvement = currentAverage - previousAverage;

  return {
    studentId,
    studentName: student.name,
    currentPeriod: {
      averageScore: Math.round(currentAverage * 100),
      totalAssessments: currentStats[0]?.totalAssessments || 0,
      improvement: Math.round(improvement * 100),
    },
    previousPeriod: {
      averageScore: Math.round(previousAverage * 100),
      totalAssessments: previousStats[0]?.totalAssessments || 0,
    },
    subjectComparison: subjectComparison.map(subject => ({
      ...subject,
      currentScore: Math.round(subject.currentScore * 100),
      previousScore: Math.round(subject.previousScore * 100),
      improvement: Math.round(subject.improvement * 100),
    })),
  };
};

// Get performance statistics
export const getPerformanceStats = async (
  tutorId: string,
  startDate?: Date,
  endDate?: Date,
  studentId?: string,
  subjectId?: string,
  assessmentType?: string
): Promise<PerformanceStats> => {
  // Get all batches by this tutor
  const tutorBatches = await Batch.find({
    tutorId,
    isDeleted: false,
  }).select("_id");

  const batchIds = tutorBatches.map(batch => batch._id);
  
  // Get all students in these batches
  const students = await Student.find({
    batchId: { $in: batchIds },
    isDeleted: false,
  }).select("_id");

  const studentIds = students.map(student => student._id);

  const filters: any = { 
    studentId: { $in: studentIds }, 
    isDeleted: false 
  };

  if (startDate || endDate) {
    filters.date = {};
    if (startDate) filters.date.$gte = startDate;
    if (endDate) filters.date.$lte = endDate;
  }

  if (studentId) {
    filters.studentId = studentId;
  }

  if (subjectId) {
    filters.subjectId = subjectId;
  }

  if (assessmentType) {
    filters.assessmentType = assessmentType;
  }

  const stats = await Performance.aggregate([
    { $match: filters },
    {
      $group: {
        _id: null,
        totalAssessments: { $sum: 1 },
        averageScore: { $avg: { $divide: ["$score", "$maxScore"] } },
        highestScore: { $max: { $divide: ["$score", "$maxScore"] } },
        lowestScore: { $min: { $divide: ["$score", "$maxScore"] } },
        passCount: { $sum: { $cond: [{ $gte: [{ $divide: ["$score", "$maxScore"] }, 0.4] }, 1, 0] } }
      }
    }
  ]);

  const performanceByType = await Performance.aggregate([
    { $match: filters },
    {
      $group: {
        _id: "$assessmentType",
        count: { $sum: 1 },
        averageScore: { $avg: { $divide: ["$score", "$maxScore"] } }
      }
    },
    { $sort: { count: -1 } }
  ]);

  const performanceBySubject = await Performance.aggregate([
    { $match: filters },
    {
      $group: {
        _id: "$subjectId",
        count: { $sum: 1 },
        averageScore: { $avg: { $divide: ["$score", "$maxScore"] } },
        highestScore: { $max: { $divide: ["$score", "$maxScore"] } }
      }
    },
    {
      $lookup: {
        from: "subjects",
        localField: "_id",
        foreignField: "_id",
        as: "subject"
      }
    },
    { $unwind: "$subject" },
    {
      $project: {
        subjectId: "$_id",
        subjectName: "$subject.name",
        count: 1,
        averageScore: 1,
        highestScore: 1
      }
    },
    { $sort: { averageScore: -1 } }
  ]);

  // Get recent performance (last 7 days)
  const recentPerformance = await Performance.countDocuments({
    ...filters,
    date: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
  });

  // Calculate improvement trend (compare last 30 days vs previous 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

  const recentTrend = await Performance.aggregate([
    {
      $match: {
        ...filters,
        date: { $gte: thirtyDaysAgo }
      }
    },
    {
      $group: {
        _id: null,
        averageScore: { $avg: { $divide: ["$score", "$maxScore"] } }
      }
    }
  ]);

  const previousTrend = await Performance.aggregate([
    {
      $match: {
        ...filters,
        date: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
      }
    },
    {
      $group: {
        _id: null,
        averageScore: { $avg: { $divide: ["$score", "$maxScore"] } }
      }
    }
  ]);

  const recentAverage = recentTrend[0]?.averageScore || 0;
  const previousAverage = previousTrend[0]?.averageScore || 0;
  const improvementTrend = recentAverage - previousAverage;

  const totalAssessments = stats[0]?.totalAssessments || 0;
  const averageScore = stats[0]?.averageScore || 0;
  const passRate = totalAssessments > 0 ? (stats[0]?.passCount / totalAssessments) * 100 : 0;

  return {
    totalAssessments,
    averageScore: Math.round(averageScore * 100),
    highestScore: Math.round((stats[0]?.highestScore || 0) * 100),
    lowestScore: Math.round((stats[0]?.lowestScore || 0) * 100),
    passRate: Math.round(passRate),
    performanceByType: performanceByType.map(type => ({
      type: type._id,
      count: type.count,
      averageScore: Math.round(type.averageScore * 100),
    })),
    performanceBySubject: performanceBySubject.map(subject => ({
      subjectId: subject.subjectId,
      subjectName: subject.subjectName,
      count: subject.count,
      averageScore: Math.round(subject.averageScore * 100),
      highestScore: Math.round(subject.highestScore * 100),
    })),
    recentPerformance,
    improvementTrend: Math.round(improvementTrend * 100),
  };
};

// Get performance heatmap data
export const getPerformanceHeatmapData = async (
  batchId: string,
  subjectIds?: string[],
  startDate?: Date,
  endDate?: Date
): Promise<PerformanceHeatmapData[]> => {
  const batch = await Batch.findById(batchId);
  if (!batch) {
    return [];
  }

  // Get all students in the batch
  const students = await Student.find({ batchId, isDeleted: false }).select("_id name");
  const studentIds = students.map(student => student._id);

  const filters: any = { 
    studentId: { $in: studentIds }, 
    isDeleted: false 
  };

  if (startDate || endDate) {
    filters.date = {};
    if (startDate) filters.date.$gte = startDate;
    if (endDate) filters.date.$lte = endDate;
  }

  if (subjectIds && subjectIds.length > 0) {
    filters.subjectId = { $in: subjectIds };
  }

  // Get performance data for each student
  const performanceData = await Performance.aggregate([
    { $match: filters },
    {
      $group: {
        _id: {
          studentId: "$studentId",
          subjectId: "$subjectId"
        },
        averageScore: { $avg: { $divide: ["$score", "$maxScore"] } }
      }
    },
    {
      $lookup: {
        from: "subjects",
        localField: "_id.subjectId",
        foreignField: "_id",
        as: "subject"
      }
    },
    { $unwind: "$subject" },
    {
      $group: {
        _id: "$_id.studentId",
        subjectPerformance: {
          $push: {
            subjectId: "$_id.subjectId",
            subjectName: "$subject.name",
            averageScore: "$averageScore"
          }
        },
        overallAverage: { $avg: "$averageScore" }
      }
    },
    {
      $lookup: {
        from: "students",
        localField: "_id",
        foreignField: "_id",
        as: "student"
      }
    },
    { $unwind: "$student" },
    {
      $project: {
        studentId: "$_id",
        studentName: "$student.name",
        subjectPerformance: 1,
        overallAverage: 1
      }
    }
  ]);

  // Add color coding for heatmap visualization
  return performanceData.map(data => ({
    studentId: data.studentId,
    studentName: data.studentName,
    subjectPerformance: data.subjectPerformance.map(subject => ({
      ...subject,
      averageScore: Math.round(subject.averageScore * 100),
      color: subject.averageScore >= 0.8 ? "#22c55e" : 
             subject.averageScore >= 0.6 ? "#eab308" : 
             subject.averageScore >= 0.4 ? "#f97316" : "#ef4444"
    })),
    overallAverage: Math.round(data.overallAverage * 100),
  }));
};

// Check if student exists and belongs to tutor's batches
export const checkStudentAccess = async (studentId: string, tutorId: string) => {
  const student = await Student.findOne({
    _id: studentId,
    isDeleted: false,
  }).populate("batchId", "tutorId");

  if (!student || (student.batchId as any).tutorId.toString() !== tutorId) {
    return null;
  }

  return student;
};

// Check if subject exists
export const checkSubjectExists = async (subjectId: string) => {
  const subject = await Subject.findById(subjectId).where({ isDeleted: false });
  return subject;
};


