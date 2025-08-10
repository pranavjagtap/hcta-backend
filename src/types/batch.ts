import { Document } from "mongoose";

export interface BatchBase {
  tutorId: string;
  name: string;
  subjectIds?: string[];
  studentIds?: string[];
  academicYear?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  classDays: string[];
  maxStudents?: number;
  location?: string;
  isActive?: boolean;
  createdBy?: string;
  updatedBy?: string;
}

export type BatchUpdate = Partial<BatchBase>;

export interface BatchDocument extends Document, BatchBase {
  isDeleted?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for populated batch with subject and student details
export interface PopulatedBatchDocument extends Omit<BatchDocument, 'subjectIds' | 'studentIds' | 'tutorId' | 'createdBy' | 'updatedBy'> {
  subjectIds: Array<{
    _id: string;
    name: string;
    board?: string;
    classLevel?: string;
  }>;
  studentIds: Array<{
    _id: string;
    name: string;
    rollNumber?: string;
  }>;
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

// Interface for batch statistics
export interface BatchStats {
  totalBatches: number;
  activeBatches: number;
  totalStudents: number;
  averageStudentsPerBatch: number;
  batchesByAcademicYear: Array<{
    academicYear: string;
    count: number;
  }>;
}

// Interface for batch query parameters
export interface BatchQuery {
  page?: number;
  limit?: number;
  search?: string;
  academicYear?: string;
  isActive?: boolean;
}
