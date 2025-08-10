import { Document } from "mongoose";

export interface TeachingLogBase {
  batchId: string;
  topic: string;
  subjectId?: string;
  date?: Date | string;
  tutorId?: string;
  durationMinutes?: number;
  teachingMethod?: string;
  status?: "pending" | "completed" | "cancelled";
  isDeleted?: boolean;
  createdBy: string;
  updatedBy: string;
}

export type TeachingLogUpdate = Partial<TeachingLogBase>;

export interface TeachingLogDocument extends Document, TeachingLogBase {
  createdAt: Date;
  updatedAt: Date;
}

// Interface for teaching log queries
export interface TeachingLogQuery {
  page?: number;
  limit?: number;
  batchId?: string;
  subjectId?: string;
  status?: "pending" | "completed" | "cancelled";
  startDate?: string;
  endDate?: string;
  topic?: string;
  search?: string;
}

// Interface for populated teaching log with batch, subject, and tutor details
export interface PopulatedTeachingLogDocument extends Omit<TeachingLogDocument, 'batchId' | 'subjectId' | 'tutorId' | 'createdBy' | 'updatedBy'> {
  batchId: {
    _id: string;
    name: string;
    academicYear?: string;
  };
  subjectId?: {
    _id: string;
    name: string;
    board?: string;
    classLevel?: string;
  };
  tutorId: {
    _id: string;
    name: string;
    email: string;
  };
  createdBy: {
    _id: string;
    name: string;
  };
  updatedBy: {
    _id: string;
    name: string;
  };
}

// Interface for teaching log statistics
export interface TeachingLogStats {
  totalLogs: number;
  completedLogs: number;
  pendingLogs: number;
  cancelledLogs: number;
  totalTeachingHours: number;
  averageSessionDuration: number;
  logsByStatus: Array<{
    status: string;
    count: number;
  }>;
  logsByMonth: Array<{
    month: string;
    count: number;
  }>;
}

// Interface for daily schedule
export interface DailySchedule {
  date: string;
  logs: Array<{
    _id: string;
    topic: string;
    batchName: string;
    subjectName?: string;
    startTime: string;
    durationMinutes: number;
    status: string;
  }>;
  totalSessions: number;
  totalHours: number;
}
