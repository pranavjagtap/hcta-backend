import { Document } from "mongoose";

export interface SubjectBase {
  name: string;
  board?: string;
  classLevel?: string;
  topics: string[];
  syllabusCode?: string;
  isElective?: boolean;
  isDeleted?: boolean;
  createdBy: string;
  updatedBy: string;
}

export type SubjectUpdate = Partial<SubjectBase>;

export interface SubjectDocument extends Document, SubjectBase {
  createdAt: Date;
  updatedAt: Date;
}

// Interface for subject statistics
export interface SubjectStats {
  totalSubjects: number;
  subjectsByBoard: Array<{
    board: string;
    count: number;
  }>;
  subjectsByClassLevel: Array<{
    classLevel: string;
    count: number;
  }>;
  electiveSubjects: number;
  coreSubjects: number;
  averageTopicsPerSubject: number;
}

// Interface for curriculum structure
export interface CurriculumStructure {
  board: string;
  classLevels: Array<{
    classLevel: string;
    subjects: Array<{
      _id: string;
      name: string;
      isElective: boolean;
      topicCount: number;
    }>;
  }>;
}
