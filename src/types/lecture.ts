import { ILecture } from '../models/lecture';

export interface LectureBase {
  subject: string;
  topic: string;
  language: string;
  duration: number;
  voice: 'male' | 'female' | 'neutral';
}

export interface LectureCreate extends LectureBase {
  userId: string;
}

export interface LectureUpdate {
  subject?: string;
  topic?: string;
  language?: string;
  duration?: number;
  voice?: 'male' | 'female' | 'neutral';
  script?: string;
  audioUrl?: string;
  audioKey?: string;
  status?: 'pending' | 'generating' | 'completed' | 'failed';
  errorMessage?: string;
  metadata?: {
    wordCount?: number;
    estimatedDuration?: number;
    generationTime?: number;
    modelUsed?: string;
  };
}

export interface LectureDocument extends ILecture {}

export interface LectureResponse {
  _id: string;
  userId: string;
  subject: string;
  topic: string;
  language: string;
  duration: number;
  voice: 'male' | 'female' | 'neutral';
  script: string;
  audioUrl: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  errorMessage?: string;
  metadata?: {
    wordCount: number;
    estimatedDuration: number;
    generationTime: number;
    modelUsed: string;
  };
  formattedDuration: string;
  formattedDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface LectureQuery {
  page?: number;
  limit?: number;
  subject?: string;
  topic?: string;
  language?: string;
  status?: 'pending' | 'generating' | 'completed' | 'failed';
  sortBy?: 'createdAt' | 'subject' | 'topic' | 'duration';
  sortOrder?: 'asc' | 'desc';
}

export interface LectureListResponse {
  lectures: LectureResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface LectureGenerationRequest {
  subject: string;
  topic: string;
  language: string;
  duration: number;
  voice: 'male' | 'female' | 'neutral';
}

export interface LectureGenerationResponse {
  lectureId: string;
  script: string;
  audioUrl: string;
  metadata: {
    wordCount: number;
    estimatedDuration: number;
    generationTime: number;
    modelUsed: string;
  };
}

export interface AILectureRequest {
  subject: string;
  topic: string;
  language: string;
  duration: number;
  voice: 'male' | 'female' | 'neutral';
}

export interface AILectureResponse {
  script: string;
  audioUrl: string;
  metadata: {
    wordCount: number;
    estimatedDuration: number;
    generationTime: number;
    modelUsed: string;
  };
}
