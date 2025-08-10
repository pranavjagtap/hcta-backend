import { Document } from "mongoose";

export interface SubmissionBase {
  assignmentId: string;
  studentId: string;
  fileURL?: string;
  submittedAt?: Date | string;
  marksAwarded?: number;
  remarks?: string;
  status?: "submitted" | "checked" | "late";
  createdBy?: string;
  updatedBy?: string;
}

export type SubmissionUpdate = Partial<SubmissionBase>;

export interface SubmissionDocument extends Document, SubmissionBase {
  isDeleted?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for populated submission with assignment, student, and user details
export interface PopulatedSubmissionDocument extends Omit<SubmissionDocument, 'assignmentId' | 'studentId' | 'createdBy' | 'updatedBy'> {
  assignmentId: {
    _id: string;
    topic: string;
    type: string;
    dueDate: Date;
    maxMarks?: number;
    batchId: {
      _id: string;
      name: string;
    };
  };
  studentId: {
    _id: string;
    name: string;
    rollNumber?: string;
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

// Interface for submission statistics
export interface SubmissionStats {
  totalSubmissions: number;
  submittedSubmissions: number;
  checkedSubmissions: number;
  lateSubmissions: number;
  averageMarks: number;
  submissionsByStatus: Array<{
    status: string;
    count: number;
  }>;
  submissionsByAssignment: Array<{
    assignmentId: string;
    assignmentName: string;
    submissionCount: number;
    totalStudents: number;
  }>;
  recentSubmissions: number;
}

// Interface for assignment submission summary
export interface AssignmentSubmissionSummary {
  assignmentId: string;
  assignmentName: string;
  totalStudents: number;
  submittedCount: number;
  checkedCount: number;
  lateCount: number;
  averageMarks: number;
  completionRate: number;
  submissions: Array<{
    _id: string;
    studentName: string;
    studentRollNumber?: string;
    submittedAt: string;
    marksAwarded?: number;
    status: string;
    remarks?: string;
  }>;
}

// Interface for submission query parameters
export interface SubmissionQuery {
  page?: number;
  limit?: number;
  search?: string;
  assignmentId?: string;
  studentId?: string;
  status?: "submitted" | "checked" | "late";
  startDate?: string;
  endDate?: string;
}
