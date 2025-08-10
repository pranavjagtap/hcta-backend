import { Document } from "mongoose";

export interface PerformanceBase {
  studentId: string;
  topic: string;
  subjectId: string;
  score: number;
  maxScore: number;
  remarks?: string;
  assessmentType: "test" | "oral" | "assignment" | "project";
  date: Date | string;
  isDeleted?: boolean;
  createdBy: string;
  updatedBy: string;
}

export type PerformanceUpdate = Partial<PerformanceBase>;

export interface PerformanceDocument extends Document, PerformanceBase {
  createdAt: Date;
  updatedAt: Date;
}

// Interface for populated performance with student, subject, and user details
export interface PopulatedPerformanceDocument extends Omit<PerformanceDocument, 'studentId' | 'subjectId' | 'createdBy' | 'updatedBy'> {
  studentId: {
    _id: string;
    name: string;
    rollNumber?: string;
    batchId?: {
      _id: string;
      name: string;
    };
  };
  subjectId: {
    _id: string;
    name: string;
    board?: string;
    classLevel?: string;
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

// Interface for performance statistics
export interface PerformanceStats {
  totalAssessments: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passRate: number;
  performanceByType: Array<{
    type: string;
    count: number;
    averageScore: number;
  }>;
  performanceBySubject: Array<{
    subjectId: string;
    subjectName: string;
    count: number;
    averageScore: number;
    highestScore: number;
  }>;
  recentPerformance: number;
  improvementTrend: number;
}

// Interface for student performance summary
export interface StudentPerformanceSummary {
  studentId: string;
  studentName: string;
  totalAssessments: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passRate: number;
  performanceBySubject: Array<{
    subjectId: string;
    subjectName: string;
    count: number;
    averageScore: number;
    highestScore: number;
    recentScore?: number;
  }>;
  performanceByType: Array<{
    type: string;
    count: number;
    averageScore: number;
  }>;
  recentAssessments: Array<{
    _id: string;
    topic: string;
    subjectName: string;
    score: number;
    maxScore: number;
    assessmentType: string;
    date: string;
    percentage: number;
  }>;
  improvementAreas: Array<{
    subjectId: string;
    subjectName: string;
    averageScore: number;
    recommendation: string;
  }>;
}

// Interface for batch performance summary
export interface BatchPerformanceSummary {
  batchId: string;
  batchName: string;
  totalStudents: number;
  totalAssessments: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passRate: number;
  topPerformers: Array<{
    studentId: string;
    studentName: string;
    averageScore: number;
    totalAssessments: number;
  }>;
  performanceBySubject: Array<{
    subjectId: string;
    subjectName: string;
    averageScore: number;
    totalAssessments: number;
    passRate: number;
  }>;
  performanceByType: Array<{
    type: string;
    count: number;
    averageScore: number;
  }>;
  recentTrends: Array<{
    date: string;
    averageScore: number;
    assessmentCount: number;
  }>;
}

// Interface for performance comparison
export interface PerformanceComparison {
  studentId: string;
  studentName: string;
  currentPeriod: {
    averageScore: number;
    totalAssessments: number;
    improvement: number;
  };
  previousPeriod: {
    averageScore: number;
    totalAssessments: number;
  };
  subjectComparison: Array<{
    subjectId: string;
    subjectName: string;
    currentScore: number;
    previousScore: number;
    improvement: number;
  }>;
}

// Interface for performance heatmap data
export interface PerformanceHeatmapData {
  studentId: string;
  studentName: string;
  subjectPerformance: Array<{
    subjectId: string;
    subjectName: string;
    averageScore: number;
    color: string; // For heatmap visualization
  }>;
  overallAverage: number;
}

// Interface for performance queries
export interface PerformanceQuery {
  page?: number;
  limit?: number;
  studentId?: string;
  subjectId?: string;
  assessmentType?: "test" | "oral" | "assignment" | "project";
  startDate?: string;
  endDate?: string;
  minScore?: number;
  maxScore?: number;
  search?: string;
}
