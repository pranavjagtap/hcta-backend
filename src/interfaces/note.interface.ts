// Note Module API Contracts
// This file defines the request/response interfaces for Note API endpoints

import { Request, Response } from "express";

// ============================================================================
// REQUEST INTERFACES
// ============================================================================

export interface CreateNoteRequest {
  batchId: string;
  topic: string;
  fileURL?: string;
  subjectId?: string;
  noteType?: "handwritten" | "typed" | "video" | "image";
  isPublic?: boolean;
  approved?: boolean;
}

export interface UpdateNoteRequest {
  batchId?: string;
  topic?: string;
  fileURL?: string;
  subjectId?: string;
  noteType?: "handwritten" | "typed" | "video" | "image";
  isPublic?: boolean;
  approved?: boolean;
}

export interface NoteQueryRequest {
  page?: number;
  limit?: number;
  batchId?: string;
  subjectId?: string;
  noteType?: "handwritten" | "typed" | "video" | "image";
  isPublic?: boolean;
  approved?: boolean;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface TogglePublicRequest {
  isPublic: boolean;
}

export interface ApproveNoteRequest {
  approved: boolean;
  remarks?: string;
}

export interface BulkUpdateNotesRequest {
  noteIds: string[];
  updates?: {
    isPublic?: boolean;
    approved?: boolean;
    noteType?: "handwritten" | "typed" | "video" | "image";
  };
}

export interface SearchNotesRequest {
  query: string;
  batchId?: string;
  subjectId?: string;
  noteType?: "handwritten" | "typed" | "video" | "image";
  isPublic?: boolean;
  approved?: boolean;
}

export interface GetBatchNotesRequest {
  batchId: string;
  noteType?: "handwritten" | "typed" | "video" | "image";
  isPublic?: boolean;
  approved?: boolean;
}

export interface NoteStatsQueryRequest {
  startDate?: string;
  endDate?: string;
}

// ============================================================================
// RESPONSE INTERFACES
// ============================================================================

export interface BatchInfo {
  _id: string;
  name: string;
  academicYear?: string;
}

export interface SubjectInfo {
  _id: string;
  name: string;
  board?: string;
  classLevel?: string;
}

export interface UserInfo {
  _id: string;
  name: string;
  email?: string;
}

export interface NoteResponse {
  _id: string;
  batchId: BatchInfo;
  topic: string;
  fileURL?: string;
  subjectId?: SubjectInfo;
  uploadedBy: UserInfo;
  noteType: "handwritten" | "typed" | "video" | "image";
  isPublic: boolean;
  approved: boolean;
  isDeleted?: boolean;
  createdBy: UserInfo;
  updatedBy: UserInfo;
  createdAt: Date;
  updatedAt: Date;
}

export interface NoteListResponse {
  notes: NoteResponse[];
  pagination: {
    current: number;
    pages: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface NoteStatsResponse {
  totalNotes: number;
  publicNotes: number;
  privateNotes: number;
  approvedNotes: number;
  pendingNotes: number;
  notesByType: Array<{
    type: string;
    count: number;
  }>;
  notesBySubject: Array<{
    subjectId: string;
    subjectName: string;
    count: number;
  }>;
  recentNotes: number;
  totalFileSize: number;
}

export interface NoteSearchResult {
  _id: string;
  topic: string;
  noteType: string;
  isPublic: boolean;
  approved: boolean;
  createdAt: string;
  batchName: string;
  subjectName?: string;
  uploadedByName: string;
  fileURL?: string;
}

export interface BatchNotesSummaryResponse {
  batchId: string;
  batchName: string;
  totalNotes: number;
  publicNotes: number;
  privateNotes: number;
  approvedNotes: number;
  notesBySubject: Array<{
    subjectId: string;
    subjectName: string;
    count: number;
  }>;
  notesByType: Array<{
    type: string;
    count: number;
  }>;
  recentNotes: Array<{
    _id: string;
    topic: string;
    noteType: string;
    createdAt: string;
    uploadedByName: string;
  }>;
}

export interface BulkUpdateResponse {
  modifiedCount: number;
  matchedCount: number;
}

// ============================================================================
// API RESPONSE WRAPPERS
// ============================================================================

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: any;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================================================
// SPECIFIC API RESPONSES
// ============================================================================

export type CreateNoteResponse = ApiResponse<NoteResponse>;
export type GetNoteResponse = ApiResponse<NoteResponse>;
export type GetNotesResponse = ApiResponse<NoteListResponse>;
export type UpdateNoteResponse = ApiResponse<NoteResponse>;
export type DeleteNoteResponse = ApiResponse<{ message: string }>;
export type TogglePublicResponse = ApiResponse<NoteResponse>;
export type ApproveNoteResponse = ApiResponse<NoteResponse>;
export type BulkUpdateNotesResponse = ApiResponse<BulkUpdateResponse>;
export type GetNoteStatsResponse = ApiResponse<NoteStatsResponse>;
export type SearchNotesResponse = ApiResponse<NoteSearchResult[]>;
export type GetBatchNotesResponse = ApiResponse<NoteResponse[]>;
export type GetBatchNotesSummaryResponse = ApiResponse<BatchNotesSummaryResponse>;

// ============================================================================
// CONTROLLER INTERFACES (for internal use)
// ============================================================================

export interface INoteController {
  createNoteController(req: Request<{}, {}, CreateNoteRequest>, res: Response): Promise<void>;
  getTutorNotesController(req: Request<{}, {}, {}, NoteQueryRequest>, res: Response): Promise<void>;
  getNoteByIdController(req: Request<{ id: string }>, res: Response): Promise<void>;
  updateNoteController(req: Request<{ id: string }, {}, UpdateNoteRequest>, res: Response): Promise<void>;
  toggleNotePublicController(req: Request<{ id: string }, {}, TogglePublicRequest>, res: Response): Promise<void>;
  approveNoteController(req: Request<{ id: string }, {}, ApproveNoteRequest>, res: Response): Promise<void>;
  bulkUpdateNotesController(req: Request<{}, {}, BulkUpdateNotesRequest>, res: Response): Promise<void>;
  deleteNoteController(req: Request<{ id: string }>, res: Response): Promise<void>;
  getBatchNotesController(req: Request<{ batchId: string }, {}, {}, GetBatchNotesRequest>, res: Response): Promise<void>;
  getBatchNotesSummaryController(req: Request<{ batchId: string }>, res: Response): Promise<void>;
  searchNotesController(req: Request<{}, {}, {}, SearchNotesRequest>, res: Response): Promise<void>;
  getNoteStatsController(req: Request<{}, {}, {}, NoteStatsQueryRequest>, res: Response): Promise<void>;
}
