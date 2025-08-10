import { Document } from "mongoose";

export interface NoteBase {
  batchId: string;
  topic: string;
  fileURL?: string;
  subjectId?: string;
  uploadedBy?: string;
  noteType?: "handwritten" | "typed" | "video" | "image";
  isPublic?: boolean;
  approved?: boolean;
  createdBy?: string;
  updatedBy?: string;
}

export type NoteUpdate = Partial<NoteBase>;

export interface NoteDocument extends Document, NoteBase {
  isDeleted?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for populated note with batch, subject, and user details
export interface PopulatedNoteDocument extends Omit<NoteDocument, 'batchId' | 'subjectId' | 'uploadedBy' | 'createdBy' | 'updatedBy'> {
  batchId: {
    _id: string;
    name: string;
    academicYear?: string;
  };
  subjectId?: {
    _id: string;
    name: string;
    board?: string;
    classLevel?: string;
  };
  uploadedBy: {
    _id: string;
    name: string;
    email: string;
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

// Interface for note statistics
export interface NoteStats {
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

// Interface for note search results
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

// Interface for batch notes summary
export interface BatchNotesSummary {
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

// Interface for note query parameters
export interface NoteQuery {
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
