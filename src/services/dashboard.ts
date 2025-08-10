import { Dashboard } from "../models/dashboard";
import { FilterQuery } from "mongoose";
import { DashboardBase, DashboardUpdate, DashboardQuery, DashboardData, AnalyticsData, BatchDashboardData } from "../types/dashboard";
import { Batch } from "../models/batch";
import { Student } from "../models/student";
import { Assignment } from "../models/assignment";
import { TeachingLog } from "../models/teachingLog";
import { Performance } from "../models/performance";
import { Note } from "../models/note";
import { Submission } from "../models/submission";

// Create dashboard data
export const createDashboard = async (data: DashboardBase) => {
  const dashboard = await Dashboard.create(data);
  return await Dashboard.findById(dashboard._id).populate([
    { path: "tutorId", select: "name email" },
    { path: "batchId", select: "name academicYear" },
  ]);
};

// Get dashboard by ID
export const getDashboardById = async (id: string, populate: boolean = true) => {
  const query = Dashboard.findById(id);
  
  if (populate) {
    query.populate([
      { path: "tutorId", select: "name email" },
      { path: "batchId", select: "name academicYear" },
    ]);
  }
  
  return await query;
};

// Get dashboard by tutor and optional batch
export const getDashboardByTutor = async (
  tutorId: string,
  batchId?: string,
  period: "day" | "week" | "month" | "quarter" | "year" = "month"
) => {
  const filter: FilterQuery<typeof Dashboard> = {
    tutorId,
    period,
    isDeleted: false,
  };

  if (batchId) {
    filter.batchId = batchId;
  }

  return await Dashboard.findOne(filter).populate([
    { path: "tutorId", select: "name email" },
    { path: "batchId", select: "name academicYear" },
  ]);
};

// Update dashboard
export const updateDashboard = async (
  id: string,
  data: DashboardUpdate,
  populate: boolean = true
) => {
  const dashboard = await Dashboard.findByIdAndUpdate(
    id,
    { ...data, lastUpdated: new Date() },
    { new: true }
  );

  if (populate && dashboard) {
    return await Dashboard.findById(dashboard._id).populate([
      { path: "tutorId", select: "name email" },
      { path: "batchId", select: "name academicYear" },
    ]);
  }

  return dashboard;
};

// Soft delete dashboard
export const softDeleteDashboard = async (id: string) => {
  return await Dashboard.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true }
  );
};

// Get all dashboards with pagination and filters
export const getAllDashboards = async (
  filters: FilterQuery<typeof Dashboard> = {},
  options: {
    page?: number;
    limit?: number;
    populate?: boolean;
  } = {}
) => {
  const { page = 1, limit = 10, populate = true } = options;
  
  const query = Dashboard.find({ ...filters, isDeleted: false });
  
  if (populate) {
    query.populate([
      { path: "tutorId", select: "name email" },
      { path: "batchId", select: "name academicYear" },
    ]);
  }

  const skip = (page - 1) * limit;
  const dashboards = await query
    .skip(skip)
    .limit(limit)
    .sort({ lastUpdated: -1 });

  const total = await Dashboard.countDocuments({ ...filters, isDeleted: false });

  return {
    dashboards,
    pagination: {
      current: page,
      pages: Math.ceil(total / limit),
      total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  };
};

// Generate teacher dashboard data
export const generateTeacherDashboardData = async (tutorId: string): Promise<DashboardData> => {
  // Get all batches for this tutor
  const batches = await Batch.find({
    tutorId,
    isDeleted: false,
  }).populate([
    { path: "subjectIds", select: "name board classLevel" },
    { path: "studentIds", select: "name rollNumber" },
  ]);

  const batchIds = batches.map(batch => batch._id);
  const studentIds = batches.reduce((acc, batch) => {
    acc.push(...batch.studentIds.map(s => s._id));
    return acc;
  }, []);

  // Get date ranges
  const today = new Date();
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  // Parallel data fetching
  const [
    todaySchedule,
    upcomingAssignments,
    recentSubmissions,
    weekTeachingLogs,
    monthlyStats,
    recentNotes,
    pendingSubmissions,
    studentPerformanceOverview,
  ] = await Promise.all([
    TeachingLog.find({
      batchId: { $in: batchIds },
      date: { $gte: startOfDay, $lte: endOfDay },
      isDeleted: false,
    })
      .populate([
        { path: "batchId", select: "name" },
        { path: "subjectId", select: "name" },
      ])
      .sort({ date: 1 }),

    Assignment.find({
      batchId: { $in: batchIds },
      dueDate: { $gte: today, $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      isDeleted: false,
    })
      .populate([
        { path: "batchId", select: "name" },
        { path: "subjectId", select: "name" },
      ])
      .sort({ dueDate: 1 })
      .limit(10),

    Submission.find({
      assignmentId: {
        $in: await Assignment.find({ batchId: { $in: batchIds } }).distinct("_id"),
      },
      submittedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      isDeleted: false,
    })
      .populate([
        { path: "studentId", select: "name rollNumber" },
        {
          path: "assignmentId",
          select: "topic type",
          populate: { path: "subjectId", select: "name" },
        },
      ])
      .sort({ submittedAt: -1 })
      .limit(10),

    TeachingLog.find({
      batchId: { $in: batchIds },
      date: { $gte: startOfWeek, $lte: endOfWeek },
      isDeleted: false,
    }),

    Promise.all([
      Student.countDocuments({
        batchId: { $in: batchIds },
        isDeleted: false,
      }),
      Assignment.countDocuments({
        batchId: { $in: batchIds },
        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        isDeleted: false,
      }),
      TeachingLog.countDocuments({
        batchId: { $in: batchIds },
        date: { $gte: startOfMonth, $lte: endOfMonth },
        status: "completed",
        isDeleted: false,
      }),
      Note.countDocuments({
        batchId: { $in: batchIds },
        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        isDeleted: false,
      }),
    ]),

    Note.find({
      batchId: { $in: batchIds },
      isDeleted: false,
    })
      .populate([
        { path: "batchId", select: "name" },
        { path: "subjectId", select: "name" },
      ])
      .sort({ createdAt: -1 })
      .limit(5),

    Assignment.aggregate([
      {
        $match: {
          batchId: { $in: batchIds },
          dueDate: { $lt: today },
          isDeleted: false,
        },
      },
      {
        $lookup: {
          from: "submissions",
          localField: "_id",
          foreignField: "assignmentId",
          as: "submissions",
        },
      },
      {
        $lookup: {
          from: "batches",
          localField: "batchId",
          foreignField: "_id",
          as: "batch",
        },
      },
      {
        $unwind: "$batch",
      },
      {
        $project: {
          topic: 1,
          type: 1,
          dueDate: 1,
          batchName: "$batch.name",
          totalStudents: { $size: "$batch.studentIds" },
          submittedCount: { $size: "$submissions" },
          pendingCount: {
            $subtract: [{ $size: "$batch.studentIds" }, { $size: "$submissions" }],
          },
        },
      },
      {
        $match: {
          pendingCount: { $gt: 0 },
        },
      },
      {
        $sort: { dueDate: 1 },
      },
      {
        $limit: 10,
      },
    ]),

    Performance.aggregate([
      {
        $match: {
          studentId: { $in: studentIds },
          date: { $gte: startOfMonth },
          isDeleted: false,
        },
      },
      {
        $lookup: {
          from: "students",
          localField: "studentId",
          foreignField: "_id",
          as: "student",
        },
      },
      {
        $unwind: "$student",
      },
      {
        $group: {
          _id: "$student.batchId",
          averageScore: { $avg: "$score" },
          totalAssessments: { $sum: 1 },
          studentsAssessed: { $addToSet: "$studentId" },
        },
      },
      {
        $lookup: {
          from: "batches",
          localField: "_id",
          foreignField: "_id",
          as: "batch",
        },
      },
      {
        $unwind: "$batch",
      },
      {
        $project: {
          batchName: "$batch.name",
          averageScore: { $round: ["$averageScore", 2] },
          totalAssessments: 1,
          studentsAssessedCount: { $size: "$studentsAssessed" },
        },
      },
    ]),
  ]);

  const [totalStudents, monthlyAssignments, monthlyTeachingSessions, monthlyNotes] = monthlyStats;

  const completedSessionsToday = todaySchedule.filter(log => log.status === "completed").length;
  const pendingSessionsToday = todaySchedule.filter(log => log.status === "pending").length;

  const weeklySessionsCompleted = weekTeachingLogs.filter(log => log.status === "completed").length;
  const weeklySessionsTotal = weekTeachingLogs.length;

  const batchSummary = batches.map(batch => ({
    _id: batch._id,
    name: batch.name,
    academicYear: batch.academicYear,
    totalStudents: batch.studentIds.length,
    totalSubjects: batch.subjectIds.length,
    subjects: batch.subjectIds.map(subject => subject.name),
  }));

  return {
    overview: {
      totalBatches: batches.length,
      totalStudents,
      monthlyAssignments,
      monthlyTeachingSessions,
      monthlyNotes,
    },
    today: {
      totalSessions: todaySchedule.length,
      completedSessions: completedSessionsToday,
      pendingSessions: pendingSessionsToday,
      schedule: todaySchedule,
    },
    thisWeek: {
      totalSessions: weeklySessionsTotal,
      completedSessions: weeklySessionsCompleted,
      completionRate: weeklySessionsTotal > 0 
        ? Math.round((weeklySessionsCompleted / weeklySessionsTotal) * 100) 
        : 0,
    },
    upcoming: {
      assignments: upcomingAssignments,
    },
    recent: {
      submissions: recentSubmissions,
      notes: recentNotes,
    },
    pending: {
      submissions: pendingSubmissions,
    },
    performance: {
      batchOverview: studentPerformanceOverview,
    },
    batches: batchSummary,
  };
};

// Generate batch dashboard data
export const generateBatchDashboardData = async (batchId: string, tutorId: string): Promise<BatchDashboardData> => {
  const batch = await Batch.findOne({
    _id: batchId,
    tutorId,
    isDeleted: false,
  }).populate([
    { path: "subjectIds", select: "name board classLevel topics" },
    { path: "studentIds", select: "name rollNumber parentName parentPhone" },
  ]);

  if (!batch) {
    throw new Error("Batch not found or access denied");
  }

  const studentIds = batch.studentIds.map(s => s._id);
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    recentTeachingLogs,
    upcomingAssignments,
    recentSubmissions,
    studentPerformances,
    recentNotes,
    attendanceStats,
  ] = await Promise.all([
    TeachingLog.find({
      batchId,
      isDeleted: false,
    })
      .populate("subjectId", "name")
      .sort({ date: -1 })
      .limit(10),

    Assignment.find({
      batchId,
      dueDate: { $gte: today },
      isDeleted: false,
    })
      .populate("subjectId", "name")
      .sort({ dueDate: 1 })
      .limit(5),

    Submission.find({
      assignmentId: {
        $in: await Assignment.find({ batchId }).distinct("_id"),
      },
      isDeleted: false,
    })
      .populate([
        { path: "studentId", select: "name rollNumber" },
        {
          path: "assignmentId",
          select: "topic type",
          populate: { path: "subjectId", select: "name" },
        },
      ])
      .sort({ submittedAt: -1 })
      .limit(10),

    Performance.find({
      studentId: { $in: studentIds },
      date: { $gte: startOfMonth },
      isDeleted: false,
    })
      .populate([
        { path: "studentId", select: "name rollNumber" },
        { path: "subjectId", select: "name" },
      ])
      .sort({ date: -1 })
      .limit(15),

    Note.find({
      batchId,
      isDeleted: false,
    })
      .populate("subjectId", "name")
      .sort({ createdAt: -1 })
      .limit(5),

    TeachingLog.aggregate([
      {
        $match: {
          batchId: batch._id,
          date: { $gte: startOfMonth },
          status: "completed",
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          totalDuration: { $sum: "$durationMinutes" },
        },
      },
    ]),
  ]);

  const performanceStats = {
    totalAssessments: studentPerformances.length,
    averageScore: studentPerformances.length > 0
      ? studentPerformances.reduce((sum, p) => sum + (p.score || 0), 0) / studentPerformances.length
      : 0,
    studentsAssessed: new Set(studentPerformances.map(p => p.studentId._id.toString())).size,
  };

  const studentPerformanceMap = studentPerformances.reduce((acc, perf) => {
    const studentId = perf.studentId._id.toString();
    if (!acc[studentId]) {
      acc[studentId] = {
        student: perf.studentId,
        performances: [],
        averageScore: 0,
      };
    }
    acc[studentId].performances.push(perf);
    return acc;
  }, {});

  Object.values(studentPerformanceMap).forEach((studentData: any) => {
    const scores = studentData.performances.map(p => p.score || 0);
    studentData.averageScore = scores.length > 0
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : 0;
  });

  return {
    batch: {
      _id: batch._id,
      name: batch.name,
      academicYear: batch.academicYear,
      totalStudents: batch.studentIds.length,
      totalSubjects: batch.subjectIds.length,
      subjects: batch.subjectIds,
      students: batch.studentIds,
    },
    recent: {
      teachingLogs: recentTeachingLogs,
      submissions: recentSubmissions,
      notes: recentNotes,
    },
    upcoming: {
      assignments: upcomingAssignments,
    },
    performance: {
      stats: performanceStats,
      studentPerformances: Object.values(studentPerformanceMap),
    },
    attendance: attendanceStats[0] || {
      totalSessions: 0,
      totalDuration: 0,
    },
    quickStats: {
      totalTeachingLogs: recentTeachingLogs.length,
      totalAssignments: upcomingAssignments.length,
      totalNotes: recentNotes.length,
      recentSubmissions: recentSubmissions.length,
    },
  };
};

// Generate analytics data
export const generateAnalyticsData = async (
  tutorId: string,
  period: "week" | "month" | "quarter" | "year" = "month",
  batchId?: string
): Promise<AnalyticsData> => {
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case "week":
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      break;
    case "quarter":
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 3);
      break;
    case "year":
      startDate = new Date(now);
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
  }

  let batchFilter: any = { tutorId, isDeleted: false };
  if (batchId) {
    batchFilter._id = batchId;
  }

  const batches = await Batch.find(batchFilter).select("_id");
  const batchIds = batches.map(b => b._id);

  const [
    teachingTrend,
    assignmentTrend,
    performanceTrend,
    submissionStats,
    subjectDistribution,
  ] = await Promise.all([
    TeachingLog.aggregate([
      {
        $match: {
          batchId: { $in: batchIds },
          date: { $gte: startDate },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            day: period === "week" ? { $dayOfMonth: "$date" } : undefined,
          },
          totalSessions: { $sum: 1 },
          completedSessions: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          totalDuration: { $sum: "$durationMinutes" },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 },
      },
    ]),

    Assignment.aggregate([
      {
        $match: {
          batchId: { $in: batchIds },
          createdAt: { $gte: startDate },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            type: "$type",
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]),

    Performance.aggregate([
      {
        $match: {
          date: { $gte: startDate },
          isDeleted: false,
        },
      },
      {
        $lookup: {
          from: "students",
          localField: "studentId",
          foreignField: "_id",
          as: "student",
        },
      },
      {
        $unwind: "$student",
      },
      {
        $match: {
          "student.batchId": { $in: batchIds },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
          },
          averageScore: { $avg: "$score" },
          totalAssessments: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]),

    Submission.aggregate([
      {
        $lookup: {
          from: "assignments",
          localField: "assignmentId",
          foreignField: "_id",
          as: "assignment",
        },
      },
      {
        $unwind: "$assignment",
      },
      {
        $match: {
          "assignment.batchId": { $in: batchIds },
          submittedAt: { $gte: startDate },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),

    TeachingLog.aggregate([
      {
        $match: {
          batchId: { $in: batchIds },
          date: { $gte: startDate },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: "$subjectId",
          sessionCount: { $sum: 1 },
          totalDuration: { $sum: "$durationMinutes" },
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
        $unwind: {
          path: "$subject",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          subjectName: { $ifNull: ["$subject.name", "General"] },
          sessionCount: 1,
          totalDuration: 1,
        },
      },
      {
        $sort: { sessionCount: -1 },
      },
    ]),
  ]);

  return {
    period,
    dateRange: {
      start: startDate,
      end: now,
    },
    trends: {
      teaching: teachingTrend,
      assignments: assignmentTrend,
      performance: performanceTrend,
    },
    distributions: {
      submissions: submissionStats,
      subjects: subjectDistribution,
    },
  };
};
