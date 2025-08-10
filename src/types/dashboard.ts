import { Document } from "mongoose";

// Base dashboard data interface
export interface DashboardBase {
  tutorId: string;
  batchId?: string;
  period: "day" | "week" | "month" | "quarter" | "year";
  data: DashboardData;
  lastUpdated?: Date;
}

// Dashboard data structure
export interface DashboardData {
  overview: {
    totalBatches: number;
    totalStudents: number;
    monthlyAssignments: number;
    monthlyTeachingSessions: number;
    monthlyNotes: number;
  };
  today: {
    totalSessions: number;
    completedSessions: number;
    pendingSessions: number;
    schedule: any[];
  };
  thisWeek: {
    totalSessions: number;
    completedSessions: number;
    completionRate: number;
  };
  upcoming: {
    assignments: any[];
  };
  recent: {
    submissions: any[];
    notes: any[];
  };
  pending: {
    submissions: any[];
  };
  performance: {
    batchOverview: any[];
  };
  batches: any[];
}

// Dashboard document interface
export interface DashboardDocument extends Document, DashboardBase {
  isDeleted?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Dashboard update interface
export interface DashboardUpdate {
  period?: "day" | "week" | "month" | "quarter" | "year";
  data?: DashboardData;
  lastUpdated?: Date;
}

// Dashboard query interface
export interface DashboardQuery {
  tutorId?: string;
  batchId?: string;
  period?: "day" | "week" | "month" | "quarter" | "year";
  page?: number;
  limit?: number;
}

// Analytics data interface
export interface AnalyticsData {
  period: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  trends: {
    teaching: any[];
    assignments: any[];
    performance: any[];
  };
  distributions: {
    submissions: any[];
    subjects: any[];
  };
}

// Batch dashboard data interface
export interface BatchDashboardData {
  batch: {
    _id: string;
    name: string;
    academicYear: string;
    totalStudents: number;
    totalSubjects: number;
    subjects: any[];
    students: any[];
  };
  recent: {
    teachingLogs: any[];
    submissions: any[];
    notes: any[];
  };
  upcoming: {
    assignments: any[];
  };
  performance: {
    stats: {
      totalAssessments: number;
      averageScore: number;
      studentsAssessed: number;
    };
    studentPerformances: any[];
  };
  attendance: {
    totalSessions: number;
    totalDuration: number;
  };
  quickStats: {
    totalTeachingLogs: number;
    totalAssignments: number;
    totalNotes: number;
    recentSubmissions: number;
  };
}
