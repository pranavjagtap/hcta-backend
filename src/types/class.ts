import { Document } from "mongoose";

export interface ClassBase {
  name: string;
  gradeLevel: string;
  subjects: string[];
  assignedTeachers: string[];
  description?: string;
  maxStudents?: number;
  isActive?: boolean;
  createdBy?: string;
  updatedBy?: string;
}

export type ClassUpdate = Partial<ClassBase>;

export interface ClassDocument extends Document, ClassBase {
  isDeleted?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for populated class with subject and teacher details
export interface PopulatedClassDocument extends Omit<ClassDocument, 'subjects' | 'assignedTeachers' | 'createdBy' | 'updatedBy'> {
  subjects: Array<{
    _id: string;
    name: string;
    board?: string;
    classLevel?: string;
  }>;
  assignedTeachers: Array<{
    _id: string;
    name: string;
    email: string;
    role: string;
  }>;
  createdBy: {
    _id: string;
    name: string;
  };
  updatedBy: {
    _id: string;
    name: string;
  };
}

// Interface for class statistics
export interface ClassStats {
  totalClasses: number;
  activeClasses: number;
  totalStudents: number;
  averageStudentsPerClass: number;
  classesByGradeLevel: Array<{
    gradeLevel: string;
    count: number;
  }>;
}

// Interface for class query parameters
export interface ClassQuery {
  page?: number;
  limit?: number;
  search?: string;
  gradeLevel?: string;
  isActive?: boolean;
  assignedTeacher?: string;
}
