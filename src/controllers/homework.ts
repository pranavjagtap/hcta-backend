import { Request, Response } from 'express';
import { HomeworkService } from '../services/homework';
import { validateRequest } from '../middlewares/validateRequest';
import {
  createHomeworkSchema,
  updateHomeworkSchema,
  homeworkQuerySchema,
  homeworkIdSchema,
  createHomeworkSubmissionSchema,
  updateHomeworkSubmissionSchema,
  homeworkSubmissionQuerySchema,
  homeworkSubmissionIdSchema,
  aiGenerateHomeworkSchema,
  aiRegenerateQuestionSchema,
  exportHomeworkSchema
} from '../validators/homework';
import { createError } from '../utils/appError';
import { catchAsync } from '../utils/catchAsync';

// AI Generation Controllers
export const generateHomeworkWithAIController = catchAsync(async (req: Request, res: Response) => {
  const request = await validateRequest(req, aiGenerateHomeworkSchema);
  const result = await HomeworkService.generateHomeworkWithAI(request);
  res.status(200).json(result);
});

export const regenerateQuestionWithAIController = catchAsync(async (req: Request, res: Response) => {
  const request = await validateRequest(req, aiRegenerateQuestionSchema);
  const result = await HomeworkService.regenerateQuestionWithAI(request);
  res.status(200).json(result);
});

// Homework CRUD Controllers
export const createHomeworkController = catchAsync(async (req: Request, res: Response) => {
  const data = await validateRequest(req, createHomeworkSchema);
  const userId = req.user?._id;
  
  if (!userId) {
    throw createError('User not authenticated', 401);
  }

  const normalized = {
    ...data,
    isPersonalized: data.isPersonalized ?? false,
  } as typeof data & { isPersonalized: boolean };

  const result = await HomeworkService.createHomework(normalized as any, userId);
  res.status(201).json(result);
});

export const getHomeworksController = catchAsync(async (req: Request, res: Response) => {
  const query = await validateRequest(req, homeworkQuerySchema);
  const normalizedQuery = {
    ...query,
    dueDateFrom: (query as any).dueDateFrom ? new Date((query as any).dueDateFrom) : undefined,
    dueDateTo: (query as any).dueDateTo ? new Date((query as any).dueDateTo) : undefined,
  } as typeof query;
  const result = await HomeworkService.getHomeworks(normalizedQuery as any);
  res.status(200).json(result);
});

export const getHomeworkByIdController = catchAsync(async (req: Request, res: Response) => {
  const { id } = await validateRequest(req, homeworkIdSchema);
  const result = await HomeworkService.getHomeworkById(id);
  res.status(200).json(result);
});

export const updateHomeworkController = catchAsync(async (req: Request, res: Response) => {
  const { id } = await validateRequest(req, homeworkIdSchema);
  const data = await validateRequest(req, updateHomeworkSchema);
  const userId = req.user?._id;
  
  if (!userId) {
    throw createError('User not authenticated', 401);
  }

  const normalized = {
    ...data,
    questions: data.questions?.map((q: any) => ({
      ...q,
      aiGenerated: q.aiGenerated ?? false,
    })),
  };

  const result = await HomeworkService.updateHomework(id, normalized as any, userId);
  res.status(200).json(result);
});

export const deleteHomeworkController = catchAsync(async (req: Request, res: Response) => {
  const { id } = await validateRequest(req, homeworkIdSchema);
  await HomeworkService.deleteHomework(id);
  res.status(204).send();
});

// Homework Publishing Controllers
export const publishHomeworkController = catchAsync(async (req: Request, res: Response) => {
  const { id } = await validateRequest(req, homeworkIdSchema);
  const userId = req.user?._id;
  
  if (!userId) {
    throw createError('User not authenticated', 401);
  }

  const result = await HomeworkService.publishHomework(id, userId);
  res.status(200).json(result);
});

export const unpublishHomeworkController = catchAsync(async (req: Request, res: Response) => {
  const { id } = await validateRequest(req, homeworkIdSchema);
  const userId = req.user?._id;
  
  if (!userId) {
    throw createError('User not authenticated', 401);
  }

  const result = await HomeworkService.unpublishHomework(id, userId);
  res.status(200).json(result);
});

// Homework Submission Controllers
export const createHomeworkSubmissionController = catchAsync(async (req: Request, res: Response) => {
  const data = await validateRequest(req, createHomeworkSubmissionSchema);
  const userId = req.user?._id;
  
  if (!userId) {
    throw createError('User not authenticated', 401);
  }

  const result = await HomeworkService.createHomeworkSubmission(data, userId);
  res.status(201).json(result);
});

export const getHomeworkSubmissionsController = catchAsync(async (req: Request, res: Response) => {
  const query = await validateRequest(req, homeworkSubmissionQuerySchema);
  const normalizedQuery = {
    ...query,
    submittedFrom: (query as any).submittedFrom ? new Date((query as any).submittedFrom) : undefined,
    submittedTo: (query as any).submittedTo ? new Date((query as any).submittedTo) : undefined,
  } as typeof query;
  const result = await HomeworkService.getHomeworkSubmissions(normalizedQuery as any);
  res.status(200).json(result);
});

export const getHomeworkSubmissionByIdController = catchAsync(async (req: Request, res: Response) => {
  const { id } = await validateRequest(req, homeworkSubmissionIdSchema);
  const result = await HomeworkService.getHomeworkSubmissionById(id);
  res.status(200).json(result);
});

export const updateHomeworkSubmissionController = catchAsync(async (req: Request, res: Response) => {
  const { id } = await validateRequest(req, homeworkSubmissionIdSchema);
  const data = await validateRequest(req, updateHomeworkSubmissionSchema);
  const userId = req.user?._id;
  
  if (!userId) {
    throw createError('User not authenticated', 401);
  }

  const result = await HomeworkService.updateHomeworkSubmission(id, data, userId);
  res.status(200).json(result);
});

export const deleteHomeworkSubmissionController = catchAsync(async (req: Request, res: Response) => {
  const { id } = await validateRequest(req, homeworkSubmissionIdSchema);
  await HomeworkService.deleteHomeworkSubmission(id);
  res.status(204).send();
});

// Grading Controllers
export const gradeHomeworkSubmissionController = catchAsync(async (req: Request, res: Response) => {
  const { id } = await validateRequest(req, homeworkSubmissionIdSchema);
  const { feedback, scores } = req.body;
  const userId = req.user?._id;
  
  if (!userId) {
    throw createError('User not authenticated', 401);
  }

  const result = await HomeworkService.gradeHomeworkSubmission(id, { feedback, scores }, userId);
  res.status(200).json(result);
});

export const autoGradeHomeworkSubmissionController = catchAsync(async (req: Request, res: Response) => {
  const { id } = await validateRequest(req, homeworkSubmissionIdSchema);
  const userId = req.user?._id;
  
  if (!userId) {
    throw createError('User not authenticated', 401);
  }

  const result = await HomeworkService.autoGradeHomeworkSubmission(id, userId);
  res.status(200).json(result);
});

// Export Controllers
export const exportHomeworkController = catchAsync(async (req: Request, res: Response) => {
  const request = await validateRequest(req, exportHomeworkSchema);
  const result = await HomeworkService.exportHomework(request);
  res.status(200).json(result);
});

// Analytics Controllers
export const getHomeworkAnalyticsController = catchAsync(async (req: Request, res: Response) => {
  const { id } = await validateRequest(req, homeworkIdSchema);
  const result = await HomeworkService.getHomeworkAnalytics(id);
  res.status(200).json(result);
});

export const getHomeworkStatsController = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?._id;
  
  if (!userId) {
    throw createError('User not authenticated', 401);
  }

  const result = await HomeworkService.getHomeworkStats(userId);
  res.status(200).json(result);
});

// Student-specific Controllers
export const getStudentHomeworksController = catchAsync(async (req: Request, res: Response) => {
  const { studentId } = req.params;
  const query = await validateRequest(req, homeworkQuerySchema);
  const normalizedQuery = {
    ...query,
    dueDateFrom: (query as any).dueDateFrom ? new Date((query as any).dueDateFrom) : undefined,
    dueDateTo: (query as any).dueDateTo ? new Date((query as any).dueDateTo) : undefined,
  } as typeof query;
  const result = await HomeworkService.getStudentHomeworks(studentId, normalizedQuery as any);
  res.status(200).json(result);
});

export const getClassHomeworksController = catchAsync(async (req: Request, res: Response) => {
  const { classId } = req.params;
  const query = await validateRequest(req, homeworkQuerySchema);
  const normalizedQuery = {
    ...query,
    dueDateFrom: (query as any).dueDateFrom ? new Date((query as any).dueDateFrom) : undefined,
    dueDateTo: (query as any).dueDateTo ? new Date((query as any).dueDateTo) : undefined,
  } as typeof query;
  const result = await HomeworkService.getClassHomeworks(classId, normalizedQuery as any);
  res.status(200).json(result);
});

export const getBatchHomeworksController = catchAsync(async (req: Request, res: Response) => {
  const { batchId } = req.params;
  const query = await validateRequest(req, homeworkQuerySchema);
  const normalizedQuery = {
    ...query,
    dueDateFrom: (query as any).dueDateFrom ? new Date((query as any).dueDateFrom) : undefined,
    dueDateTo: (query as any).dueDateTo ? new Date((query as any).dueDateTo) : undefined,
  } as typeof query;
  const result = await HomeworkService.getBatchHomeworks(batchId, normalizedQuery as any);
  res.status(200).json(result);
});
