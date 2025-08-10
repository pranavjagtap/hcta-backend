import { 
  ApiResponse, 
  QueryFilters, 
  SoftDeleteEntity, 
  UserReference, 
  StudentReference, 
  SubjectReference,
  ValidationError,
  ValidationResponse
} from "./index";

// ============================================================================
// PERFORMANCE TYPES
// ============================================================================

export type AssessmentType = "test" | "oral" | "assignment" | "project";

export interface PerformanceBase {
  studentId: string;
  topic: string;
  subjectId: string;
  score: number;
  maxScore: number;
  remarks?: string;
  assessmentType: AssessmentType;
  date: string;
}

export interface PerformanceEntity extends PerformanceBase, SoftDeleteEntity {
  _id: string;
  createdBy: UserReference;
  updatedBy: UserReference;
  createdAt: string;
  updatedAt: string;
}

export interface PopulatedPerformanceEntity extends Omit<PerformanceEntity, 'studentId' | 'subjectId' | 'createdBy' | 'updatedBy'> {
  studentId: StudentReference & {
    batchId?: {
      _id: string;
      name: string;
    };
  };
  subjectId: SubjectReference;
  createdBy: UserReference;
  updatedBy: UserReference;
}

// ============================================================================
// CREATE PERFORMANCE
// ============================================================================

export interface CreatePerformanceRequest extends PerformanceBase {}

export interface CreatePerformanceResponse extends ApiResponse {
  data: PopulatedPerformanceEntity;
  message: string;
}

// ============================================================================
// UPDATE PERFORMANCE
// ============================================================================

export interface UpdatePerformanceRequest extends Partial<PerformanceBase> {}

export interface UpdatePerformanceResponse extends ApiResponse {
  data: PopulatedPerformanceEntity;
  message: string;
}

// ============================================================================
// GET PERFORMANCE BY ID
// ============================================================================

export interface GetPerformanceByIdResponse extends ApiResponse {
  data: PopulatedPerformanceEntity;
  message: string;
}

// ============================================================================
// DELETE PERFORMANCE
// ============================================================================

export interface DeletePerformanceResponse extends ApiResponse {
  message: string;
}

// ============================================================================
// GET ALL PERFORMANCES
// ============================================================================

export interface PerformanceFilters extends QueryFilters {
  studentId?: string;
  subjectId?: string;
  assessmentType?: AssessmentType;
  startDate?: string;
  endDate?: string;
  minScore?: number;
  maxScore?: number;
  search?: string;
}

export interface PerformancePagination {
  current: number;
  pages: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface GetAllPerformancesResponse extends ApiResponse {
  data: {
    performances: PopulatedPerformanceEntity[];
    pagination: PerformancePagination;
  };
  message: string;
}

// ============================================================================
// BULK CREATE PERFORMANCES
// ============================================================================

export interface BulkCreatePerformanceRequest {
  performances: PerformanceBase[];
}

export interface BulkCreatePerformanceResponse extends ApiResponse {
  data: PopulatedPerformanceEntity[];
  message: string;
}

// ============================================================================
// GET STUDENT PERFORMANCES
// ============================================================================

export interface StudentPerformanceFilters {
  startDate?: string;
  endDate?: string;
  subjectId?: string;
  assessmentType?: AssessmentType;
}

export interface GetStudentPerformancesResponse extends ApiResponse {
  data: PopulatedPerformanceEntity[];
  message: string;
}

// ============================================================================
// PERFORMANCE SUMMARY TYPES
// ============================================================================

export interface PerformanceByType {
  type: string;
  count: number;
  averageScore: number;
}

export interface PerformanceBySubject {
  subjectId: string;
  subjectName: string;
  count: number;
  averageScore: number;
  highestScore: number;
  recentScore?: number;
}

export interface RecentAssessment {
  _id: string;
  topic: string;
  subjectName: string;
  score: number;
  maxScore: number;
  assessmentType: string;
  date: string;
  percentage: number;
}

export interface ImprovementArea {
  subjectId: string;
  subjectName: string;
  averageScore: number;
  recommendation: string;
}

// ============================================================================
// STUDENT PERFORMANCE SUMMARY
// ============================================================================

export interface StudentPerformanceSummary {
  studentId: string;
  studentName: string;
  totalAssessments: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passRate: number;
  performanceBySubject: PerformanceBySubject[];
  performanceByType: PerformanceByType[];
  recentAssessments: RecentAssessment[];
  improvementAreas: ImprovementArea[];
}

export interface GetStudentPerformanceSummaryResponse extends ApiResponse {
  data: StudentPerformanceSummary;
  message: string;
}

// ============================================================================
// BATCH PERFORMANCE SUMMARY
// ============================================================================

export interface TopPerformer {
  studentId: string;
  studentName: string;
  averageScore: number;
  totalAssessments: number;
}

export interface BatchPerformanceBySubject {
  subjectId: string;
  subjectName: string;
  averageScore: number;
  totalAssessments: number;
  passRate: number;
}

export interface RecentTrend {
  date: string;
  averageScore: number;
  assessmentCount: number;
}

export interface BatchPerformanceSummary {
  batchId: string;
  batchName: string;
  totalStudents: number;
  totalAssessments: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passRate: number;
  topPerformers: TopPerformer[];
  performanceBySubject: BatchPerformanceBySubject[];
  performanceByType: PerformanceByType[];
  recentTrends: RecentTrend[];
}

export interface GetBatchPerformanceSummaryResponse extends ApiResponse {
  data: BatchPerformanceSummary;
  message: string;
}

// ============================================================================
// PERFORMANCE COMPARISON
// ============================================================================

export interface PeriodPerformance {
  averageScore: number;
  totalAssessments: number;
  improvement?: number;
}

export interface SubjectComparison {
  subjectId: string;
  subjectName: string;
  currentScore: number;
  previousScore: number;
  improvement: number;
}

export interface PerformanceComparison {
  studentId: string;
  studentName: string;
  currentPeriod: PeriodPerformance;
  previousPeriod: PeriodPerformance;
  subjectComparison: SubjectComparison[];
}

export interface GetPerformanceComparisonResponse extends ApiResponse {
  data: PerformanceComparison;
  message: string;
}

// ============================================================================
// PERFORMANCE STATISTICS
// ============================================================================

export interface PerformanceStats {
  totalAssessments: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passRate: number;
  performanceByType: PerformanceByType[];
  performanceBySubject: PerformanceBySubject[];
  recentPerformance: number;
  improvementTrend: number;
}

export interface GetPerformanceStatsResponse extends ApiResponse {
  data: PerformanceStats;
  message: string;
}

// ============================================================================
// PERFORMANCE HEATMAP
// ============================================================================

export interface SubjectPerformanceHeatmap {
  subjectId: string;
  subjectName: string;
  averageScore: number;
  color: string;
}

export interface PerformanceHeatmapData {
  studentId: string;
  studentName: string;
  subjectPerformance: SubjectPerformanceHeatmap[];
  overallAverage: number;
}

export interface GetPerformanceHeatmapResponse extends ApiResponse {
  data: PerformanceHeatmapData[];
  message: string;
}

// ============================================================================
// ERROR RESPONSES
// ============================================================================

export interface PerformanceValidationError extends ValidationError {
  field: keyof PerformanceBase | 'score' | 'maxScore';
  message: string;
}

export interface PerformanceValidationResponse extends ValidationResponse {
  errors: PerformanceValidationError[];
}

export interface PerformanceNotFoundError {
  error: "Performance record not found";
}

export interface StudentAccessDeniedError {
  error: "Student not found or access denied";
}

export interface SubjectNotFoundError {
  error: "Subject not found";
}

export interface ScoreValidationError {
  error: "Score cannot exceed max score";
  field: "score";
}
