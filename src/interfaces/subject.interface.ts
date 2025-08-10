// Subject Module API Contracts
// This file defines the request/response interfaces for Subject API endpoints

import { Request, Response } from "express";

// ============================================================================
// REQUEST INTERFACES
// ============================================================================

export interface CreateSubjectRequest {
  name: string;
  board?: string;
  classLevel?: string;
  topics?: string[];
  syllabusCode?: string;
  isElective?: boolean;
}

export interface UpdateSubjectRequest {
  name?: string;
  board?: string;
  classLevel?: string;
  topics?: string[];
  syllabusCode?: string;
  isElective?: boolean;
}

export interface SubjectQueryRequest {
  page?: number;
  limit?: number;
  search?: string;
  board?: string;
  classLevel?: string;
  isElective?: boolean;
}

export interface AddTopicRequest {
  topic: string;
}

export interface RemoveTopicRequest {
  topic: string;
}

export interface GetSubjectsByBoardAndClassRequest {
  board: string;
  classLevel: string;
}

// ============================================================================
// RESPONSE INTERFACES
// ============================================================================

export interface SubjectResponse {
  _id: string;
  name: string;
  board?: string;
  classLevel?: string;
  topics: string[];
  syllabusCode?: string;
  isElective: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubjectListResponse {
  subjects: SubjectResponse[];
  pagination: {
    current: number;
    pages: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface SubjectStatsResponse {
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

export interface CurriculumStructureResponse {
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

export interface SubjectsByBoardAndClassResponse {
  subjects: Array<{
    _id: string;
    name: string;
    topics: string[];
    syllabusCode?: string;
    isElective: boolean;
  }>;
  total: number;
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

export type CreateSubjectResponse = ApiResponse<SubjectResponse>;
export type GetSubjectResponse = ApiResponse<SubjectResponse>;
export type GetSubjectsResponse = ApiResponse<SubjectListResponse>;
export type UpdateSubjectResponse = ApiResponse<SubjectResponse>;
export type DeleteSubjectResponse = ApiResponse<{ message: string }>;
export type AddTopicResponse = ApiResponse<SubjectResponse>;
export type RemoveTopicResponse = ApiResponse<SubjectResponse>;
export type GetSubjectStatsResponse = ApiResponse<SubjectStatsResponse>;
export type GetCurriculumStructureResponse = ApiResponse<CurriculumStructureResponse>;
export type GetSubjectsByBoardAndClassResponse = ApiResponse<SubjectsByBoardAndClassResponse>;

// ============================================================================
// CONTROLLER INTERFACES (for internal use)
// ============================================================================

export interface ISubjectController {
  createSubjectController(req: Request<{}, {}, CreateSubjectRequest>, res: Response): Promise<void>;
  getSubjects(req: Request<{}, {}, {}, SubjectQueryRequest>, res: Response): Promise<void>;
  getSubjectByIdController(req: Request<{ id: string }>, res: Response): Promise<void>;
  updateSubjectController(req: Request<{ id: string }, {}, UpdateSubjectRequest>, res: Response): Promise<void>;
  addTopicController(req: Request<{ id: string }, {}, AddTopicRequest>, res: Response): Promise<void>;
  removeTopicController(req: Request<{ id: string }, {}, RemoveTopicRequest>, res: Response): Promise<void>;
  deleteSubjectController(req: Request<{ id: string }>, res: Response): Promise<void>;
  getSubjectStatsController(req: Request, res: Response): Promise<void>;
  getCurriculumStructureController(req: Request, res: Response): Promise<void>;
  getSubjectsByBoardAndClassController(req: Request<{}, {}, {}, GetSubjectsByBoardAndClassRequest>, res: Response): Promise<void>;
}
