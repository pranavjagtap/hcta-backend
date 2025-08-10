// Submission Module API Interfaces

// ===== REQUEST INTERFACES =====

export interface CreateSubmissionRequest {
  assignmentId: string;
  studentId: string;
  fileURL?: string;
  submittedAt?: string;
  marksAwarded?: number;
  remarks?: string;
  status?: "submitted" | "checked" | "late";
}

export interface UpdateSubmissionRequest {
  assignmentId?: string;
  studentId?: string;
  fileURL?: string;
  submittedAt?: string;
  marksAwarded?: number;
  remarks?: string;
  status?: "submitted" | "checked" | "late";
}

export interface GradeSubmissionRequest {
  marksAwarded: number;
  remarks?: string;
  status: "checked" | "late";
}

export interface BulkGradeSubmissionRequest {
  submissions: Array<{
    submissionId: string;
    marksAwarded: number;
    remarks?: string;
    status: "checked" | "late";
  }>;
}

export interface SubmissionQueryRequest {
  page?: number;
  limit?: number;
  search?: string;
  assignmentId?: string;
  studentId?: string;
  status?: "submitted" | "checked" | "late";
  startDate?: string;
  endDate?: string;
}

export interface StudentSubmissionsQueryRequest {
  startDate?: string;
  endDate?: string;
}

export interface SubmissionStatsQueryRequest {
  startDate?: string;
  endDate?: string;
}

// ===== RESPONSE INTERFACES =====

export interface SubmissionData {
  _id: string;
  assignmentId: {
    _id: string;
    topic: string;
    type: string;
    dueDate: string;
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
  fileURL?: string;
  submittedAt: string;
  marksAwarded?: number;
  remarks?: string;
  status: "submitted" | "checked" | "late";
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubmissionResponse {
  success: true;
  data: SubmissionData;
  message: string;
}

export interface GetSubmissionsResponse {
  success: true;
  data: {
    submissions: SubmissionData[];
    pagination: {
      current: number;
      pages: number;
      total: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
  message: string;
}

export interface GetSubmissionByIdResponse {
  success: true;
  data: SubmissionData;
  message: string;
}

export interface UpdateSubmissionResponse {
  success: true;
  data: SubmissionData;
  message: string;
}

export interface GradeSubmissionResponse {
  success: true;
  data: SubmissionData;
  message: string;
}

export interface BulkGradeSubmissionsResponse {
  success: true;
  data: SubmissionData[];
  message: string;
}

export interface DeleteSubmissionResponse {
  success: true;
  message: string;
}

export interface AssignmentSubmissionData {
  _id: string;
  studentId: {
    _id: string;
    name: string;
    rollNumber?: string;
  };
  fileURL?: string;
  submittedAt: string;
  marksAwarded?: number;
  remarks?: string;
  status: "submitted" | "checked" | "late";
}

export interface GetAssignmentSubmissionsResponse {
  success: true;
  data: AssignmentSubmissionData[];
  message: string;
}

export interface AssignmentSubmissionSummaryData {
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

export interface GetAssignmentSubmissionSummaryResponse {
  success: true;
  data: AssignmentSubmissionSummaryData;
  message: string;
}

export interface StudentSubmissionData {
  _id: string;
  assignmentId: {
    _id: string;
    topic: string;
    type: string;
    dueDate: string;
    maxMarks?: number;
    batchId: {
      _id: string;
      name: string;
    };
  };
  fileURL?: string;
  submittedAt: string;
  marksAwarded?: number;
  remarks?: string;
  status: "submitted" | "checked" | "late";
}

export interface GetStudentSubmissionsResponse {
  success: true;
  data: StudentSubmissionData[];
  message: string;
}

export interface SubmissionStatsData {
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

export interface GetSubmissionStatsResponse {
  success: true;
  data: SubmissionStatsData;
  message: string;
}

// ===== ERROR RESPONSE INTERFACES =====

export interface SubmissionErrorResponse {
  success: false;
  error: string;
  details?: any;
}

// ===== COMMON TYPES =====

export type SubmissionStatus = "submitted" | "checked" | "late";

export interface SubmissionPagination {
  current: number;
  pages: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface SubmissionFilters {
  assignmentId?: string;
  studentId?: string;
  status?: SubmissionStatus;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface SubmissionOptions {
  page?: number;
  limit?: number;
  search?: string;
  populate?: boolean;
}
