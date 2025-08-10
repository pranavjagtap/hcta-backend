import { Document } from "mongoose";

export interface AssignmentBase {
  batchId: string;
  topic: string;
  subjectId?: string;
  type?: "homework" | "quiz" | "test" | "practice";
  dueDate?: Date | string;
  assignedBy?: string;
  fileUrl?: string;
  isOptional?: boolean;
  maxMarks?: number;
  approved?: boolean;
  isLocked?: boolean;
  createdBy?: string;
  updatedBy?: string;
}

export type AssignmentUpdate = Partial<AssignmentBase>;

export interface AssignmentDocument extends Document, AssignmentBase {
  isDeleted?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for populated assignment with batch, subject, and assigner details
export interface PopulatedAssignmentDocument extends Omit<AssignmentDocument, 'batchId' | 'subjectId' | 'assignedBy' | 'createdBy' | 'updatedBy'> {
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
  assignedBy: {
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

// Interface for assignment statistics
export interface AssignmentStats {
  totalAssignments: number;
  pendingAssignments: number;
  approvedAssignments: number;
  lockedAssignments: number;
  assignmentsByType: Array<{
    type: string;
    count: number;
  }>;
  assignmentsByStatus: Array<{
    status: string;
    count: number;
  }>;
  upcomingDeadlines: number;
  averageCompletionRate: number;
}

// Interface for upcoming assignments
export interface UpcomingAssignment {
  _id: string;
  topic: string;
  batchName: string;
  subjectName?: string;
  type: string;
  dueDate: string;
  daysUntilDue: number;
  submissionCount: number;
  totalStudents: number;
}

// Interface for assignment query parameters
export interface AssignmentQuery {
  page?: number;
  limit?: number;
  search?: string;
  batchId?: string;
  subjectId?: string;
  type?: "homework" | "quiz" | "test" | "practice";
  status?: "pending" | "approved" | "locked";
  startDate?: string;
  endDate?: string;
  topic?: string;
}
