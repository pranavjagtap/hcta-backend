import { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import {
  createTopic,
  getAllTopics,
  getTopicById,
  updateTopic,
  softDeleteTopic,
  getTopicStats,
  getCurriculumTopicStructure,
  getTopicsBySubjectWithProgress,
  bulkCreateTopics,
  getTopicsByBoardAndClass,
  searchTopicsByKeywords,
} from "../services/topic";
import {
  createTopicSchema,
  updateTopicSchema,
  topicQuerySchema,
  bulkCreateTopicsSchema,
} from "../validators/topic";

// Create a new topic
export const createTopicController = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = createTopicSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: "Validation failed",
        details: parsed.error.errors
      });
      return;
    }

    if (!req.user?._id) {
      res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
      return;
    }

    const topicData = {
      ...parsed.data,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    };

    const topic = await createTopic(topicData as any);

    res.status(201).json({
      success: true,
      data: topic,
    });
  } catch (error) {
    console.error("Create topic error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create topic",
      details: error instanceof Error ? error.message : error,
    });
  }
};

// Get all topics with filtering and pagination
export const getAllTopicsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = topicQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: "Invalid query parameters",
        details: parsed.error.errors
      });
      return;
    }

    const topics = await getAllTopics(parsed.data, req.user?._id);

    res.status(200).json({
      success: true,
      data: topics,
    });
  } catch (error) {
    console.error("Get topics error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch topics",
      details: error instanceof Error ? error.message : error,
    });
  }
};

// Get topic by ID
export const getTopicByIdController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        error: "Invalid topic ID",
      });
      return;
    }

    const topic = await getTopicById(id);

    if (!topic) {
      res.status(404).json({
        success: false,
        error: "Topic not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: topic,
    });
  } catch (error) {
    console.error("Get topic by ID error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch topic",
      details: error instanceof Error ? error.message : error,
    });
  }
};

// Update topic
export const updateTopicController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const parsed = updateTopicSchema.safeParse(req.body);

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        error: "Invalid topic ID",
      });
      return;
    }

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: "Validation failed",
        details: parsed.error.errors
      });
      return;
    }

    if (!req.user?._id) {
      res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
      return;
    }

    const topic = await updateTopic(id, parsed.data, req.user._id);

    if (!topic) {
      res.status(404).json({
        success: false,
        error: "Topic not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: topic,
    });
  } catch (error) {
    console.error("Update topic error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update topic",
      details: error instanceof Error ? error.message : error,
    });
  }
};

// Soft delete topic
export const deleteTopicController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        error: "Invalid topic ID",
      });
      return;
    }

    if (!req.user?._id) {
      res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
      return;
    }

    const topic = await softDeleteTopic(id, req.user._id);

    if (!topic) {
      res.status(404).json({
        success: false,
        error: "Topic not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Topic deleted successfully",
    });
  } catch (error) {
    console.error("Delete topic error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete topic",
      details: error instanceof Error ? error.message : error,
    });
  }
};

// Get topic statistics
export const getTopicStatsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await getTopicStats(req.user?._id);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Get topic stats error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch topic statistics",
      details: error instanceof Error ? error.message : error,
    });
  }
};

// Get curriculum topic structure for a subject
export const getCurriculumTopicStructureController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { subjectId } = req.params;

    if (!isValidObjectId(subjectId)) {
      res.status(400).json({
        success: false,
        error: "Invalid subject ID",
      });
      return;
    }

    const structure = await getCurriculumTopicStructure(subjectId);

    res.status(200).json({
      success: true,
      data: structure,
    });
  } catch (error) {
    console.error("Get curriculum structure error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch curriculum structure",
      details: error instanceof Error ? error.message : error,
    });
  }
};

// Get topics by subject with progress tracking
export const getTopicsBySubjectWithProgressController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { subjectId, batchId } = req.params;

    if (!isValidObjectId(subjectId) || !isValidObjectId(batchId)) {
      res.status(400).json({
        success: false,
        error: "Invalid subject ID or batch ID",
      });
      return;
    }

    const topics = await getTopicsBySubjectWithProgress(subjectId, batchId);

    res.status(200).json({
      success: true,
      data: topics,
    });
  } catch (error) {
    console.error("Get topics with progress error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch topics with progress",
      details: error instanceof Error ? error.message : error,
    });
  }
};

// Bulk create topics for a subject
export const bulkCreateTopicsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = bulkCreateTopicsSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: "Validation failed",
        details: parsed.error.errors
      });
      return;
    }

    if (!req.user?._id) {
      res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
      return;
    }

    const { subjectId, topics } = parsed.data;

    if (!isValidObjectId(subjectId)) {
      res.status(400).json({
        success: false,
        error: "Invalid subject ID",
      });
      return;
    }

    const createdTopics = await bulkCreateTopics(subjectId, topics as any, req.user._id);

    res.status(201).json({
      success: true,
      data: createdTopics,
      message: `${createdTopics.length} topics created successfully`,
    });
  } catch (error) {
    console.error("Bulk create topics error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create topics",
      details: error instanceof Error ? error.message : error,
    });
  }
};

// Get topics by board and class level
export const getTopicsByBoardAndClassController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { board, classLevel } = req.params;

    if (!board || !classLevel) {
      res.status(400).json({
        success: false,
        error: "Board and class level are required",
      });
      return;
    }

    const topics = await getTopicsByBoardAndClass(board, classLevel);

    res.status(200).json({
      success: true,
      data: topics,
    });
  } catch (error) {
    console.error("Get topics by board and class error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch topics",
      details: error instanceof Error ? error.message : error,
    });
  }
};

// Search topics by keywords
export const searchTopicsByKeywordsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { keywords, limit = 10 } = req.query;

    if (!keywords || typeof keywords !== "string") {
      res.status(400).json({
        success: false,
        error: "Keywords parameter is required",
      });
      return;
    }

    const keywordArray = keywords.split(",").map(k => k.trim());
    const topics = await searchTopicsByKeywords(keywordArray, Number(limit));

    res.status(200).json({
      success: true,
      data: topics,
    });
  } catch (error) {
    console.error("Search topics error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to search topics",
      details: error instanceof Error ? error.message : error,
    });
  }
};

