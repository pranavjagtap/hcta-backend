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
import { Topic } from "../models/topic";
import { TopicProgress } from "../models/topicProgress";
import { Subject } from "../models/subject";

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
    if (batch.studentIds && Array.isArray(batch.studentIds)) {
      acc.push(...batch.studentIds.map((s: any) => s._id));
    }
    return acc;
  }, [] as string[]);

  // Get subject IDs for curriculum data
  const subjectIds = batches.reduce((acc, batch) => {
    if (batch.subjectIds && Array.isArray(batch.subjectIds)) {
      acc.push(...batch.subjectIds.map((s: any) => s._id));
    }
    return acc;
  }, [] as string[]);

  // Get date ranges
  const currentDate = new Date();
  const startOfDay = new Date(currentDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(currentDate);
  endOfDay.setHours(23, 59, 59, 999);

  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

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
    curriculumData,
    topicProgressData,
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
      dueDate: { $gte: currentDate, $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
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
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      isDeleted: false,
    })
      .populate([
        { path: "batchId", select: "name" },
        { path: "subjectId", select: "name" },
      ])
      .sort({ createdAt: -1 })
      .limit(5),

    Submission.find({
      assignmentId: {
        $in: await Assignment.find({ batchId: { $in: batchIds } }).distinct("_id"),
      },
      status: "submitted",
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

    Performance.aggregate([
      {
        $match: {
          studentId: { $in: studentIds },
          date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: "$studentId",
          averageScore: { $avg: { $divide: ["$score", "$maxScore"] } },
          totalAssessments: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "students",
          localField: "_id",
          foreignField: "_id",
          as: "student",
        },
      },
      {
        $unwind: "$student",
      },
      {
        $project: {
          studentId: "$_id",
          studentName: "$student.name",
          averageScore: 1,
          totalAssessments: 1,
        },
      },
      { $sort: { averageScore: -1 } },
      { $limit: 5 },
    ]),

    // Curriculum planning data
    Promise.all([
      Topic.countDocuments({
        subjectId: { $in: subjectIds },
        isDeleted: false,
      }),
      Topic.aggregate([
        {
          $match: {
            subjectId: { $in: subjectIds },
            isDeleted: false,
          },
        },
        {
          $group: {
            _id: "$difficultyLevel",
            count: { $sum: 1 },
          },
        },
      ]),
      Topic.aggregate([
        {
          $match: {
            subjectId: { $in: subjectIds },
            isDeleted: false,
          },
        },
        {
          $group: {
            _id: null,
            totalHours: { $sum: "$estimatedHours" },
            averageHours: { $avg: "$estimatedHours" },
          },
        },
      ]),
    ]),

    // Topic progress data
    TopicProgress.aggregate([
      {
        $match: {
          batchId: { $in: batchIds },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          averageCompletion: { $avg: "$completionPercentage" },
        },
      },
    ]),
  ]);

  const [totalStudents, monthlyAssignments, monthlyTeachingSessions, monthlyNotes] = monthlyStats;
  const [totalTopics, topicsByDifficulty, topicHours] = curriculumData;
  const topicProgressBreakdown = topicProgressData;

  // Calculate overview statistics
  const overview = {
    totalBatches: batches.length,
    totalStudents,
    monthlyAssignments,
    monthlyTeachingSessions,
    monthlyNotes,
    totalTopics: totalTopics || 0,
    totalCurriculumHours: topicHours?.[0]?.totalHours || 0,
  };

  // Calculate today's schedule
  const today = {
    totalSessions: todaySchedule.length,
    completedSessions: todaySchedule.filter(session => session.status === "completed").length,
    pendingSessions: todaySchedule.filter(session => session.status === "pending").length,
    schedule: todaySchedule.map(session => ({
      id: session._id,
      batchName: (session.batchId as any).name,
      subjectName: (session.subjectId as any)?.name,
      topic: session.topic,
      startTime: session.date,
      duration: session.durationMinutes,
      status: session.status,
    })),
  };

  // Calculate this week's statistics
  const thisWeek = {
    totalSessions: weekTeachingLogs.length,
    completedSessions: weekTeachingLogs.filter(session => session.status === "completed").length,
    completionRate: weekTeachingLogs.length > 0 
      ? (weekTeachingLogs.filter(session => session.status === "completed").length / weekTeachingLogs.length) * 100 
      : 0,
  };

  // Format upcoming assignments
  const upcoming = {
    assignments: (() => {
      const nowTs = Date.now();
      return upcomingAssignments.map(assignment => ({
        id: assignment._id,
        topic: assignment.topic,
        batchName: (assignment.batchId as any).name,
        subjectName: (assignment.subjectId as any)?.name,
        dueDate: assignment.dueDate,
        type: assignment.type,
        daysUntilDue: Math.ceil((new Date(assignment.dueDate || nowTs).getTime() - nowTs) / (1000 * 60 * 60 * 24)),
      }));
    })(),
  };

  // Format recent submissions
  const recent = {
    submissions: recentSubmissions.map(submission => ({
      id: submission._id,
      studentName: (submission.studentId as any).name,
      assignmentTopic: (submission.assignmentId as any).topic,
      subjectName: (submission.assignmentId as any).subjectId?.name,
      submittedAt: submission.submittedAt,
      status: submission.status,
    })),
    notes: recentNotes.map(note => ({
      id: note._id,
      topic: note.topic,
      batchName: (note.batchId as any).name,
      subjectName: (note.subjectId as any)?.name,
      createdAt: note.createdAt,
      noteType: note.noteType,
    })),
  };

  // Format pending submissions
  const pending = {
    submissions: (() => {
      const nowTs = Date.now();
      return pendingSubmissions.map(submission => {
        const due = (submission.assignmentId as any).dueDate || nowTs;
        const dueTs = new Date(due).getTime();
        return {
          id: submission._id,
          studentName: (submission.studentId as any).name,
          assignmentTopic: (submission.assignmentId as any).topic,
          subjectName: (submission.assignmentId as any).subjectId?.name,
          dueDate: (submission.assignmentId as any).dueDate,
          daysOverdue: Math.ceil((nowTs - dueTs) / (1000 * 60 * 60 * 24)),
        };
      });
    })(),
  };

  // Format student performance overview
  const performance = {
    batchOverview: studentPerformanceOverview.map(student => ({
      studentId: student.studentId,
      studentName: student.studentName,
      averageScore: Math.round(student.averageScore * 100),
      totalAssessments: student.totalAssessments,
    })),
  };

  // Format curriculum planning data
  const curriculum = {
    totalTopics: totalTopics || 0,
    topicsByDifficulty: topicsByDifficulty.map(item => ({
      difficulty: item._id,
      count: item.count,
    })),
    totalHours: topicHours?.[0]?.totalHours || 0,
    averageHoursPerTopic: topicHours?.[0]?.averageHours || 0,
  };

  // Format topic progress data
  const topicProgress = {
    breakdown: topicProgressBreakdown.map(item => ({
      status: item._id,
      count: item.count,
      averageCompletion: Math.round(item.averageCompletion || 0),
    })),
    totalTopics: topicProgressBreakdown.reduce((sum, item) => sum + item.count, 0),
  };

  // Format batch overview
  const batchesOverview = batches.map(batch => ({
    id: batch._id.toString(),
    name: batch.name,
    studentCount: (batch.studentIds || []).length,
    subjectCount: (batch.subjectIds || []).length,
    academicYear: batch.academicYear || '',
  }));

  return {
    overview,
    today,
    thisWeek,
    upcoming,
    recent,
    pending,
    performance,
    batches: batchesOverview,
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

  const studentIds = (batch.studentIds || []).map((s: any) => (s?._id ? s._id : s));
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

  const studentPerformanceMap: Record<string, { student: any; performances: any[]; averageScore: number }> = studentPerformances.reduce((acc: Record<string, { student: any; performances: any[]; averageScore: number }>, perf: any) => {
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
    const scores = studentData.performances.map((p: any) => p.score || 0);
    studentData.averageScore = scores.length > 0
      ? scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length
      : 0;
  });

  return {
    batch: {
      _id: batch._id.toString(),
      name: batch.name,
      academicYear: batch.academicYear || '',
      totalStudents: (batch.studentIds || []).length,
      totalSubjects: (batch.subjectIds || []).length,
      subjects: batch.subjectIds || [],
      students: batch.studentIds || [],
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
      stats: {
        totalAssessments: performanceStats.totalAssessments,
        averageScore: performanceStats.averageScore,
        studentsAssessed: performanceStats.studentsAssessed,
      },
      studentPerformances: Object.values(studentPerformanceMap),
    },
    attendance: {
      totalSessions: (attendanceStats[0] as any)?.totalSessions || 0,
      totalDuration: (attendanceStats[0] as any)?.totalDuration || 0,
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

