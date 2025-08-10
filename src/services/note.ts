import { Note } from "../models/note";
import { Batch } from "../models/batch";
import { Subject } from "../models/subject";
import { FilterQuery } from "mongoose";
import { NoteBase, NoteUpdate, NoteStats, NoteSearchResult, BatchNotesSummary, NoteQuery } from "../types/note";

// Create a new note
export const createNote = async (data: NoteBase) => {
  const note = new Note(data);
  const savedNote = await note.save();
  
  return await savedNote.populate([
    { path: "batchId", select: "name academicYear" },
    { path: "subjectId", select: "name board classLevel" },
    { path: "uploadedBy", select: "name email" },
  ]);
};

// Get all notes with pagination, search, and population
export const getAllNotes = async (
  filters: FilterQuery<typeof Note> = {},
  options: {
    page?: number;
    limit?: number;
    search?: string;
    populate?: boolean;
  } = {}
) => {
  const { page = 1, limit = 10, search, populate = true } = options;

  // Always include isDeleted: false filter
  const finalFilters = { ...filters, isDeleted: false };

  // Build search filter
  if (search) {
    finalFilters.$or = [
      { topic: { $regex: search, $options: "i" } },
      { fileURL: { $regex: search, $options: "i" } },
    ];
  }

  const query = Note.find(finalFilters);

  if (populate) {
    query.populate([
      { path: "batchId", select: "name academicYear" },
      { path: "subjectId", select: "name board classLevel" },
      { path: "uploadedBy", select: "name email" },
    ]);
  }

  // Apply pagination
  const skip = (page - 1) * limit;
  const notes = await query
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  // Get total count for pagination
  const total = await Note.countDocuments(finalFilters);

  return {
    notes,
    pagination: {
      current: page,
      pages: Math.ceil(total / limit),
      total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  };
};

// Get notes for a specific tutor (through batches)
export const getTutorNotes = async (
  tutorId: string,
  filters: FilterQuery<typeof Note> = {},
  options: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}
) => {
  // Get all batches by this tutor
  const tutorBatches = await Batch.find({
    tutorId,
    isDeleted: false,
  }).select("_id");

  const batchIds = tutorBatches.map(batch => batch._id);
  
  const tutorFilters = { 
    ...filters, 
    batchId: { $in: batchIds }, 
    isDeleted: false 
  };
  
  return await getAllNotes(tutorFilters, options);
};

// Get note by ID
export const getNoteById = async (id: string, tutorId?: string) => {
  const filters: any = { _id: id, isDeleted: false };
  
  if (tutorId) {
    // Get all batches by this tutor
    const tutorBatches = await Batch.find({
      tutorId,
      isDeleted: false,
    }).select("_id");

    const batchIds = tutorBatches.map(batch => batch._id);
    filters.batchId = { $in: batchIds };
  }

  const note = await Note.findOne(filters).populate([
    { path: "batchId", select: "name academicYear" },
    { path: "subjectId", select: "name board classLevel" },
    { path: "uploadedBy", select: "name email" },
  ]);

  return note;
};

// Update note
export const updateNote = async (id: string, data: NoteUpdate, tutorId?: string) => {
  const filters: any = { _id: id, isDeleted: false };
  
  if (tutorId) {
    // Get all batches by this tutor
    const tutorBatches = await Batch.find({
      tutorId,
      isDeleted: false,
    }).select("_id");

    const batchIds = tutorBatches.map(batch => batch._id);
    filters.batchId = { $in: batchIds };
  }

  const note = await Note.findOneAndUpdate(
    filters,
    { ...data, updatedAt: new Date() },
    { new: true }
  ).populate([
    { path: "batchId", select: "name academicYear" },
    { path: "subjectId", select: "name board classLevel" },
    { path: "uploadedBy", select: "name email" },
  ]);

  return note;
};

// Toggle note public status
export const toggleNotePublic = async (id: string, isPublic: boolean, tutorId?: string) => {
  const filters: any = { _id: id, isDeleted: false };
  
  if (tutorId) {
    // Get all batches by this tutor
    const tutorBatches = await Batch.find({
      tutorId,
      isDeleted: false,
    }).select("_id");

    const batchIds = tutorBatches.map(batch => batch._id);
    filters.batchId = { $in: batchIds };
  }

  const note = await Note.findOneAndUpdate(
    filters,
    { 
      isPublic, 
      updatedAt: new Date() 
    },
    { new: true }
  ).populate([
    { path: "batchId", select: "name academicYear" },
    { path: "subjectId", select: "name board classLevel" },
    { path: "uploadedBy", select: "name email" },
  ]);

  return note;
};

// Approve/reject note
export const approveNote = async (id: string, approved: boolean, tutorId?: string) => {
  const filters: any = { _id: id, isDeleted: false };
  
  if (tutorId) {
    // Get all batches by this tutor
    const tutorBatches = await Batch.find({
      tutorId,
      isDeleted: false,
    }).select("_id");

    const batchIds = tutorBatches.map(batch => batch._id);
    filters.batchId = { $in: batchIds };
  }

  const note = await Note.findOneAndUpdate(
    filters,
    { 
      approved, 
      updatedAt: new Date() 
    },
    { new: true }
  ).populate([
    { path: "batchId", select: "name academicYear" },
    { path: "subjectId", select: "name board classLevel" },
    { path: "uploadedBy", select: "name email" },
  ]);

  return note;
};

// Bulk update notes
export const bulkUpdateNotes = async (
  noteIds: string[], 
  updates: Partial<NoteUpdate>, 
  tutorId?: string
) => {
  const filters: any = { 
    _id: { $in: noteIds }, 
    isDeleted: false 
  };
  
  if (tutorId) {
    // Get all batches by this tutor
    const tutorBatches = await Batch.find({
      tutorId,
      isDeleted: false,
    }).select("_id");

    const batchIds = tutorBatches.map(batch => batch._id);
    filters.batchId = { $in: batchIds };
  }

  const notes = await Note.updateMany(
    filters,
    { ...updates, updatedAt: new Date() },
    { new: true }
  );

  return notes;
};

// Soft delete note
export const softDeleteNote = async (id: string, tutorId?: string) => {
  const filters: any = { _id: id, isDeleted: false };
  
  if (tutorId) {
    // Get all batches by this tutor
    const tutorBatches = await Batch.find({
      tutorId,
      isDeleted: false,
    }).select("_id");

    const batchIds = tutorBatches.map(batch => batch._id);
    filters.batchId = { $in: batchIds };
  }

  const note = await Note.findOneAndUpdate(
    filters,
    { isDeleted: true, updatedAt: new Date() },
    { new: true }
  );

  return note;
};

// Get notes for a specific batch
export const getBatchNotes = async (batchId: string, tutorId?: string, filters: any = {}) => {
  // Verify batch belongs to tutor if tutorId provided
  if (tutorId) {
    const batch = await Batch.findOne({
      _id: batchId,
      tutorId,
      isDeleted: false,
    });

    if (!batch) {
      return null;
    }
  }

  const batchFilters = { 
    batchId, 
    isDeleted: false,
    ...filters
  };

  const notes = await Note.find(batchFilters)
    .populate([
      { path: "subjectId", select: "name board classLevel" },
      { path: "uploadedBy", select: "name email" },
    ])
    .sort({ createdAt: -1 });

  return notes;
};

// Get batch notes summary
export const getBatchNotesSummary = async (batchId: string, tutorId?: string): Promise<BatchNotesSummary | null> => {
  // Verify batch belongs to tutor if tutorId provided
  if (tutorId) {
    const batch = await Batch.findOne({
      _id: batchId,
      tutorId,
      isDeleted: false,
    });

    if (!batch) {
      return null;
    }
  }

  const batch = await Batch.findById(batchId).select("name academicYear");
  if (!batch) {
    return null;
  }

  // Get note statistics
  const stats = await Note.aggregate([
    { $match: { batchId, isDeleted: false } },
    {
      $group: {
        _id: null,
        totalNotes: { $sum: 1 },
        publicNotes: { $sum: { $cond: [{ $eq: ["$isPublic", true] }, 1, 0] } },
        privateNotes: { $sum: { $cond: [{ $eq: ["$isPublic", false] }, 1, 0] } },
        approvedNotes: { $sum: { $cond: [{ $eq: ["$approved", true] }, 1, 0] } }
      }
    }
  ]);

  const notesBySubject = await Note.aggregate([
    { $match: { batchId, isDeleted: false } },
    {
      $group: {
        _id: "$subjectId",
        count: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: "subjects",
        localField: "_id",
        foreignField: "_id",
        as: "subject"
      }
    },
    { $unwind: "$subject" },
    {
      $project: {
        subjectId: "$_id",
        subjectName: "$subject.name",
        count: 1
      }
    },
    { $sort: { count: -1 } }
  ]);

  const notesByType = await Note.aggregate([
    { $match: { batchId, isDeleted: false } },
    {
      $group: {
        _id: "$noteType",
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);

  // Get recent notes
  const recentNotes = await Note.find({ batchId, isDeleted: false })
    .populate("uploadedBy", "name")
    .sort({ createdAt: -1 })
    .limit(5);

  const recentNotesData = recentNotes.map(note => ({
    _id: note._id.toString(),
    topic: note.topic,
    noteType: note.noteType,
    createdAt: note.createdAt.toISOString(),
    uploadedByName: (note.uploadedBy as any).name,
  }));

  return {
    batchId,
    batchName: batch.name,
    totalNotes: stats[0]?.totalNotes || 0,
    publicNotes: stats[0]?.publicNotes || 0,
    privateNotes: stats[0]?.privateNotes || 0,
    approvedNotes: stats[0]?.approvedNotes || 0,
    notesBySubject,
    notesByType,
    recentNotes: recentNotesData,
  };
};

// Search notes
export const searchNotes = async (
  query: string,
  tutorId?: string,
  filters: any = {}
): Promise<NoteSearchResult[]> => {
  const searchFilters: any = {
    isDeleted: false,
    $or: [
      { topic: { $regex: query, $options: "i" } },
      { fileURL: { $regex: query, $options: "i" } },
    ],
    ...filters
  };

  if (tutorId) {
    // Get all batches by this tutor
    const tutorBatches = await Batch.find({
      tutorId,
      isDeleted: false,
    }).select("_id");

    const batchIds = tutorBatches.map(batch => batch._id);
    searchFilters.batchId = { $in: batchIds };
  }

  const notes = await Note.find(searchFilters)
    .populate([
      { path: "batchId", select: "name" },
      { path: "subjectId", select: "name" },
      { path: "uploadedBy", select: "name" },
    ])
    .sort({ createdAt: -1 })
    .limit(20);

  return notes.map(note => ({
    _id: note._id.toString(),
    topic: note.topic,
    noteType: note.noteType,
    isPublic: note.isPublic,
    approved: note.approved,
    createdAt: note.createdAt.toISOString(),
    batchName: (note.batchId as any).name,
    subjectName: (note.subjectId as any)?.name,
    uploadedByName: (note.uploadedBy as any).name,
    fileURL: note.fileURL,
  }));
};

// Get note statistics for a tutor
export const getNoteStats = async (tutorId: string, startDate?: Date, endDate?: Date): Promise<NoteStats> => {
  // Get all batches by this tutor
  const tutorBatches = await Batch.find({
    tutorId,
    isDeleted: false,
  }).select("_id");

  const batchIds = tutorBatches.map(batch => batch._id);

  const filters: any = { 
    batchId: { $in: batchIds }, 
    isDeleted: false 
  };

  if (startDate || endDate) {
    filters.createdAt = {};
    if (startDate) filters.createdAt.$gte = startDate;
    if (endDate) filters.createdAt.$lte = endDate;
  }

  const stats = await Note.aggregate([
    { $match: filters },
    {
      $group: {
        _id: null,
        totalNotes: { $sum: 1 },
        publicNotes: { $sum: { $cond: [{ $eq: ["$isPublic", true] }, 1, 0] } },
        privateNotes: { $sum: { $cond: [{ $eq: ["$isPublic", false] }, 1, 0] } },
        approvedNotes: { $sum: { $cond: [{ $eq: ["$approved", true] }, 1, 0] } },
        pendingNotes: { $sum: { $cond: [{ $eq: ["$approved", false] }, 1, 0] } }
      }
    }
  ]);

  const notesByType = await Note.aggregate([
    { $match: filters },
    {
      $group: {
        _id: "$noteType",
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);

  const notesBySubject = await Note.aggregate([
    { $match: filters },
    {
      $group: {
        _id: "$subjectId",
        count: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: "subjects",
        localField: "_id",
        foreignField: "_id",
        as: "subject"
      }
    },
    { $unwind: "$subject" },
    {
      $project: {
        subjectId: "$_id",
        subjectName: "$subject.name",
        count: 1
      }
    },
    { $sort: { count: -1 } }
  ]);

  // Get recent notes (last 7 days)
  const recentNotes = await Note.countDocuments({
    ...filters,
    createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
  });

  // Calculate total file size (placeholder - would need actual file size tracking)
  const totalFileSize = 0; // This would be calculated based on actual file sizes

  return {
    totalNotes: stats[0]?.totalNotes || 0,
    publicNotes: stats[0]?.publicNotes || 0,
    privateNotes: stats[0]?.privateNotes || 0,
    approvedNotes: stats[0]?.approvedNotes || 0,
    pendingNotes: stats[0]?.pendingNotes || 0,
    notesByType,
    notesBySubject,
    recentNotes,
    totalFileSize,
  };
};

// Check if batch exists and belongs to tutor
export const checkBatchAccess = async (batchId: string, tutorId: string) => {
  const batch = await Batch.findOne({
    _id: batchId,
    tutorId,
    isDeleted: false,
  });
  return batch;
};

// Check if subject exists
export const checkSubjectExists = async (subjectId: string) => {
  const subject = await Subject.findById(subjectId);
  return subject;
};
