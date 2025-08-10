import { Document } from "mongoose";

export interface StudentBase {
  name: string;
  parentName?: string;
  parentPhone?: string;
  whatsappNumber?: string;
  schoolName?: string;
  board?: string;
  classLevel?: string;
  batchId?: string;
  weaknesses: string[];
  rollNumber?: string;
  admissionDate?: Date | string;
}

export type StudentUpdate = Partial<StudentBase>;

export interface StudentDocument extends Document, StudentBase {
  isDeleted?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for populated student with batch details
export interface PopulatedStudentDocument extends Omit<StudentDocument, 'batchId'> {
  batchId?: {
    _id: string;
    name: string;
    academicYear?: string;
  };
}

// Interface for student statistics
export interface StudentStats {
  totalStudents: number;
  assignedStudents: number;
  unassignedStudents: number;
  studentsByBoard: Array<{
    board: string;
    count: number;
  }>;
  studentsByClassLevel: Array<{
    classLevel: string;
    count: number;
  }>;
  recentAdmissions: number;
}

// Interface for student query parameters
export interface StudentQuery {
  page?: number;
  limit?: number;
  search?: string;
  batchId?: string;
  board?: string;
  classLevel?: string;
}
