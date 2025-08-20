import { Document } from "mongoose";

export interface TopicBase {
  name: string;
  subjectId: string;
  board: string;
  classLevel: string;
  chapterNumber?: number;
  learningObjectives: string[];
  prerequisites: string[];
  estimatedHours: number;
  difficultyLevel: "easy" | "medium" | "hard";
  bloomTaxonomyLevel: "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create";
  keywords: string[];
  isDeleted?: boolean;
  createdBy: string;
  updatedBy: string;
}

export type TopicUpdate = Partial<TopicBase>;

export interface TopicDocument extends Document, TopicBase {
  createdAt: Date;
  updatedAt: Date;
}

// Interface for topic statistics
export interface TopicStats {
  totalTopics: number;
  topicsByDifficulty: Array<{
    difficulty: string;
    count: number;
  }>;
  topicsByBloomLevel: Array<{
    level: string;
    count: number;
  }>;
  averageHoursPerTopic: number;
  totalEstimatedHours: number;
}

// Interface for topic query parameters
export interface TopicQuery {
  page?: number;
  limit?: number;
  search?: string;
  subjectId?: string;
  board?: string;
  classLevel?: string;
  difficultyLevel?: "easy" | "medium" | "hard";
  bloomTaxonomyLevel?: "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create";
  chapterNumber?: number;
}

// Interface for topic response
export interface TopicResponse {
  _id: string;
  name: string;
  subjectId: {
    _id: string;
    name: string;
    board: string;
    classLevel: string;
  };
  board: string;
  classLevel: string;
  chapterNumber?: number;
  learningObjectives: string[];
  prerequisites: string[];
  estimatedHours: number;
  difficultyLevel: "easy" | "medium" | "hard";
  bloomTaxonomyLevel: "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create";
  keywords: string[];
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

// Interface for topic list response
export interface TopicListResponse {
  topics: TopicResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Interface for curriculum topic structure
export interface CurriculumTopicStructure {
  subjectId: string;
  subjectName: string;
  topics: Array<{
    _id: string;
    name: string;
    chapterNumber?: number;
    estimatedHours: number;
    difficultyLevel: string;
    bloomTaxonomyLevel: string;
    prerequisites: string[];
  }>;
  totalHours: number;
  totalTopics: number;
}

