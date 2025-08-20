import { Topic } from "../models/topic";
import { Subject } from "../models/subject";
import { TopicProgress } from "../models/topicProgress";
import { FilterQuery } from "mongoose";
import { TopicBase, TopicUpdate, TopicStats, TopicQuery, TopicResponse, TopicListResponse, CurriculumTopicStructure } from "../types/topic";

// Create a new topic
export const createTopic = async (data: TopicBase) => {
  const topic = new Topic(data);
  const savedTopic = await topic.save();
  
  return await savedTopic.populate([
    { path: "subjectId", select: "name board classLevel" },
    { path: "createdBy", select: "name email" },
    { path: "updatedBy", select: "name email" },
  ]);
};

// Get all topics with pagination, search, and population
export const getAllTopics = async (
  filters: TopicQuery,
  tutorId?: string
): Promise<TopicListResponse> => {
  const { page = 1, limit = 10, search, subjectId, board, classLevel, difficultyLevel, bloomTaxonomyLevel, chapterNumber } = filters;
  
  const skip = (page - 1) * limit;
  
  // Build filter query
  const filterQuery: FilterQuery<any> = { isDeleted: false };
  
  if (search) {
    filterQuery.$or = [
      { name: { $regex: search, $options: "i" } },
      { keywords: { $in: [new RegExp(search, "i")] } },
    ];
  }
  
  if (subjectId) filterQuery.subjectId = subjectId;
  if (board) filterQuery.board = board;
  if (classLevel) filterQuery.classLevel = classLevel;
  if (difficultyLevel) filterQuery.difficultyLevel = difficultyLevel;
  if (bloomTaxonomyLevel) filterQuery.bloomTaxonomyLevel = bloomTaxonomyLevel;
  if (chapterNumber) filterQuery.chapterNumber = chapterNumber;
  
  // If tutorId is provided, filter by subjects assigned to the tutor
  if (tutorId) {
    const tutorSubjects = await Subject.find({ 
      _id: { $in: await Subject.find({}).distinct("_id") },
      isDeleted: false 
    }).distinct("_id");
    filterQuery.subjectId = { $in: tutorSubjects };
  }
  
  const [topics, total] = await Promise.all([
    Topic.find(filterQuery)
      .populate([
        { path: "subjectId", select: "name board classLevel" },
        { path: "createdBy", select: "name email" },
        { path: "updatedBy", select: "name email" },
      ])
      .sort({ chapterNumber: 1, name: 1 })
      .skip(skip)
      .limit(limit),
    Topic.countDocuments(filterQuery),
  ]);
  
  const mapped: TopicResponse[] = topics.map((t: any) => ({
    _id: t._id.toString(),
    name: t.name,
    subjectId: {
      _id: t.subjectId?._id?.toString?.() || String(t.subjectId),
      name: t.subjectId?.name || '',
      board: t.subjectId?.board || '',
      classLevel: t.subjectId?.classLevel || '',
    },
    board: t.board,
    classLevel: t.classLevel,
    chapterNumber: t.chapterNumber,
    learningObjectives: t.learningObjectives,
    prerequisites: t.prerequisites,
    estimatedHours: t.estimatedHours,
    difficultyLevel: t.difficultyLevel,
    bloomTaxonomyLevel: t.bloomTaxonomyLevel,
    keywords: t.keywords,
    isDeleted: t.isDeleted,
    createdBy: {
      _id: t.createdBy?._id?.toString?.() || String(t.createdBy),
      name: t.createdBy?.name || '',
      email: t.createdBy?.email || '',
    },
    updatedBy: {
      _id: t.updatedBy?._id?.toString?.() || String(t.updatedBy),
      name: t.updatedBy?.name || '',
      email: t.updatedBy?.email || '',
    },
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  }));

  return {
    topics: mapped,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Get topic by ID
export const getTopicById = async (id: string) => {
  const topic = await Topic.findOne({ _id: id, isDeleted: false }).populate([
    { path: "subjectId", select: "name board classLevel" },
    { path: "createdBy", select: "name email" },
    { path: "updatedBy", select: "name email" },
  ]);
  
  return topic;
};

// Update topic
export const updateTopic = async (id: string, data: TopicUpdate, updatedBy: string) => {
  const topic = await Topic.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { ...data, updatedBy },
    { new: true }
  ).populate([
    { path: "subjectId", select: "name board classLevel" },
    { path: "createdBy", select: "name email" },
    { path: "updatedBy", select: "name email" },
  ]);
  
  return topic;
};

// Soft delete topic
export const softDeleteTopic = async (id: string, deletedBy: string) => {
  const topic = await Topic.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true, updatedBy: deletedBy },
    { new: true }
  );
  
  return topic;
};

// Get topic statistics
export const getTopicStats = async (tutorId?: string): Promise<TopicStats> => {
  const filterQuery: FilterQuery<any> = { isDeleted: false };
  
  if (tutorId) {
    const tutorSubjects = await Subject.find({ 
      _id: { $in: await Subject.find({}).distinct("_id") },
      isDeleted: false 
    }).distinct("_id");
    filterQuery.subjectId = { $in: tutorSubjects };
  }
  
  const [
    totalTopics,
    topicsByDifficulty,
    topicsByBloomLevel,
    averageHoursPerTopic,
    totalEstimatedHours,
  ] = await Promise.all([
    Topic.countDocuments(filterQuery),
    Topic.aggregate([
      { $match: filterQuery },
      {
        $group: {
          _id: "$difficultyLevel",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]),
    Topic.aggregate([
      { $match: filterQuery },
      {
        $group: {
          _id: "$bloomTaxonomyLevel",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]),
    Topic.aggregate([
      { $match: filterQuery },
      {
        $group: {
          _id: null,
          averageHours: { $avg: "$estimatedHours" },
        },
      },
    ]),
    Topic.aggregate([
      { $match: filterQuery },
      {
        $group: {
          _id: null,
          totalHours: { $sum: "$estimatedHours" },
        },
      },
    ]),
  ]);
  
  return {
    totalTopics,
    topicsByDifficulty: topicsByDifficulty.map(item => ({
      difficulty: item._id,
      count: item.count,
    })),
    topicsByBloomLevel: topicsByBloomLevel.map(item => ({
      level: item._id,
      count: item.count,
    })),
    averageHoursPerTopic: averageHoursPerTopic[0]?.averageHours || 0,
    totalEstimatedHours: totalEstimatedHours[0]?.totalHours || 0,
  };
};

// Get curriculum topic structure for a subject
export const getCurriculumTopicStructure = async (subjectId: string): Promise<CurriculumTopicStructure> => {
  const [subject, topics] = await Promise.all([
    Subject.findById(subjectId).select("name board classLevel"),
    Topic.find({ subjectId, isDeleted: false })
      .select("name chapterNumber estimatedHours difficultyLevel bloomTaxonomyLevel prerequisites")
      .sort({ chapterNumber: 1, name: 1 }),
  ]);
  
  if (!subject) {
    throw new Error("Subject not found");
  }
  
  const totalHours = topics.reduce((sum, topic) => sum + topic.estimatedHours, 0);
  
  return {
    subjectId,
    subjectName: subject.name,
    topics: topics.map(topic => ({
      _id: topic._id.toString(),
      name: topic.name,
      chapterNumber: topic.chapterNumber,
      estimatedHours: topic.estimatedHours,
      difficultyLevel: topic.difficultyLevel,
      bloomTaxonomyLevel: topic.bloomTaxonomyLevel,
      prerequisites: topic.prerequisites,
    })),
    totalHours,
    totalTopics: topics.length,
  };
};

// Get topics by subject with progress tracking
export const getTopicsBySubjectWithProgress = async (subjectId: string, batchId: string) => {
  const topics = await Topic.find({ subjectId, isDeleted: false })
    .select("name chapterNumber estimatedHours difficultyLevel bloomTaxonomyLevel")
    .sort({ chapterNumber: 1, name: 1 });
  
  const topicIds = topics.map(topic => topic._id);
  
  // Get progress for all students in the batch
  const progress = await TopicProgress.find({
    topicId: { $in: topicIds },
    batchId,
    isDeleted: false,
  }).populate("studentId", "name rollNumber");
  
  // Group progress by topic
  const progressByTopic = progress.reduce((acc, prog) => {
    const topicId = prog.topicId.toString();
    if (!acc[topicId]) {
      acc[topicId] = [];
    }
    acc[topicId].push(prog);
    return acc;
  }, {} as Record<string, any[]>);
  
  return topics.map(topic => {
    const topicProgress = progressByTopic[topic._id.toString()] || [];
    const completedCount = topicProgress.filter(p => p.status === "completed").length;
    const inProgressCount = topicProgress.filter(p => p.status === "in_progress").length;
    const notStartedCount = topicProgress.filter(p => p.status === "not_started").length;
    
    return {
      _id: topic._id,
      name: topic.name,
      chapterNumber: topic.chapterNumber,
      estimatedHours: topic.estimatedHours,
      difficultyLevel: topic.difficultyLevel,
      bloomTaxonomyLevel: topic.bloomTaxonomyLevel,
      progress: {
        totalStudents: topicProgress.length,
        completed: completedCount,
        inProgress: inProgressCount,
        notStarted: notStartedCount,
        completionRate: topicProgress.length > 0 ? (completedCount / topicProgress.length) * 100 : 0,
      },
    };
  });
};

// Bulk create topics for a subject
export const bulkCreateTopics = async (subjectId: string, topics: Omit<TopicBase, "subjectId" | "createdBy" | "updatedBy">[], createdBy: string) => {
  const topicData = topics.map(topic => ({
    ...topic,
    subjectId,
    createdBy,
    updatedBy: createdBy,
  }));
  
  const createdTopics = await Topic.insertMany(topicData);
  
  return await Topic.populate(createdTopics, [
    { path: "subjectId", select: "name board classLevel" },
    { path: "createdBy", select: "name email" },
    { path: "updatedBy", select: "name email" },
  ]);
};

// Get topics by board and class level
export const getTopicsByBoardAndClass = async (board: string, classLevel: string) => {
  const topics = await Topic.find({ board, classLevel, isDeleted: false })
    .populate("subjectId", "name")
    .sort({ "subjectId.name": 1, chapterNumber: 1, name: 1 });
  
  return topics;
};

// Search topics by keywords
export const searchTopicsByKeywords = async (keywords: string[], limit: number = 10) => {
  const topics = await Topic.find({
    keywords: { $in: keywords },
    isDeleted: false,
  })
    .populate("subjectId", "name board classLevel")
    .limit(limit)
    .sort({ name: 1 });
  
  return topics;
};

