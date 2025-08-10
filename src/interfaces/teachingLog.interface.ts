import { 
  ApiResponse, 
  QueryFilters, 
  SoftDeleteEntity, 
  UserReference, 
  BatchReference,
  SubjectReference,
  ValidationError,
  ValidationResponse
} from "./index";

export type TeachingLogStatus = "pending" | "completed" | "cancelled";

export interface TeachingLogBase {
  batchId: string;
  topic: string;
  subjectId?: string;
  date?: string;
  tutorId?: string;
  durationMinutes?: number;
  teachingMethod?: string;
  status?: TeachingLogStatus;
}

export interface TeachingLogEntity extends TeachingLogBase, SoftDeleteEntity {
  _id: string;
  createdBy: UserReference;
  updatedBy: UserReference;
  createdAt: string;
  updatedAt: string;
}

export interface PopulatedTeachingLogEntity extends Omit<TeachingLogEntity, 'batchId' | 'subjectId' | 'tutorId' | 'createdBy' | 'updatedBy'> {
  batchId: BatchReference;
  subjectId?: SubjectReference;
  tutorId: UserReference;
  createdBy: UserReference;
  updatedBy: UserReference;
}

// ===== CRUD OPERATIONS =====

export interface CreateTeachingLogRequest extends TeachingLogBase {
  batchId: string;
  topic: string;
}

export interface CreateTeachingLogResponse extends ApiResponse<PopulatedTeachingLogEntity> {}

export interface GetTeachingLogsRequest extends QueryFilters {
  batchId?: string;
  subjectId?: string;
  status?: TeachingLogStatus;
  startDate?: string;
  endDate?: string;
  topic?: string;
  search?: string;
}

export interface TeachingLogPagination {
  current: number;
  pages: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface GetTeachingLogsResponse extends ApiResponse<{
  logs: PopulatedTeachingLogEntity[];
  pagination: TeachingLogPagination;
}> {}

export interface GetTeachingLogByIdResponse extends ApiResponse<PopulatedTeachingLogEntity> {}

export interface UpdateTeachingLogRequest extends Partial<TeachingLogBase> {}

export interface UpdateTeachingLogResponse extends ApiResponse<PopulatedTeachingLogEntity> {}

export interface DeleteTeachingLogResponse extends ApiResponse<null> {}

// ===== STATUS OPERATIONS =====

export interface MarkTeachingLogStatusRequest {
  status: "completed" | "cancelled";
  remarks?: string;
}

export interface MarkTeachingLogStatusResponse extends ApiResponse<PopulatedTeachingLogEntity> {}

// ===== STATISTICS & ANALYTICS =====

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

export interface GetBatchTeachingStatsRequest extends QueryFilters {
  batchId: string;
  startDate?: string;
  endDate?: string;
}

export interface GetBatchTeachingStatsResponse extends ApiResponse<TeachingLogStats> {}

// ===== SCHEDULE OPERATIONS =====

export interface DailyScheduleLog {
  _id: string;
  topic: string;
  batchName: string;
  subjectName?: string;
  startTime: string;
  durationMinutes: number;
  status: string;
}

export interface DailySchedule {
  date: string;
  logs: DailyScheduleLog[];
  totalSessions: number;
  totalHours: number;
}

export interface GetDailyScheduleRequest extends QueryFilters {
  date?: string;
  batchId?: string;
}

export interface GetDailyScheduleResponse extends ApiResponse<DailySchedule> {}

// ===== ERROR RESPONSES =====

export interface TeachingLogValidationError extends ValidationError {
  field: keyof CreateTeachingLogRequest | keyof UpdateTeachingLogRequest;
}

export interface TeachingLogValidationResponse extends ValidationResponse {
  errors: TeachingLogValidationError[];
}

// ===== COMMON ERROR MESSAGES =====

export const TEACHING_LOG_ERROR_MESSAGES = {
  BATCH_NOT_FOUND: "Batch not found or access denied",
  SUBJECT_NOT_FOUND: "Subject not found",
  TEACHING_LOG_NOT_FOUND: "Teaching log not found",
  INVALID_STATUS: "Invalid status. Must be 'pending', 'completed', or 'cancelled'",
  INVALID_DURATION: "Duration must be a positive number",
  TOPIC_REQUIRED: "Topic is required",
  TOPIC_TOO_LONG: "Topic must be less than 200 characters",
  BATCH_ID_REQUIRED: "Batch ID is required",
  INVALID_DATE: "Invalid date format",
  UNAUTHORIZED: "User not authenticated",
  ACCESS_DENIED: "Access denied to this teaching log",
} as const;

// ===== SUCCESS MESSAGES =====

export const TEACHING_LOG_SUCCESS_MESSAGES = {
  CREATED: "Teaching log created successfully",
  UPDATED: "Teaching log updated successfully",
  DELETED: "Teaching log deleted successfully",
  STATUS_UPDATED: "Teaching log status updated successfully",
  RETRIEVED: "Teaching log retrieved successfully",
  LIST_RETRIEVED: "Teaching logs retrieved successfully",
  STATS_RETRIEVED: "Batch teaching statistics retrieved successfully",
  SCHEDULE_RETRIEVED: "Daily schedule retrieved successfully",
} as const;
