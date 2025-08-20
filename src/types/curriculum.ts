import { Document } from "mongoose";

export interface CurriculumBase {
  name: string;
  board: string;
  classLevel: string;
  academicYear: string;
  description?: string;
  totalHours: number;
  totalTopics: number;
  isActive: boolean;
  isDeleted?: boolean;
  createdBy: string;
  updatedBy: string;
}

export type CurriculumUpdate = Partial<CurriculumBase>;

export interface CurriculumDocument extends Document, CurriculumBase {
  createdAt: Date;
  updatedAt: Date;
}

// Interface for curriculum statistics
export interface CurriculumStats {
  totalCurriculums: number;
  curriculumsByBoard: Array<{
    board: string;
    count: number;
  }>;
  curriculumsByClassLevel: Array<{
    classLevel: string;
    count: number;
  }>;
  activeCurriculums: number;
  inactiveCurriculums: number;
  averageTopicsPerCurriculum: number;
  averageHoursPerCurriculum: number;
}

// Interface for curriculum query parameters
export interface CurriculumQuery {
  page?: number;
  limit?: number;
  search?: string;
  board?: string;
  classLevel?: string;
  academicYear?: string;
  isActive?: boolean;
}

// Interface for curriculum response
export interface CurriculumResponse {
  _id: string;
  name: string;
  board: string;
  classLevel: string;
  academicYear: string;
  description?: string;
  totalHours: number;
  totalTopics: number;
  isActive: boolean;
  isDeleted?: boolean;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  updatedBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Interface for curriculum list response
export interface CurriculumListResponse {
  curriculums: CurriculumResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Interface for board-specific curriculum structure
export interface BoardCurriculumStructure {
  board: string;
  classLevels: Array<{
    classLevel: string;
    curriculums: Array<{
      _id: string;
      name: string;
      academicYear: string;
      totalHours: number;
      totalTopics: number;
      isActive: boolean;
    }>;
  }>;
}

