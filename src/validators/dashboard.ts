import { z } from "zod";

// Schema for creating dashboard data
export const createDashboardSchema = z.object({
  tutorId: z.string().min(1, "Tutor ID is required"),
  batchId: z.string().optional(),
  period: z.enum(["day", "week", "month", "quarter", "year"], {
    errorMap: () => ({ message: "Period must be one of: day, week, month, quarter, year" })
  }).default("month"),
  data: z.object({
    overview: z.object({
      totalBatches: z.number().min(0),
      totalStudents: z.number().min(0),
      monthlyAssignments: z.number().min(0),
      monthlyTeachingSessions: z.number().min(0),
      monthlyNotes: z.number().min(0),
    }),
    today: z.object({
      totalSessions: z.number().min(0),
      completedSessions: z.number().min(0),
      pendingSessions: z.number().min(0),
      schedule: z.array(z.any()),
    }),
    thisWeek: z.object({
      totalSessions: z.number().min(0),
      completedSessions: z.number().min(0),
      completionRate: z.number().min(0).max(100),
    }),
    upcoming: z.object({
      assignments: z.array(z.any()),
    }),
    recent: z.object({
      submissions: z.array(z.any()),
      notes: z.array(z.any()),
    }),
    pending: z.object({
      submissions: z.array(z.any()),
    }),
    performance: z.object({
      batchOverview: z.array(z.any()),
    }),
    batches: z.array(z.any()),
  }),
  lastUpdated: z.union([z.string().transform((val) => new Date(val)), z.date()]).optional(),
});

// Schema for updating dashboard data
export const updateDashboardSchema = createDashboardSchema.partial();

// Schema for dashboard queries
export const dashboardQuerySchema = z.object({
  tutorId: z.string().min(1, "Valid tutor ID required").optional(),
  batchId: z.string().min(1, "Valid batch ID required").optional(),
  period: z.enum(["day", "week", "month", "quarter", "year"]).optional(),
  page: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(1).max(1000)).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(1).max(100)).optional(),
});

// Schema for analytics queries
export const analyticsQuerySchema = z.object({
  period: z.enum(["week", "month", "quarter", "year"]).default("month"),
  batchId: z.string().optional(),
});

// Schema for batch dashboard queries
export const batchDashboardQuerySchema = z.object({
  batchId: z.string().min(1, "Valid batch ID required"),
});

// Schema for dashboard data validation
export const dashboardDataSchema = z.object({
  overview: z.object({
    totalBatches: z.number().min(0),
    totalStudents: z.number().min(0),
    monthlyAssignments: z.number().min(0),
    monthlyTeachingSessions: z.number().min(0),
    monthlyNotes: z.number().min(0),
  }),
  today: z.object({
    totalSessions: z.number().min(0),
    completedSessions: z.number().min(0),
    pendingSessions: z.number().min(0),
    schedule: z.array(z.any()),
  }),
  thisWeek: z.object({
    totalSessions: z.number().min(0),
    completedSessions: z.number().min(0),
    completionRate: z.number().min(0).max(100),
  }),
  upcoming: z.object({
    assignments: z.array(z.any()),
  }),
  recent: z.object({
    submissions: z.array(z.any()),
    notes: z.array(z.any()),
  }),
  pending: z.object({
    submissions: z.array(z.any()),
  }),
  performance: z.object({
    batchOverview: z.array(z.any()),
  }),
  batches: z.array(z.any()),
});

// Schema for batch dashboard data validation
export const batchDashboardDataSchema = z.object({
  batch: z.object({
    _id: z.string(),
    name: z.string(),
    academicYear: z.string(),
    totalStudents: z.number().min(0),
    totalSubjects: z.number().min(0),
    subjects: z.array(z.any()),
    students: z.array(z.any()),
  }),
  recent: z.object({
    teachingLogs: z.array(z.any()),
    submissions: z.array(z.any()),
    notes: z.array(z.any()),
  }),
  upcoming: z.object({
    assignments: z.array(z.any()),
  }),
  performance: z.object({
    stats: z.object({
      totalAssessments: z.number().min(0),
      averageScore: z.number().min(0),
      studentsAssessed: z.number().min(0),
    }),
    studentPerformances: z.array(z.any()),
  }),
  attendance: z.object({
    totalSessions: z.number().min(0),
    totalDuration: z.number().min(0),
  }),
  quickStats: z.object({
    totalTeachingLogs: z.number().min(0),
    totalAssignments: z.number().min(0),
    totalNotes: z.number().min(0),
    recentSubmissions: z.number().min(0),
  }),
});

// Schema for analytics data validation
export const analyticsDataSchema = z.object({
  period: z.string(),
  dateRange: z.object({
    start: z.date(),
    end: z.date(),
  }),
  trends: z.object({
    teaching: z.array(z.any()),
    assignments: z.array(z.any()),
    performance: z.array(z.any()),
  }),
  distributions: z.object({
    submissions: z.array(z.any()),
    subjects: z.array(z.any()),
  }),
});
